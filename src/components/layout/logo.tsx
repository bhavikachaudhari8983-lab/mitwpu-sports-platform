import Link from "next/link";
import { UNIVERSITY_SHORT } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("flex min-h-11 items-center gap-2.5", className)} aria-label={`${UNIVERSITY_SHORT} Sports Portal home`}>
      <span aria-hidden className="relative grid size-9 place-items-center overflow-hidden rounded-lg bg-accent font-heading text-lg font-bold text-accent-fg">
        S
        <span className="absolute inset-x-0 bottom-0 h-1 bg-[#0b1f3a]/40" />
      </span>
      <span className="font-heading text-xl leading-none font-bold tracking-tight">
        {UNIVERSITY_SHORT} <span className="text-accent">Sports</span>
      </span>
    </Link>
  );
}
