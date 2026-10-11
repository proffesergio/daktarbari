"use client";

import { useEffect, useState } from "react";
import { OSM_TILE_URL, OSM_ATTRIBUTION } from "@/lib/mapConfig";

// Admin → সেটিংস: map Tile URL + attribution + future API key.
// Stored in DB site_settings (needs migration-2026-10-site-settings.sql).
// Falls back to NEXT_PUBLIC_MAP_* env, then free OSM.
export default function AdminSettings() {
  const [tileUrl, setTileUrl] = useState("");
  const [attribution, setAttribution] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [missingTable, setMissingTable] = useState(false);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        if (j.missing_table) setMissingTable(true);
        const s = j.settings ?? {};
        setTileUrl(s.map_tile_url ?? OSM_TILE_URL);
        setAttribution(s.map_attribution ?? OSM_ATTRIBUTION);
        setApiKey(s.map_api_key ?? "");
        setLoaded(true);
      })
      .catch(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  async function save(key: "map_tile_url" | "map_attribution" | "map_api_key", value: string) {
    setBusy(key);
    setMsg("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) setMsg(`✅ ${key} সেভ হয়েছে — মানচিত্রে ৫ মিনিটে লাইভ হবে`);
      else setMsg(`❌ ${j.error ?? "ব্যর্থ"}`);
    } catch {
      setMsg("❌ নেটওয়ার্ক সমস্যা");
    }
    setBusy("");
  }

  function resetOsm() {
    setTileUrl(OSM_TILE_URL);
    setAttribution(OSM_ATTRIBUTION);
  }

  if (!loaded)
    return <p className="text-sm text-gray-500">সেটিংস লোড হচ্ছে…</p>;

  const input =
    "w-full rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-emerald-600 font-mono";

  return (
    <div className="flex flex-col gap-3">
      {missingTable && (
        <p className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
          site_settings টেবিল পাওয়া যায়নি — Supabase-এ{" "}
          <code>supabase/migration-2026-10-site-settings.sql</code> চালান। ততক্ষণ env/OSM
          ডিফল্ট চলবে।
        </p>
      )}

      <div>
        <label className="text-xs font-bold text-gray-700">
          🗺️ Tile URL template <span className="font-normal text-gray-500">(DB &gt; env &gt; OSM ফ্রি)</span>
        </label>
        <input value={tileUrl} onChange={(e) => setTileUrl(e.target.value)} className={`${input} mt-1`} spellCheck={false} />
        <p className="mt-1 text-[11px] text-gray-500">
          ফ্রি OSM: <code className="font-mono">{OSM_TILE_URL}</code>
          <br />
          ভবিষ্যতে CARTO/অন্য provider: Tile URL-এ{" "}
          <code>?api_key=YOUR_KEY</code> যোগ করে নিচে কী বসান।
        </p>
        <div className="mt-1.5 flex gap-1.5">
          <button
            disabled={!!busy}
            onClick={() => save("map_tile_url", tileUrl.trim() || OSM_TILE_URL)}
            className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            {busy === "map_tile_url" ? "…" : "Tile URL সেভ"}
          </button>
          <button onClick={resetOsm} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700">
            OSM ফ্রি-তে ফেরত
          </button>
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-gray-700">© Attribution (ক্রেডিট লাইন)</label>
        <textarea
          value={attribution}
          onChange={(e) => setAttribution(e.target.value)}
          rows={2}
          className={`${input} mt-1`}
          spellCheck={false}
        />
        <button
          disabled={!!busy}
          onClick={() => save("map_attribution", attribution.trim() || OSM_ATTRIBUTION)}
          className="mt-1.5 rounded-lg border border-emerald-700 px-3 py-2 text-xs font-bold text-emerald-800 disabled:opacity-50"
        >
          {busy === "map_attribution" ? "…" : "Attribution সেভ"}
        </button>
      </div>

      <div>
        <label className="text-xs font-bold text-gray-700">
          🔑 Map API key <span className="font-normal text-gray-500">(ভবিষ্যতের জন্য — OSM-এ লাগে না)</span>
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="CARTO / অন্য provider কী — থাকলে এখানে"
          className={`${input} mt-1`}
          spellCheck={false}
          autoComplete="off"
        />
        <button
          disabled={!!busy}
          onClick={() => save("map_api_key", apiKey.trim())}
          className="mt-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 disabled:opacity-50"
        >
          {busy === "map_api_key" ? "…" : "API key সেভ"}
        </button>
        <p className="mt-1 text-[11px] text-gray-500">
          .env-এ <code>NEXT_PUBLIC_CARTO_API_KEY</code> থাকলেও চলবে — DB-এর মান অগ্রাধিকার পায়।
          বর্তমান .env.local-এর <code>&quot;Carto Map api: ...&quot;</code> লাইনটি ভুল ফরম্যাটের
          (স্পেস+কোলন), তাই কোড পড়তে পারে না — উপরের ঘরে কীটি পেস্ট করে সেভ করুন অথবা env-এ{" "}
          <code>NEXT_PUBLIC_CARTO_API_KEY=...</code> লিখুন।
        </p>
      </div>

      {msg && <p className="text-xs font-bold">{msg}</p>}
    </div>
  );
}
