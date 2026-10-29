"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignOutButton({ callbackUrl = "/" }: { callbackUrl?: string }) {
  return (
    <Button variant="ghost" onClick={() => signOut({ callbackUrl })} icon={<LogOut className="size-4" aria-hidden />}>
      Sign out
    </Button>
  );
}
