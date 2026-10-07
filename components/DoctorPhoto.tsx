import { Stethoscope } from "lucide-react";
import type { Doctor } from "@/lib/types";

// Round photo with logo-stethoscope fallback (no empty/initials tile).
export default function DoctorPhoto({ doctor, size = 80 }: { doctor: Doctor; size?: number }) {
  if (doctor.photo_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={doctor.photo_url}
        alt={doctor.name_bn}
        width={size}
        height={size}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="shrink-0 rounded-full bg-emerald-50 object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      role="img"
      aria-label={`${doctor.name_bn} — ডাক্তার`}
      title={doctor.name_bn}
      className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-sm"
      style={{ width: size, height: size }}
    >
      <Stethoscope size={Math.round(size * 0.45)} strokeWidth={2.2} />
    </span>
  );
}
