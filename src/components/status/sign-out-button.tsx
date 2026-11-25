"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignOutButton({ callbackUrl = "/", onStage = false }: { callbackUrl?: string; onStage?: boolean }) {
  return (
    <Button variant={onStage ? "stageOutline" : "ghost"} onClick={() => signOut({ callbackUrl })} icon={<LogOut className="size-4" aria-hidden />}>
      Sign out
    </Button>
  );
}
