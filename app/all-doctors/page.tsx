import Link from "next/link";
import type { Metadata } from "next";
import DoctorCard from "@/components/DoctorCard";
import { getSupabasePublic } from "@/lib/supabase";
import { SEED_DOCTORS } from "@/lib/seed-doctors";
import { QIMP_DOCTORS } from "@/lib/seed-qimp14";
import { filterBdd } from "@/lib/seed-bddoctor";
import { BANCHARAMPUR_DOCTORS } from "@/lib/seed-bancharampur";
import { SPECIALTIES_BN } from "@/lib/specialties";
import { applySearch } from "@/lib/search";
import AllDoctorsSearchBar from "@/components/AllDoctorsSearchBar";
import TrackResults from "@/components/TrackResults";
import type { Doctor } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "সকল ডাক্তার — ক্যাটাগরি অনুযায়ী | ডাক্তার বাড়ি",
  description: "বিশেষজ্ঞ ক্যাটাগরি অনুযায়ী সব ডাক্তার এক জায়গায়। নাম দিয়ে খুঁজুন।",
};

async function getDbDoctors(): Promise<Doctor[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return [];
  try {
    const sb = getSupabasePublic();
    const { data } = await sb.from("doctors").select("*").eq("status", "APPROVED").order("created_at", { ascending: false }).limit(200);
    return (data ?? []) as Doctor[];
  } catch {
    return [];
  }
}

type SP = { q?: string; specialty?: string; phone?: string; bmdc?: string; feeKnown?: string; sort?: string; n?: string };

const PAGE_SIZE = 60;

function toggleHref(f: SP, key: "phone" | "bmdc" | "feeKnown", cur: string | undefined) {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.specialty) p.set("specialty", f.specialty);
  if (f.sort) p.set("sort", f.sort);
  for (const k of ["phone", "bmdc", "feeKnown"] as const) {
    const v = k === key ? (cur === "1" ? undefined : "1") : f[k];
    if (v) p.set(k, v);
  }
  return `/all-doctors?${p.toString()}`;
}

export default async function AllDoctorsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const f = await searchParams;
  const db = await getDbDoctors();
  const dbIds = new Set(db.map((d) => d.id));
  const dbBmdc = new Set(db.flatMap((d) => (d.bmdc_reg_no ? [d.bmdc_reg_no] : [])));
  const seeds = [...SEED_DOCTORS, ...QIMP_DOCTORS, ...BANCHARAMPUR_DOCTORS, ...filterBdd({})].filter(
    (s) => !dbIds.has(s.id) && !(s.bmdc_reg_no && dbBmdc.has(s.bmdc_reg_no)),
  );
  const allRaw = [...db, ...seeds];
  const all = applySearch(allRaw, {
    q: f.q,
    specialty: f.specialty,
    phoneOnly: f.phone === "1",
    bmdcOnly: f.bmdc === "1",
    feeKnown: f.feeKnown === "1",
    sort: f.sort === "complete" ? "complete" : "smart",
  });
  // Show-more paging over the merged list (groups render from the slice)
  const shown = Math.max(PAGE_SIZE, parseInt(f.n ?? "", 10) || PAGE_SIZE);
  const sliced = all.slice(0, shown);

  const order = [...SPECIALTIES_BN];
  const groups = new Map<string, Doctor[]>();
  for (const d of sliced) {
    if (!groups.has(d.specialty_bn)) groups.set(d.specialty_bn, []);
    groups.get(d.specialty_bn)!.push(d);
  }
  const cats = [...groups.keys()].sort((a, b) => {
    const ia = order.indexOf(a as (typeof order)[number]);
    const ib = order.indexOf(b as (typeof order)[number]);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  const fromParams = new URLSearchParams();
  if (f.q) fromParams.set("q", f.q);
  if (f.specialty) fromParams.set("specialty", f.specialty);
  if (f.phone) fromParams.set("phone", f.phone);
  if (f.bmdc) fromParams.set("bmdc", f.bmdc);
  if (f.feeKnown) fromParams.set("feeKnown", f.feeKnown);
  if (f.sort) fromParams.set("sort", f.sort);
  const fromQs = fromParams.toString();
  const fromUrl = `/all-doctors${fromQs ? `?${fromQs}` : ""}`;

  const chip = (active: boolean) =>
    `flex min-h-[44px] items-center rounded-full border px-3 py-2 text-xs font-bold ${active ? "border-emerald-700 bg-emerald-700 text-white" : "border-gray-200 bg-white text-gray-700"}`;

  // Active-filter pills with individual remove links (mobile-friendly)
  function removeHref(key: "q" | "specialty" | "phone" | "bmdc" | "feeKnown" | "sort") {
    const p = new URLSearchParams();
    if (f.q && key !== "q") p.set("q", f.q);
    if (f.specialty && key !== "specialty") p.set("specialty", f.specialty);
    if (f.phone && key !== "phone") p.set("phone", f.phone);
    if (f.bmdc && key !== "bmdc") p.set("bmdc", f.bmdc);
    if (f.feeKnown && key !== "feeKnown") p.set("feeKnown", f.feeKnown);
    if (f.sort && key !== "sort") p.set("sort", f.sort);
    return `/all-doctors?${p.toString()}`;
  }
  const activePills: { label: string; href: string }[] = [];
  if (f.q) activePills.push({ label: `“${f.q}”`, href: removeHref("q") });
  if (f.specialty) activePills.push({ label: f.specialty, href: removeHref("specialty") });
  if (f.phone) activePills.push({ label: "☎ ফোন", href: removeHref("phone") });
  if (f.feeKnown) activePills.push({ label: "৳ ফি", href: removeHref("feeKnown") });
  if (f.bmdc) activePills.push({ label: "✓ BMDC", href: removeHref("bmdc") });
  if (f.sort === "complete") activePills.push({ label: "📋 সম্পূর্ণ", href: removeHref("sort") });

  return (
    <div className="mx-auto max-w-5xl px-3 py-5 pb-24 sm:pb-8">
      <TrackResults query={f.q ?? ""} meta="সকল ডাক্তার" count={all.length} />
      <h1 className="text-lg font-bold">✨ সকল ডাক্তার</h1>
      <p className="mt-0.5 text-sm text-gray-600">{all.length} জন ({db.length} লাইভ + {seeds.length} কমিউনিটি)</p>

      {/* Sticky search + live filters — stays put while scrolling on phone */}
      <div className="sticky top-14 z-10 -mx-1 bg-[#FAF7F0]/95 px-1 py-2 backdrop-blur">
        <AllDoctorsSearchBar initialQ={f.q ?? ""} />
        <div className="mt-2 flex flex-wrap gap-2">
          <Link href={toggleHref(f, "phone", f.phone)} className={chip(f.phone === "1")}>☎ ফোন আছে</Link>
          <Link href={toggleHref(f, "feeKnown", f.feeKnown)} className={chip(f.feeKnown === "1")}>৳ ফি জানা</Link>
          <Link href={toggleHref(f, "bmdc", f.bmdc)} className={chip(f.bmdc === "1")}>✓ BMDC</Link>
          <Link
            href={`/all-doctors?${(() => {
              const p = new URLSearchParams();
              if (f.q) p.set("q", f.q);
              if (f.specialty) p.set("specialty", f.specialty);
              if (f.phone) p.set("phone", f.phone);
              if (f.bmdc) p.set("bmdc", f.bmdc);
              if (f.feeKnown) p.set("feeKnown", f.feeKnown);
              if (f.sort === "complete") p.delete("sort");
              else p.set("sort", "complete");
              return p.toString();
            })()}`}
            className={chip(f.sort === "complete")}
          >
            📋 সম্পূর্ণ আগে
          </Link>
        </div>
        {activePills.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-gray-500">চালু:</span>
            {activePills.map((a) => (
              <Link key={a.label} href={a.href} title="তুলে দিন" className="rounded-full bg-emerald-700 px-2.5 py-1 text-[11px] font-bold text-white">
                {a.label} ✕
              </Link>
            ))}
            <Link href="/all-doctors" className="text-[11px] font-bold text-emerald-700 underline">সব মুছুন</Link>
          </div>
        )}
      </div>

      <details className="mt-3 rounded-2xl border border-gray-100 bg-white px-3 py-2 shadow-sm" open={cats.length <= 6}>
        <summary className="cursor-pointer py-1 text-sm font-bold text-emerald-900">📂 ক্যাটাগরি ({cats.length}টি) — {cats.length > 6 ? "খুলুন" : ""}</summary>
        <nav className="flex flex-wrap gap-2 py-2" aria-label="ক্যাটাগরি">
          {cats.map((c, i) => (
            <a key={c} href={`#cat-${i}`} className="flex min-h-[44px] items-center rounded-full border border-emerald-700 p-3 text-xs font-bold leading-tight text-emerald-800 hover:bg-emerald-50">
              <span className="truncate">{c} ({groups.get(c)!.length})</span>
            </a>
          ))}
        </nav>
      </details>
      {cats.map((c, i) => (
        <section key={c} id={`cat-${i}`} className="mt-6 scroll-mt-24">
          <h2 className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-900">
            Expertised in {c} — {groups.get(c)!.length} জন
          </h2>
          <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {groups.get(c)!.slice(0, 24).map((d) => <DoctorCard key={d.id} doctor={d} variant="grid" from={fromUrl} />)}
          </div>
          {groups.get(c)!.length > 24 && (
            <Link href={`/doctors?specialty=${encodeURIComponent(c)}`} className="mt-2 block rounded-xl border border-gray-200 bg-white px-3 py-2 text-center text-xs font-bold text-emerald-800">
              আরও {groups.get(c)!.length - 24} জন দেখুন →
            </Link>
          )}
        </section>
      ))}
      {cats.length === 0 && <p className="mt-6 rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">কিছু মেলেনি — অন্য নামে খুঁজুন।</p>}
      {all.length > sliced.length && (
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">{sliced.length}/{all.length} দেখানো হচ্ছে</p>
          <Link
            href={`/all-doctors?${(() => {
              const p = new URLSearchParams();
              if (f.q) p.set("q", f.q);
              if (f.specialty) p.set("specialty", f.specialty);
              if (f.phone) p.set("phone", f.phone);
              if (f.bmdc) p.set("bmdc", f.bmdc);
              if (f.feeKnown) p.set("feeKnown", f.feeKnown);
              if (f.sort) p.set("sort", f.sort);
              p.set("n", String(shown + PAGE_SIZE));
              return p.toString();
            })()}#more`}
            className="mt-2 inline-flex items-center justify-center rounded-xl border border-emerald-700 px-6 py-2.5 text-sm font-bold text-emerald-800"
          >
            আরও {Math.min(PAGE_SIZE, all.length - sliced.length)} জন দেখুন ↓
          </Link>
          <span id="more" className="scroll-mt-24" />
        </div>
      )}
      <div className="mt-6 text-center">
        <Link href="/add" className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white">
          + আপনার তথ্য যুক্ত করুন
        </Link>
      </div>
    </div>
  );
}
