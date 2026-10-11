import { isOpenToday, todaySlot, todayNames, WEEKDAY_OPTIONS } from "@/lib/schedule";

// Weekly availability calendar: per-day slots with today highlighted.
// Free-text slots are displayed as-is (never parsed as clock time).
export default function ScheduleTable({
  schedule,
}: {
  schedule?: { off?: string[]; note?: string; slots?: Record<string, string> } | null;
}) {
  const slots = schedule?.slots ?? {};
  const filled = WEEKDAY_OPTIONS.filter((d) => (slots[d.en] ?? "").trim());
  if (!filled.length && !(schedule?.note ?? "").trim()) return null;
  const { en: todayEn } = todayNames();
  const open = isOpenToday(schedule);

  return (
    <div className="mt-3 rounded-2xl border border-gray-100 bg-white p-3">
      <h2 className="text-sm font-bold">
        🗓️ সাপ্তাহিক সময়সূচি{" "}
        {open === true && <span className="text-emerald-700">• 🟢 আজ খোলা</span>}
        {open === false && <span className="text-gray-500">• 🔴 আজ বন্ধ</span>}
      </h2>
      {filled.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1">
          {WEEKDAY_OPTIONS.map((d) => {
            const v = (slots[d.en] ?? "").trim();
            if (!v) return null;
            const isToday = d.en === todayEn;
            const isOff = (schedule?.off ?? []).map((x) => x.toLowerCase()).includes(d.en.toLowerCase());
            return (
              <li
                key={d.en}
                className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-[13px] ${isToday ? "bg-emerald-50 font-bold text-emerald-900" : "bg-gray-50 text-gray-700"}`}
              >
                <span>{d.bn}{isToday && " (আজ)"}</span>
                <span>{isOff ? "বন্ধ" : v}</span>
              </li>
            );
          })}
        </ul>
      )}
      {schedule?.note && <p className="mt-1.5 text-xs text-gray-600">📌 {schedule.note}</p>}
      {todaySlot(schedule) && open !== false && (
        <p className="mt-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-800">
          আজকের সময়: {todaySlot(schedule)}
        </p>
      )}
    </div>
  );
}
