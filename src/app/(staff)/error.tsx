"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StaffError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="grid min-h-[50dvh] place-items-center">
      <div className="max-w-md text-center">
        <AlertTriangle className="mx-auto size-10 text-danger-fg" aria-hidden />
        <h1 className="mt-3 text-2xl text-fg">This page failed to load</h1>
        <p className="mt-2 text-muted">{error.digest ? `Reference ${error.digest}. ` : ""}Try again, or reload the page.</p>
        <Button className="mt-4" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
