"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function BlogViewportMode() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    const syncMode = () => {
      const compact = media.matches;
      const currentlyCompact = searchParams.get("view") === "compact";
      if (compact === currentlyCompact) return;

      const params = new URLSearchParams(searchParams.toString());
      const currentPage = Number.parseInt(params.get("page") || "1", 10);
      const currentStart = currentlyCompact
        ? currentPage <= 1
          ? 0
          : 7 + (currentPage - 2) * 8
        : currentPage <= 1
          ? 0
          : 10 + (currentPage - 2) * 9;
      const targetPage = compact
        ? currentStart < 7
          ? 1
          : 2 + Math.floor((currentStart - 7) / 8)
        : currentStart < 10
          ? 1
          : 2 + Math.floor((currentStart - 10) / 9);

      if (compact) params.set("view", "compact");
      else params.delete("view");
      if (targetPage > 1) params.set("page", String(targetPage));
      else params.delete("page");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    };

    syncMode();
    media.addEventListener("change", syncMode);
    return () => media.removeEventListener("change", syncMode);
  }, [pathname, router, searchParams]);

  return null;
}
