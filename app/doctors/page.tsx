import Link from "next/link";
import type { Metadata } from "next";
import DoctorCard from "@/components/DoctorCard";
import TrackResults from "@/components/TrackResults";
import { getSupabasePublic } from "@/lib/supabase";
import { SEED_DOCTORS } from "@/lib/seed-doctors";
import { QIMP_DOCTORS } from "@/lib/seed-qimp14";
import { filterBdd } from "@/lib/seed-bddoctor";
import { BANCHARAMPUR_DOCTORS } from "@/lib/seed-bancharampur";
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
  phone?: string;
  feeKnown?: string;
  hours?: string;
  bmdc?: string;
  emergency?: string;
  page?: string;
};

const PER_PAGE = 15;

async function getDbDoctors(): Promise<Doctor[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return [];
  try {
    const sb = getSupabasePublic();
    const { data } = await sb
      .from("doctors")
      .select("*")
      .eq("status", "APPROVED")
      .order("created_at", { ascending: false })
      .limit(1000);
    return (data ?? []) as Doctor[];
  } catch {
    return [];
  }
}

function toFilters(f: SP): SearchFilters {
  const fee = (["all", "lt500", "500_1000", "gt1000"] as const).includes(f.fee as never)
    ? (f.fee as SearchFilters["fee"])
    : "all";
  const sort: SearchFilters["sort"] =
    f.sort === "fee_asc" || f.sort === "complete" || f.sort === "emergency"
      ? f.sort
      : "smart";
  return {
    division: f.division || undefined,
    district: f.district || undefined,
    area: f.area || undefined,
    specialty: f.specialty || undefined,
    q: f.q || undefined,
    fee,
    sort,
    phoneOnly: f.phone === "1",
    feeKnown: f.feeKnown === "1",
    hoursKnown: f.hours === "1",
    bmdcOnly: f.bmdc === "1",
    emergencyOnly: f.emergency === "1",
  };
}

function baseParams(f: SP) {
  const p = new URLSearchParams();
  if (f.division) p.set("division", f.division);
  if (f.district) p.set("district", f.district);
  if (f.area) p.set("area", f.area);
  if (f.specialty) p.set("specialty", f.specialty);
  if (f.q) p.set("q", f.q);
  if (f.fee) p.set("fee", f.fee);
  if (f.sort) p.set("sort", f.sort);
  if (f.phone) p.set("phone", f.phone);
  if (f.feeKnown) p.set("feeKnown", f.feeKnown);
  if (f.hours) p.set("hours", f.hours);
  if (f.bmdc) p.set("bmdc", f.bmdc);
  if (f.emergency) p.set("emergency", f.emergency);
  return p;
}

function withPageLink(f: SP, page: number) {
  const p = baseParams(f);
  if (page <= 1) p.delete("page");
  else p.set("page", String(page));
  return `/doctors?${p.toString()}`;
}

function withFeeLink(f: SP, feeVal: string) {
  const p = baseParams(f);
  if (feeVal === "all") p.delete("fee");
  else p.set("fee", feeVal);
  return `/doctors?${p.toString()}`;
}

function withSortLink(f: SP, sortVal: string) {
  const p = baseParams(f);
  if (sortVal === "smart") p.delete("sort");
  else p.set("sort", sortVal);
  return `/doctors?${p.toString()}`;
}

function withToggleLink(f: SP, key: "phone" | "feeKnown" | "hours" | "bmdc" | "emergency") {
  const p = baseParams(f);
  if (p.get(key) === "1") p.delete(key);
  else p.set(key, "1");
  return `/doctors?${p.toString()}`;
}

export default async function DoctorsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const f = await searchParams;
  const filters = toFilters(f);
  const db = await getDbDoctors();

  const dbIds = new Set(db.map((d) => d.id));
  const dbBmdc = new Set(db.flatMap((d) => (d.bmdc_reg_no ? [d.bmdc_reg_no] : [])));
  const seedsRaw = [...SEED_DOCTORS, ...QIMP_DOCTORS, ...BANCHARAMPUR_DOCTORS, ...filterBdd({})].filter(
    (s) => !dbIds.has(s.id) && !(s.bmdc_reg_no && dbBmdc.has(s.bmdc_reg_no)),
  );

  const allDb = applySearch(db, filters);
  // seeds filtered in-memory with same engine, capped 30, page 1 only
  const page = Math.max(1, parseInt(f.page ?? "1", 10) || 1);
  const seedsMatched = page === 1 ? applySearch(seedsRaw, filters).slice(0, 30) : [];
  const totalPages = Math.max(1, Math.ceil(allDb.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageRows = allDb.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const label =
    [f.division, f.district, f.area, f.specialty, f.q ? `“${f.q}”` : ""]
      .filter(Boolean)
      .join(" • ") || "সকল ডাক্তার";

  // Carry the full results URL into profile links so Back returns here
  const fromParams = baseParams(f);
  if (safePage > 1) fromParams.set("page", String(safePage));
  const fromQs = fromParams.toString();
  const fromUrl = `/doctors${fromQs ? `?${fromQs}` : ""}`;

  const toggleChip = (active: boolean) =>
    `flex min-h-[44px] items-center rounded-full border p-3 text-xs font-bold leading-tight ${
      active
        ? "border-emerald-700 bg-emerald-700 text-white"
        : "border-gray-200 bg-white text-gray-700"
    }`;
  const sortChip = (active: boolean) =>
    `flex min-h-[44px] items-center rounded-full border p-3 text-xs font-bold leading-tight ${
      active
        ? "border-emerald-700 bg-emerald-50 text-emerald-800"
        : "border-gray-200 bg-white text-gray-700"
    }`;

  return (
    <div className="mx-auto max-w-3xl px-3 py-5 pb-24 sm:pb-8">
      <TrackResults query={f.q ?? ""} meta={label} count={allDb.length + seedsMatched.length} />
      <Link href="/" className="text-sm font-bold text-emerald-800">← নতুন করে খুঁজুন</Link>
      <h1 className="mt-1 text-lg font-bold">{label}</h1>
      <p className="mt-0.5 text-sm text-gray-600">
        {allDb.length} জন ডাক্তার{totalPages > 1 && ` • পৃষ্ঠা ${safePage}/${totalPages}`} • দ্রুত ফিল্টার নিচে
      </p>

      {/* Fast availability filters */}
      <div className="mt-3 rounded-2xl border border-gray-100 bg-white p-2.5 shadow-sm">
        <p className="mb-1.5 px-1 text-[11px] font-bold uppercase tracking-wide text-gray-500">দ্রুত ফিল্টার — তথ্য আছে এমন</p>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={withToggleLink(f, "phone")} className={toggleChip(f.phone === "1")}>
            ☎ ফোন আছে
          </Link>
          <Link href={withToggleLink(f, "feeKnown")} className={toggleChip(f.feeKnown === "1")}>
            ৳ ফি জানা
          </Link>
          <Link href={withToggleLink(f, "hours")} className={toggleChip(f.hours === "1")}>
            🕒 সময় জানা
          </Link>
          <Link href={withToggleLink(f, "bmdc")} className={toggleChip(f.bmdc === "1")}>
            ✓ BMDC
          </Link>
          <Link href={withToggleLink(f, "emergency")} className={toggleChip(f.emergency === "1")}>
            🚨 ২৪/৭ ও জরুরি
          </Link>
        </div>
      </div>

      {/* Budget + sort bar (sticky) */}
      <div className="sticky top-14 z-10 -mx-1 bg-gray-50/95 px-1 py-2 backdrop-blur">
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-500">বাজেট + সর্ট</p>
        <div className="flex flex-wrap items-center gap-2">
        {FEE_RANGES.map((r) => {
          const active = (f.fee ?? "all") === r.value;
          return (
            <Link
              key={r.value}
              href={withFeeLink(f, r.value)}
              className={toggleChip(active)}
            >
              {r.label}
            </Link>
          );
        })}
        <span className="mx-1 h-4 w-px bg-gray-200" />
        <Link href={withSortLink(f, "smart")} className={sortChip((f.sort ?? "smart") === "smart")}>
          ✨ স্মার্ট
        </Link>
        <Link href={withSortLink(f, "fee_asc")} className={sortChip(f.sort === "fee_asc")}>
          ৳ কম → বেশি
        </Link>
        <Link href={withSortLink(f, "complete")} className={sortChip(f.sort === "complete")}>
          📋 সম্পূর্ণ আগে
        </Link>
        <Link href={withSortLink(f, "emergency")} className={sortChip(f.sort === "emergency")}>
          🚨 জরুরি আগে
        </Link>
        </div>
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
            {pageRows.map((d) => (
              <DoctorCard key={d.id} doctor={d} from={fromUrl} />
            ))}
          </div>
          {totalPages > 1 && (
            <nav className="mt-5 flex items-center justify-center gap-1.5" aria-label="পৃষ্ঠা">
              {safePage > 1 && (
                <Link href={withPageLink(f, safePage - 1)} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700">← আগে</Link>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((n) => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
                .map((n, i, arr) => (
                  <span key={n} className="flex items-center gap-1.5">
                    {i > 0 && arr[i - 1] !== n - 1 && <span className="text-gray-400">…</span>}
                    <Link
                      href={withPageLink(f, n)}
                      aria-current={n === safePage ? "page" : undefined}
                      className={`rounded-xl px-4 py-2.5 text-sm font-bold ${n === safePage ? "bg-emerald-700 text-white" : "border border-gray-200 bg-white text-gray-700"}`}
                    >
                      {n}
                    </Link>
                  </span>
                ))}
              {safePage < totalPages && (
                <Link href={withPageLink(f, safePage + 1)} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700">পরে →</Link>
              )}
            </nav>
          )}
          {seedsMatched.length > 0 && (
            <section className="mt-8">
              <h2 className="text-base font-bold">Expertised in — আরও {seedsMatched.length} জন</h2>
              <p className="mt-0.5 text-sm text-gray-600">
                নিচের প্রোফাইলগুলো যাচাই চলমান — Verify বাটনে তথ্য নিশ্চিত করুন।
              </p>
              <div className="mt-3 flex flex-col gap-3">
                {seedsMatched.map((d) => (
                  <DoctorCard key={d.id} doctor={d} from={fromUrl} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
