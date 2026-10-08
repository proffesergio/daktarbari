"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { DIVISIONS, findDivisionByDistrict } from "@/lib/divisions";
import { SPECIALTIES_BN } from "@/lib/specialties";
import { useDistrictStats } from "@/lib/useDistrictStats";
import DistrictCounters from "@/components/DistrictCounters";
import {
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Stethoscope,
  User,
  Check,
} from "lucide-react";

// Leaflet touches `window` — keep it client-only per Next.js lazy-loading guide
// (next/dynamic + ssr:false must live inside a Client Component).
const BangladeshMap = dynamic(() => import("@/components/BangladeshMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[340px] items-center justify-center rounded-2xl border border-[#E9DFC9] bg-[#F3ECDD] text-sm font-semibold text-[#23456F] sm:h-[440px]">
      <span className="animate-pulse">🗺️ লাইভ মানচিত্র লোড হচ্ছে…</span>
    </div>
  ),
});

const STEPS = ["বিভাগ", "জেলা", "উপজেলা", "বিশেষজ্ঞ"];

export default function Home() {
  const [step, setStep] = useState(0);
  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [upazila, setUpazila] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [q, setQ] = useState("");
  const [filterText, setFilterText] = useState("");

  const stats = useDistrictStats();

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

  // Map tap -> fill division+district, jump to upazila step.
  function handleMapSelect(districtBn: string, divisionBn: string) {
    const div = divisionBn || findDivisionByDistrict(districtBn);
    if (div) setDivision(div);
    setDistrict(districtBn);
    setUpazila("");
    setFilterText("");
    setStep(2);
    document.getElementById("doctor-search")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const params = new URLSearchParams();
  if (division) params.set("division", division);
  if (district) params.set("district", district);
  if (upazila) params.set("area", upazila);
  if (specialty) params.set("specialty", specialty);
  if (q.trim()) params.set("q", q.trim());
  const query = `/doctors?${params.toString()}`;
  const hasAny = division || specialty || q.trim();

  const chip = (active: boolean) =>
    `rounded-xl border px-3 py-2 text-sm font-semibold transition-all ${
      active
        ? "chip-active border-[#0A1930] bg-[#0A1930] text-white shadow-md"
        : "border-[#E9DFC9] bg-white text-gray-800 hover:border-[#C9A86A] hover:shadow-sm"
    }`;

  return (
    <div className="mx-auto max-w-3xl px-3 py-5 pb-24 sm:pb-8">
      {/* Hero — Deep Trust Navy (replaces default emerald AI-tool gradient) */}
      <div id="doctor-search" className="scroll-mt-20 rounded-2xl bg-[#0A1930] p-5 text-white shadow-lg">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold leading-snug sm:text-2xl">
            সঠিক ডাক্তার খুঁজুন
          </h1>
          <span className="ml-auto rounded-full bg-[#C9A86A] px-2.5 py-1 text-[11px] font-bold text-[#0A1930]">
            {stats.loading ? "গণনা হচ্ছে…" : `লাইভ • ${stats.total} জন`}
          </span>
        </div>
        <p className="mt-1 text-sm text-white/70">
          নাম • বিশেষজ্ঞ • লোকেশন — ৪ ধাপে স্মার্ট সার্চ (বাজেট ফিল্টার রেজাল্ট পেজে)
        </p>
        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] font-semibold text-white/60">
            {STEPS.map((s, i) => (
              <button
                key={s}
                onClick={() => setStep(i)}
                className={`flex items-center gap-1 ${i <= step ? "text-white" : "text-white/50"}`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                    i < step
                      ? "bg-white text-[#0A1930]"
                      : i === step
                        ? "bg-[#C9A86A] text-[#0A1930]"
                        : "bg-white/20 text-white"
                  }`}
                >
                  {i < step ? <Check size={12} /> : i + 1}
                </span>
                <span className="hidden sm:inline">{s}</span>
              </button>
            ))}
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15">
            <div
              className="animate-progress-shimmer h-full rounded-full bg-gradient-to-r from-[#C9A86A] via-white to-[#C9A86A] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step body */}
      <div key={step} className="animate-step-in mt-4 rounded-2xl border border-[#E9DFC9] bg-white p-4 shadow-sm">
        {step === 0 && (
          <section>
            <h2 className="flex items-center gap-2 text-base font-bold text-[#0A1930]">
              <MapPin size={18} className="text-[#256662]" /> বিভাগ সিলেক্ট করুন
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
            <h2 className="flex items-center gap-2 text-base font-bold text-[#0A1930]">
              <MapPin size={18} className="text-[#256662]" /> জেলা — {division || "বিভাগ বেছে নিন"}
            </h2>
            {!division ? (
              <p className="mt-2 text-sm text-gray-600">
                আগে বিভাগ সিলেক্ট করুন।{" "}
                <button onClick={() => setStep(0)} className="font-bold text-[#14365D]">বিভাগে ফিরুন</button>
              </p>
            ) : (
              <>
                <input
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="জেলা খুঁজুন..."
                  className="mt-3 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#256662]"
                />
                <div className="mt-3 grid max-h-72 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
                  {filteredDistricts.map((d) => (
                    <button key={d.name_bn} onClick={() => pickDistrict(d.name_bn)} className={chip(district === d.name_bn)}>
                      {d.name_bn}
                      <span className="block text-[11px] font-normal tabular-nums opacity-70">
                        {stats.byDistrict[d.name_bn] ?? 0} জন
                      </span>
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
            <h2 className="flex items-center gap-2 text-base font-bold text-[#0A1930]">
              <MapPin size={18} className="text-[#256662]" /> উপজেলা / এলাকা — {district || "জেলা বেছে নিন"}
            </h2>
            {!district ? (
              <p className="mt-2 text-sm text-gray-600">
                আগে জেলা সিলেক্ট করুন।{" "}
                <button onClick={() => setStep(1)} className="font-bold text-[#14365D]">জেলায় ফিরুন</button>
              </p>
            ) : (
              <>
                <input
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="উপজেলা খুঁজুন..."
                  className="mt-3 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#256662]"
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
            <h2 className="flex items-center gap-2 text-base font-bold text-[#0A1930]">
              <Stethoscope size={18} className="text-[#256662]" /> বিশেষজ্ঞ + নাম
            </h2>
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 focus-within:border-[#256662]">
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
              className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#256662]"
            />
            <div className="mt-3 grid max-h-64 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
              {filteredSpecialties.map((s) => (
                <button key={s} onClick={() => pickSpecialty(s)} className={`${chip(specialty === s)} flex items-center justify-between`}>
                  <span>{s}</span>
                  {specialty === s && <Check size={14} />}
                </button>
              ))}
            </div>
            {/* Summary */}
            <div className="animate-fade-up mt-4 rounded-xl border border-[#E9DFC9] bg-[#FAF7F0] p-3 text-sm">
              <p className="font-bold text-[#0A1930]">আপনার সার্চ:</p>
              <p className="mt-1 text-gray-700">
                {[division, district, upazila, specialty, q.trim() && `“${q.trim()}”`].filter(Boolean).join(" • ") || "সব ডাক্তার"}
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
              className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#14365D] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0A1930]"
            >
              পরের ধাপ <ChevronRight size={16} />
            </button>
          ) : (
            <Link
              href={hasAny ? query : "/all-doctors"}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0A1930] px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#14365D]"
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
        <Link href="/all-doctors" className="rounded-xl bg-[#C9A86A] px-3 py-3 text-center text-sm font-bold text-[#0A1930] shadow-sm hover:bg-[#E2C78F]">
          ✨ সকল ডাক্তার
        </Link>
        <Link href="/hospitals" className="rounded-xl border border-[#0A1930]/20 bg-white px-3 py-3 text-center text-sm font-bold text-[#0A1930] shadow-sm hover:border-[#0A1930]">
          🏥 হাসপাতাল খুঁজুন
        </Link>
      </div>

      {/* Live Bangladesh map — search stays on top, map below (per approved layout) */}
      <div className="mt-6">
        <div className="mb-3 flex items-baseline gap-2 px-1">
          <h2 className="text-base font-bold text-[#0A1930]">লাইভ ডাক্তার মানচিত্র</h2>
          <p className="text-xs text-gray-500">জেলায় ট্যাপ করলেই সার্চ • রঙ গাঢ় = বেশি ডাক্তার</p>
        </div>
        <BangladeshMap
          byDistrict={stats.byDistrict}
          total={stats.total}
          live={stats.live}
          loading={stats.loading}
          selectedDistrict={district}
          onSelectDistrict={handleMapSelect}
        />
        {/* Counters sit at the bottom of the map in an animated pattern */}
        <DistrictCounters
          districts={stats.districts}
          total={stats.total}
          loading={stats.loading}
          live={stats.live}
        />
        {stats.error && (
          <p className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-xs font-semibold text-red-700">
            লাইভ গণনা আনা যায়নি — মানচিত্রে শেষ জানা তথ্য দেখাচ্ছে।{" "}
            <button onClick={stats.refresh} className="underline">আবার চেষ্টা করুন</button>
          </p>
        )}
      </div>
    </div>
  );
}
