import { z } from "zod";

export const doctorSubmitSchema = z.object({
  name_bn: z.string().min(3, "বাংলা নাম দিন"),
  name_en: z.string().min(3, "English name দিন").optional().default(""),
  specialty_bn: z.string().min(2, "বিশেষজ্ঞ বেছে নিন"),
  bmdc_reg_no: z.string().optional().default(""),
  location_division: z.string().min(2, "বিভাগ বেছে নিন").optional().default(""),
  location_district: z.string().min(2, "জেলা বেছে নিন"),
  location_upazila_area: z.string().min(2, "এলাকা/উপজেলা দিন"),
  chamber_address_bn: z.string().min(5, "চেম্বার ঠিকানা দিন"),
  appointment_contact: z
    .string()
    .transform((s) => s.replace(/[\s\-()]/g, ""))
    .pipe(z.string().regex(/^01[3-9]\d{8}$/, "সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন (01XXXXXXXXX)")),
  visiting_hours_bn: z.string().min(3, "রোগী দেখার সময় লিখুন"),
  visiting_fee_approx: z.string().min(1, "ভিজিট ফি লিখুন"),
});

export type DoctorSubmitInput = z.infer<typeof doctorSubmitSchema>;
