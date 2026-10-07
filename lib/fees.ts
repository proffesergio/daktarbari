// Fee normalization: "৮০০ টাকা" / "800" / "500-800" -> 800 (min)
// Supports Bengali digits, ranges, commas.
const BN_DIGITS: Record<string, string> = {
  "০": "0",
  "১": "1",
  "২": "2",
  "৩": "3",
  "৪": "4",
  "৫": "5",
  "৬": "6",
  "৭": "7",
  "৮": "8",
  "৯": "9",
};

export function bnToEnDigits(s: string): string {
  return s.replace(/[০-৯]/g, (d) => BN_DIGITS[d] ?? d);
}

export function parseFeeMin(feeRaw: string | null | undefined): number | null {
  if (!feeRaw) return null;
  const en = bnToEnDigits(feeRaw);
  const nums = en.replace(/,/g, "").match(/\d+/g)?.map(Number) ?? [];
  if (nums.length === 0) return null;
  const min = Math.min(...nums);
  // sanity: 50–20000 BDT
  if (min < 0 || min > 50000) return null;
  return min;
}

export type FeeRange = "all" | "lt500" | "500_1000" | "gt1000";

export function feeInRange(feeMin: number | null, range: FeeRange): boolean {
  if (range === "all") return true;
  // unknown fee only shows in "all" (don't hide, don't mis-sort)
  if (feeMin == null) return false;
  if (range === "lt500") return feeMin < 500;
  if (range === "500_1000") return feeMin >= 500 && feeMin <= 1000;
  return feeMin > 1000;
}

export const FEE_RANGES: { value: FeeRange; label: string }[] = [
  { value: "all", label: "সব বাজেট" },
  { value: "lt500", label: "৳৫০০ এর নিচে" },
  { value: "500_1000", label: "৳৫০০–১০০০" },
  { value: "gt1000", label: "৳১০০০+" },
];

export function sortByFeeLowHigh<T extends { feeMin: number | null; created_at?: string }>(
  rows: T[],
): T[] {
  return [...rows].sort((a, b) => {
    if (a.feeMin == null && b.feeMin == null) return 0;
    if (a.feeMin == null) return 1;
    if (b.feeMin == null) return -1;
    return a.feeMin - b.feeMin;
  });
}
