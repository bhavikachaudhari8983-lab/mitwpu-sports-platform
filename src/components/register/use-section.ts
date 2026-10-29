"use client";

import { useState } from "react";
import type { ZodType } from "zod";
import type { DraftSection } from "@/lib/validation/registration";
import { useWizard } from "./wizard-context";

/** Local form state for one wizard section; every change is queued for autosave. */
export function useSection<T extends Record<string, unknown>>(section: DraftSection, initial: T) {
  const { queueSave, skipped } = useWizard();
  const [values, setValues] = useState<T>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set<K extends keyof T & string>(key: K, value: T[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => {
      if (!e[key]) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
    queueSave(section, { [key]: value });
  }

  /** Full validation for "Save & continue". Returns true when valid. */
  function validate(schema: ZodType, extra: Record<string, string> = {}, data: Record<string, unknown> = values): boolean {
    const r = schema.safeParse(data);
    const errs: Record<string, string> = { ...extra };
    if (!r.success) {
      for (const issue of r.error.issues) {
        const k = issue.path.join(".");
        if (!errs[k]) errs[k] = issue.message;
      }
    }
    setErrors(errs);
    if (Object.keys(errs).length) {
      // Move focus to the first invalid field.
      requestAnimationFrame(() => {
        const first = Object.keys(errs)[0];
        document.getElementById(first)?.focus();
      });
      return false;
    }
    return true;
  }

  const errorFor = (k: string) => errors[k] ?? skipped[k];
  return { values, set, errors, setErrors, validate, errorFor };
}
