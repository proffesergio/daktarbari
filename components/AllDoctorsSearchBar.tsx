"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import VoiceSearch from "@/components/VoiceSearch";
import { track } from "@/lib/track";

export default function AllDoctorsSearchBar({ initialQ = "" }: { initialQ?: string }) {
  const [q, setQ] = useState(initialQ);
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams(window.location.search);
    if (q.trim()) p.set("q", q.trim());
    else p.delete("q");
    track("search", undefined, "all-doctors", q.trim());
    router.push(`/all-doctors?${p.toString()}`);
  }

  return (
    <form onSubmit={submit} className="mt-3 flex gap-1.5">
      <div className="flex min-w-0 flex-1 items-center gap-1 rounded-xl border border-gray-200 px-2 focus-within:border-emerald-600">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="নাম / হাসপাতাল লিখুন বা 🎙️ বলুন..."
          className="w-full bg-transparent px-1 py-2 text-sm outline-none"
        />
        <VoiceSearch onResult={(t) => setQ(t)} />
      </div>
      <button className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white">খুঁজুন</button>
    </form>
  );
}
