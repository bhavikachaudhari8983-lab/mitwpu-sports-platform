import Image from "next/image";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** The official Sports Sphere roundel (public/brand/sports-sphere-logo.png). */
export function LogoMark({ size = 40, className, priority, alt = "" }: { size?: number; className?: string; priority?: boolean; alt?: string }) {
  return (
    <Image
      src="/brand/sports-sphere-logo.png"
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      className={cn("shrink-0 rounded-full bg-white", className)}
    />
  );
}

/**
 * Roundel + "SPORTS SPHERE" wordmark in the logo's navy / orange, heavy italic like the logo.
 * `stacked`: always two lines (narrow sidebars); "mobile" (default): two lines below 640px.
 */
export function Logo({ className, href = "/", stacked = "mobile" }: { className?: string; href?: string; stacked?: boolean | "mobile" }) {
  return (
    <Link href={href} className={cn("flex min-h-11 items-center gap-2.5", className)} aria-label={`${APP_NAME} home`}>
      <LogoMark size={40} priority className="ring-1 ring-border" />
      <span
        className={cn(
          "flex font-heading leading-none font-extrabold tracking-tight whitespace-nowrap uppercase italic",
          stacked === true ? "flex-col text-base" : "flex-col text-base sm:flex-row sm:gap-[0.3em] sm:text-xl",
        )}
      >
        <span className="text-wordmark-1">Sports</span>
        <span className="text-wordmark-2">Sphere</span>
      </span>
    </Link>
  );
}
