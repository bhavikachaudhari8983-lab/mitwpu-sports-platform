import type { ComponentProps, ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const control =
  "block w-full min-h-11 rounded-lg border border-border-strong bg-surface px-3 py-2 text-fg placeholder:text-muted " +
  "focus:outline-none focus-visible:outline-3 focus-visible:outline-ring focus-visible:outline-offset-1 " +
  "aria-[invalid=true]:border-danger read-only:bg-surface-2 read-only:text-muted disabled:opacity-60";

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

/** Wraps a control with label, hint and inline error. Pass the same id to the control and use fieldA11y(). */
export function Field({ id, label, error, hint, required, children, className }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block font-medium text-fg">
        {label}
        {required && (
          <span className="text-danger-fg" aria-hidden>
            {" "}
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-small text-muted">
          {hint}
        </p>
      )}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

export function fieldA11y(id: string, error?: string, hasHint?: boolean) {
  return {
    id,
    name: id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : hasHint ? `${id}-hint` : undefined,
  } as const;
}

export function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="flex items-start gap-1.5 text-small font-medium text-danger-fg">
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      {message}
    </p>
  );
}

export function Input({ className, ...rest }: ComponentProps<"input">) {
  return <input className={cn(control, className)} {...rest} />;
}

export function Select({ className, children, ...rest }: ComponentProps<"select">) {
  return (
    <select className={cn(control, "pr-8", className)} {...rest}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...rest }: ComponentProps<"textarea">) {
  return <textarea className={cn(control, "min-h-24", className)} {...rest} />;
}

export function Checkbox({ id, label, className, ...rest }: ComponentProps<"input"> & { id: string; label: ReactNode }) {
  return (
    <label htmlFor={id} className={cn("flex min-h-11 cursor-pointer items-start gap-3 py-2", className)}>
      <input id={id} type="checkbox" className="mt-0.5 size-5 shrink-0 accent-[var(--accent)]" {...rest} />
      <span className="text-fg">{label}</span>
    </label>
  );
}

/** Read-only value display used for verified data (name, DOB). */
export function LockedValue({ label, value, source }: { label: string; value: ReactNode; source?: string }) {
  return (
    <div className="space-y-1.5">
      <span className="block font-medium text-fg">{label}</span>
      <div className="flex min-h-11 items-center justify-between gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2">
        <span className="font-medium">{value}</span>
        {source && <span className="text-small text-muted">{source}</span>}
      </div>
    </div>
  );
}
