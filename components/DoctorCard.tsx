import Link from "next/link";
import { PhoneCall, MapPin, BadgeCheck, ShieldCheck } from "lucide-react";
import DoctorPhoto from "@/components/DoctorPhoto";
import type { Doctor } from "@/lib/types";

// Compact modern card: expertise line + verify CTA (no "Verifying" wording)
export default function DoctorCard({ doctor, variant = "list" }: { doctor: Doctor; variant?: "list" | "grid" }) {
  const hasPhone =
    !!doctor.appointment_contact &&
    /^01[3-9]\d{8}$/.test(doctor.appointment_contact.replace(/[\s\-()]/g, ""));
  const verifiedBmdc = !!doctor.bmdc_reg_no;
  const grid = variant === "grid";

  return (
    <article className={`rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md ${grid ? "p-3" : "p-4"}`}>
      <div className={`flex items-center ${grid ? "gap-2" : "gap-3"}`}>
        <DoctorPhoto doctor={doctor} size={grid ? 48 : 60} />
        <div className="min-w-0 flex-1">
          <h3 className={`truncate font-bold text-gray-900 ${grid ? "text-sm" : "text-base"}`}>{doctor.name_bn}</h3>
          <p className={`truncate font-semibold text-emerald-700 ${grid ? "text-xs" : "text-sm"}`}>
            Expertised in {doctor.specialty_bn}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {verifiedBmdc ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                <BadgeCheck size={12} /> BMDC {doctor.bmdc_reg_no}
              </span>
            ) : (
              <Link
                href={`/doctor/${doctor.id}#verify`}
                className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 hover:bg-amber-100"
              >
                <ShieldCheck size={12} /> তথ্য যাচাই করুন
              </Link>
            )}
          </div>
        </div>
      </div>
      <p className={`mt-2 flex items-start gap-1.5 text-gray-600 ${grid ? "text-xs" : "text-sm"}`}>
        <MapPin size={grid ? 13 : 15} className="mt-0.5 shrink-0" />
        <span className="truncate">{doctor.location_upazila_area}, {doctor.location_district}</span>
      </p>
      {!grid && (
        <p className="mt-1 truncate text-[13px] text-gray-500">
          {doctor.visiting_hours_bn} {doctor.visiting_fee_approx ? `• ${doctor.visiting_fee_approx}` : ""}
        </p>
      )}
      <div className={`flex gap-1.5 ${grid ? "mt-2" : "mt-3"}`}>
        {hasPhone ? (
          <a
            href={`tel:${doctor.appointment_contact}`}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-700 font-bold text-white hover:bg-emerald-800 ${grid ? "px-2 py-2 text-xs" : "px-3 py-2.5 text-sm"}`}
          >
            <PhoneCall size={grid ? 14 : 16} /> ফোন করুন
          </a>
        ) : (
          <Link
            href={`/doctor/${doctor.id}#verify`}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gray-100 font-bold text-gray-600 hover:bg-gray-200 ${grid ? "px-2 py-2 text-[11px]" : "px-3 py-2.5 text-sm"}`}
          >
            <PhoneCall size={grid ? 13 : 16} /> নম্বর যাচাই চলছে
          </Link>
        )}
        <Link
          href={`/doctor/${doctor.id}`}
          className={`flex flex-1 items-center justify-center rounded-xl border border-emerald-700 font-bold text-emerald-800 hover:bg-emerald-50 ${grid ? "px-2 py-2 text-xs" : "px-3 py-2.5 text-sm"}`}
        >
          বিস্তারিত
        </Link>
      </div>
    </article>
  );
}
