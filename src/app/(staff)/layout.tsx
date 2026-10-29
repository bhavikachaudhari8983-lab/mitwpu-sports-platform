import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { isStaffRole } from "@/lib/constants";
import { StaffShell } from "@/components/layout/staff-shell";

export const dynamic = "force-dynamic";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user || user.role === "STUDENT") redirect("/staff/login");
  const staff = await prisma.staffUser.findUnique({ where: { id: user.id }, select: { name: true, role: true, active: true } });
  if (!staff || !staff.active || !isStaffRole(staff.role)) redirect("/staff/login");
  return <StaffShell user={{ name: staff.name, role: staff.role }}>{children}</StaffShell>;
}
