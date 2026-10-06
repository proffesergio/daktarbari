import Link from "next/link";
import type { Metadata } from "next";
import DoctorCard from "@/components/DoctorCard";
import { getSupabasePublic } from "@/lib/supabase";
import { filterSeed } from "@/lib/seed-doctors";
import { filterQimp } from "@/lib/seed-qimp14";
import { filterBdd } from "@/lib/seed-bddoctor";
import { SPECIALTIES_BN } from "@/lib/specialties";
import type { Doctor } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "সকল ডাক্তার — ক্যাটাগরি অনুযায়ী | ডাক্তার বাড়ি",
  description: "বিশেষজ্ঞ ক্যাটাগরি অনুযায়ী সব ডাক্তার এক জায়গায়।",
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

export default async function AllDoctorsPage() {
  const db = await getDbDoctors();
  // Seeds carry photos via filter helpers; DB rows win on same id (after admin seed/sync).
  const dbIds = new Set(db.map((d) => d.id));
  const dbBmdc = new Set(db.flatMap((d) => (d.bmdc_reg_no ? [d.bmdc_reg_no] : [])));
  const seeds = [...filterSeed({}), ...filterQimp({}), ...filterBdd({})].filter(
    (s) => !dbIds.has(s.id) && !(s.bmdc_reg_no && dbBmdc.has(s.bmdc_reg_no)),
  );
  const all = [...db, ...seeds];

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
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-3xl font-bold">✨ সকল ডাক্তার</h1>
      <p className="mt-1 text-lg text-gray-600">{all.length} জন ({db.length} যাচাইকৃত + {seeds.length} Verifying)</p>
      <nav className="mt-4 flex flex-wrap gap-2" aria-label="ক্যাটাগরি">
        {cats.map((c, i) => (
          <a key={c} href={`#cat-${i}`} className="touch-target rounded-full border-2 border-emerald-700 px-4 py-2 text-lg font-bold text-emerald-800">
            {c} ({groups.get(c)!.length})
          </a>
        ))}
      </nav>
      {cats.map((c, i) => (
        <section key={c} id={`cat-${i}`} className="mt-8 scroll-mt-24">
          <h2 className="rounded-xl bg-emerald-50 px-4 py-3 text-2xl font-bold text-emerald-900">
            {c} — {groups.get(c)!.length} জন
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {groups.get(c)!.map((d) => <DoctorCard key={d.id} doctor={d} variant="grid" />)}
          </div>
        </section>
      ))}
      <div className="mt-8 text-center">
        <Link href="/add" className="touch-target inline-flex items-center justify-center rounded-xl bg-emerald-700 px-6 text-xl font-bold text-white">
          + আপনার তথ্য যুক্ত করুন
        </Link>
      </div>
    </div>
  );
}
