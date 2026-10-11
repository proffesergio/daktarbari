"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

// Mobile scroll relief: floating back-to-top after 600px.
export default function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!show) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="উপরে ফিরুন"
      className="fixed bottom-24 right-3 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-950 text-white shadow-xl md:bottom-6"
    >
      <ArrowUp size={18} />
    </button>
  );
}
