"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DIVISIONS } from "@/lib/divisions";
import { SPECIALTIES_BN } from "@/lib/specialties";
import { FEE_RANGES, type FeeRange } from "@/lib/fees";
import {
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Stethoscope,
  Wallet,
  User,
  Check,
} from "lucide-react";

const STEPS = ["বিভাগ", "জেলা", "উপজেলা", "বিশেষজ্ঞ", "বাজেট"];

export default function Home() {
  const [step, setStep] = useState(0);
  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [upazila, setUpazila] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [q, setQ] = useState("");
  const [fee, setFee] = useState<FeeRange>("all");
  const [sort, setSort] = useState<"smart" | "fee_asc">("smart");
  const [filterText, setFilterText] = useState("");

  const districts = useMemo(
    () => DIVISIONS.find((d) => d.name_bn === division)?.districts ?? [],
    [division],
  );
  const upazilas = useMemo(
    () => districts.find((d) => d.name_bn === district)?.upazilas ?? [],
    [districts, district],
  );

  const filteredDistricts = districts.filter((d) =>
    filterText ? d.name_bn.includes(filterText.trim()) : true,
  );
  const filteredUpazilas = upazilas.filter((a) =>
    filterText ? a.includes(filterText.trim()) : true,
  );
  const filteredSpecialties = SPECIALTIES_BN.filter((s) =>
    filterText ? s.includes(filterText.trim()) : true,
  );

  const progress = ((step + 1) / STEPS.length) * 100;

  function goNext() {
    setFilterText("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function goBack() {
    setFilterText("");
    setStep((s) => Math.max(s - 1, 0));
  }
  function reset() {
    setDivision("");
    setDistrict("");
    setUpazila("");
    setSpecialty("");
    setQ("");
    setFee("all");
    setSort("smart");
    setStep(0);
    setFilterText("");
  }

  function pickDivision(v: string) {
    setDivision(v);
    setDistrict("");
    setUpazila("");
    setTimeout(goNext, 180);
  }
  function pickDistrict(v: string) {
    setDistrict(v);
    setUpazila("");
    setTimeout(goNext, 180);
  }
  function pickUpazila(v: string) {
    setUpazila(v);
    setTimeout(goNext, 180);
  }
  function pickSpecialty(v: string) {
    setSpecialty(v === specialty ? "" : v);
  }

  const params = new URLSearchParams();
  if (division) params.set("division", division);
  if (district) params.set("district", district);
  if (upazila) params.set("area", upazila);
  if (specialty) params.set("specialty", specialty);
  if (q.trim()) params.set("q", q.trim());
  if (fee !== "all") params.set("fee", fee);
  if (sort === "fee_asc") params.set("sort", "fee_asc");
  const query = `/doctors?${params.toString()}`;
  const hasAny = division || specialty || q.trim();

  const chip = (active: boolean) =>
    `rounded-xl border px-3 py-2 text-sm font-semibold transition-all ${
      active
        ? "chip-active border-emerald-700 bg-emerald-700 text-white shadow-md"
        : "border-gray-200 bg-white text-gray-800 hover:border-emerald-500 hover:shadow-sm"
    }`;

  return (
    <div className="mx-auto max-w-3xl px-3 py-5 pb-24 sm:pb-8">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 p-5 text-white shadow-lg">
        <h1 className="text-xl font-bold leading-snug sm:text-2xl">
          সঠিক ডাক্তার খুঁজুন
        </h1>
        <p className="mt-1 text-sm text-emerald-50">
          নাম • বিশেষজ্ঞ • লোকেশন • বাজেট — ৫ ধাপে স্মার্ট সার্চ
        </p>
        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-100">
            {STEPS.map((s, i) => (
              <button
                key={s}
                onClick={() => setStep(i)}
                className={`flex items-center gap-1 ${i <= step ? "text-white" : "text-emerald-200"}`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                    i < step
                      ? "bg-white text-emerald-700"
                      : i === step
                        ? "bg-amber-400 text-emerald-950"
                        : "bg-white/20 text-white"
                  }`}
                >
                  {i < step ? <Check size={12} /> : i + 1}
                </span>
                <span className="hidden sm:inline">{s}</span>
              </button>
            ))}
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
            <div
              className="animate-progress-shimmer h-full rounded-full bg-gradient-to-r from-amber-300 via-white to-amber-300 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step body */}
      <div key={step} className="animate-step-in mt-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        {step === 0 && (
          <section>
            <h2 className="flex items-center gap-2 text-base font-bold">
              <MapPin size={18} className="text-emerald-700" /> বিভাগ সিলেক্ট করুন
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {DIVISIONS.map((d) => (
                <button key={d.name_bn} onClick={() => pickDivision(d.name_bn)} className={chip(division === d.name_bn)}>
                  {d.name_bn}
                  <span className="block text-[11px] font-normal opacity-70">{d.districts.length} জেলা</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 1 && (
          <section>
            <h2 className="flex items-center gap-2 text-base font-bold">
              <MapPin size={18} className="text-emerald-700" /> জেলা — {division || "বিভাগ বেছে নিন"}
            </h2>
            {!division ? (
              <p className="mt-2 text-sm text-gray-600">
                আগে বিভাগ সিলেক্ট করুন।{" "}
                <button onClick={() => setStep(0)} className="font-bold text-emerald-700">বিভাগে ফিরুন</button>
              </p>
            ) : (
              <>
                <input
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="জেলা খুঁজুন..."
                  className="mt-3 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                />
                <div className="mt-3 grid max-h-72 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
                  {filteredDistricts.map((d) => (
                    <button key={d.name_bn} onClick={() => pickDistrict(d.name_bn)} className={chip(district === d.name_bn)}>
                      {d.name_bn}
                    </button>
                  ))}
                </div>
                {filteredDistricts.length === 0 && <p className="mt-2 text-sm text-gray-500">কোনো জেলা মেলেনি</p>}
              </>
            )}
          </section>
        )}

        {step === 2 && (
          <section>
            <h2 className="flex items-center gap-2 text-base font-bold">
              <MapPin size={18} className="text-emerald-700" /> উপজেলা / এলাকা — {district || "জেলা বেছে নিন"}
            </h2>
            {!district ? (
              <p className="mt-2 text-sm text-gray-600">
                আগে জেলা সিলেক্ট করুন।{" "}
                <button onClick={() => setStep(1)} className="font-bold text-emerald-700">জেলায় ফিরুন</button>
              </p>
            ) : (
              <>
                <input
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="উপজেলা খুঁজুন..."
                  className="mt-3 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => { setUpazila(""); setTimeout(goNext, 180); }} className={chip(upazila === "")}>
                    সব এলাকা
                  </button>
                  {filteredUpazilas.map((a) => (
                    <button key={a} onClick={() => pickUpazila(a)} className={chip(upazila === a)}>
                      {a}
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {step === 3 && (
          <section>
            <h2 className="flex items-center gap-2 text-base font-bold">
              <Stethoscope size={18} className="text-emerald-700" /> বিশেষজ্ঞ + নাম
            </h2>
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 focus-within:border-emerald-600">
              <User size={16} className="shrink-0 text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ডাক্তারের নাম লিখুন (ঐচ্ছিক) — যেমন: রহিম, Shafiqul"
                className="w-full bg-transparent text-sm outline-none"
              />
              {q && (
                <button onClick={() => setQ("")} className="text-xs font-bold text-gray-500">মুছুন</button>
              )}
            </div>
            <input
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="বিশেষজ্ঞ ফিল্টার..."
              className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
            />
            <div className="mt-3 grid max-h-64 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
              {filteredSpecialties.map((s) => (
                <button key={s} onClick={() => pickSpecialty(s)} className={`${chip(specialty === s)} flex items-center justify-between`}>
                  <span>{s}</span>
                  {specialty === s && <Check size={14} />}
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 4 && (
          <section>
            <h2 className="flex items-center gap-2 text-base font-bold">
              <Wallet size={18} className="text-emerald-700" /> বাজেট + সর্ট
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {FEE_RANGES.map((r) => (
                <button key={r.value} onClick={() => setFee(r.value)} className={chip(fee === r.value)}>
                  {r.label}
                </button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button onClick={() => setSort("smart")} className={chip(sort === "smart")}>✨ স্মার্ট সর্ট</button>
              <button onClick={() => setSort("fee_asc")} className={chip(sort === "fee_asc")}>৳ কম → বেশি</button>
            </div>
            {/* Summary */}
            <div className="animate-fade-up mt-4 rounded-xl bg-emerald-50 p-3 text-sm">
              <p className="font-bold text-emerald-900">আপনার সার্চ:</p>
              <p className="mt-1 text-gray-700">
                {[division, district, upazila, specialty, q.trim() && `“${q.trim()}”`, fee !== "all" ? FEE_RANGES.find((x) => x.value === fee)?.label : "", sort === "fee_asc" ? "কম ফি আগে" : ""].filter(Boolean).join(" • ") || "সব ডাক্তার"}
              </p>
            </div>
          </section>
        )}

        {/* Nav */}
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={goBack}
            disabled={step === 0}
            className="flex items-center gap-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 disabled:opacity-40"
          >
            <ChevronLeft size={16} /> পেছনে
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={goNext}
              className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800"
            >
              পরের ধাপ <ChevronRight size={16} />
            </button>
          ) : (
            <Link
              href={hasAny ? query : "/all-doctors"}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-md"
            >
              <Search size={16} /> {hasAny ? "ডাক্তার খুঁজুন" : "সব ডাক্তার দেখুন"}
            </Link>
          )}
          <button onClick={reset} title="রিসেট" className="rounded-xl border border-gray-200 p-2.5 text-gray-600 hover:border-red-300 hover:text-red-600">
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link href="/all-doctors" className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-3 text-center text-sm font-bold text-white shadow-sm">
          ✨ সকল ডাক্তার
        </Link>
        <Link href="/hospitals" className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-center text-sm font-bold text-gray-800 shadow-sm">
          🏥 হাসপাতাল খুঁজুন
        </Link>
      </div>
    </div>
  );
}
