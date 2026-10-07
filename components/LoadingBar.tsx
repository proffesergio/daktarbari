"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// YouTube-style top thin gradient bar.
// Starts instantly on any internal <a> click (header menus felt dead),
// completes when pathname/searchParams settle.
export default function LoadingBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const [width, setWidth] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Complete on route settle
  useEffect(() => {
    setWidth(100);
    const t = setTimeout(() => {
      setActive(false);
      setWidth(0);
    }, 350);
    return () => clearTimeout(t);
  }, [pathname, searchParams]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const a = (e.target as HTMLElement).closest?.("a[href^='/']") as HTMLAnchorElement | null;
      if (!a) return;
      // same-page hash only → no bar
      try {
        const url = new URL(a.href);
        if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      } catch {
        return;
      }
      setActive(true);
      setWidth(8);
      if (timer.current) clearInterval(timer.current);
      timer.current = setInterval(() => {
        setWidth((w) => (w >= 88 ? w : w + Math.random() * 14));
      }, 220);
      // safety: never stuck
      setTimeout(() => {
        setActive((on) => {
          if (on) {
            if (timer.current) clearInterval(timer.current);
            setWidth(100);
            setTimeout(() => {
              setActive(false);
              setWidth(0);
            }, 400);
          }
          return on;
        });
      }, 8000);
    }
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  useEffect(() => {
    if (!active && width === 100 && timer.current) clearInterval(timer.current);
  }, [active, width]);

  if (!active && width === 0) return null;

  return (
    <div aria-hidden className="fixed left-0 right-0 top-0 z-[60] h-[3px] bg-transparent">
      <div
        className="animate-progress-shimmer h-full rounded-r-full bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-600 transition-[width] duration-300 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
