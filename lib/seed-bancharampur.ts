import type { Doctor } from "@/lib/types";

// ─── Bancharampur Upazila Health Complex duty roster ───
// Source: 10 OPD roster graphics in data/extract_from_img/ (1.jpg–10.jpg),
// published by বাঞ্ছারামপুর উপজেলা স্বাস্থ্য কমপ্লেক্স, ব্রাহ্মণবাড়িয়া.
// FACTS ONLY (name + department/designation). Date/day stripped on purpose
// to avoid roster conflicts — generic OPD hours used instead.
// No phone/BMDC printed on graphics → appointment_contact "" (verify queue).
// Chamber = health complex; fee = govt ticket (fee_min null → "all" bucket).

const T = "2026-10-07T00:00:00.000Z";
const CHAMBER = "বাঞ্ছারামপুর উপজেলা স্বাস্থ্য কমপ্লেক্স";
const HOURS = "বহির্বিভাগ: সকাল ৮:৩০ – দুপুর ২:৩০";
const FEE = "সরকারি নির্ধারিত ফি";

function b(
  id: string,
  name_bn: string,
  name_en: string,
  specialty_bn: string,
  note: string,
): Doctor {
  return {
    id,
    name_bn,
    name_en,
    specialty_bn,
    bmdc_reg_no: null,
    location_division: "চট্টগ্রাম",
    location_district: "ব্রাহ্মণবাড়িয়া",
    location_upazila_area: "বাঞ্ছারামপুর",
    chamber_address_bn: `${CHAMBER}${note ? ` (${note})` : ""}`,
    appointment_contact: "",
    visiting_hours_bn: HOURS,
    visiting_fee_approx: FEE,
    status: "PENDING",
    upvotes: 0,
    downvotes: 0,
    reports: 0,
    created_at: T,
  };
}

export const BANCHARAMPUR_DOCTORS: Doctor[] = [
  b("bnc-01", "ডা. মাহফুজ সরকার", "Dr. Mahfuz Sarkar", "হৃদরোগ", "মেডিসিন ও হৃদরোগ বিশেষজ্ঞ"),
  b("bnc-02", "ডা. ইফতেখার হোসেন বাঁধন", "Dr. Iftekhar Hossain Badhon", "অর্থোপেডিক (হাড়)", "হাড়ক্ষয়, বাত ও জয়েন্ট ব্যথা বিশেষজ্ঞ"),
  b("bnc-03", "ডা. লিটন আবদুল্লাহ", "Dr. Liton Abdullah", "অর্থোপেডিক (হাড়)", "হাড় ভাঙ্গা, বাত ব্যথা ও অর্থোপেডিক সার্জন"),
  b("bnc-04", "ডা. রোকসানা আক্তার", "Dr. Roksana Akter", "গাইনি ও প্রসূতি", "গাইনি ও প্রসূতি বিভাগ"),
  b("bnc-05", "ডা. রোকসানা ববি", "Dr. Roksana Boby", "গাইনি ও প্রসূতি", "গাইনি বিশেষজ্ঞ"),
  b("bnc-06", "ডা. সুস্মিতা সাহা", "Dr. Susmita Saha", "গাইনি ও প্রসূতি", "গাইনি বিশেষজ্ঞ"),
  b("bnc-07", "ডা. প্রীতিকণা দাস", "Dr. Pritikona Das", "গাইনি ও প্রসূতি", "গাইনি বিশেষজ্ঞ"),
  b("bnc-08", "ডা. শরীফ মো. আবদুল্লাহ দোলন", "Dr. Sharif Md. Abdullah Dolon", "শিশু রোগ", "শিশু বিশেষজ্ঞ"),
  b("bnc-09", "ডা. রনজিত সরকার", "Dr. Ranjit Sarkar", "শিশু রোগ", "শিশু বিভাগ"),
  b("bnc-10", "ডা. ইয়াছিন চৌধুরী", "Dr. Yachin Chowdhury", "শিশু রোগ", "মেডিকেল অফিসার (শিশু)"),
  b("bnc-11", "ডা. মাহমুদ মিয়া", "Dr. Mahmud Mia", "মেডিসিন", "মেডিসিন বিভাগ"),
  b("bnc-12", "ডা. ফয়সাল কবির জয়", "Dr. Faysal Kabir Joy", "মেডিসিন", "মেডিসিন বিভাগ"),
  b("bnc-13", "ডা. রিপন দেবনাথ", "Dr. Ripon Debnath", "মেডিসিন", "মেডিসিন বিভাগ"),
  b("bnc-14", "ডা. আবদুল্লাহ আল মামুন", "Dr. Abdullah Al Mamun", "মেডিসিন", "মেডিকেল অফিসার"),
  b("bnc-15", "ডা. বশির আহমেদ", "Dr. Bashir Ahmed", "মেডিসিন", "মেডিকেল অফিসার"),
  b("bnc-16", "ডা. এহসানুল হক তমাল", "Dr. Ehsanul Haque Tamal", "ডেন্টাল (দাঁত)", "ডেন্টাল সার্জন"),
  b("bnc-17", "ডা. রায়হান উদ্দিন", "Dr. Raihan Uddin", "ডেন্টাল (দাঁত)", "ডেন্টাল সার্জন"),
];

export function filterBancharampur(f: { specialty?: string; q?: string }): Doctor[] {
  const q = (f.q ?? "").trim().toLowerCase();
  return BANCHARAMPUR_DOCTORS.filter(
    (d) =>
      (!f.specialty || d.specialty_bn === f.specialty) &&
      (!q || `${d.name_bn} ${d.name_en ?? ""}`.toLowerCase().includes(q)),
  );
}

export function findBancharampur(id: string): Doctor | undefined {
  return BANCHARAMPUR_DOCTORS.find((d) => d.id === id);
}
