import { DIVISIONS } from "@/lib/divisions";

// GeoJSON source: geoBoundaries BGD ADM2 simplified (CC-BY-4.0,
// https://www.geoboundaries.org) vendored at public/data/bd-districts.geojson.
// Its `shapeName` values use older English spellings — map them to the
// canonical `name_en` used in lib/divisions.ts (which pairs with `name_bn`).
const SHAPE_TO_CANONICAL_EN: Record<string, string> = {
  Bagerhat: "Bagerhat",
  Bandarban: "Bandarban",
  Barguna: "Barguna",
  Barisal: "Barishal",
  Bhola: "Bhola",
  Bogra: "Bogura",
  Brahamanbaria: "Brahmanbaria",
  Chandpur: "Chandpur",
  Chittagong: "Chattogram",
  Chuadanga: "Chuadanga",
  Comilla: "Cumilla",
  "Cox's Bazar": "Cox's Bazar",
  Dhaka: "Dhaka",
  Dinajpur: "Dinajpur",
  Faridpur: "Faridpur",
  Feni: "Feni",
  Gaibandha: "Gaibandha",
  Gazipur: "Gazipur",
  Gopalganj: "Gopalganj",
  Habiganj: "Habiganj",
  Jamalpur: "Jamalpur",
  Jessore: "Jashore",
  Jhalokati: "Jhalokati",
  Jhenaidah: "Jhenaidah",
  Joypurhat: "Joypurhat",
  Khagrachhari: "Khagrachari",
  Khulna: "Khulna",
  Kishoreganj: "Kishoreganj",
  Kurigram: "Kurigram",
  Kushtia: "Kushtia",
  Lakshmipur: "Lakshmipur",
  Lalmonirhat: "Lalmonirhat",
  Madaripur: "Madaripur",
  Magura: "Magura",
  Manikganj: "Manikganj",
  Maulvibazar: "Moulvibazar",
  Meherpur: "Meherpur",
  Munshiganj: "Munshiganj",
  Mymensingh: "Mymensingh",
  Naogaon: "Naogaon",
  Narail: "Narail",
  Narayanganj: "Narayanganj",
  Narsingdi: "Narsingdi",
  Natore: "Natore",
  Nawabganj: "Chapai Nawabganj",
  Netrakona: "Netrokona",
  Nilphamari: "Nilphamari",
  Noakhali: "Noakhali",
  Pabna: "Pabna",
  Panchagarh: "Panchagarh",
  Patuakhali: "Patuakhali",
  Pirojpur: "Pirojpur",
  Rajbari: "Rajbari",
  Rajshahi: "Rajshahi",
  Rangamati: "Rangamati",
  Rangpur: "Rangpur",
  Satkhira: "Satkhira",
  Shariatpur: "Shariatpur",
  Sherpur: "Sherpur",
  Sirajganj: "Sirajganj",
  Sunamganj: "Sunamganj",
  Sylhet: "Sylhet",
  Tangail: "Tangail",
  Thakurgaon: "Thakurgaon",
};

const EN_TO_BN: Record<string, string> = {};
for (const div of DIVISIONS) {
  for (const d of div.districts) EN_TO_BN[d.name_en] = d.name_bn;
}

const EN_TO_DIVISION_BN: Record<string, string> = {};
for (const div of DIVISIONS) {
  for (const d of div.districts) EN_TO_DIVISION_BN[d.name_en] = div.name_bn;
}

/** geoBoundaries shapeName -> canonical English district name. */
export function canonicalDistrictEn(shapeName: string): string {
  return SHAPE_TO_CANONICAL_EN[shapeName] ?? shapeName;
}

/** geoBoundaries shapeName -> Bengali district name (fallback: shapeName). */
export function districtBnFromShape(shapeName: string): string {
  const en = canonicalDistrictEn(shapeName);
  return EN_TO_BN[en] ?? shapeName;
}

/** geoBoundaries shapeName -> Bengali division name. */
export function divisionBnFromShape(shapeName: string): string {
  const en = canonicalDistrictEn(shapeName);
  return EN_TO_DIVISION_BN[en] ?? "";
}
