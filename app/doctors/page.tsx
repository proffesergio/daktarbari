import Link from "next/link";
import type { Metadata } from "next";
import DoctorCard from "@/components/DoctorCard";
import { getSupabasePublic } from "@/lib/supabase";
import { SEED_DOCTORS } from "@/lib/seed-doctors";
import { QIMP_DOCTORS } from "@/lib/seed-qimp14";
import { filterBdd } from "@/lib/seed-bddoctor";
import { applySearch, type SearchFilters } from "@/lib/search";
import { FEE_RANGES } from "@/lib/fees";
import type { Doctor } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ডাক্তার খুঁজুন | ডাক্তার বাড়ি",
  description: "নাম, বিভাগ, জেলা, বিশেষজ্ঞ ও বাজেট অনুযায়ী ডাক্তার খুঁজুন।",
};

type SP = {
  division?: string;
  district?: string;
  area?: string;
  specialty?: string;
  q?: string;
  fee?: string;
  sort?: string;
};

async function getDbDoctors(): Promise<Doctor[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return [];
  try {
    const sb = getSupabasePublic();
    const { data } = await sb
      .from("doctors")
      .select("*")
      .eq("status", "APPROVED")
      .order("created_at", { ascending: false })
      .limit(200);
    return (data ?? []) as Doctor[];
  } catch {
    return [];
  }
}

function toFilters(f: SP): SearchFilters {
  const fee = (["all", "lt500", "500_1000", "gt1000"] as const).includes(f.fee as never)
    ? (f.fee as SearchFilters["fee"])
    : "all";
  return {
    division: f.division || undefined,
    district: f.district || undefined,
    area: f.area || undefined,
    specialty: f.specialty || undefined,
    q: f.q || undefined,
    fee,
    sort: f.sort === "fee_asc" ? "fee_asc" : "smart",
  };
}

function withFeeLink(f: SP, feeVal: string) {
  const p = new URLSearchParams();
  if (f.division) p.set("division", f.division);
  if (f.district) p.set("district", f.district);
  if (f.area) p.set("area", f.area);
  if (f.specialty) p.set("specialty", f.specialty);
  if (f.q) p.set("q", f.q);
  if (feeVal !== "all") p.set("fee", feeVal);
  if (f.sort) p.set("sort", f.sort);
  return `/doctors?${p.toString()}`;
}

function withSortLink(f: SP, sortVal: string) {
  const p = new URLSearchParams();
  if (f.division) p.set("division", f.division);
  if (f.district) p.set("district", f.district);
  if (f.area) p.set("area", f.area);
  if (f.specialty) p.set("specialty", f.specialty);
  if (f.q) p.set("q", f.q);
  if (f.fee) p.set("fee", f.fee);
  if (sortVal !== "smart") p.set("sort", sortVal);
  return `/doctors?${p.toString()}`;
}

export default async function DoctorsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const f = await searchParams;
  const filters = toFilters(f);
  const db = await getDbDoctors();

  const dbIds = new Set(db.map((d) => d.id));
  const dbBmdc = new Set(db.flatMap((d) => (d.bmdc_reg_no ? [d.bmdc_reg_no] : [])));
  const seedsRaw = [...SEED_DOCTORS, ...QIMP_DOCTORS, ...filterBdd({})].filter(
    (s) => !dbIds.has(s.id) && !(s.bmdc_reg_no && dbBmdc.has(s.bmdc_reg_no)),
  );

  const allDb = applySearch(db, filters);
  // seeds filtered in-memory with same engine, capped 30 for speed
  const seedsMatched = applySearch(seedsRaw, filters).slice(0, 30);

  const label =
    [f.division, f.district, f.area, f.specialty, f.q ? `“${f.q}”` : ""]
      .filter(Boolean)
      .join(" • ") || "সকল ডাক্তার";

  return (
    <div className="mx-auto max-w-3xl px-3 py-5 pb-24 sm:pb-8">
      <Link href="/" className="text-sm font-bold text-emerald-800">← নতুন করে খুঁজুন</Link>
      <h1 className="mt-1 text-lg font-bold">{label}</h1>
      <p className="mt-0.5 text-sm text-gray-600">
        {allDb.length} জন ডাক্তার • কম ফি আগে সর্ট available
      </p>

      {/* Fee + sort bar */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {FEE_RANGES.map((r) => {
          const active = (f.fee ?? "all") === r.value;
          return (
            <Link
              key={r.value}
              href={withFeeLink(f, r.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                active
                  ? "border-emerald-700 bg-emerald-700 text-white"
                  : "border-gray-200 bg-white text-gray-700"
              }`}
            >
              {r.label}
            </Link>
          );
        })}
        <span className="mx-1 h-4 w-px bg-gray-200" />
        <Link
          href={withSortLink(f, "smart")}
          className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
            (f.sort ?? "smart") === "smart"
              ? "border-emerald-700 bg-emerald-50 text-emerald-800"
              : "border-gray-200 bg-white text-gray-700"
          }`}
        >
          ✨ স্মার্ট
        </Link>
        <Link
          href={withSortLink(f, "fee_asc")}
          className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
            f.sort === "fee_asc"
              ? "border-emerald-700 bg-emerald-50 text-emerald-800"
              : "border-gray-200 bg-white text-gray-700"
          }`}
        >
          ৳ কম → বেশি
        </Link>
      </div>

      {allDb.length === 0 && seedsMatched.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed p-8 text-center">
          <p className="text-base font-bold">কোনো ডাক্তার পাওয়া যায়নি</p>
          <p className="mt-1 text-sm text-gray-600">ফিল্টার বদলে আবার দেখুন — বিভাগ/বাজেট শিথিল করুন।</p>
          <div className="mt-4 flex justify-center gap-2">
            <Link href="/" className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white">
              নতুন সার্চ
            </Link>
            <Link href="/add" className="rounded-xl border border-emerald-700 px-5 py-2.5 text-sm font-bold text-emerald-800">
              তথ্য যুক্ত করুন
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-col gap-3">
            {allDb.map((d) => (
              <DoctorCard key={d.id} doctor={d} />
            ))}
          </div>
          {seedsMatched.length > 0 && (
            <section className="mt-8">
              <h2 className="text-base font-bold">Expertised in — আরও {seedsMatched.length} জন</h2>
              <p className="mt-0.5 text-sm text-gray-600">
                নিচের প্রোফাইলগুলো যাচাই চলমান — Verify বাটনে তথ্য নিশ্চিত করুন।
              </p>
              <div className="mt-3 flex flex-col gap-3">
                {seedsMatched.map((d) => (
                  <DoctorCard key={d.id} doctor={d} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
