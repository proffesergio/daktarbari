"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Stethoscope, Hospital, FlaskConical } from "lucide-react";

const ITEMS = [
  { href: "/", label: "হোম", icon: Home, match: (p: string) => p === "/" },
  { href: "/all-doctors", label: "ডাক্তার", icon: Stethoscope, match: (p: string) => p.startsWith("/all-doctors") || p.startsWith("/doctors") || p.startsWith("/doctor") },
  { href: "/hospitals", label: "হাসপাতাল", icon: Hospital, match: (p: string) => p.startsWith("/hospitals") },
  { href: "/diagnostics", label: "ডায়াগনস্টিক", icon: FlaskConical, match: (p: string) => p.startsWith("/diagnostics") },
];

// Mobile-only bottom nav (md:hidden). Home / Doctors / Hospitals / Diagnostics.
export default function BottomNav() {
  const pathname = usePathname() ?? "/";
  return (
    <nav aria-label="মোবাইল নেভিগেশন" className="pb-safe fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-4">
        {ITEMS.map((it) => {
          const active = it.match(pathname);
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-bold ${active ? "text-emerald-700" : "text-gray-500"}`}
            >
              <span className={`flex h-7 items-center justify-center rounded-full px-4 ${active ? "bg-emerald-50" : ""}`}>
                <Icon size={19} />
              </span>
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
