"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollPersist() {
  const pathname = usePathname();
  const KEY = `scroll:${pathname || "/"}`;

  useEffect(() => {
    const y = Number(localStorage.getItem(KEY) || 0);
    if (!Number.isNaN(y)) window.scrollTo(0, y);

    let t: ReturnType<typeof setTimeout> | null = null;
    const onScroll = () => {
      if (t) clearTimeout(t);
      t = setTimeout(() => {
        try {
          localStorage.setItem(KEY, String(window.scrollY));
        } catch {}
      }, 150);
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    const onBeforeUnload = () => {
      try {
        localStorage.setItem(KEY, String(window.scrollY));
      } catch {}
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      if (t) clearTimeout(t);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [KEY]);

  return null;
}
