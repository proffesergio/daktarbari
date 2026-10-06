import { google } from "googleapis";

// Lazy auth — only init when env present so build never crashes
export function getSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !key) throw new Error("Missing Google Sheets env");
  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

export const SHEET_TABS = {
  pending: "Pending",
  approved: "Approved",
  reports: "Reports",
} as const;

// Column order MUST match supabase/schema.sql field order
export const SHEET_HEADERS = [
  "id",
  "name_bn",
  "name_en",
  "specialty_bn",
  "bmdc_reg_no",
  "location_district",
  "location_upazila_area",
  "chamber_address_bn",
  "appointment_contact",
  "visiting_hours_bn",
  "visiting_fee_approx",
  "status",
  "created_at",
] as const;
