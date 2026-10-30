import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { StaffLoginForm } from "@/components/staff/staff-login-form";
import { staffHomeFor } from "@/components/layout/site-header";
import { getSessionUser } from "@/lib/rbac";
import { isDemoMode } from "@/lib/env";

export const metadata: Metadata = { title: "Staff login" };

export default async function StaffLoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; error?: string }> }) {
  const { callbackUrl, error } = await searchParams;
  const user = await getSessionUser();
  if (user && user.role !== "STUDENT") redirect(staffHomeFor(user.role));
  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:py-16">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-xl bg-tint text-tint-fg">
          <ShieldCheck className="size-6" aria-hidden />
        </span>
        <div>
          <h1 className="text-[clamp(1.75rem,4vw,2.25rem)] text-fg">Staff login</h1>
          <p className="text-muted">Admins, officials, medical staff and coaches.</p>
        </div>
      </div>
      <Card>
        <CardBody>
          <StaffLoginForm callbackUrl={callbackUrl} demo={isDemoMode()} initialError={error ? "Sign-in failed. Please try again." : undefined} />
        </CardBody>
      </Card>
      <p className="mt-4 text-center text-small text-muted">Accounts are created by the sports office admin. Too many failed attempts locks sign-in for 15 minutes.</p>
    </div>
  );
}
