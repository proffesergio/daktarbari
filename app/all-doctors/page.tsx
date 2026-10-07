import Link from "next/link";
import type { Metadata } from "next";
import DoctorCard from "@/components/DoctorCard";
import { getSupabasePublic } from "@/lib/supabase";
import { SEED_DOCTORS } from "@/lib/seed-doctors";
import { QIMP_DOCTORS } from "@/lib/seed-qimp14";
import { filterBdd } from "@/lib/seed-bddoctor";
import { SPECIALTIES_BN } from "@/lib/specialties";
import { applySearch } from "@/lib/search";
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

type SP = { q?: string; specialty?: string };

export default async function AllDoctorsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const f = await searchParams;
  const db = await getDbDoctors();
  const dbIds = new Set(db.map((d) => d.id));
  const dbBmdc = new Set(db.flatMap((d) => (d.bmdc_reg_no ? [d.bmdc_reg_no] : [])));
  const seeds = [...SEED_DOCTORS, ...QIMP_DOCTORS, ...filterBdd({})].filter(
    (s) => !dbIds.has(s.id) && !(s.bmdc_reg_no && dbBmdc.has(s.bmdc_reg_no)),
  );
  const allRaw = [...db, ...seeds];
  const all = applySearch(allRaw, { q: f.q, specialty: f.specialty });

  const order = [...SPECIALTIES_BN];
  const groups = new Map<string, Doctor[]>();
  for (const d of all) {
    if (!groups.has(d.specialty_bn)) groups.set(d.specialty_bn, []);
    groups.get(d.specialty_bn)!.push(d);
  }
  const cats = [...groups.keys()].sort((a, b) => {
    const ia = order.indexOf(a as (typeof order)[number]);
    const ib = order.indexOf(b as (typeof order)[number]);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  return (
    <div className="mx-auto max-w-5xl px-3 py-5 pb-24 sm:pb-8">
      <h1 className="text-lg font-bold">✨ সকল ডাক্তার</h1>
      <p className="mt-0.5 text-sm text-gray-600">{all.length} জন ({db.length} লাইভ + {seeds.length} কমিউনিটি)</p>

      <form action="/all-doctors" className="mt-3 flex gap-1.5">
        <input name="q" defaultValue={f.q ?? ""} placeholder="নাম / হাসপাতাল দিয়ে খুঁজুন..." className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-600" />
        {f.specialty && <input type="hidden" name="specialty" value={f.specialty} />}
        <button className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white">খুঁজুন</button>
      </form>
      {(f.q || f.specialty) && (
        <Link href="/all-doctors" className="mt-2 inline-block text-xs font-bold text-emerald-700">✕ ফিল্টার মুছুন</Link>
      )}

      <nav className="mt-3 flex flex-wrap gap-1.5" aria-label="ক্যাটাগরি">
        {cats.map((c, i) => (
          <a key={c} href={`#cat-${i}`} className="rounded-full border border-emerald-700 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-50">
            {c} ({groups.get(c)!.length})
          </a>
        ))}
      </nav>
      {cats.map((c, i) => (
        <section key={c} id={`cat-${i}`} className="mt-6 scroll-mt-24">
          <h2 className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-900">
            Expertised in {c} — {groups.get(c)!.length} জন
          </h2>
          <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {groups.get(c)!.slice(0, 24).map((d) => <DoctorCard key={d.id} doctor={d} variant="grid" />)}
          </div>
          {groups.get(c)!.length > 24 && (
            <Link href={`/doctors?specialty=${encodeURIComponent(c)}`} className="mt-2 block rounded-xl border border-gray-200 bg-white px-3 py-2 text-center text-xs font-bold text-emerald-800">
              আরও {groups.get(c)!.length - 24} জন দেখুন →
            </Link>
          )}
        </section>
      ))}
      {cats.length === 0 && <p className="mt-6 rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">কিছু মেলেনি — অন্য নামে খুঁজুন।</p>}
      <div className="mt-6 text-center">
        <Link href="/add" className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white">
          + আপনার তথ্য যুক্ত করুন
        </Link>
      </div>
    </div>
  );
}
