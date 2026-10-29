import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/rbac";
import { getDraftDto } from "@/lib/registration";
import { isDemoMode } from "@/lib/env";
import { StartRegistration } from "@/components/register/start-registration";
import { Wizard } from "@/components/register/wizard";

export const metadata: Metadata = { title: "Register" };
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const user = await getSessionUser();
  if (user?.role === "STUDENT") {
    const draft = await getDraftDto(user.id);
    if (draft) {
      if (draft.status !== "DRAFT") redirect("/status");
      return <Wizard initial={draft} demo={isDemoMode()} />;
    }
  }
  return <StartRegistration demo={isDemoMode()} />;
}
