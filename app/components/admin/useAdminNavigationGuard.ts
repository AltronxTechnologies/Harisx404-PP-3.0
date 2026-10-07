"use client";

import { useEffect, useRef, useState } from "react";
import { logout } from "@/app/lib/supabase/auth";

export function useAdminNavigationGuard(isDirty: boolean) {
  const [leaveTarget, setLeaveTarget] = useState<string | null>(null);
  const allowHistory = useRef(false);

  useEffect(() => {
    if (!isDirty) return;
    const currentUrl = window.location.href;
    const currentState = window.history.state;
    // A same-URL history entry lets Back stop here before Next navigates away.
    window.history.pushState(currentState, "", currentUrl);
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || !(event.target instanceof Element)) return;
      const button = event.target.closest("button");
      if (button?.textContent?.trim() === "Sign Out" || button?.getAttribute("aria-label") === "Sign Out") {
        event.preventDefault();
        event.stopImmediatePropagation();
        setLeaveTarget("__signout__");
        return;
      }
      const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.hasAttribute("download") || anchor.hasAttribute("data-admin-unguarded") || anchor.target === "_blank") return;
      const destination = new URL(anchor.href, currentUrl);
      if (destination.origin !== window.location.origin || destination.href === currentUrl) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setLeaveTarget(`${destination.pathname}${destination.search}${destination.hash}`);
    };
    const onPopState = () => {
      if (allowHistory.current || window.location.href !== currentUrl) return;
      window.history.pushState(currentState, "", currentUrl);
      setLeaveTarget("__history_back__");
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, [isDirty]);

  const confirmLeave = (navigate: (destination: string) => void) => {
    const destination = leaveTarget;
    setLeaveTarget(null);
    if (destination === "__history_back__") {
      allowHistory.current = true;
      window.history.go(-2);
    } else if (destination === "__signout__") {
      void logout();
    } else if (destination) {
      navigate(destination);
    }
  };

  return { leaveTarget, setLeaveTarget, confirmLeave };
}
