import Link from "next/link";
import type { Metadata } from "next";
import { PhoneCall, MapPin, Clock, BadgeCheck, ShieldCheck } from "lucide-react";
import VoteButtons from "@/components/VoteButtons";
import VerifyPanel from "@/components/VerifyPanel";
import BackButton from "@/components/BackButton";
import DoctorPhoto from "@/components/DoctorPhoto";
import MissingInfoCta from "@/components/MissingInfoCta";
import ScheduleTable from "@/components/ScheduleTable";
import SerialForm from "@/components/SerialForm";
import ReviewSection, { type Review } from "@/components/ReviewSection";
import ClaimForm from "@/components/ClaimForm";
import TrackView from "@/components/TrackView";
import { isOpenToday } from "@/lib/schedule";
import { getSupabasePublic, getSupabaseAdmin } from "@/lib/supabase";
import { findSeed } from "@/lib/seed-doctors";
import { findQimp } from "@/lib/seed-qimp14";
import { findBdd } from "@/lib/seed-bddoctor";
import { findBancharampur } from "@/lib/seed-bancharampur";
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
  if (id.startsWith("bnc-")) return findBancharampur(id) ?? null;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  try {
    const sb = getSupabasePublic();
    const { data } = await sb.from("doctors").select("*").eq("id", id).eq("status", "APPROVED").single();
    return data as Doctor | null;
  } catch {
    return null;
  }
}

export default async function DoctorDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ from?: string }> }) {
  const { id } = await params;
  const { from } = await searchParams;
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
  const isBnc = id.startsWith("bnc-");
  const isExternal = isSeed || isQimp || isBdd || isBnc;
  const hasPhone = !!d.appointment_contact && /^01[3-9]\d{8}$/.test(d.appointment_contact.replace(/[\s\-()]/g, ""));
  const openToday = isOpenToday(d.schedule);
  const consultOff = d.consult_available === false;
  // Only allow internal return URLs (open-redirect safe)
  const backHref = from && from.startsWith("/") && !from.startsWith("//") ? from : "/doctors";
  const backLabel = backHref.startsWith("/doctors") ? "← ফলাফলে ফিরুন" : "← ফিরে যান";

  // Approved reviews for this doctor (best-effort; seeds have none)
  let reviews: Review[] = [];
  if (!isExternal && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const sb = getSupabasePublic();
      const { data } = await sb
        .from("doctor_reviews")
        .select("id,rating,comment,patient_name,created_at")
        .eq("doctor_id", id)
        .eq("status", "APPROVED")
        .order("created_at", { ascending: false })
        .limit(10);
      reviews = (data ?? []) as Review[];
    } catch {
      reviews = [];
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-3 py-5 pb-24 sm:pb-8">
      {!isExternal && <TrackView doctorId={id} />}
      <BackButton fallback={backHref} label={backLabel} />
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
          {d.verified === true ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-800">
              <BadgeCheck size={14} /> ✓ অ্যাডমিন যাচাইকৃত
            </span>
          ) : !isExternal ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
              ⏳ যাচাই বাকি — ফোনে নিশ্চিত হয়ে নিন
            </span>
          ) : null}
          {d.bmdc_reg_no ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
              <BadgeCheck size={14} /> BMDC: {d.bmdc_reg_no}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
              <ShieldCheck size={14} /> BMDC যাচাই বাকি — Verify করুন
            </span>
          )}
          {openToday === true && !consultOff && (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">🟢 আজ খোলা</span>
          )}
          {openToday === false && (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">🔴 আজ বন্ধ</span>
          )}
          {consultOff ? (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">পরামর্শ আপাতত বন্ধ</span>
          ) : (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">📋 পরামর্শ চালু</span>
          )}
          {isExternal && (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              কমিউনিটি সংযোজন — নিশ্চিত করে ব্যবহার করুন
            </span>
          )}
        </div>
        {d.schedule?.note && (
          <p className="mt-2 rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-700">🗓️ {d.schedule.note}</p>
        )}
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
            <MissingInfoCta phone={d.appointment_contact} name={d.name_bn} specialty={d.specialty_bn} />
            <p className="mt-2 text-center text-xs text-gray-500">সিরিয়ালের জন্য উপরের বাটনে চাপ দিন • WhatsApp-ও চলবে</p>
          </>
        ) : (
          <>
            <p className="mt-3 rounded-xl bg-gray-100 p-3 text-center text-sm font-bold text-gray-600">
              সিরিয়াল নম্বর যাচাই চলছে — নিচে সঠিক নম্বর থাকলে পাঠান
            </p>
            <MissingInfoCta phone={d.appointment_contact} name={d.name_bn} specialty={d.specialty_bn} />
          </>
        )}
        {(!d.visiting_fee_approx?.trim() || !d.visiting_hours_bn?.trim() || !d.bmdc_reg_no?.trim()) && (
          <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs text-amber-900">
            কিছু তথ্য বাকি ({[!d.visiting_fee_approx?.trim() && "ফি", !d.visiting_hours_bn?.trim() && "সময়", !d.bmdc_reg_no?.trim() && "BMDC"].filter(Boolean).join(" • ")})
            — নিচে <b>তথ্য যাচাই করুন</b> থেকে এক ট্যাপে যোগ করুন।
          </p>
        )}
        {!isExternal && <ScheduleTable schedule={d.schedule} />}
        <div id="verify">
          <VerifyPanel doctorId={d.id} />
        </div>
        {!isExternal && !consultOff && <SerialForm doctorId={d.id} />}
        {!isExternal && <ReviewSection doctorId={d.id} initial={reviews} />}
        {!isExternal && <ClaimForm doctorId={d.id} />}
        {!isExternal && <VoteButtons doctorId={d.id} up={d.upvotes} down={d.downvotes} reports={d.reports} />}
      </div>
    </div>
  );
}
