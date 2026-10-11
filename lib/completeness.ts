// Completeness + phone helpers — shared by admin approvals & frontend filters.
// Score is 0..6 over: phone(valid 01XXXXXXXXX), fee, hours, chamber, bmdc, location.

export function normalizePhone(raw: string | null | undefined): string {
  return (raw ?? "").replace(/[\s\-().]/g, "");
}

export function isValidBdPhone(raw: string | null | undefined): boolean {
  const p = normalizePhone(raw);
  return /^01[3-9]\d{8}$/.test(p);
}

export function toWhatsAppNumber(raw: string | null | undefined): string | null {
  const p = normalizePhone(raw);
  if (!/^01[3-9]\d{8}$/.test(p)) return null;
  return `880${p.slice(1)}`;
}

export function whatsappLink(
  raw: string | null | undefined,
  textBn?: string,
): string | null {
  const wa = toWhatsAppNumber(raw);
  if (!wa) return null;
  const text =
    textBn ?? "আসসালামু আলাইকুম, আমি সিরিয়াল নিতে চাই। কখন আসতে পারবো?";
  return `https://wa.me/${wa}?text=${encodeURIComponent(text)}`;
}

export type Completeness = {
  score: number;
  max: number;
  hasPhone: boolean;
  hasFee: boolean;
  hasHours: boolean;
  hasChamber: boolean;
  hasBmdc: boolean;
  hasLocation: boolean;
  missing: string[];
};

export function completenessScore(d: {
  appointment_contact?: string | null;
  visiting_fee_approx?: string | null;
  fee_min?: number | null;
  visiting_hours_bn?: string | null;
  chamber_address_bn?: string | null;
  bmdc_reg_no?: string | null;
  location_district?: string | null;
  location_upazila_area?: string | null;
}): Completeness {
  const hasPhone = isValidBdPhone(d.appointment_contact);
  const hasFee = !!(d.visiting_fee_approx?.trim() || d.fee_min != null);
  const hasHours = !!d.visiting_hours_bn?.trim();
  const hasChamber = !!d.chamber_address_bn?.trim();
  const hasBmdc = !!d.bmdc_reg_no?.trim();
  const hasLocation = !!(d.location_district?.trim() && d.location_upazila_area?.trim());
  const parts = [hasPhone, hasFee, hasHours, hasChamber, hasBmdc, hasLocation];
  const score = parts.filter(Boolean).length;
  const missing: string[] = [];
  if (!hasPhone) missing.push("ফোন");
  if (!hasFee) missing.push("ফি");
  if (!hasHours) missing.push("সময়");
  if (!hasChamber) missing.push("চেম্বার");
  if (!hasBmdc) missing.push("BMDC");
  if (!hasLocation) missing.push("লোকেশন");
  return {
    score,
    max: 6,
    hasPhone,
    hasFee,
    hasHours,
    hasChamber,
    hasBmdc,
    hasLocation,
    missing,
  };
}

// 24/7 or emergency heuristic — honest keyword match only.
export function isEmergencyCapable(d: {
  appointment_contact?: string | null;
  visiting_hours_bn?: string | null;
}): boolean {
  if (!isValidBdPhone(d.appointment_contact)) return false;
  const h = (d.visiting_hours_bn ?? "").toLowerCase();
  return (
    h.includes("২৪") ||
    h.includes("24") ||
    h.includes("জরুরি") ||
    h.includes("emergency") ||
    h.includes("anytime") ||
    h.includes("সার্বক্ষণিক")
  );
}
