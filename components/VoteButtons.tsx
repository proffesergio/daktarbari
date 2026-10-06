"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown, Flag } from "lucide-react";

type Props = { doctorId: string; up: number; down: number; reports: number };

export default function VoteButtons({ doctorId, up, down, reports }: Props) {
  const [counts, setCounts] = useState({ up, down, reports });
  const [done, setDone] = useState("");
  const [busy, setBusy] = useState(false);

  async function vote(kind: "up" | "down" | "report") {
    if (busy) return;
    let reason = "";
    if (kind === "report") {
      reason = window.prompt("ভুল তথ্যের কারণ লিখুন (ঐচ্ছিক):") ?? "";
      if (reason === null) return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctor_id: doctorId, kind, reason }),
      });
      if (res.ok) {
        setCounts((c) => ({ ...c, [kind === "report" ? "reports" : kind]: c[kind === "report" ? "reports" : kind] + 1 }));
        setDone(kind === "up" ? "ধন্যবাদ! আপনার মতামত নেওয়া হয়েছে।" : kind === "down" ? "জানানোর জন্য ধন্যবাদ।" : "রিপোর্ট জমা হয়েছে, অ্যাডমিন দেখবে।");
      } else {
        setDone("ব্যর্থ হয়েছে, পরে চেষ্টা করুন।");
      }
    } catch {
      setDone("নেটওয়ার্ক সমস্যা।");
    }
    setBusy(false);
  }

  const b = "touch-target flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-3 text-xl font-bold disabled:opacity-50";
  return (
    <div className="mt-5 rounded-2xl border-2 p-4">
      <p className="text-xl font-bold">এই তথ্য কি সঠিক?</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <button onClick={() => vote("up")} disabled={busy} className={`${b} border-emerald-700 text-emerald-800`}><ThumbsUp size={22} /> উপকারী ({counts.up})</button>
        <button onClick={() => vote("down")} disabled={busy} className={`${b} border-gray-300 text-gray-800`}><ThumbsDown size={22} /> ভুল ({counts.down})</button>
        <button onClick={() => vote("report")} disabled={busy} className={`${b} border-red-300 text-red-700`}><Flag size={22} /> রিপোর্ট ({counts.reports})</button>
      </div>
      {done && <p className="mt-2 text-lg font-semibold">{done}</p>}
    </div>
  );
}
