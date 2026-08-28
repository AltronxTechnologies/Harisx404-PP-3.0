"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Briefcase, Settings, LogOut, Activity, Image, User, List, Quote, History, Award } from "lucide-react";
import { logout } from "@/app/lib/supabase/auth";

const navItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Blogs", href: "/admin/blogs", icon: FileText },
  { name: "Projects", href: "/admin/projects", icon: Briefcase },
  { name: "Changelogs", href: "/admin/changelogs", icon: List },
  { name: "Testimonials", href: "/admin/testimonials", icon: Quote },
  { name: "Experience", href: "/admin/experience", icon: History },
  { name: "Certifications", href: "/admin/certifications", icon: Award },
  { name: "Media", href: "/admin/media", icon: Image },
  { name: "About", href: "/admin/about", icon: User },
  { name: "System Logs", href: "/admin/logs", icon: Activity },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r border-border-primary/50 bg-bg-primary sm:flex">
      {/* Logo / Brand */}
      <div className="flex h-14 items-center border-b border-border-primary/50 px-6">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-lg select-none">
            H
          </div>
          <span className="font-semibold text-text-primary">Admin Panel</span>
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-auto py-4">
        <ul className="grid gap-1 px-3">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
                    isActive
                      ? "bg-indigo-50 dark:bg-indigo-950/40 font-medium text-indigo-600 dark:text-indigo-400"
                      : "text-text-secondary hover:bg-border-primary/30 hover:text-text-primary"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Log out */}
      <div className="border-t border-border-primary/50 p-3">
        <button
          onClick={() => logout()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
