import Link from "next/link";
import type { Metadata } from "next";
import { PhoneCall, MapPin, Clock, BadgeCheck, ShieldCheck } from "lucide-react";
import VoteButtons from "@/components/VoteButtons";
import VerifyPanel from "@/components/VerifyPanel";
import DoctorPhoto from "@/components/DoctorPhoto";
import { getSupabasePublic, getSupabaseAdmin } from "@/lib/supabase";
import { findSeed } from "@/lib/seed-doctors";
import { findQimp } from "@/lib/seed-qimp14";
import { findBdd } from "@/lib/seed-bddoctor";
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
  const external = id.startsWith("seed-") || id.startsWith("qimp-");
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const sb = getSupabaseAdmin();
      const q = sb.from("doctors").select("*").eq("id", id);
      const { data } = external ? await q.maybeSingle() : await q.eq("status", "APPROVED").maybeSingle();
      if (data) return data as Doctor;
    } catch {
      /* fall through to local */
    }
  }
  if (id.startsWith("seed-")) return findSeed(id) ?? null;
  if (id.startsWith("qimp-")) return findQimp(id) ?? null;
  if (id.startsWith("bd-")) return findBdd(id) ?? null;
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
        <p className="text-xl font-bold">ডাক্তারের তথ্য পাওয়া যায়নি</p>
        <Link href="/" className="mt-4 inline-block text-sm font-bold text-emerald-800">← মূল পাতায় ফিরুন</Link>
      </div>
    );
  }

  const isSeed = id.startsWith("seed-");
  const isQimp = id.startsWith("qimp-");
  const isBdd = id.startsWith("bd-");
  const isExternal = isSeed || isQimp || isBdd;
  const hasPhone = !!d.appointment_contact && /^01[3-9]\d{8}$/.test(d.appointment_contact.replace(/[\s\-()]/g, ""));

  return (
    <div className="mx-auto max-w-3xl px-3 py-5 pb-24 sm:pb-8">
      <Link href="/" className="text-sm font-bold text-emerald-800">← ফিরে যান</Link>
      <div className="mt-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <DoctorPhoto doctor={d} size={72} />
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold">{d.name_bn}</h1>
            {d.name_en && d.name_en !== d.name_bn && <p className="truncate text-sm text-gray-500">{d.name_en}</p>}
            <p className="mt-0.5 text-sm font-semibold text-emerald-700">Expertised in {d.specialty_bn}</p>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {d.bmdc_reg_no ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
              <BadgeCheck size={14} /> BMDC: {d.bmdc_reg_no}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
              <ShieldCheck size={14} /> BMDC যাচাই বাকি — Verify করুন
            </span>
          )}
          {isExternal && (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              কমিউনিটি সংযোজন — নিশ্চিত করে ব্যবহার করুন
            </span>
          )}
        </div>
        <div className="mt-3 rounded-xl bg-gray-50 p-3 text-sm">
          <p className="flex gap-1.5"><MapPin size={16} className="mt-0.5 shrink-0 text-gray-500" />{d.chamber_address_bn}, {d.location_upazila_area}, {d.location_district}</p>
          <p className="mt-1.5 flex gap-1.5"><Clock size={16} className="mt-0.5 shrink-0 text-gray-500" />{d.visiting_hours_bn}</p>
          <p className="mt-1.5 font-bold">ভিজিট ফি: {d.visiting_fee_approx}</p>
        </div>
        {hasPhone ? (
          <>
            <a href={`tel:${d.appointment_contact}`} className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800">
              <PhoneCall size={18} /> ফোন করুন: {d.appointment_contact}
            </a>
            <p className="mt-2 text-center text-xs text-gray-500">সিরিয়ালের জন্য উপরের বাটনে চাপ দিন</p>
          </>
        ) : (
          <p className="mt-3 rounded-xl bg-gray-100 p-3 text-center text-sm font-bold text-gray-600">
            সিরিয়াল নম্বর যাচাই চলছে — নিচে সঠিক নম্বর থাকলে পাঠান
          </p>
        )}
        <div id="verify">
          <VerifyPanel doctorId={d.id} />
        </div>
        {!isExternal && <VoteButtons doctorId={d.id} up={d.upvotes} down={d.downvotes} reports={d.reports} />}
      </div>
    </div>
  );
}
