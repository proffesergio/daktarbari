import type { Doctor } from "@/lib/types";
import { findDivisionByDistrict } from "@/lib/divisions";
import { parseFeeMin, feeInRange, type FeeRange } from "@/lib/fees";

export type SearchFilters = {
  division?: string;
  district?: string;
  area?: string;
  specialty?: string;
  q?: string;
  fee?: FeeRange;
  sort?: "smart" | "fee_asc";
};

export function enrichDoctor(d: Doctor): Doctor & { _division: string; _feeMin: number | null } {
  const div =
    (d as Doctor).location_division || findDivisionByDistrict(d.location_district) || "";
  const feeMin =
    (d as Doctor).fee_min ?? parseFeeMin(d.visiting_fee_approx);
  return { ...d, _division: div, _feeMin: feeMin };
}

export function matchesFilters(
  d: Doctor & { _division: string; _feeMin: number | null },
  f: SearchFilters,
): boolean {
  if (f.division && d._division !== f.division) return false;
  if (f.district && d.location_district !== f.district) return false;
  if (f.area && d.location_upazila_area !== f.area) return false;
  if (f.specialty && d.specialty_bn !== f.specialty) return false;
  if (f.fee && f.fee !== "all" && !feeInRange(d._feeMin, f.fee)) return false;
  if (f.q?.trim()) {
    const needle = f.q.trim().toLowerCase();
    const hay = `${d.name_bn} ${d.name_en ?? ""} ${d.specialty_bn} ${d.chamber_address_bn}`.toLowerCase();
    // allow multi-token: every token must appear
    const tokens = needle.split(/\s+/);
    if (!tokens.every((t) => hay.includes(t))) return false;
  }
  return true;
}

export function applySearch(doctors: Doctor[], f: SearchFilters): Doctor[] {
  const enriched = doctors.map(enrichDoctor).filter((d) => matchesFilters(d, f));
  if (f.sort === "fee_asc") {
    enriched.sort((a, b) => {
      if (a._feeMin == null && b._feeMin == null) return 0;
      if (a._feeMin == null) return 1;
      if (b._feeMin == null) return -1;
      return a._feeMin - b._feeMin;
    });
  }
  return enriched;
}
