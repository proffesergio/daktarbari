"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DISTRICTS } from "@/lib/districts";
import { SPECIALTIES_BN } from "@/lib/specialties";
import { RotateCcw, Search } from "lucide-react";

export default function Home() {
  const [district, setDistrict] = useState("");
  const [area, setArea] = useState("");
  const [specialty, setSpecialty] = useState("");

  const areas = useMemo(
    () => DISTRICTS.find((d) => d.district === district)?.areas ?? [],
    [district]
  );

  const ready = district && area && specialty;
  const query = ready
    ? `/doctors?district=${encodeURIComponent(district)}&area=${encodeURIComponent(area)}&specialty=${encodeURIComponent(specialty)}`
    : "#";

  function reset() {
    setDistrict("");
    setArea("");
    setSpecialty("");
  }

  const btn = (active: boolean) =>
    `touch-target rounded-xl border-2 px-4 py-3 text-xl font-bold ${
      active
        ? "border-emerald-700 bg-emerald-700 text-white"
        : "border-gray-300 bg-white text-gray-900 hover:border-emerald-600"
    }`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-3xl font-bold text-emerald-900">সঠিক ডাক্তার খুঁজুন — ৩ ধাপে</h1>

      <section className="mt-6 rounded-2xl border-2 border-gray-200 p-4">
        <h2 className="text-2xl font-bold">ধাপ ১: জেলা সিলেক্ট করুন</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {DISTRICTS.map((d) => (
            <button key={d.district} onClick={() => { setDistrict(d.district); setArea(""); }} className={btn(district === d.district)}>
              {d.district}
            </button>
          ))}
        </div>
      </section>

      {district && (
        <section className="mt-4 rounded-2xl border-2 border-gray-200 p-4">
          <h2 className="text-2xl font-bold">ধাপ ২: এলাকা / উপজেলা — {district}</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {areas.map((a) => (
              <button key={a} onClick={() => setArea(a)} className={btn(area === a)}>{a}</button>
            ))}
          </div>
        </section>
      )}

      {area && (
        <section className="mt-4 rounded-2xl border-2 border-gray-200 p-4">
          <h2 className="text-2xl font-bold">ধাপ ৩: রোগের ধরণ / স্পেশালিটি</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {SPECIALTIES_BN.map((s) => (
              <button key={s} onClick={() => setSpecialty(s)} className={btn(specialty === s)}>{s}</button>
            ))}
          </div>
        </section>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link href={query} aria-disabled={!ready} className={`touch-target flex flex-1 items-center justify-center gap-2 rounded-xl px-6 text-2xl font-bold text-white ${ready ? "bg-emerald-700" : "bg-gray-400"}`}>
          <Search size={26} /> ডাক্তার খুঁজুন
        </Link>
        <button onClick={reset} className="touch-target flex items-center justify-center gap-2 rounded-xl border-2 border-gray-300 px-6 text-xl font-bold">
          <RotateCcw size={22} /> নতুন করে
        </button>
      </div>
    </div>
  );
}
