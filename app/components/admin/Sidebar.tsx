"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { LayoutDashboard, FileText, Briefcase, Settings, LogOut, Activity, Image, User, List, Quote, History, Award, HelpCircle, MessageSquare, ChartNoAxesCombined, Menu, X, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { logout } from "@/app/lib/supabase/auth";

const navItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Analytics", href: "/admin/analytics", icon: ChartNoAxesCombined },
  { name: "Blogs", href: "/admin/blogs", icon: FileText },
  { name: "Projects", href: "/admin/projects", icon: Briefcase },
  { name: "Resume", href: "/admin/resume", icon: FileText },
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
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const close = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  useEffect(() => {
    setMounted(true);
    setCollapsed(window.localStorage.getItem("admin-sidebar-collapsed") === "true");
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    window.localStorage.setItem("admin-sidebar-collapsed", String(next));
  };

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
        <Link href="/admin" className="flex min-h-11 items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-text-primary text-lg font-bold text-bg-primary">H</span>
          <span className="font-semibold text-text-primary">Admin Panel</span>
        </Link>
        <button ref={triggerRef} type="button" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="mobile-admin-navigation" aria-label="Open admin navigation" className="flex size-11 items-center justify-center rounded-lg border border-border-primary text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"><Menu className="size-5" /></button>
      </header>
      {mounted && open && createPortal(<div data-admin-mobile-nav className="dark"><div aria-hidden="true" onClick={close} className="fixed inset-0 z-40 bg-black/45 sm:hidden" /><aside data-admin-mobile-nav="panel" ref={drawerRef} id="mobile-admin-navigation" role="dialog" aria-modal="true" aria-labelledby="mobile-admin-navigation-title" className="fixed inset-y-0 left-0 z-50 flex w-[min(320px,86vw)] flex-col border-r border-border-primary/50 shadow-2xl sm:hidden">
        <div className="flex h-14 items-center justify-between border-b border-border-primary/50 px-4">
          <span id="mobile-admin-navigation-title" className="font-semibold text-text-primary">Navigation</span>
          <button ref={closeRef} type="button" onClick={close} aria-label="Close admin navigation panel" className="flex size-11 items-center justify-center rounded-lg text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"><X className="size-5" /></button>
        </div>
         <nav className="flex-1 overflow-y-auto py-3"><ul className="grid gap-1 px-3">{navItems.map((item) => { const Icon = item.icon; const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href)); return <li key={item.name}><Link href={item.href} onClick={close} aria-current={active ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current ${active ? "bg-bg-primary font-medium text-text-primary" : "text-text-secondary hover:bg-border-primary/30 hover:text-text-primary"}`}><Icon className="size-4 shrink-0" />{item.name}</Link></li>; })}</ul></nav>
        <div className="border-t border-border-primary/50 p-3"><button onClick={() => logout()} className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-red-700 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current dark:text-red-400 dark:hover:bg-red-950/20"><LogOut className="size-4" />Sign Out</button></div>
      </aside></div>, document.body)}
       <aside data-admin-sidebar={collapsed ? "collapsed" : "expanded"} className="admin-sidebar fixed inset-y-0 left-0 z-10 hidden flex-col border-r border-border-primary sm:flex" style={{ width: collapsed ? 80 : 256 }}>
      {/* Logo / Brand */}
       <div className={`flex h-16 items-center border-b border-border-primary ${collapsed ? "justify-center px-2" : "justify-between px-4"}`}>
         <Link href="/admin" aria-label="Admin dashboard" title={collapsed ? "Admin dashboard" : undefined} className="flex min-h-11 items-center gap-2.5">
           <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-text-primary text-bg-primary font-bold text-lg select-none">
             H
           </div>
           {!collapsed && <span className="font-semibold text-text-primary">Admin Panel</span>}
         </Link>
         {!collapsed && <button type="button" onClick={toggleCollapsed} aria-label="Collapse navigation" title="Collapse navigation" className="flex size-11 items-center justify-center rounded-xl text-text-secondary hover:bg-bg-primary hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-current"><PanelLeftClose className="size-5" /></button>}
       </div>

       {collapsed && <button type="button" onClick={toggleCollapsed} aria-label="Expand navigation" title="Expand navigation" className="mx-auto mt-3 flex size-11 items-center justify-center rounded-xl text-text-secondary hover:bg-bg-primary hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-current"><PanelLeftOpen className="size-5" /></button>}

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
                   title={collapsed ? item.name : undefined}
                   aria-label={collapsed ? item.name : undefined}
                   aria-current={isActive ? "page" : undefined}
                   className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current ${collapsed ? "justify-center" : ""} ${
                     isActive
                       ? "bg-bg-primary font-medium text-text-primary"
                       : "text-text-secondary hover:bg-border-primary/30 hover:text-text-primary"
                   }`}
                 >
                   <Icon className="size-5 shrink-0" />
                   {!collapsed && item.name}
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
           aria-label={collapsed ? "Sign Out" : undefined}
           title={collapsed ? "Sign Out" : undefined}
           className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current dark:text-red-400 dark:hover:bg-red-950/20 ${collapsed ? "justify-center" : ""}`}
         >
           <LogOut className="size-5 shrink-0" />
           {!collapsed && "Sign Out"}
        </button>
      </div>
      </aside>
    </>
  );
}
