import type { ReactNode } from "react";
import { BadgeCheck, CheckCircle2, CircleDashed, Clock, Flag, XCircle } from "lucide-react";
import { STATUS_LABEL, type Status } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const tones: Record<Tone, string> = {
  success: "bg-success-bg text-success-fg",
  warning: "bg-warning-bg text-warning-fg",
  danger: "bg-danger-bg text-danger-fg",
  info: "bg-info-bg text-info-fg",
  neutral: "bg-neutral-bg text-neutral-fg",
};

export function Badge({ tone = "neutral", icon, children, className }: { tone?: Tone; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-small font-semibold whitespace-nowrap", tones[tone], className)}>
      {icon}
      {children}
    </span>
  );
}

const statusTone: Record<Status, Tone> = {
  DRAFT: "neutral",
  PENDING: "warning",
  VERIFIED: "info",
  APPROVED: "success",
  FLAGGED: "info",
  REJECTED: "danger",
};

const statusIcon: Record<Status, ReactNode> = {
  DRAFT: <CircleDashed className="size-4" aria-hidden />,
  PENDING: <Clock className="size-4" aria-hidden />,
  VERIFIED: <BadgeCheck className="size-4" aria-hidden />,
  APPROVED: <CheckCircle2 className="size-4" aria-hidden />,
  FLAGGED: <Flag className="size-4" aria-hidden />,
  REJECTED: <XCircle className="size-4" aria-hidden />,
};

/** Status is always shown as colour + icon + text, never colour alone. */
export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return (
    <Badge tone={statusTone[status]} icon={statusIcon[status]} className={className}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}

export function Alert({ tone = "info", title, children, icon, className }: { tone?: Tone; title?: ReactNode; children?: ReactNode; icon?: ReactNode; className?: string }) {
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("flex gap-3 rounded-xl p-4", tones[tone], className)}>
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div className="min-w-0 space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="text-small">{children}</div>}
      </div>
    </div>
  );
}
