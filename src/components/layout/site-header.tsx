"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { ShieldCheck } from "lucide-react";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";
import { buttonClass } from "@/components/ui/button";

const links = [
  { href: "/", label: "Home" },
  { href: "/register", label: "Register" },
  { href: "/status", label: "My status" },
  { href: "/privacy", label: "Privacy" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { data } = useSession();
  const role = data?.user?.role;
  const staffHome = role && role !== "STUDENT" ? staffHomeFor(role) : null;

  return (
    <header className="sticky top-0 z-40 bg-brand-deep text-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center rounded-lg px-3 font-medium text-white/85 hover:bg-white/10 hover:text-white",
                  active && "bg-white/10 text-white",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-1">
          <ThemeToggle className="text-white" />
          {staffHome ? (
            <Link href={staffHome} className={buttonClass("outline", "sm", "border-white/30 bg-transparent text-white hover:bg-white/10")}>
              <ShieldCheck className="size-4" aria-hidden />
              <span className="hidden sm:inline">Staff area</span>
            </Link>
          ) : (
            <Link href="/staff/login" className="flex min-h-11 items-center rounded-lg px-3 text-small font-medium text-white/85 hover:bg-white/10 hover:text-white">
              Staff login
            </Link>
          )}
        </div>
      </div>
      <div aria-hidden className="brand-stripe" />
    </header>
  );
}

export function staffHomeFor(role: string): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "OFFICIAL":
      return "/desk";
    case "MEDICAL":
      return "/medical";
    case "COACH":
      return "/coach";
    default:
      return "/status";
  }
}
