import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Lock, XCircle } from "lucide-react";
import { requireStaffPage } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getAgeCategory } from "@/lib/registration";
import { verificationBlockers } from "@/lib/workflow";
import { CHECK_LABEL, DOC_LABEL, GENDER_LABEL, isDocType, isStatus, STUDENT_TYPE_LABEL, type CheckType, type Gender, type StudentType } from "@/lib/constants";
import { formatDateTime, formatDob } from "@/lib/utils";
import { isMinor } from "@/lib/age";
import { Card, CardBody, CardHeader, DefinitionList } from "@/components/ui/card";
import { Alert, Badge, StatusBadge } from "@/components/ui/badge";
import { PhotoCompare } from "@/components/admin/photo-compare";
import { DocumentViewer } from "@/components/admin/document-viewer";
import { StudentActions } from "@/components/admin/student-actions";
import { AuditList } from "@/components/admin/audit-list";

export const metadata: Metadata = { title: "Student" };

export default async function StudentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireStaffPage(["ADMIN"], `/admin/students/${id}`);
  const s = await prisma.student.findUnique({
    where: { id },
    include: {
      documents: { orderBy: { createdAt: "asc" } },
      checks: { orderBy: { createdAt: "asc" } },
      college: true,
      registrations: { include: { event: { include: { sport: true } }, weightCategory: true } },
      measurements: { orderBy: { createdAt: "desc" }, include: { measuredBy: { select: { name: true } } } },
      weighIns: { orderBy: { createdAt: "desc" }, include: { event: true, recordedBy: { select: { name: true } } } },
    },
  });
  if (!s) notFound();
  const audits = await prisma.auditLog.findMany({ where: { studentId: id }, orderBy: { createdAt: "desc" }, take: 100 });
  const { ageCategory } = await getAgeCategory(s.dob);
  const status = isStatus(s.status) ? s.status : "DRAFT";
  const blockers = status === "VERIFIED" ? [] : verificationBlockers({ ...s, measurements: s.measurements.slice(0, 1) });
  const approveBlockers = s.studentType === "OUTSIDE_INDIAN" && !s.college?.trusted ? ["college not confirmed"] : [];

  const docs = s.documents.filter((d) => isDocType(d.type));
  const label = (d: (typeof docs)[number]) => {
    const base = DOC_LABEL[d.type as keyof typeof DOC_LABEL];
    return d.type === "REFERENCE_PHOTO" ? `${d.source === "ERP" ? "ERP" : d.source === "PASSPORT" ? "Passport" : "DigiLocker"} photo` : base;
  };
  const reference = docs.filter((d) => d.type === "REFERENCE_PHOTO").map((d) => ({ id: d.id, label: label(d) }));
  const submitted = docs.filter((d) => d.type === "SELFIE" || d.type === "PHOTO").map((d) => ({ id: d.id, label: label(d) }));
  const failedChecks = s.checks.filter((c) => !c.passed);

  return (
    <div className="space-y-6">
      <Link href="/admin#students" className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-lg px-2 font-medium text-muted hover:text-fg">
        <ArrowLeft className="size-4" aria-hidden /> All students
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] text-fg">{s.fullName ?? "Unverified applicant"}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={status} />
            <Badge>{STUDENT_TYPE_LABEL[s.studentType as StudentType] ?? s.studentType}</Badge>
            {ageCategory && <Badge>Age {ageCategory}</Badge>}
            {s.sportsId && <Badge tone="success"><span className="font-mono">{s.sportsId}</span></Badge>}
            {isMinor(s.dob) && <Badge tone="warning">Under 18</Badge>}
            {s.deletionRequestedAt && <Badge tone="danger">Deletion requested</Badge>}
          </div>
        </div>
      </div>

      {s.statusReason && (status === "FLAGGED" || status === "REJECTED") && (
        <Alert tone={status === "REJECTED" ? "danger" : "info"} title={`Reason shown to student`}>
          {s.statusReason}
        </Alert>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader title="Photo comparison" description="Compare the verified-source photo with the live selfie and uploaded photo." />
            <CardBody>
              <PhotoCompare reference={reference} submitted={submitted} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Automatic checks" description={failedChecks.length ? `${failedChecks.length} mismatch${failedChecks.length > 1 ? "es" : ""}` : "All passed"} />
            <CardBody>
              {s.checks.length === 0 ? (
                <p className="text-muted">No checks recorded yet.</p>
              ) : (
                <ul className="space-y-2">
                  {s.checks.map((c) => (
                    <li key={c.id} className="flex gap-3 rounded-lg bg-surface-2 p-3">
                      {c.passed ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success-fg" aria-label="Passed" /> : <XCircle className="mt-0.5 size-5 shrink-0 text-danger-fg" aria-label="Failed" />}
                      <div className="min-w-0">
                        <p className="font-medium">{CHECK_LABEL[c.type as CheckType] ?? c.type}</p>
                        {(c.expected || c.actual) && (
                          <p className="text-small break-words">
                            Record: <span className="font-mono">{c.type.includes("DOB") ? formatDob(c.expected) : c.expected}</span> · Verified source: <span className="font-mono">{c.type.includes("DOB") ? formatDob(c.actual) : c.actual}</span>
                          </p>
                        )}
                        {c.details && <p className="text-small text-muted">{c.details}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Identity" />
            <CardBody>
              <DefinitionList
                items={[
                  { label: "Full name", value: s.fullName },
                  {
                    label: "Date of birth",
                    value: (
                      <span className="inline-flex items-center gap-1.5">
                        {formatDob(s.dob)} {s.dobLocked && <Lock className="size-3.5 text-muted" aria-label="Locked" />}
                        <span className="text-small font-normal text-muted">({s.dobSource?.toLowerCase().replace("_", " ") ?? "unverified"})</span>
                      </span>
                    ),
                  },
                  { label: "Gender", value: s.gender ? GENDER_LABEL[s.gender as Gender] ?? s.gender : "—" },
                  ...(s.studentType === "INTERNATIONAL"
                    ? [
                        { label: "Passport", value: <span className="font-mono">{s.nationality} · {s.passportNumber}</span> },
                        { label: "Passport expiry", value: formatDob(s.passportExpiry) },
                        { label: "MRZ check", value: s.mrzValid ? "Valid" : "Not checked" },
                        { label: "Passport chip/MRZ at desk", value: s.passportDeskVerified ? `Verified ${formatDateTime(s.passportDeskVerifiedAt)}` : "Not yet" },
                      ]
                    : [{ label: "Aadhaar (masked)", value: s.aadhaarLast4 ? <span className="font-mono">XXXX XXXX {s.aadhaarLast4}</span> : "—" }]),
                  { label: "Mobile", value: s.mobile },
                  { label: "Email", value: <span className="break-all">{s.email}</span> },
                  { label: "Address", value: s.address },
                  { label: "Blood group", value: s.bloodGroup },
                  { label: "Emergency contact", value: s.emergencyName ? `${s.emergencyName} · ${s.emergencyPhone ?? ""}` : "—" },
                  { label: "Medical conditions", value: s.medicalConditions ? "Declared — visible to medical staff only" : "None declared" },
                ]}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Academic & sports" />
            <CardBody className="space-y-4">
              <DefinitionList
                items={[
                  { label: "University / college", value: s.universityName },
                  ...(s.studentType === "OUTSIDE_INDIAN" ? [{ label: "College status", value: s.college?.trusted ? `Confirmed ${formatDateTime(s.college.confirmedAt)}` : "Awaiting confirmation" }, { label: "College office email", value: s.collegeOfficeEmail }] : []),
                  { label: "PRN / enrollment", value: s.prn ? <span className="font-mono">{s.prn}</span> : "—" },
                  { label: "Course", value: s.course ? `${s.course}${s.year ? ` · Year ${s.year}` : ""}` : "—" },
                  { label: "APAAR / ABC ID", value: s.apaarId || "—" },
                  { label: "Playing position", value: s.playingPosition || "—" },
                ]}
              />
              <div>
                <p className="mb-2 text-small text-muted">Events</p>
                <ul className="space-y-1">
                  {s.registrations.map((r) => (
                    <li key={r.id} className="rounded-lg bg-surface-2 px-3 py-2">
                      {r.event.sport.name} · {r.event.name}
                      {r.weightCategory && <span className="text-muted"> · {r.weightCategory.name}</span>}
                    </li>
                  ))}
                  {s.registrations.length === 0 && <li className="text-muted">None</li>}
                </ul>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Measurements & weigh-ins" description="Entered only by officials." />
            <CardBody className="space-y-4">
              {s.measurements.length === 0 ? (
                <p className="text-muted">Not measured yet.</p>
              ) : (
                <ul className="space-y-1">
                  {s.measurements.map((m) => (
                    <li key={m.id} className="flex flex-wrap justify-between gap-2 rounded-lg bg-surface-2 px-3 py-2">
                      <span className="font-mono tabular">
                        {m.heightCm} cm · {m.weightKg} kg
                      </span>
                      <span className="text-small text-muted">
                        {m.measuredBy.name} · {formatDateTime(m.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {s.weighIns.length > 0 && (
                <ul className="space-y-1">
                  {s.weighIns.map((w) => (
                    <li key={w.id} className="flex flex-wrap justify-between gap-2 rounded-lg bg-surface-2 px-3 py-2">
                      <span>
                        {w.event.name}: <span className="font-mono">{w.weightKg} kg</span> {w.categoryName && `(${w.categoryName})`}{" "}
                        {w.withinCategory === false ? <Badge tone="danger">Outside category</Badge> : w.withinCategory ? <Badge tone="success">Within</Badge> : null}
                      </span>
                      <span className="text-small text-muted">
                        {w.recordedBy.name} · {formatDateTime(w.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Actions" />
            <CardBody>
              <StudentActions
                studentId={s.id}
                name={s.fullName ?? "Applicant"}
                status={status}
                dob={s.dob}
                canConfirmCollege={s.studentType === "OUTSIDE_INDIAN" && !!s.college && !s.college.trusted}
                collegeName={s.college?.name ?? null}
                approveBlockers={approveBlockers}
              />
              {status === "PENDING" && blockers.length > 0 && (
                <div className="mt-4 rounded-lg bg-surface-2 p-3 text-small">
                  <p className="font-semibold">Before desk verification:</p>
                  <ul className="list-inside list-disc text-muted">
                    {blockers.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Documents" description="Every view is logged." />
            <CardBody>
              <DocumentViewer docs={docs.map((d) => ({ id: d.id, label: label(d), mimeType: d.mimeType, size: d.size, source: d.source, createdAt: d.createdAt.toISOString() }))} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Timeline" />
            <CardBody>
              <DefinitionList
                className="sm:grid-cols-1"
                items={[
                  { label: "Started", value: formatDateTime(s.createdAt) },
                  { label: "Submitted", value: formatDateTime(s.submittedAt) },
                  { label: "Verified", value: formatDateTime(s.verifiedAt) },
                  { label: "Approved", value: formatDateTime(s.approvedAt) },
                ]}
              />
            </CardBody>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader title="Audit history" description="Most recent first" />
        <CardBody>
          <AuditList entries={audits} />
        </CardBody>
      </Card>
    </div>
  );
}
