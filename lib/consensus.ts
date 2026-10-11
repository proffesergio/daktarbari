// Consensus helper for hybrid verification: identical low-risk corrections
// (hours/fee/chamber) from `threshold`+ independent submissions auto-apply.
// phone/bmdc are NEVER auto-applied (route enforces this by target).
export const LOW_RISK_TARGETS = ["hours", "fee", "chamber"] as const;

export function findConsensusIds(
  rows: { id: string; note: string | null }[],
  note: string,
  threshold = 3,
): string[] {
  const want = (note ?? "").trim();
  if (!want) return [];
  const matching = rows.filter((r) => (r.note ?? "").trim() === want).map((r) => r.id);
  return matching.length >= threshold ? matching : [];
}
