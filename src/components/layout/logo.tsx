import Image from "next/image";
import Link from "next/link";
import { APP_NAME, DEPARTMENT_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Compact MIT-WPU logo (dome + MIT-WPU), cut from the MIT-WPU Brand Book 2026. 640 × 610 px. */
const COMPACT = { color: "/brand/mitwpu-logo-compact.png", white: "/brand/mitwpu-logo-compact-white.png", ratio: 610 / 640 };
/** Master MIT-WPU logo (with "MIT World Peace University | Pune"). 1600 × 451 px. */
export const MASTER_LOGO = { color: "/brand/mitwpu-logo-master.png", white: "/brand/mitwpu-logo-master-white.png", ratio: 451 / 1600 };

/**
 * The MIT-WPU compact logo. `tone="white"` on navy/dark surfaces (Brand Book p.5: white or colour, never recoloured).
 * Served unoptimised: re-compression blurs the Devanagari motto.
 */
export function LogoMark({ size = 64, className, priority, alt = "", tone = "color" }: { size?: number; className?: string; priority?: boolean; alt?: string; tone?: "color" | "white" }) {
  return (
    <Image
      src={COMPACT[tone]}
      alt={alt}
      width={size}
      height={Math.round(size * COMPACT.ratio)}
      priority={priority}
      unoptimized
      className={cn("shrink-0 object-contain", className)}
    />
  );
}

/**
 * Header lock-up: MIT-WPU logo, a rule, then "Department of Sports". The logo is at least 60 px tall
 * (Brand Book 2026 minimum digital size) and keeps clear space on every side via the gap.
 * `stacked`: always the narrow layout (sidebars); "mobile" (default): narrow below 640px.
 */
export function Logo({ className, href = "/", stacked = "mobile", tone = "color" }: { className?: string; href?: string; stacked?: boolean | "mobile"; tone?: "color" | "white" }) {
  return (
    <Link href={href} className={cn("flex min-h-11 items-center gap-3", className)} aria-label={`${APP_NAME} home`}>
      <LogoMark size={66} priority tone={tone} />
      <span aria-hidden className={cn("h-11 w-px", tone === "white" ? "bg-white/40" : "bg-border-strong")} />
      <span className={cn("flex flex-col font-heading leading-tight", tone === "white" ? "text-white" : "text-primary")}>
        <span className={cn("font-black tracking-tight", stacked === true ? "text-base" : "text-base sm:text-xl")}>{DEPARTMENT_NAME}</span>
        <span className={cn("font-bold tracking-wide text-muted uppercase", tone === "white" && "text-white/75", stacked === true ? "text-[0.65rem]" : "text-[0.65rem] sm:text-xs")}>
          MIT World Peace University
        </span>
      </span>
    </Link>
  );
}
