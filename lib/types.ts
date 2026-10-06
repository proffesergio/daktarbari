export type DoctorStatus = "PENDING" | "APPROVED" | "REJECTED";

export type Doctor = {
  id: string;
  name_bn: string;
  name_en: string | null;
  specialty_bn: string;
  bmdc_reg_no: string | null;
  location_district: string;
  location_upazila_area: string;
  chamber_address_bn: string;
  appointment_contact: string;
  visiting_hours_bn: string;
  visiting_fee_approx: string;
  status: DoctorStatus;
  photo_url?: string | null; // seed/external entries only; not a DB column
  upvotes: number;
  downvotes: number;
  reports: number;
  created_at: string;
};
