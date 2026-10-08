"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Stethoscope, Menu, X, Search, Plus, Hospital, FlaskConical } from "lucide-react";
import { SPECIALTIES_BN } from "@/lib/specialties";
import { DIVISIONS } from "@/lib/divisions";

export default function Header() {
  const [drawer, setDrawer] = useState(false);
  const [q, setQ] = useState("");
  const pathname = usePathname();

  const nav = [
    { href: "/all-doctors", label: "ডাক্তার", active: pathname?.startsWith("/all-doctors") || pathname?.startsWith("/doctors") || pathname?.startsWith("/doctor") },
    { href: "/hospitals", label: "হাসপাতাল", active: pathname?.startsWith("/hospitals") },
    { href: "/diagnostics", label: "ডায়াগনস্টিক", active: pathname?.startsWith("/diagnostics") },
  ];

  const filteredSpecialties = SPECIALTIES_BN.filter((s) => (q ? s.includes(q.trim()) : true));
  const filteredDivisions = DIVISIONS.filter((d) => (q ? d.name_bn.includes(q.trim()) : true));

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-3 py-2.5">
          <button
            onClick={() => setDrawer(true)}
            aria-label="মেনু খুলুন"
            className="rounded-xl border border-gray-200 p-2 text-gray-700 hover:bg-gray-50"
          >
            <Menu size={20} />
          </button>
          <Link href="/" className="flex min-w-0 flex-1 items-center gap-2" aria-label="ডাক্তার বাড়ি">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0A1930] text-[#E2C78F]">
              <Stethoscope size={20} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-base font-bold leading-tight text-[#0A1930]">ডাক্তার বাড়ি</span>
              <span className="hidden text-[11px] text-gray-500 sm:block">বাংলাদেশের ডাক্তার ডিরেক্টরি</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="প্রধান মেনু">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`rounded-lg px-3 py-2 text-sm font-bold ${n.active ? "bg-[#FAF7F0] text-[#0A1930]" : "text-gray-700 hover:bg-gray-50"}`}
              >
                {n.label}
              </Link>
            ))}
            <Link
              href="/add"
              className="ml-1 flex items-center gap-1 rounded-xl bg-[#0A1930] px-3.5 py-2 text-sm font-bold text-white hover:bg-[#14365D]"
            >
              <Plus size={16} /> তথ্য যুক্ত করুন
            </Link>
          </nav>
          <Link
            href="/add"
            aria-label="তথ্য যুক্ত করুন"
            className="rounded-xl bg-[#0A1930] p-2 text-white md:hidden"
          >
            <Plus size={20} />
          </Link>
        </div>
      </header>

      {/* Drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
          <aside className="animate-drawer-in absolute left-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b p-3">
              <span className="flex items-center gap-2 text-sm font-bold text-[#0A1930]">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0A1930] text-[#E2C78F]">
                  <Stethoscope size={18} />
                </span>
                ক্যাটাগরি অনুযায়ী খুঁজুন
              </span>
              <button onClick={() => setDrawer(false)} aria-label="বন্ধ করুন" className="rounded-lg border p-1.5">
                <X size={18} />
              </button>
            </div>
            <div className="border-b p-3">
              <div className="flex items-center gap-2 rounded-xl border px-3 py-2 focus-within:border-[#256662]">
                <Search size={16} className="text-gray-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="বিশেষজ্ঞ / বিভাগ খুঁজুন..."
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-gray-500">সার্চ হোম পেজে হবে — নিচে ক্যাটাগরি বেছে নিন</p>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">বিশেষজ্ঞ</p>
              <div className="mt-2 flex flex-col gap-1">
                {filteredSpecialties.map((s) => (
                  <Link
                    key={s}
                    href={`/doctors?specialty=${encodeURIComponent(s)}`}
                    onClick={() => setDrawer(false)}
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-[#FAF7F0] hover:text-[#0A1930]"
                  >
                    {s}
                  </Link>
                ))}
                {filteredSpecialties.length === 0 && <p className="px-3 py-2 text-sm text-gray-500">মেলেনি</p>}
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-wide text-gray-500">বিভাগ</p>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {filteredDivisions.map((d) => (
                  <Link
                    key={d.name_bn}
                    href={`/doctors?division=${encodeURIComponent(d.name_bn)}`}
                    onClick={() => setDrawer(false)}
                    className="rounded-lg border px-3 py-2 text-center text-sm font-bold text-gray-800 hover:border-[#C9A86A]"
                  >
                    {d.name_bn}
                  </Link>
                ))}
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-wide text-gray-500">সেবা</p>
              <div className="mt-2 flex flex-col gap-1">
                <Link href="/hospitals" onClick={() => setDrawer(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-gray-800 hover:bg-gray-50">
                  <Hospital size={16} /> হাসপাতাল
                </Link>
                <Link href="/diagnostics" onClick={() => setDrawer(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-gray-800 hover:bg-gray-50">
                  <FlaskConical size={16} /> ডায়াগনস্টিক
                </Link>
                <Link href="/all-doctors" onClick={() => setDrawer(false)} className="flex items-center gap-2 rounded-lg bg-[#FAF7F0] px-3 py-2 text-sm font-bold text-[#0A1930]">
                  ✨ সকল ডাক্তার
                </Link>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
