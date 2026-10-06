import Link from "next/link";
import { PhoneCall, MapPin } from "lucide-react";
import DoctorPhoto from "@/components/DoctorPhoto";
import type { Doctor } from "@/lib/types";

// variant list = big elder-friendly card; grid = compact smaller-text tile
export default function DoctorCard({ doctor, variant = "list" }: { doctor: Doctor; variant?: "list" | "grid" }) {
  const pending = doctor.status !== "APPROVED";
  const hasPhone = !!doctor.appointment_contact && !doctor.appointment_contact.includes("যাচাই");
  const grid = variant === "grid";

  return (
    <article className={`rounded-2xl border-2 border-gray-200 bg-white shadow-sm ${grid ? "p-3" : "p-5"}`}>
      <div className={`flex items-center ${grid ? "gap-2" : "gap-3"}`}>
        <DoctorPhoto doctor={doctor} size={grid ? 56 : 72} />
        <div className="min-w-0">
          <h3 className={`font-bold text-gray-900 ${grid ? "text-lg leading-snug" : "text-2xl"}`}>{doctor.name_bn}</h3>
          <p className={`font-semibold text-emerald-800 ${grid ? "text-base" : "text-xl"}`}>{doctor.specialty_bn}</p>
          {pending && (
            <span className="mt-1 inline-block rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-800">
              Verifying
            </span>
          )}
        </div>
      </div>
      <p className={`mt-2 flex items-start gap-2 text-gray-700 ${grid ? "text-sm" : "text-lg"}`}>
        <MapPin size={grid ? 16 : 22} className="mt-1 shrink-0" />
        {doctor.location_upazila_area}, {doctor.location_district}
      </p>
      {!grid && (
        <p className="mt-1 text-lg text-gray-700">
          {doctor.visiting_hours_bn} | {doctor.visiting_fee_approx}
        </p>
      )}
      <div className={`flex gap-2 ${grid ? "mt-2" : "mt-4 flex-col sm:flex-row gap-3"}`}>
        {hasPhone ? (
          <a
            href={`tel:${doctor.appointment_contact}`}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 font-bold text-white ${grid ? "px-2 py-2 text-base" : "touch-target px-4 text-xl"}`}
          >
            <PhoneCall size={grid ? 18 : 24} /> ফোন করুন
          </a>
        ) : (
          <span className={`flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-200 font-bold text-gray-600 ${grid ? "px-2 py-2 text-sm" : "touch-target px-4 text-xl"}`}>
            <PhoneCall size={grid ? 16 : 24} /> {grid ? "Verifying" : "সিরিয়াল নম্বর Verifying"}
          </span>
        )}
        <Link
          href={`/doctor/${doctor.id}`}
          className={`flex flex-1 items-center justify-center rounded-xl border-2 border-emerald-700 font-bold text-emerald-800 ${grid ? "px-2 py-2 text-base" : "touch-target px-4 text-xl"}`}
        >
          বিস্তারিত
        </Link>
      </div>
    </article>
  );
}
