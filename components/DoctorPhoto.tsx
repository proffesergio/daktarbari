import type { Doctor } from "@/lib/types";

function initials(name: string): string {
  const parts = name.replace(/^(Prof\.|Dr\.|Professor|Associate|Assistant)\.?/i, "").trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "ডা";
}

// Round profile photo with initials fallback (seed photos hotlinked for now).
export default function DoctorPhoto({ doctor, size = 80 }: { doctor: Doctor; size?: number }) {
  if (doctor.photo_url) {
    // Plain <img> is deliberate: seed photos are hotlinked and will move to
    // /public later; next/image remote optimization is not worth it yet.
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
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials(doctor.name_en ?? doctor.name_bn)}
    </span>
  );
}
