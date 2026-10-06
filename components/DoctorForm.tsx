"use client";

import { useState } from "react";
import { DISTRICTS } from "@/lib/districts";
import { SPECIALTIES_BN } from "@/lib/specialties";

const input = "w-full rounded-xl border-2 border-gray-300 px-4 py-3 text-xl focus:border-emerald-700";
const label = "mt-4 block text-xl font-bold";

export default function DoctorForm() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [district, setDistrict] = useState(DISTRICTS[0].district);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      setMsg(res.ok ? "✅ জমা হয়েছে! যাচাইয়ের পর লাইভ হবে।" : `❌ ${j.error ?? "ব্যর্থ হয়েছে"}`);
      if (res.ok) (e.target as HTMLFormElement).reset();
    } catch {
      setMsg("❌ নেটওয়ার্ক সমস্যা, পরে চেষ্টা করুন।");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 rounded-2xl border-2 p-5">
      <p className="rounded-xl bg-amber-50 p-4 text-lg font-semibold">তথ্য যাচাইকরণের পর এটি লাইভ করা হবে।</p>
      <label className={label}>ডাক্তারের নাম (বাংলা) *<input name="name_bn" required minLength={3} className={input} placeholder="ডা. রহিম উদ্দিন" /></label>
      <label className={label}>English Name<input name="name_en" className={input} placeholder="Dr. Rahim Uddin" /></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={label}>জেলা *<select name="location_district" value={district} onChange={(e) => setDistrict(e.target.value)} className={input}>{DISTRICTS.map((d) => <option key={d.district} value={d.district}>{d.district}</option>)}</select></label>
        <label className={label}>এলাকা / উপজেলা *<input name="location_upazila_area" required className={input} placeholder="ধানমণ্ডি" /></label>
      </div>
      <label className={label}>বিশেষজ্ঞ ক্যাটাগরি *<select name="specialty_bn" required className={input} defaultValue=""><option value="" disabled>বেছে নিন</option>{SPECIALTIES_BN.map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
      <label className={label}>BMDC রেজি. নম্বর (ঐচ্ছিক)<input name="bmdc_reg_no" className={input} placeholder="A-12345" /><span className="mt-1 block text-base font-normal text-gray-600">দিলে ✅ যাচাইকৃত ব্যাজ পাবে, রোগীর নিরাপত্তার জন্য।</span></label>
      <label className={label}>চেম্বার ঠিকানা (বাংলা) *<textarea name="chamber_address_bn" required rows={2} className={input} placeholder="হাউস ১২, রোড ৫, ধানমণ্ডি" /></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={label}>সিরিয়াল মোবাইল *<input name="appointment_contact" required pattern="01[3-9][0-9]{8}" className={input} placeholder="017XXXXXXXX" /></label>
        <label className={label}>ভিজিট ফি *<input name="visiting_fee_approx" required className={input} placeholder="৮০০ টাকা" /></label>
      </div>
      <label className={label}>রোগী দেখার সময় *<input name="visiting_hours_bn" required className={input} placeholder="শনি-বুধ, বিকেল ৫টা-রাত ৯টা" /></label>
      <button disabled={loading} className="touch-target mt-5 w-full rounded-xl bg-emerald-700 text-2xl font-bold text-white disabled:bg-gray-400">
        {loading ? "জমা হচ্ছে..." : "তথ্য জমা দিন"}
      </button>
      {msg && <p className="mt-3 text-xl font-bold">{msg}</p>}
    </form>
  );
}
