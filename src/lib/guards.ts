import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";

// Role gate for admin pages and server actions. Middleware already forces a
// login for /admin; this narrows access per module.
export async function requireStaff(roles?: Role[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/admin/login");
  if (roles && !roles.includes(session.user.role)) redirect("/admin");
  return session;
}

export const MANAGEMENT: Role[] = ["OWNER", "MANAGER"];
export const DESK: Role[] = ["OWNER", "MANAGER", "FRONT_DESK"];
export const ALL_STAFF: Role[] = ["OWNER", "MANAGER", "FRONT_DESK", "HOUSEKEEPING"];
