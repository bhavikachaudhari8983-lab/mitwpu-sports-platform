import type { DefaultSession } from "next-auth";
import type { Role } from "@/lib/constants";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      sportId?: string | null;
    } & DefaultSession["user"];
  }
  interface User {
    id: string;
    role: Role;
    sportId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid: string;
    role: Role;
    sportId?: string | null;
  }
}
