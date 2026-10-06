import Link from "next/link";
import type { Metadata } from "next";
import DoctorCard from "@/components/DoctorCard";
import { getSupabasePublic } from "@/lib/supabase";
import type { Doctor } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ডাক্তার খুঁজুন | ডাক্তার বাড়ি",
  description: "জেলা, এলাকা ও বিশেষজ্ঞ অনুযায়ী যাচাইকৃত ডাক্তার তালিকা।",
};

type SP = { district?: string; area?: string; specialty?: string };

async function getDoctors(f: SP): Promise<Doctor[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return [];
  try {
    const sb = getSupabasePublic();
    let q = sb.from("doctors").select("*").eq("status", "APPROVED").order("created_at", { ascending: false }).limit(50);
    if (f.district) q = q.eq("location_district", f.district);
    if (f.area) q = q.eq("location_upazila_area", f.area);
    if (f.specialty) q = q.eq("specialty_bn", f.specialty);
    const { data } = await q;
    return (data ?? []) as Doctor[];
  } catch {
    return [];
  }
}

export default async function DoctorsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const f = await searchParams;
  const doctors = await getDoctors(f);
  const label = [f.district, f.area, f.specialty].filter(Boolean).join(" • ") || "সকল ডাক্তার";

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Link href="/" className="text-xl font-bold text-emerald-800">← নতুন করে খুঁজুন</Link>
      <h1 className="mt-2 text-3xl font-bold">{label}</h1>
      <p className="mt-1 text-lg text-gray-600">{doctors.length} জন ডাক্তার পাওয়া গেছে</p>
      {doctors.length === 0 ? (
        <div className="mt-6 rounded-2xl border-2 border-dashed p-8 text-center">
          <p className="text-2xl font-bold">কোনো ডাক্তার পাওয়া যায়নি</p>
          <p className="mt-2 text-lg">অন্য জেলা / এলাকা / স্পেশালিটি বেছে দেখুন।</p>
          <Link href="/add" className="touch-target mt-4 inline-flex items-center justify-center rounded-xl bg-emerald-700 px-6 text-xl font-bold text-white">
            ডাক্তারের তথ্য যুক্ত করুন
          </Link>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          {doctors.map((d) => <DoctorCard key={d.id} doctor={d} />)}
        </div>
      )}
    </div>
  );
}
