import type { Metadata } from "next";
import Link from "next/link";
import { PhoneCall, MapPin } from "lucide-react";
import { DIVISIONS } from "@/lib/divisions";
import { type Facility } from "@/lib/facilities";
import { getSupabasePublic } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ডায়াগনস্টিক খুঁজুন | ডাক্তার বাড়ি",
  description: "লোকেশন অনুযায়ী নিকটস্থ ডায়াগনস্টিক সেন্টার খুঁজুন।",
};

type SP = { division?: string; district?: string; q?: string };

export default async function DiagnosticsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const f = await searchParams;
  let dbFac: Facility[] = [];
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const sb = getSupabasePublic();
      const { data } = await sb.from("facilities").select("*").eq("kind", "diagnostic").limit(200);
      dbFac = (data ?? []) as Facility[];
    } catch {
      dbFac = [];
    }
  }
  const { FACILITIES } = await import("@/lib/facilities");
  const merged: Facility[] = [...dbFac, ...FACILITIES.filter((x) => !dbFac.some((d) => d.id === x.id))];
  const q = (f.q ?? "").trim().toLowerCase();
  const list = merged.filter(
    (x) =>
      x.kind === "diagnostic" &&
      (!f.division || x.division_bn === f.division) &&
      (!f.district || x.district_bn === f.district) &&
      (!q || x.name_bn.includes((f.q ?? "").trim()) || (x.name_en ?? "").toLowerCase().includes(q)),
  );
  const districts = DIVISIONS.find((d) => d.name_bn === f.division)?.districts ?? [];

  function link(patch: Partial<SP>) {
    const p = new URLSearchParams();
    const merged = { ...f, ...patch };
    if (merged.division) p.set("division", merged.division);
    if (merged.district) p.set("district", merged.district);
    if (merged.q) p.set("q", merged.q);
    const s = p.toString();
    return `/diagnostics${s ? `?${s}` : ""}`;
  }

  return (
    <div className="mx-auto max-w-3xl px-3 py-5 pb-24 sm:pb-8">
      <h1 className="text-lg font-bold">🧪 নিকটস্থ ডায়াগনস্টিক</h1>
      <p className="text-sm text-gray-600">{list.length}টি সেন্টার • বিভাগ/জেলা দিয়ে ফিল্টার করুন</p>

      <form action="/diagnostics" className="mt-3 flex gap-1.5">
        <input name="q" defaultValue={f.q ?? ""} placeholder="নাম লিখুন..." className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-600" />
        {f.division && <input type="hidden" name="division" value={f.division} />}
        {f.district && <input type="hidden" name="district" value={f.district} />}
        <button className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white">খুঁজুন</button>
      </form>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <Link href="/diagnostics" className={`rounded-full border px-3 py-1.5 text-xs font-bold ${!f.division ? "border-emerald-700 bg-emerald-700 text-white" : "border-gray-200 bg-white"}`}>সব বিভাগ</Link>
        {DIVISIONS.map((d) => (
          <Link key={d.name_bn} href={link({ division: d.name_bn, district: undefined })} className={`rounded-full border px-3 py-1.5 text-xs font-bold ${f.division === d.name_bn ? "border-emerald-700 bg-emerald-700 text-white" : "border-gray-200 bg-white"}`}>
            {d.name_bn}
          </Link>
        ))}
      </div>
      {districts.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {districts.map((d) => (
            <Link key={d.name_bn} href={link({ district: f.district === d.name_bn ? undefined : d.name_bn })} className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${f.district === d.name_bn ? "border-emerald-700 bg-emerald-50 text-emerald-800" : "border-gray-200 bg-white text-gray-600"}`}>
              {d.name_bn}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2.5">
        {list.map((h) => (
          <article key={h.id} className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
            <h2 className="text-sm font-bold">{h.name_bn}</h2>
            {h.name_en && <p className="truncate text-xs text-gray-500">{h.name_en}</p>}
            <p className="mt-1 flex items-start gap-1.5 text-xs text-gray-600">
              <MapPin size={13} className="mt-0.5 shrink-0" />
              {h.address_bn}, {h.upazila_area}, {h.district_bn} ({h.division_bn})
            </p>
            <div className="mt-2 flex gap-1.5">
              {h.phone ? (
                <a href={`tel:${h.phone}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white">
                  <PhoneCall size={14} /> {h.phone}
                </a>
              ) : (
                <span className="flex flex-1 items-center justify-center rounded-xl bg-gray-100 px-3 py-2 text-xs font-bold text-gray-500">ফোন শীঘ্রই</span>
              )}
              <a
                href={`https://www.google.com/maps/search/${encodeURIComponent(`${h.name_en ?? h.name_bn} ${h.district_bn}`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center justify-center rounded-xl border border-emerald-700 px-3 py-2 text-xs font-bold text-emerald-800"
              >
                ম্যাপে দেখুন
              </a>
            </div>
          </article>
        ))}
        {list.length === 0 && <p className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">কোনো সেন্টার মেলেনি — ফিল্টার বদলান।</p>}
      </div>
    </div>
  );
}
