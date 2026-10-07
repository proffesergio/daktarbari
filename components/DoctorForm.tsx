"use client";

import { useMemo, useState } from "react";
import { DIVISIONS } from "@/lib/divisions";
import { SPECIALTIES_BN } from "@/lib/specialties";

const input = "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600";
const label = "mt-3 block text-sm font-bold";

export default function DoctorForm() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [division, setDivision] = useState(DIVISIONS[0].name_bn);
  const [district, setDistrict] = useState("");

  const districts = useMemo(
    () => DIVISIONS.find((d) => d.name_bn === division)?.districts ?? [],
    [division],
  );
  const upazilas = useMemo(
    () => districts.find((d) => d.name_bn === district)?.upazilas ?? [],
    [districts, district],
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    // normalize phone: strip spaces/dashes
    if (typeof body.appointment_contact === "string") {
      body.appointment_contact = body.appointment_contact.replace(/[\s\-()]/g, "");
    }
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      setMsg(res.ok ? "✅ জমা হয়েছে! যাচাইয়ের পর লাইভ হবে।" : `❌ ${j.error ?? "ব্যর্থ হয়েছে"}`);
      if (res.ok) {
        (e.target as HTMLFormElement).reset();
        setDistrict("");
      }
    } catch {
      setMsg("❌ নেটওয়ার্ক সমস্যা, পরে চেষ্টা করুন।");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="rounded-xl bg-amber-50 p-3 text-sm font-semibold">
        সিরিয়াল মোবাইল অবশ্যই ১১ সংখ্যার (01XXXXXXXXX) হতে হবে — ভুল নম্বর যাচাইয়ে বাদ যাবে।
      </p>
      <label className={label}>ডাক্তারের নাম (বাংলা) *<input name="name_bn" required minLength={3} className={input} placeholder="ডা. রহিম উদ্দিন" /></label>
      <label className={label}>English Name<input name="name_en" className={input} placeholder="Dr. Rahim Uddin" /></label>
      <div className="grid gap-2 sm:grid-cols-3">
        <label className={label}>বিভাগ *<select name="location_division" value={division} onChange={(e) => { setDivision(e.target.value); setDistrict(""); }} className={input}>{DIVISIONS.map((d) => <option key={d.name_bn} value={d.name_bn}>{d.name_bn}</option>)}</select></label>
        <label className={label}>জেলা *<select name="location_district" value={district} onChange={(e) => setDistrict(e.target.value)} required className={input}><option value="" disabled>বেছে নিন</option>{districts.map((d) => <option key={d.name_bn} value={d.name_bn}>{d.name_bn}</option>)}</select></label>
        <label className={label}>উপজেলা / এলাকা *<input name="location_upazila_area" required list="upazila-list" className={input} placeholder="ধানমণ্ডি / সাভার" /><datalist id="upazila-list">{upazilas.map((a) => <option key={a} value={a} />)}</datalist></label>
      </div>
      <label className={label}>বিশেষজ্ঞ ক্যাটাগরি *<select name="specialty_bn" required className={input} defaultValue=""><option value="" disabled>বেছে নিন</option>{SPECIALTIES_BN.map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
      <label className={label}>BMDC রেজি. নম্বর (ঐচ্ছিক)<input name="bmdc_reg_no" className={input} placeholder="A-12345" /><span className="mt-1 block text-xs font-normal text-gray-500">দিলে যাচাইকৃত ব্যাজ পাবে।</span></label>
      <label className={label}>চেম্বার ঠিকানা (বাংলা) *<textarea name="chamber_address_bn" required rows={2} className={input} placeholder="হাউস ১২, রোড ৫, ধানমণ্ডি" /></label>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className={label}>সিরিয়াল মোবাইল (Phone/Appointment No.) *<input name="appointment_contact" required pattern="01[3-9][0-9]{8}" title="01 দিয়ে শুরু ১১ সংখ্যা, যেমন 01712345678" inputMode="tel" className={input} placeholder="017XXXXXXXX" /><span className="mt-1 block text-xs font-normal text-gray-500">Google Sheet-এর Contact কলামে যাবে।</span></label>
        <label className={label}>ভিজিট ফি *<input name="visiting_fee_approx" required className={input} placeholder="৮০০ টাকা" /></label>
      </div>
      <label className={label}>রোগী দেখার সময় *<input name="visiting_hours_bn" required className={input} placeholder="শনি-বুধ, বিকেল ৫টা-রাত ৯টা" /></label>
      <button disabled={loading} className="mt-4 w-full rounded-xl bg-emerald-700 py-3 text-sm font-bold text-white disabled:bg-gray-400">
        {loading ? "জমা হচ্ছে..." : "তথ্য জমা দিন"}
      </button>
      {msg && <p className="mt-2 text-sm font-bold">{msg}</p>}
    </form>
  );
}
