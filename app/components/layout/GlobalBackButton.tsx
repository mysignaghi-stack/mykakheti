"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";

const getFallbackPath = (pathname: string) => {
  if (pathname === "/admin") return "/";
  if (pathname.startsWith("/admin/")) return "/admin";
  if (pathname.startsWith("/announcements/")) return "/announcements";
  if (pathname.startsWith("/community/masters/")) return "/community/masters";
  if (pathname.startsWith("/community/lost-found/")) return "/community/lost-found";
  if (pathname.startsWith("/community/")) return "/community";
  return "/";
};

export default function GlobalBackButton() {
  const pathname = usePathname();
  const router = useRouter();
  const fallbackPath = useMemo(() => getFallbackPath(pathname), [pathname]);

  if (!pathname || pathname === "/" || pathname.startsWith("/auth/callback")) {
    return null;
  }

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallbackPath);
  };

  return (
    <button
      type="button"
      onClick={goBack}
      className="fixed bottom-4 left-4 z-[1100] inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-black/70 px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-white/75 shadow-2xl backdrop-blur-xl transition hover:border-amber-300/45 hover:bg-black/85 hover:text-amber-100"
      aria-label="უკან დაბრუნება"
    >
      <span aria-hidden="true">←</span>
      <span>უკან</span>
    </button>
  );
}
