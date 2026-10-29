import type { Metadata } from "next";
import { ShieldX } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Access denied" };

export default function ForbiddenPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-danger-bg text-danger-fg">
        <ShieldX className="size-8" aria-hidden />
      </span>
      <h1 className="mt-4 text-fg">Access denied</h1>
      <p className="mt-2 text-muted">Your account doesn&apos;t have permission to open this page. If you think this is a mistake, ask the sports office admin.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <ButtonLink href="/">Go home</ButtonLink>
        <ButtonLink href="/staff/login" variant="outline">
          Switch account
        </ButtonLink>
      </div>
    </div>
  );
}
