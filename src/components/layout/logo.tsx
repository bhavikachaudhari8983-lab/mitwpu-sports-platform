import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Sphere mark: logo-blue ball with seams and a crimson orbit. `onDark` lifts contrast on navy surfaces. */
export function SphereMark({ className, onDark }: { className?: string; onDark?: boolean }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden className={cn("size-9 shrink-0", className)}>
      <circle cx="20" cy="20" r="16.5" fill="#14457F" stroke={onDark ? "#FFFFFF" : "none"} strokeWidth="1.5" />
      <path d="M4.2 16.5c7.5 3.6 24 3.6 31.6 0" stroke="#FFFFFF" strokeWidth="1.8" fill="none" opacity=".9" />
      <path d="M20 3.6c-5.6 7.2-5.6 25.6 0 32.8" stroke="#FFFFFF" strokeWidth="1.8" fill="none" opacity=".9" />
      <ellipse cx="20" cy="21" rx="19" ry="6.5" transform="rotate(-24 20 21)" fill="none" stroke={onDark ? "#F06B79" : "#B32D41"} strokeWidth="3" />
    </svg>
  );
}

export function Logo({ className, href = "/", onDark }: { className?: string; href?: string; onDark?: boolean }) {
  return (
    <Link href={href} className={cn("flex min-h-11 items-center gap-2", className)} aria-label={`${APP_NAME} home`}>
      <SphereMark onDark={onDark} className="size-8 sm:size-9" />
      <span className="font-heading text-lg leading-none font-extrabold tracking-tight whitespace-nowrap sm:text-xl">
        <span className={onDark ? "text-white" : "text-wordmark-1"}>Sports</span> <span className={onDark ? "text-[#F06B79]" : "text-wordmark-2"}>Sphere</span>
      </span>
    </Link>
  );
}
