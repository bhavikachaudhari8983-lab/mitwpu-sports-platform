import type { Metadata } from "next";
import { requireStaffPage } from "@/lib/rbac";
import { PageHeader } from "@/components/ui/card";
import { Scanner } from "@/components/scan/scanner";

export const metadata: Metadata = { title: "QR scanner" };

export default async function ScanPage() {
  await requireStaffPage(["OFFICIAL", "ADMIN"], "/scan");
  return (
    <div className="space-y-6">
      <PageHeader title="Event-day scanner" description="Scan the athlete's QR Sports ID. Status is checked live — revoked or unapproved IDs show INVALID." />
      <Scanner />
    </div>
  );
}
