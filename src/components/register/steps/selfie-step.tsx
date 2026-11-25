"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, CheckCircle2, RefreshCw } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import type { DraftDoc } from "@/lib/registration-types";
import { isOffline, whenOnline } from "@/lib/use-online";
import { useStepValidator, useWizard } from "../wizard-context";
import { DocumentUpload } from "../document-upload";

type CamState = "idle" | "starting" | "live" | "captured" | "uploading" | "error";

export function SelfieStep() {
  const { draft, setDraft } = useWizard();
  const toast = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CamState>("idle");
  const [camError, setCamError] = useState<string>();
  const [shot, setShot] = useState<{ blob: Blob; url: string } | null>(null);
  const [stepError, setStepError] = useState<string>();
  const selfie = draft.documents.find((d) => d.type === "SELFIE");

  useStepValidator(() => {
    if (!selfie) {
      setStepError("Please take a live selfie before continuing.");
      return false;
    }
    return true;
  });

  function stop() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }
  useEffect(() => stop, []);

  async function start() {
    setCamError(undefined);
    if (!navigator.mediaDevices?.getUserMedia) {
      setState("error");
      setCamError("This browser can't open the camera here. Use “Upload instead” below.");
      return;
    }
    setState("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 1280 } }, audio: false });
      streamRef.current = stream;
      setState("live");
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch (e) {
      setState("error");
      const name = e instanceof DOMException ? e.name : "";
      setCamError(
        name === "NotAllowedError"
          ? "Camera permission was denied. Allow camera access in your browser settings, or upload a photo instead."
          : name === "NotFoundError"
            ? "No camera was found on this device. Upload a photo instead."
            : "Couldn't start the camera. Upload a photo instead.",
      );
    }
  }

  function capture() {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Un-mirror: the preview is mirrored for comfort, the saved photo is not.
    ctx.drawImage(v, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        stop();
        setShot({ blob, url: URL.createObjectURL(blob) });
        setState("captured");
      },
      "image/jpeg",
      0.85,
    );
  }

  async function useShot() {
    if (!shot) return;
    setState("uploading");
    const form = new FormData();
    form.append("type", "SELFIE");
    form.append("source", "CAMERA");
    form.append("file", new File([shot.blob], "live-selfie.jpg", { type: "image/jpeg" }));
    // A dropped connection used to throw here and leave the button spinning for ever. Now: wait for the
    // connection and try again (up to 5 attempts), then let the student retry by hand.
    let res: Response | null = null;
    for (let attempt = 0; attempt < 5 && !res; attempt++) {
      if (attempt > 0) {
        if (isOffline()) {
          toast.error("You're offline", "Your selfie will upload as soon as you're back online.");
          await whenOnline();
        } else await new Promise((r) => setTimeout(r, 1500 * 2 ** (attempt - 1)));
      }
      res = await fetch("/api/uploads", { method: "POST", body: form }).catch(() => null);
    }
    if (!res) {
      setState("captured");
      toast.error("Upload failed", "Check your connection and tap “Use this photo” again.");
      return;
    }
    const body = (await res.json().catch(() => ({}))) as DraftDoc & { error?: string };
    if (!res.ok) {
      setState("captured");
      toast.error("Upload failed", body.error);
      return;
    }
    setDraft({ ...draft, documents: [...draft.documents.filter((d) => d.type !== "SELFIE"), body] });
    setShot(null);
    setState("idle");
    setStepError(undefined);
    toast.success("Selfie saved");
  }

  return (
    <div className="space-y-6">
      <p className="text-muted">
        Officials compare this live selfie with your verified {draft.studentType === "INTERNATIONAL" ? "passport" : "DigiLocker"} photo. Face the camera in good light, without sunglasses or a cap.
      </p>
      {stepError && <Alert tone="danger">{stepError}</Alert>}

      <Card>
        <CardBody className="space-y-4">
          {selfie && state === "idle" && (
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              {/* eslint-disable-next-line @next/next/no-img-element -- authorised private route */}
              <img src={`/api/documents/${selfie.id}`} alt="Your saved selfie" className="h-48 w-36 rounded-xl object-cover" />
              <div className="space-y-2 text-center sm:text-left">
                <p className="inline-flex items-center gap-2 font-semibold text-success-fg">
                  <CheckCircle2 className="size-5" aria-hidden /> Selfie saved
                </p>
                <div>
                  <Button variant="outline" onClick={start} icon={<RefreshCw className="size-4" aria-hidden />}>
                    Retake selfie
                  </Button>
                </div>
              </div>
            </div>
          )}

          {!selfie && state === "idle" && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <span className="grid size-20 place-items-center rounded-full bg-surface-2">
                <Camera className="size-9 text-muted" aria-hidden />
              </span>
              <Button size="lg" onClick={start} icon={<Camera className="size-5" aria-hidden />}>
                Open camera
              </Button>
            </div>
          )}

          {(state === "starting" || state === "live") && (
            <div className="space-y-3">
              <div className="relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-xl bg-black">
                <video ref={videoRef} playsInline muted autoPlay className="h-full w-full -scale-x-100 object-cover" aria-label="Camera preview" />
                <div aria-hidden className="pointer-events-none absolute inset-[12%_18%_22%] rounded-[50%] border-4 border-white/70" />
                {state === "starting" && <p className="absolute inset-0 grid place-items-center text-white">Starting camera…</p>}
              </div>
              <p className="text-center text-small text-muted">Fit your face inside the oval.</p>
              <div className="flex justify-center gap-2">
                <Button size="lg" onClick={capture} disabled={state !== "live"} icon={<Camera className="size-5" aria-hidden />}>
                  Capture
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    stop();
                    setState("idle");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {(state === "captured" || state === "uploading") && shot && (
            <div className="flex flex-col items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
              <img src={shot.url} alt="Captured selfie preview" className="aspect-[3/4] w-full max-w-sm rounded-xl object-cover" />
              <div className="flex gap-2">
                <Button size="lg" onClick={useShot} loading={state === "uploading"}>
                  Use this photo
                </Button>
                <Button variant="outline" size="lg" onClick={start} disabled={state === "uploading"}>
                  Retake
                </Button>
              </div>
            </div>
          )}

          {state === "error" && (
            <Alert tone="warning" icon={<CameraOff className="size-5" aria-hidden />} title="Camera unavailable">
              {camError}
            </Alert>
          )}
        </CardBody>
      </Card>

      <details className="rounded-xl border border-border p-4">
        <summary className="min-h-11 cursor-pointer content-center font-medium">Can&apos;t use the live camera? Upload instead</summary>
        <div className="mt-3">
          <DocumentUpload
            type="SELFIE"
            label="Selfie photo"
            description="On phones, “Take photo” opens the front camera."
            imageOnly
            cameraFacing="user"
            required
            docs={draft.documents}
            onChange={(docs) => {
              setDraft({ ...draft, documents: docs });
              setStepError(undefined);
            }}
          />
        </div>
      </details>
    </div>
  );
}
