import Link from "next/link";
import type { Metadata } from "next";
import { PhoneCall, MapPin, Clock, BadgeCheck } from "lucide-react";
import BackButton from "@/components/BackButton";
import DoctorPhoto from "@/components/DoctorPhoto";
import MissingInfoCta from "@/components/MissingInfoCta";
import SerialForm from "@/components/SerialForm";
import ScheduleTable from "@/components/ScheduleTable";
import ReviewSection, { type Review } from "@/components/ReviewSection";
import ClaimForm from "@/components/ClaimForm";
import TrackView from "@/components/TrackView";
import { isOpenToday, todaySlot } from "@/lib/schedule";
import { getSupabasePublic } from "@/lib/supabase";
import { getDoctorById, isExternalId } from "@/lib/doctorLookup";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const d = await getDoctorById(id);
  return {
    title: d ? `বুকিং — ${d.name_bn} | ডাক্তার বাড়ি` : "বুকিং | ডাক্তার বাড়ি",
    description: d
      ? `${d.name_bn} (${d.specialty_bn})-এর সিরিয়াল ও পরামর্শের অনুরোধ পাঠান।`
      : "ডাক্তারের বুকিং রুম",
  };
}

// Personal booking room: the shareable link a doctor gives patients —
// today's hours, call/WhatsApp, serial + online-consult requests, reviews.
export default async function BookingRoom({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getDoctorById(id);

  if (!d) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-center">
        <p className="text-xl font-bold">বুকিং রুম পাওয়া যায়নি</p>
        <Link href="/" className="mt-4 inline-block text-sm font-bold text-emerald-800">← মূল পাতায় ফিরুন</Link>
      </div>
    );
  }

  const isExternal = isExternalId(id);
  const hasPhone =
    !!d.appointment_contact &&
    /^01[3-9]\d{8}$/.test(d.appointment_contact.replace(/[\s\-()]/g, ""));
  const openToday = isOpenToday(d.schedule);
  const slotToday = todaySlot(d.schedule);
  const consultOff = d.consult_available === false;

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
  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="mx-auto max-w-3xl px-3 py-5 pb-24 sm:pb-8">
      {!isExternal && <TrackView doctorId={id} />}
      <BackButton fallback={`/doctor/${id}`} label="← প্রোফাইলে ফিরুন" />

      {/* Room header */}
      <div className="mt-3 rounded-2xl bg-[#0A1930] p-4 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <DoctorPhoto doctor={d} size={64} />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#C9A86A]">📋 বুকিং রুম</p>
            <h1 className="truncate text-lg font-bold">{d.name_bn}</h1>
            <p className="truncate text-sm text-white/70">Expertised in {d.specialty_bn}</p>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {d.verified === true && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white">
              <BadgeCheck size={12} /> ✓ যাচাইকৃত
            </span>
          )}
          {d.verified === false && !isExternal && (
            <span className="rounded-full bg-[#C9A86A] px-2.5 py-1 text-[11px] font-bold text-[#0A1930]">⏳ যাচাই বাকি</span>
          )}
          {openToday === true && !consultOff && (
            <span className="rounded-full bg-emerald-400/20 px-2.5 py-1 text-[11px] font-bold text-emerald-200">🟢 আজ খোলা</span>
          )}
          {openToday === false && (
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white/70">🔴 আজ বন্ধ</span>
          )}
          {avg && <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white/80">⭐ {avg}/৫</span>}
        </div>
        {slotToday && openToday !== false && (
          <p className="mt-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-bold text-white">
            আজকের সময়: {slotToday}
          </p>
        )}
      </div>

      {/* Contact */}
      <div className="mt-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <p className="flex gap-1.5 text-sm text-gray-600">
          <MapPin size={16} className="mt-0.5 shrink-0 text-gray-500" />
          {d.chamber_address_bn}, {d.location_upazila_area}, {d.location_district}
        </p>
        <p className="mt-1.5 flex gap-1.5 text-sm text-gray-600">
          <Clock size={16} className="mt-0.5 shrink-0 text-gray-500" />
          {d.visiting_hours_bn || "সময় জানা নেই"}
          {d.visiting_fee_approx ? ` • ফি: ${d.visiting_fee_approx}` : ""}
        </p>
        {hasPhone ? (
          <>
            <a
              href={`tel:${d.appointment_contact}`}
              className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800"
            >
              <PhoneCall size={18} /> ফোন করুন: {d.appointment_contact}
            </a>
            <MissingInfoCta phone={d.appointment_contact} name={d.name_bn} specialty={d.specialty_bn} />
          </>
        ) : (
          <p className="mt-3 rounded-xl bg-gray-100 p-3 text-center text-sm font-bold text-gray-600">
            ফোন নম্বর যাচাই চলছে — নিচে সিরিয়াল অনুরোধ পাঠাতে পারেন
          </p>
        )}
      </div>

      {!isExternal && !consultOff && <SerialForm doctorId={d.id} />}
      {!isExternal && <ScheduleTable schedule={d.schedule} />}
      {!isExternal && <ReviewSection doctorId={d.id} initial={reviews} />}
      {!isExternal && <ClaimForm doctorId={d.id} />}

      <p className="mt-4 text-center text-xs text-gray-500">
        এই বুকিং রুমের লিংক রোগীদের সাথে শেয়ার করুন • জরুরিতে ৯৯৯
      </p>
    </div>
  );
}
