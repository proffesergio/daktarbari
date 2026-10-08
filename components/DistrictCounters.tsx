"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { DistrictStat } from "@/lib/useDistrictStats";

function useCountUp(target: number, duration = 900): number {
  const [val, setVal] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const start = from.current;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.round(start + (target - start) * eased);
      setVal(v);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

function TopCard({ stat, max, rank }: { stat: DistrictStat; max: number; rank: number }) {
  const n = useCountUp(stat.count);
  const pct = max > 0 ? Math.max(4, Math.round((stat.count / max) * 100)) : 0;
  return (
    <Link
      href={`/doctors?district=${encodeURIComponent(stat.district)}`}
      className="group rounded-2xl border border-[#E9DFC9] bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#C9A86A] hover:shadow-md"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0A1930] text-xs font-bold text-[#E2C78F]">
          {rank}
        </span>
        <p className="truncate text-sm font-bold text-[#0A1930]">{stat.district}</p>
        <p className="ml-auto text-lg font-bold tabular-nums text-[#14365D]">{n}</p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#F3ECDD]">
        <div
          className="animate-count-bar h-full rounded-full bg-gradient-to-r from-[#2F7E79] via-[#14365D] to-[#C9A86A]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] font-semibold text-gray-500 group-hover:text-[#256662]">
        {stat.count} জন ডাক্তার • দেখুন →
      </p>
    </Link>
  );
}

export default function DistrictCounters({
  districts,
  total,
  loading,
  live,
}: {
  districts: DistrictStat[];
  total: number;
  loading: boolean;
  live: boolean;
}) {
  const totalShown = useCountUp(total);
  const top = districts.slice(0, 8);
  const max = top[0]?.count ?? 1;
  // Duplicate list for seamless marquee loop
  const loop = [...districts, ...districts];

  return (
    <section aria-label="জেলা ভিত্তিক ডাক্তার কাউন্টার" className="mt-3">
      {/* Total strip */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-[#0A1930] px-4 py-3 text-white shadow-sm">
        <p className="text-sm font-bold">
          মোট <span className="tabular-nums text-[#E2C78F]">{loading ? "…" : totalShown}</span> জন ডাক্তার
          <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/80">
            {live ? "● লাইভ ডাটাবেজ" : "○ তথ্য যোগ হলে লাইভ হবে"}
          </span>
        </p>
        <Link
          href="/all-doctors"
          className="ml-auto rounded-xl bg-[#C9A86A] px-3 py-1.5 text-xs font-bold text-[#0A1930] hover:bg-[#E2C78F]"
        >
          সকল ডাক্তার →
        </Link>
      </div>

      {/* Ticker: all 64 districts */}
      <div className="relative mt-3 overflow-hidden rounded-2xl border border-[#E9DFC9] bg-[#FAF7F0] py-2.5">
        <div className="animate-ticker flex w-max items-center gap-2 px-2">
          {loop.map((d, i) => (
            <Link
              key={`${d.district}-${i}`}
              href={`/doctors?district=${encodeURIComponent(d.district)}`}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                d.count > 0
                  ? "border-[#256662] bg-[#0A1930] text-white hover:bg-[#23456F]"
                  : "border-[#E9DFC9] bg-white text-gray-600 hover:border-[#C9A86A]"
              }`}
              aria-hidden={i >= districts.length}
              tabIndex={i >= districts.length ? -1 : 0}
            >
              <span>{d.district}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 tabular-nums ${
                  d.count > 0 ? "bg-[#C9A86A] text-[#0A1930]" : "bg-[#F3ECDD] text-gray-500"
                }`}
              >
                {d.count}
              </span>
            </Link>
          ))}
        </div>
        {districts.length === 0 && !loading && (
          <p className="px-4 py-1 text-center text-xs text-gray-500">
            এখনো কোনো জেলায় ডাক্তার যোগ হয়নি — প্রথম তথ্য যোগ করুন।
          </p>
        )}
      </div>

      {/* Top districts grid */}
      {top.length > 0 && (
        <div className="mt-3">
          <h3 className="px-1 text-sm font-bold text-[#0A1930]">
            সর্বাধিক ডাক্তার <span className="font-semibold text-gray-500">• শীর্ষ {top.length} জেলা</span>
          </h3>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {top.map((s, i) => (
              <TopCard key={s.district} stat={s} max={max} rank={i + 1} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
