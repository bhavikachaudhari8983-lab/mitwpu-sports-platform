import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { AlertTriangle, BadgeCheck, Ban, SearchX } from "lucide-react";
import { verifyCertificate } from "@/lib/certificates";
import { CERT_LABEL, type CertKind } from "@/lib/constants";
import { formatDateTime, formatDob, cn } from "@/lib/utils";
import { Card, CardBody, DefinitionList } from "@/components/ui/card";

export const metadata: Metadata = { title: "Certificate check", robots: { index: false } };
export const dynamic = "force-dynamic";

const STATE = {
  VALID: { icon: BadgeCheck, title: "Certificate is authentic", tone: "bg-success-bg text-success-fg", note: "The details below match what the sports office issued, and the digital signature checks out." },
  REVOKED: { icon: Ban, title: "Certificate was revoked", tone: "bg-danger-bg text-danger-fg", note: "This certificate was genuine but has since been withdrawn by the sports office." },
  TAMPERED: { icon: AlertTriangle, title: "Certificate record failed its signature check", tone: "bg-danger-bg text-danger-fg", note: "The stored details don't match their signature. Do not rely on this certificate; contact the sports office." },
  NOT_FOUND: { icon: SearchX, title: "No certificate with this code", tone: "bg-warning-bg text-warning-fg", note: "Check the code for typos. A certificate not listed here was not issued by this system." },
} as const;

/** Public verification. Shows only what is printed on the certificate itself — never DOB, IDs or contact details. */
export default async function VerifyCode({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  const result = await verifyCertificate(decodeURIComponent(code), ip);
  const s = STATE[result.state];
  const cert = result.state === "NOT_FOUND" ? null : result.cert;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <div className={cn("flex items-start gap-3 rounded-2xl p-5", s.tone)} role="status">
        <s.icon className="size-8 shrink-0" aria-hidden />
        <div>
          <h1 className="text-2xl">{s.title}</h1>
          <p className="mt-1">{s.note}</p>
        </div>
      </div>
      {cert && (
        <Card>
          <CardBody>
            <DefinitionList
              items={[
                { label: "Certificate ID", value: <span className="font-mono">{cert.code}</span> },
                { label: "Type", value: CERT_LABEL[cert.kind as CertKind] ?? cert.kind },
                { label: "Awarded to", value: cert.recipient },
                { label: "Institution", value: cert.institution },
                { label: "Event", value: cert.title },
                { label: "Issued", value: formatDob(cert.issuedAt.toISOString().slice(0, 10)) },
                ...(cert.revokedAt ? [{ label: "Revoked", value: `${formatDateTime(cert.revokedAt)} — ${cert.revokeReason ?? ""}` }] : []),
              ]}
            />
          </CardBody>
        </Card>
      )}
      <p className="text-small text-muted">
        Every check is recorded, and certificate records can&apos;t be edited after issue. <Link href="/verify" className="font-semibold text-fg underline underline-offset-4">Check another code</Link>
      </p>
    </div>
  );
}
