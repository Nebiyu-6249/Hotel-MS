"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Role } from "@prisma/client";
import {
  BarChart3,
  BedDouble,
  CalendarDays,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  MessageSquareQuote,
  Settings,
  SprayCan,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MANAGEMENT: Role[] = ["OWNER", "MANAGER"];
const DESK: Role[] = ["OWNER", "MANAGER", "FRONT_DESK"];
const ALL: Role[] = ["OWNER", "MANAGER", "FRONT_DESK", "HOUSEKEEPING"];

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, roles: ALL, exact: true },
  { href: "/admin/reservations", label: "Reservations", icon: CalendarDays, roles: DESK },
  { href: "/admin/rooms", label: "Rooms & rates", icon: BedDouble, roles: MANAGEMENT },
  { href: "/admin/guests", label: "Guests", icon: Users, roles: DESK },
  { href: "/admin/housekeeping", label: "Housekeeping", icon: SprayCan, roles: ALL },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquareQuote, roles: DESK },
  { href: "/admin/reports", label: "Reports", icon: BarChart3, roles: MANAGEMENT },
  { href: "/admin/content", label: "Content", icon: ImageIcon, roles: MANAGEMENT },
  { href: "/admin/settings", label: "Settings", icon: Settings, roles: MANAGEMENT },
];

const ROLE_LABEL: Record<Role, string> = {
  OWNER: "Owner",
  MANAGER: "Manager",
  FRONT_DESK: "Front desk",
  HOUSEKEEPING: "Housekeeping",
};

export function AdminShell({
  user,
  children,
}: {
  user: { name: string; role: Role };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const items = NAV.filter((item) => item.roles.includes(user.role));

  function isActive(item: (typeof NAV)[number]): boolean {
    return item.exact ? pathname === item.href : pathname.startsWith(item.href);
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-zinc-800 bg-zinc-950 text-zinc-300 lg:flex">
        <div className="border-b border-zinc-800 px-5 py-5">
          <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">
            Hotel Transylvania
          </p>
          <p className="mt-0.5 text-sm font-semibold text-white">Back office</p>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Admin">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-[13px] transition-colors",
                isActive(item)
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              )}
            >
              <item.icon className="h-4 w-4" aria-hidden />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-zinc-800 p-4">
          <p className="truncate text-[13px] text-zinc-300">{user.name}</p>
          <p className="text-[11px] text-zinc-500">{ROLE_LABEL[user.role]}</p>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="mt-3 flex items-center gap-2 text-[12px] text-zinc-400 hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 border-b border-zinc-200 bg-white lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm font-semibold">Back office</p>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="flex items-center gap-1.5 text-[12px] text-zinc-500"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden /> Sign out
          </button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2" aria-label="Admin">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap px-3 py-1.5 text-[12px]",
                isActive(item)
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <main className="p-4 sm:p-6 lg:ml-60 lg:p-8">{children}</main>
    </div>
  );
}
