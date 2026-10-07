import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { upsertApprovedRow, syncSheetStatus } from "@/lib/adminSheets";

export const dynamic = "force-dynamic";

const schema = z.object({
  action: z.enum(["approve", "reject", "delete"]),
  ids: z.array(z.string().min(1)).min(1).max(100),
});

type ItemResult = { id: string; ok: boolean; sheet?: string; error?: string };

// Bulk CMS action: approve / reject / delete a selection of doctors.
// Approvals write each VERIFIED DB row into the Sheet's Approved tab
// (update-in-place or append — never duplicates).
export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "অননুমোদিত" }, { status: 401 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "ভুল তথ্য (action + ids[1..100])" }, { status: 400 });

  const sb = getSupabaseAdmin();
  const { action, ids } = p.data;
  // Dedupe while preserving order
  const queue = [...new Set(ids)];
  const results: ItemResult[] = [];

  for (const id of queue) {
    try {
      if (action === "delete") {
        await sb.from("doctor_votes").delete().eq("doctor_id", id);
        const { error } = await sb.from("doctors").delete().eq("id", id);
        if (error) throw error;
        await syncSheetStatus(id, "DELETED");
        results.push({ id, ok: true, sheet: "stamped" });
      } else {
        const status = action === "approve" ? "APPROVED" : "REJECTED";
        const { error } = await sb.from("doctors").update({ status }).eq("id", id);
        if (error) throw error;
        if (action === "approve") {
          const { data } = await sb.from("doctors").select("*").eq("id", id).maybeSingle();
          const { sheet } = data
            ? await upsertApprovedRow(data)
            : { sheet: "failed" as const };
          results.push({ id, ok: true, sheet });
        } else {
          await syncSheetStatus(id, "REJECTED");
          results.push({ id, ok: true, sheet: "stamped" });
        }
      }
    } catch {
      results.push({ id, ok: false, error: `${action} ব্যর্থ` });
    }
  }

  const done = results.filter((r) => r.ok).length;
  const sheetOk = results.filter((r) => r.ok && r.sheet && r.sheet !== "failed" && r.sheet !== "skipped").length;
  return NextResponse.json({ ok: true, action, done, total: queue.length, sheetOk, results });
}
