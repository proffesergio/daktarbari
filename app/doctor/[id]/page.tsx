import Link from "next/link";
import type { Metadata } from "next";
import { PhoneCall, MapPin, Clock, BadgeCheck } from "lucide-react";
import VoteButtons from "@/components/VoteButtons";
import { getSupabasePublic } from "@/lib/supabase";
import type { Doctor } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const d = await getDoctor(id);
  return {
    title: d ? `${d.name_bn} | ডাক্তার বাড়ি` : "ডাক্তার | ডাক্তার বাড়ি",
    description: d ? `${d.specialty_bn}, ${d.location_upazila_area}, ${d.location_district}` : "ডাক্তারের বিস্তারিত",
  };
}

async function getDoctor(id: string): Promise<Doctor | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  try {
    const sb = getSupabasePublic();
    const { data } = await sb.from("doctors").select("*").eq("id", id).eq("status", "APPROVED").single();
    return data as Doctor | null;
  } catch {
    return null;
  }
}

export default async function DoctorDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getDoctor(id);

  if (!d) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-center">
        <p className="text-2xl font-bold">ডাক্তারের তথ্য পাওয়া যায়নি</p>
        <Link href="/" className="mt-4 inline-block text-xl font-bold text-emerald-800">← মূল পাতায় ফিরুন</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link href="/" className="text-xl font-bold text-emerald-800">← ফিরে যান</Link>
      <h1 className="mt-2 text-4xl font-bold">{d.name_bn}</h1>
      {d.name_en && <p className="text-xl text-gray-600">{d.name_en}</p>}
      <p className="mt-1 text-2xl font-semibold text-emerald-800">{d.specialty_bn}</p>
      {d.bmdc_reg_no && (
        <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-lg font-bold text-emerald-800">
          <BadgeCheck size={22} /> BMDC: {d.bmdc_reg_no} (যাচাইকৃত)
        </p>
      )}
      <div className="mt-4 rounded-2xl border-2 p-5 text-xl">
        <p className="flex gap-2"><MapPin size={24} className="mt-1 shrink-0" />{d.chamber_address_bn}, {d.location_upazila_area}, {d.location_district}</p>
        <p className="mt-2 flex gap-2"><Clock size={24} className="mt-1 shrink-0" />{d.visiting_hours_bn}</p>
        <p className="mt-2 font-bold">ভিজিট ফি: {d.visiting_fee_approx}</p>
      </div>
      <a href={`tel:${d.appointment_contact}`} className="touch-target mt-5 flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-6 text-2xl font-bold text-white">
        <PhoneCall size={28} /> ফোন করুন: {d.appointment_contact}
      </a>
      <p className="mt-3 text-center text-lg text-gray-500">সিরিয়ালের জন্য উপরের বাটনে চাপ দিন</p>
      <VoteButtons doctorId={d.id} up={d.upvotes} down={d.downvotes} reports={d.reports} />
    </div>
  );
}
