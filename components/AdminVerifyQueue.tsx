"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export type VerifItem = {
  id: string;
  doctor_id: string;
  target: string;
  action: string;
  note: string;
  created_at: string;
  doctor_name?: string;
  doctor_district?: string;
  doctor_phone?: string;
};

const TARGET_BN: Record<string, string> = {
  phone: "ফোন",
  chamber: "চেম্বার",
  fee: "ফি",
  hours: "সময়",
  bmdc: "BMDC",
  general: "অন্যান্য",
};

type Group = {
  key: string;
  doctor_id: string;
  doctor_name: string;
  doctor_district: string;
  doctor_phone: string;
  target: string;
  confirms: number;
  confirmIds: string[];
  corrections: { id: string; note: string; created_at: string }[];
};

// Verification that DOES something: grouped by doctor+field, with
// Apply (write to profile + Sheet mirror) or Dismiss per correction.
export default function AdminVerifyQueue({ items }: { items: VerifItem[] }) {
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const router = useRouter();

  const groups = useMemo<Group[]>(() => {
    const m = new Map<string, Group>();
    for (const v of items) {
      const key = `${v.doctor_id}::${v.target}`;
      let g = m.get(key);
      if (!g) {
        g = {
          key,
          doctor_id: v.doctor_id,
          doctor_name: v.doctor_name || v.doctor_id.slice(0, 8),
          doctor_district: v.doctor_district || "",
          doctor_phone: v.doctor_phone || "",
          target: v.target,
          confirms: 0,
          confirmIds: [],
          corrections: [],
        };
        m.set(key, g);
      }
      if (v.action === "confirm") {
        g.confirms++;
        g.confirmIds.push(v.id);
      } else g.corrections.push({ id: v.id, note: v.note, created_at: v.created_at });
    }
    return [...m.values()].sort((a, b) => b.corrections.length - a.corrections.length || b.confirms - a.confirms);
  }, [items]);

  async function decide(g: Group, kind: "apply" | "dismiss", correctionId?: string, value?: string) {
    const val = (value ?? values[g.key] ?? "").trim();
    const ids =
      kind === "dismiss"
        ? [...g.corrections.map((c) => c.id), ...g.confirmIds]
        : correctionId && correctionId !== g.key
          ? [correctionId]
          : [];
    if (kind === "apply" && !val) {
      setMsg("❌ Apply করতে মান লিখুন/বেছে নিন");
      return;
    }
    if (kind === "dismiss" && !ids.length) return;
    setBusy(g.key + kind);
    setMsg("");
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: kind,
          verification_ids: ids,
          doctor_id: g.doctor_id,
          target: g.target,
          value: val,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg(`✅ ${kind === "apply" ? "প্রোফাইলে প্রয়োগ হয়েছে" : "খারিজ হয়েছে"}${j.sheet && j.sheet !== "skipped" ? ` • Sheet: ${j.sheet}` : ""}`);
        router.refresh();
      } else setMsg(`❌ ${j.error ?? "ব্যর্থ"}`);
    } catch {
      setMsg("❌ নেটওয়ার্ক সমস্যা");
    }
    setBusy("");
  }

  if (!items.length)
    return (
      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">
        যাচাই কিউ খালি — কেউ তথ্য নিশ্চিত/সংশোধন করলে এখানে আসবে।
      </div>
    );

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] text-gray-500">
        {groups.length}টি ফিল্ড-গ্রুপ • ✓ = নিশ্চিতকারী • ✎ = সংশোধনী প্রস্তাব (Apply = প্রোফাইল+Sheet-এ লিখুন)
      </p>
      {groups.map((g) => (
        <div key={g.key} className="rounded-xl border border-gray-100 p-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <Link href={`/doctor/${g.doctor_id}`} className="text-sm font-bold text-emerald-800 hover:underline">
              {g.doctor_name}
            </Link>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">{TARGET_BN[g.target] ?? g.target}</span>
            {g.confirms > 0 && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">✓{g.confirms}</span>}
            <span className="ml-auto text-[11px] text-gray-500">{g.doctor_district} {g.doctor_phone && `• ${g.doctor_phone}`}</span>
          </div>
          {g.corrections.length === 0 ? (
            <p className="mt-1.5 text-xs text-gray-500">শুধু নিশ্চিতকরণ — কোনো সংশোধনী নেই।</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1.5">
              {g.corrections.map((c) => (
                <li key={c.id} className="flex flex-col gap-1 rounded-lg bg-gray-50 p-2 sm:flex-row sm:items-center">
                  <span className="min-w-0 flex-1 text-[13px]">
                    ✎ <b>“{c.note}”</b>
                  </span>
                  <span className="flex shrink-0 gap-1">
                    <button
                      disabled={!!busy}
                      onClick={() => decide(g, "apply", c.id, c.note)}
                      className="rounded-lg bg-emerald-700 px-2.5 py-1.5 text-[11px] font-bold text-white disabled:opacity-50"
                    >
                      Apply
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {g.target !== "general" && (
            <div className="mt-1.5 flex gap-1.5">
              <input
                value={values[g.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [g.key]: e.target.value }))}
                placeholder="নিজে মান লিখে Apply (যাচাই করে)"
                className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:border-emerald-600"
              />
              <button
                disabled={!!busy}
                onClick={() => {
                  const first = g.corrections[0];
                  decide(g, "apply", first?.id ?? g.key, values[g.key]);
                }}
                className="rounded-lg border border-emerald-700 px-2.5 py-1.5 text-[11px] font-bold text-emerald-800 disabled:opacity-50"
              >
                লিখে Apply
              </button>
            </div>
          )}
          <button
            disabled={!!busy}
            onClick={() => decide(g, "dismiss")}
            className="mt-1.5 text-[11px] font-bold text-gray-500 hover:text-red-600"
          >
            সব সংশোধনী খারিজ করুন ✕
          </button>
        </div>
      ))}
      {msg && <p className="text-xs font-bold">{msg}</p>}
    </div>
  );
}
