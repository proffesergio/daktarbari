import Link from "next/link";
import { PhoneCall, MapPin, Clock } from "lucide-react";
import type { Doctor } from "@/lib/types";

export default function DoctorCard({ doctor }: { doctor: Doctor }) {
  return (
    <article className="rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-2xl font-bold text-gray-900">{doctor.name_bn}</h3>
      <p className="mt-1 text-xl font-semibold text-emerald-800">{doctor.specialty_bn}</p>
      <p className="mt-2 flex items-start gap-2 text-lg text-gray-700">
        <MapPin size={22} className="mt-1 shrink-0" />
        {doctor.location_upazila_area}, {doctor.location_district}
      </p>
      <p className="mt-1 flex items-start gap-2 text-lg text-gray-700">
        <Clock size={22} className="mt-1 shrink-0" />
        {doctor.visiting_hours_bn} | {doctor.visiting_fee_approx}
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <a
          href={`tel:${doctor.appointment_contact}`}
          className="touch-target flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-xl font-bold text-white"
        >
          <PhoneCall size={24} /> ফোন করুন
        </a>
        <Link
          href={`/doctor/${doctor.id}`}
          className="touch-target flex flex-1 items-center justify-center rounded-xl border-2 border-emerald-700 px-4 text-xl font-bold text-emerald-800"
        >
          বিস্তারিত দেখুন
        </Link>
      </div>
    </article>
  );
}
