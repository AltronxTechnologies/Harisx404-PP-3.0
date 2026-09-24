"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { LayoutDashboard, FileText, Briefcase, Settings, LogOut, Activity, Image, User, List, Quote, History, Award, HelpCircle, MessageSquare, ChartNoAxesCombined, Menu, X } from "lucide-react";
import { logout } from "@/app/lib/supabase/auth";

const navItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Analytics", href: "/admin/analytics", icon: ChartNoAxesCombined },
  { name: "Blogs", href: "/admin/blogs", icon: FileText },
  { name: "Projects", href: "/admin/projects", icon: Briefcase },
  { name: "Resume", href: "/admin/resume", icon: FileText },
  { name: "Changelogs", href: "/admin/changelogs", icon: List },
  { name: "Buildlog", href: "/admin/buildlog", icon: List },
  { name: "Community Wall", href: "/admin/community-wall", icon: MessageSquare },
  { name: "Testimonials", href: "/admin/testimonials", icon: Quote },
  { name: "FAQs", href: "/admin/faqs", icon: HelpCircle },
  { name: "Experience", href: "/admin/experience", icon: History },
  { name: "Certifications", href: "/admin/certifications", icon: Award },
  { name: "Media", href: "/admin/media", icon: Image },
  { name: "About", href: "/admin/about", icon: User },
  { name: "System Logs", href: "/admin/logs", icon: Activity },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const close = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const background = [...document.body.children].filter(
      (element): element is HTMLElement =>
        element instanceof HTMLElement &&
        !element.hasAttribute("data-admin-mobile-nav") &&
        !["SCRIPT", "STYLE"].includes(element.tagName),
    );
    const previousState = background.map((element) => ({
      element,
      ariaHidden: element.getAttribute("aria-hidden"),
      inert: element.inert,
    }));
    background.forEach((element) => {
      element.setAttribute("aria-hidden", "true");
      element.inert = true;
    });
    closeRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key !== "Tab" || !drawerRef.current) return;
      const controls = [...drawerRef.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled])')];
      if (!controls.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previous;
      previousState.forEach(({ element, ariaHidden, inert }) => {
        if (ariaHidden === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", ariaHidden);
        element.inert = inert;
      });
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [close, open]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border-primary/50 bg-bg-primary px-4 sm:hidden">
        <Link href="/admin" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-lg font-bold text-white">H</span>
          <span className="font-semibold text-text-primary">Admin Panel</span>
        </Link>
        <button ref={triggerRef} type="button" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="mobile-admin-navigation" aria-label="Open admin navigation" className="flex size-10 items-center justify-center rounded-lg border border-border-primary text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"><Menu className="size-5" /></button>
      </header>
      {mounted && open && createPortal(<><div data-admin-mobile-nav aria-hidden="true" onClick={close} className="fixed inset-0 z-40 bg-black/45 sm:hidden" /><aside data-admin-mobile-nav ref={drawerRef} id="mobile-admin-navigation" role="dialog" aria-modal="true" aria-labelledby="mobile-admin-navigation-title" className="fixed inset-y-0 left-0 z-50 flex w-[min(320px,86vw)] flex-col border-r border-border-primary/50 bg-bg-primary shadow-2xl sm:hidden">
        <div className="flex h-14 items-center justify-between border-b border-border-primary/50 px-4">
          <span id="mobile-admin-navigation-title" className="font-semibold text-text-primary">Navigation</span>
          <button ref={closeRef} type="button" onClick={close} aria-label="Close admin navigation panel" className="flex size-10 items-center justify-center rounded-lg text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"><X className="size-5" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3"><ul className="grid gap-1 px-3">{navItems.map((item) => { const Icon = item.icon; const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href)); return <li key={item.name}><Link href={item.href} onClick={close} className={`flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm ${active ? "bg-indigo-50 font-medium text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400" : "text-text-secondary hover:bg-border-primary/30 hover:text-text-primary"}`}><Icon className="size-4 shrink-0" />{item.name}</Link></li>; })}</ul></nav>
        <div className="border-t border-border-primary/50 p-3"><button onClick={() => logout()} className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"><LogOut className="size-4" />Sign Out</button></div>
      </aside></>, document.body)}
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
    </>
  );
}
