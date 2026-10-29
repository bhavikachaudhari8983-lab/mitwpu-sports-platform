"use client";

import { useId, useRef, useState } from "react";
import { Camera, CheckCircle2, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { compressImage } from "@/lib/image-compress";
import { UPLOAD_MAX_BYTES, type DocType } from "@/lib/constants";
import type { DraftDoc } from "@/lib/registration-types";
import { cn, formatBytes } from "@/lib/utils";

type Props = {
  type: DocType;
  label: string;
  description?: string;
  required?: boolean;
  imageOnly?: boolean;
  docs: DraftDoc[];
  onChange: (docs: DraftDoc[]) => void;
  multiple?: boolean;
  error?: string;
  readOnly?: boolean;
};

const ACCEPT_ALL = "image/jpeg,image/png,image/webp,application/pdf";
const ACCEPT_IMG = "image/jpeg,image/png,image/webp";

function uploadWithProgress(form: FormData, onProgress: (pct: number) => void): Promise<{ ok: boolean; body: unknown }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/uploads");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let body: unknown = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        /* ignore */
      }
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, body });
    };
    xhr.onerror = () => resolve({ ok: false, body: { error: "Network error — please try again." } });
    xhr.send(form);
  });
}

export function DocumentUpload({ type, label, description, required, imageOnly, docs, onChange, multiple, error, readOnly }: Props) {
  const id = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const [progress, setProgress] = useState<number | null>(null);
  const [localError, setLocalError] = useState<string>();
  const [localPreview, setLocalPreview] = useState<Record<string, string>>({});
  const mine = docs.filter((d) => d.type === type);

  async function handle(file: File | undefined, source: "UPLOAD" | "CAMERA") {
    if (!file) return;
    setLocalError(undefined);
    const allowed = (imageOnly ? ACCEPT_IMG : ACCEPT_ALL).split(",");
    if (!allowed.includes(file.type)) {
      setLocalError(imageOnly ? "Please choose a JPG, PNG or WebP photo." : "Only images (JPG, PNG, WebP) or PDF files are allowed.");
      return;
    }
    let toSend = file;
    try {
      toSend = await compressImage(file, UPLOAD_MAX_BYTES);
    } catch {
      /* fall back to the original */
    }
    if (toSend.size > UPLOAD_MAX_BYTES) {
      setLocalError(`This file is ${formatBytes(toSend.size)}. The maximum is 5 MB.`);
      return;
    }
    const form = new FormData();
    form.append("type", type);
    form.append("source", source);
    form.append("file", toSend);
    setProgress(0);
    const res = await uploadWithProgress(form, setProgress);
    setProgress(null);
    if (!res.ok) {
      const msg = (res.body as { error?: string }).error ?? "Upload failed.";
      setLocalError(msg);
      return;
    }
    const doc = res.body as DraftDoc;
    if (toSend.type.startsWith("image/")) setLocalPreview((p) => ({ ...p, [doc.id]: URL.createObjectURL(toSend) }));
    onChange(multiple ? [...docs, doc] : [...docs.filter((d) => d.type !== type), doc]);
    toast.success(`${label} uploaded`, `${formatBytes(toSend.size)}${toSend !== file ? " (compressed)" : ""}`);
  }

  async function remove(doc: DraftDoc) {
    const res = await fetch(`/api/uploads/${doc.id}`, { method: "DELETE" });
    if (!res.ok) {
      const b = (await res.json().catch(() => ({}))) as { error?: string };
      toast.error("Could not remove file", b.error);
      return;
    }
    onChange(docs.filter((d) => d.id !== doc.id));
  }

  const err = localError ?? error;
  const canAdd = !readOnly && (multiple || mine.length === 0);

  return (
    <div className={cn("rounded-xl border p-4", err ? "border-danger" : "border-border")} role="group" aria-labelledby={`${id}-label`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p id={`${id}-label`} className="font-medium text-fg">
            {label}
            {required && <span className="text-danger-fg"> *</span>}
            {!required && <span className="text-small text-muted"> (optional)</span>}
          </p>
          {description && <p className="text-small text-muted">{description}</p>}
        </div>
        {mine.length > 0 && !multiple && (
          <span className="inline-flex items-center gap-1 text-small font-semibold text-success-fg">
            <CheckCircle2 className="size-4" aria-hidden /> Uploaded
          </span>
        )}
      </div>

      {mine.length > 0 && (
        <ul className="mt-3 space-y-2">
          {mine.map((d) => {
            const src = localPreview[d.id] ?? `/api/documents/${d.id}`;
            return (
              <li key={d.id} className="flex items-center gap-3 rounded-lg bg-surface-2 p-2">
                {d.mimeType.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element -- private, authorised route; next/image can't proxy it
                  <img src={src} alt={`${label} preview`} className="size-16 shrink-0 rounded-md object-cover" />
                ) : (
                  <span className="grid size-16 shrink-0 place-items-center rounded-md bg-surface text-muted">
                    <FileText className="size-7" aria-hidden />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <a href={`/api/documents/${d.id}`} target="_blank" rel="noopener" className="block truncate font-medium text-fg underline-offset-4 hover:underline">
                    {d.originalName}
                  </a>
                  <p className="text-small text-muted">{formatBytes(d.size)}</p>
                </div>
                {!readOnly && (d.source === "UPLOAD" || d.source === "CAMERA") && (
                  <button type="button" onClick={() => remove(d)} className="grid size-11 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface hover:text-danger-fg" aria-label={`Remove ${d.originalName}`}>
                    <Trash2 className="size-5" aria-hidden />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {progress !== null && (
        <div className="mt-3" role="status">
          <p className="flex items-center gap-2 text-small text-muted">
            <Loader2 className="size-4 animate-spin" aria-hidden /> Uploading… {progress}%
          </p>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full bg-accent transition-[width]" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {(canAdd || (!multiple && mine.length > 0 && !readOnly)) && progress === null && (
        <div className="mt-3 flex flex-wrap gap-2">
          <input ref={fileRef} type="file" accept={imageOnly ? ACCEPT_IMG : ACCEPT_ALL} className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => { void handle(e.target.files?.[0], "UPLOAD"); e.target.value = ""; }} />
          <input ref={camRef} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => { void handle(e.target.files?.[0], "CAMERA"); e.target.value = ""; }} />
          <Button variant="outline" size="sm" icon={<Upload className="size-4" aria-hidden />} onClick={() => fileRef.current?.click()}>
            {mine.length > 0 && !multiple ? "Replace file" : "Choose file"}
          </Button>
          <Button variant="outline" size="sm" icon={<Camera className="size-4" aria-hidden />} onClick={() => camRef.current?.click()}>
            Take photo
          </Button>
          <span className="self-center text-small text-muted">{imageOnly ? "JPG/PNG" : "JPG, PNG or PDF"} · max 5 MB</span>
        </div>
      )}
      <div className="mt-2">
        <FieldError message={err} />
      </div>
    </div>
  );
}
