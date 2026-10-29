"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main id="main" className="grid min-h-[70dvh] place-items-center px-4 py-16">
      <div className="max-w-md text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-danger-bg text-danger-fg">
          <AlertTriangle className="size-7" aria-hidden />
        </span>
        <h1 className="mt-4 text-[clamp(1.75rem,4vw,2.5rem)] text-fg">Something went wrong</h1>
        <p className="mt-2 text-muted">Your saved draft is safe. Please try again — if it keeps happening, contact the sports office.</p>
        {error.digest && <p className="mt-2 font-mono text-small text-muted">Ref: {error.digest}</p>}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button onClick={reset} icon={<RotateCcw className="size-4" aria-hidden />}>
            Try again
          </Button>
          <ButtonLink href="/" variant="outline">
            Go home
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
