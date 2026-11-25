import { cn } from "@/lib/utils";

/**
 * Sporty page opener used on public pages: a navy "stage" band with a heavy italic title, the logo's
 * motion streaks and a faint watermark word, the same language as the home hero.
 */
export function PageHero({
  eyebrow,
  title,
  lead,
  mark,
  children,
  className,
  width = "max-w-6xl",
  caps = true,
}: {
  /** false keeps the title's own capitalisation (e.g. a person's name). */
  caps?: boolean;
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  lead?: React.ReactNode;
  /** Big outlined word behind the title (decorative). */
  mark?: string;
  children?: React.ReactNode;
  className?: string;
  width?: string;
}) {
  return (
    <section className={cn("stage relative isolate overflow-hidden", className)}>
      <MotionStreaks />
      {mark && (
        <span aria-hidden className="hero-mark pointer-events-none absolute -bottom-6 right-2 -z-10 select-none sm:right-8">
          {mark}
        </span>
      )}
      <div className={cn("relative mx-auto px-4 py-10 sm:px-6 sm:py-14", width)}>
        {eyebrow && <p className="eyebrow text-volt">{eyebrow}</p>}
        <h1 className="display mt-3 text-[clamp(2.1rem,6vw,4rem)] text-stage-fg" style={caps ? undefined : { textTransform: "none" }}>
          {title}
        </h1>
        {lead && <p className="mt-4 max-w-2xl text-lg text-stage-muted">{lead}</p>}
        {children}
      </div>
      <div className="brand-stripe" aria-hidden />
    </section>
  );
}

/** Five slanted speed streaks in the logo's ring colours (decorative). */
export function MotionStreaks({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("streaks pointer-events-none absolute inset-y-0 right-0 -z-10 w-[min(60%,34rem)]", className)}>
      <span />
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}
