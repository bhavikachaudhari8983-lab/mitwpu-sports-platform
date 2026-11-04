import type { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { audit } from "./audit";
import { rateLimit, resetRateLimit } from "./rate-limit";
import { consumeOtpChallenge, OtpError } from "./otp";
import { staffLoginSchema, verifyOtpSchema } from "./validation/auth";
import { isStaffRole, UNIVERSITY_NAME } from "./constants";
import { erpService } from "@/services";

// Real bcrypt hash of a random value: comparing against it keeps timing equal for unknown emails.
const DUMMY_HASH = bcrypt.hashSync(Math.random().toString(36), 10);

type ReqLike = { headers?: Record<string, unknown> };

function ipOf(req: ReqLike | undefined): string {
  const h = req?.headers ?? {};
  const fwd = typeof h["x-forwarded-for"] === "string" ? h["x-forwarded-for"] : "";
  return fwd.split(",")[0]?.trim() || "local";
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 12 * 60 * 60 },
  pages: { signIn: "/staff/login", error: "/staff/login" },
  providers: [
    CredentialsProvider({
      id: "staff",
      name: "Staff",
      credentials: { email: { type: "email" }, password: { type: "password" } },
      async authorize(raw, req): Promise<User | null> {
        const parsed = staffLoginSchema.safeParse(raw);
        if (!parsed.success) throw new Error("Enter your email and password.");
        const { email, password } = parsed.data;
        const ip = ipOf(req);
        const key = `login:${email}:${ip}`;
        const limit = rateLimit(key, 5, 15 * 60_000);
        if (!limit.ok) throw new Error(`Too many attempts. Try again in ${Math.ceil(limit.retryAfterSec / 60)} minute(s).`);

        const user = await prisma.staffUser.findUnique({ where: { email } });
        // Always run bcrypt to keep timing similar for unknown emails.
        const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
        if (!user || !valid || !user.active || !isStaffRole(user.role)) {
          await audit({ actor: { type: "SYSTEM" }, action: "LOGIN_FAILED", summary: `Failed staff login for ${email}`, ip });
          throw new Error("Email or password is incorrect.");
        }
        resetRateLimit(key);
        await prisma.staffUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        await audit({ actor: { type: "STAFF", id: user.id, name: user.name, role: user.role }, action: "LOGIN", summary: "Signed in", ip });
        return { id: user.id, name: user.name, email: user.email, role: user.role, sportId: user.sportId };
      },
    }),
    CredentialsProvider({
      id: "student-otp",
      name: "Student OTP",
      credentials: { challengeId: { type: "text" }, code: { type: "text" } },
      async authorize(raw, req): Promise<User | null> {
        const parsed = verifyOtpSchema.safeParse(raw);
        if (!parsed.success) throw new Error("Enter the 6-digit code.");
        const ip = ipOf(req);
        const limit = rateLimit(`otp-verify:${ip}`, 20, 10 * 60_000);
        if (!limit.ok) throw new Error("Too many attempts. Please wait a few minutes.");

        let result;
        try {
          result = await consumeOtpChallenge(parsed.data.challengeId, parsed.data.code);
        } catch (e) {
          if (e instanceof OtpError) throw new Error(e.message);
          throw e;
        }
        const { target, channel, meta } = result;
        const isEmail = channel === "EMAIL";
        const byContact = isEmail ? { email: target, emailVerified: true } : { mobile: target, mobileVerified: true };

        let student = null;
        if (meta.path === "LOGIN") {
          student = await prisma.student.findFirst({ where: byContact, orderBy: { updatedAt: "desc" } });
          if (!student) throw new Error(`No registration found for this ${isEmail ? "email" : "mobile number"}.`);
        } else if (meta.path === "A") {
          student = await prisma.student.findUnique({ where: { prn: meta.prn } });
          if (!student) {
            const erp = await erpService.findStudentByPrn(meta.prn);
            if (!erp) throw new Error("Not a registered student of this university.");
            const school = erp.schoolCode ? await prisma.school.findUnique({ where: { code: erp.schoolCode }, select: { id: true } }) : null;
            student = await prisma.student.create({
              data: {
                studentType: "OUR_INDIAN",
                isOurUniversity: true,
                prn: erp.prn,
                mobile: erp.phone,
                email: erp.email,
                mobileVerified: true,
                emailVerified: true,
                universityName: UNIVERSITY_NAME,
                course: erp.course,
                year: erp.year,
                schoolId: school?.id ?? null,
              },
            });
            await audit({ actor: { type: "STUDENT", id: student.id, name: erp.name }, action: "REGISTRATION_STARTED", studentId: student.id, summary: `Registration started (our university, PRN ${erp.prn})`, ip });
          }
        } else {
          student = await prisma.student.findFirst({ where: byContact, orderBy: { updatedAt: "desc" } });
          if (!student) {
            const type = meta.path === "B" ? "OUTSIDE_INDIAN" : "INTERNATIONAL";
            student = await prisma.student.create({
              data: {
                studentType: type,
                ...(isEmail ? { email: target, emailVerified: true } : { mobile: target, mobileVerified: true }),
              },
            });
            await audit({ actor: { type: "STUDENT", id: student.id, name: target }, action: "REGISTRATION_STARTED", studentId: student.id, summary: `Registration started (${type === "OUTSIDE_INDIAN" ? "outside student" : "international student"})`, ip });
          }
        }
        await audit({ actor: { type: "STUDENT", id: student.id, name: student.fullName ?? target }, action: "LOGIN", studentId: student.id, summary: `Student signed in with ${isEmail ? "email" : "mobile"} OTP`, ip });
        return { id: student.id, name: student.fullName ?? "Student", role: "STUDENT" };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.role = user.role;
        token.sportId = user.sportId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = { ...session.user, id: token.uid, role: token.role, sportId: token.sportId ?? null };
      return session;
    },
  },
  events: {
    async signOut({ token }) {
      if (token?.uid && token.role && token.role !== "STUDENT") {
        await audit({ actor: { type: "STAFF", id: token.uid, name: token.name ?? "Staff", role: token.role }, action: "LOGOUT", summary: "Signed out" });
      }
    },
  },
};
