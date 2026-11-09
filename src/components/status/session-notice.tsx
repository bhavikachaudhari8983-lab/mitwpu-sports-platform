import Link from "next/link";
import { Info } from "lucide-react";
import { Alert } from "@/components/ui/badge";
import { staffHomeFor } from "@/lib/staff-home";

/**
 * One browser holds one sign-in. Warn before a student sign-in replaces a staff session (or the other way round),
 * so nobody is signed out without knowing why.
 */
export function SessionNotice({ user, wants }: { user: { name?: string | null; role: string } | null; wants: "STUDENT" | "STAFF" }) {
  if (!user) return null;
  const isStudent = user.role === "STUDENT";
  if (wants === "STUDENT" && !isStudent) {
    return (
      <Alert tone="info" icon={<Info className="size-5" aria-hidden />} title={`You're signed in as staff${user.name ? ` (${user.name})` : ""}`} className="mb-6">
        Signing in as a student here will sign you out of the staff area.{" "}
        <Link href={staffHomeFor(user.role)} className="font-semibold underline underline-offset-4">
          Back to the staff area
        </Link>
      </Alert>
    );
  }
  if (wants === "STAFF" && isStudent) {
    return (
      <Alert tone="info" icon={<Info className="size-5" aria-hidden />} title={`You're signed in as a student${user.name && user.name !== "Student" ? ` (${user.name})` : ""}`} className="mb-6">
        Signing in as staff will sign you out of the student account.{" "}
        <Link href="/status" className="font-semibold underline underline-offset-4">
          Back to my status
        </Link>
      </Alert>
    );
  }
  return null;
}
