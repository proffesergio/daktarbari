// Weekly schedule helpers. Schedule shape: { off?: string[], note?: string }.
// Day names accepted in English or Bangla; matching is case-insensitive.
const DAY_EN = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DAY_BN = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];

export function todayNames(now = new Date()): { en: string; bn: string } {
  const i = now.getDay();
  return { en: DAY_EN[i]!, bn: DAY_BN[i]! };
}

// null = no schedule info → neutral. true/false = open/closed today.
export function isOpenToday(schedule?: { off?: string[] } | null): boolean | null {
  const off = schedule?.off ?? [];
  if (!off.length) return null;
  const norm = off.map((d) => d.trim().toLowerCase());
  const { en, bn } = todayNames();
  if (norm.includes(en) || norm.includes(bn)) return false;
  return true;
}

export const WEEKDAY_OPTIONS = [
  { en: "Saturday", bn: "শনিবার" },
  { en: "Sunday", bn: "রবিবার" },
  { en: "Monday", bn: "সোমবার" },
  { en: "Tuesday", bn: "মঙ্গলবার" },
  { en: "Wednesday", bn: "বুধবার" },
  { en: "Thursday", bn: "বৃহস্পতিবার" },
  { en: "Friday", bn: "শুক্রবার" },
];

// Today's per-day slot text (free text, shown as-is — never parsed as clock time).
// Keys are matched case-insensitively ("Sunday" and "sunday" both work).
export function todaySlot(schedule?: { slots?: Record<string, string> } | null): string | null {
  const slots = schedule?.slots ?? {};
  const { en } = todayNames();
  const hit = Object.entries(slots).find(([k]) => k.trim().toLowerCase() === en);
  const v = (hit?.[1] ?? "").trim();
  return v || null;
}
