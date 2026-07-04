import { requireStaff } from "@/lib/guards";
import { AdminShell } from "@/components/admin/shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireStaff();
  return (
    <AdminShell
      user={{ name: session.user.name ?? "Staff", role: session.user.role }}
    >
      {children}
    </AdminShell>
  );
}
