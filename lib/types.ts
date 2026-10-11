export type DoctorStatus = "PENDING" | "APPROVED" | "REJECTED";

export type Doctor = {
  id: string;
  name_bn: string;
  name_en: string | null;
  specialty_bn: string;
  bmdc_reg_no: string | null;
  location_division?: string | null;
  location_district: string;
  location_upazila_area: string;
  chamber_address_bn: string;
  appointment_contact: string;
  visiting_hours_bn: string;
  visiting_fee_approx: string;
  fee_min?: number | null;
  status: DoctorStatus;
  verified?: boolean; // instant-live entries show amber badge until admin verifies
  consult_available?: boolean; // doctor currently taking consultations
  schedule?: { off?: string[]; note?: string; slots?: Record<string, string> } | null; // weekly off-days + per-day hours + note
  photo_url?: string | null; // seed/external entries only; not a DB column
  upvotes: number;
  downvotes: number;
  reports: number;
  created_at: string;
};

export type VerifyTarget = "phone" | "chamber" | "fee" | "hours" | "bmdc" | "general";
