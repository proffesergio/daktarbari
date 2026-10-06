import raw from "../data/bddoctors.json";
import type { Doctor } from "@/lib/types";

// bddoctor.com intake (27 departments). JSON holds extra debug fields
// (degree, profile_url) — stripped to the Doctor shape on read.
type Row = Doctor & { degree?: string; profile_url?: string };

const ALL: Doctor[] = (raw as Row[]).map((r) => {
  // degree/profile_url kept in JSON for future use, stripped from app type
  const { degree, profile_url, ...d } = r;
  void degree;
  void profile_url;
  return d;
});

export const BDD_COUNT = ALL.length;

export function filterBdd(f: { district?: string; area?: string; specialty?: string }): Doctor[] {
  return ALL.filter(
    (d) =>
      (!f.district || d.location_district === f.district) &&
      (!f.area || d.location_upazila_area === f.area) &&
      (!f.specialty || d.specialty_bn === f.specialty),
  );
}

export function findBdd(id: string): Doctor | undefined {
  return ALL.find((d) => d.id === id);
}
