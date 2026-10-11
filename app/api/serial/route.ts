import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin, getSupabasePublic } from "@/lib/supabase";
import { rateLimit, clientIpHash, LIMITS } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const schema = z.object({
  doctor_id: z.string().min(1),
  kind: z.enum(["chamber", "online"]).optional().default("chamber"),
  patient_name: z.string().min(2, "আপনার নাম দিন").max(80),
  patient_phone: z
    .string()
    .transform((s) => s.replace(/[\s\-()]/g, ""))
    .pipe(z.string().regex(/^01[3-9]\d{8}$/, "সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন")),
  preferred_date: z.string().max(60).optional().default(""),
  note: z.string().max(300).optional().default(""),
});

// Serial / consultation request. Goes to admin inbox (PENDING) —
// the chamber confirms by phone/WhatsApp.
export async function POST(req: Request) {
  const lim = await rateLimit(req, "serial", LIMITS.serial.limit, LIMITS.serial.windowMs);
  if (!lim.ok)
    return NextResponse.json({ error: `অনেক অনুরোধ — ${lim.retryAfterSec ?? 60} সেকেন্ড পরে আবার চেষ্টা করুন` }, { status: 429 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success)
    return NextResponse.json({ error: p.error.issues[0]?.message ?? "ফর্ম ঠিক করুন" }, { status: 400 });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL)
    return NextResponse.json({ error: "DB কনফিগার হয়নি" }, { status: 500 });
  try {
    const sb = process.env.SUPABASE_SERVICE_ROLE_KEY ? getSupabaseAdmin() : getSupabasePublic();
    const { error } = await sb.from("serial_requests").insert({
      doctor_id: p.data.doctor_id,
      kind: p.data.kind,
      patient_name: p.data.patient_name.trim(),
      patient_phone: p.data.patient_phone,
      preferred_date: p.data.preferred_date.trim(),
      note: p.data.note.trim(),
      ip_hash: clientIpHash(req),
    });
    if (error) throw error;
    // Notifications (best-effort, queued when no provider configured):
    // chamber gets the request, patient gets a confirmation.
    try {
      const { queueNotification } = await import("@/lib/notify");
      const { data: doc } = await sb.from("doctors").select("name_bn,appointment_contact").eq("id", p.data.doctor_id).maybeSingle();
      const docName = (doc?.name_bn as string) || "ডাক্তার";
      const chamberPhone = ((doc?.appointment_contact as string) || "").replace(/[\s\-()]/g, "");
      const kindBn = p.data.kind === "online" ? "অনলাইন পরামর্শ" : "চেম্বার সিরিয়াল";
      if (/^01[3-9]\d{8}$/.test(chamberPhone)) {
        void queueNotification("sms", chamberPhone, `ডাক্তারবাড়ি: ${docName}-এর জন্য নতুন ${kindBn} অনুরোধ — ${p.data.patient_name.trim()}, ${p.data.patient_phone}${p.data.preferred_date.trim() ? `, ${p.data.preferred_date.trim()}` : ""}। নিশ্চিত করতে কল করুন।`);
      }
      void queueNotification("sms", p.data.patient_phone, `ডাক্তারবাড়ি: ${docName}-এর ${kindBn} অনুরোধ পৌঁছেছে। চেম্বার থেকে ফোনে নিশ্চিত করা হবে।`);
    } catch {
      /* notifications never block */
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "অনুরোধ পাঠানো যায়নি" }, { status: 500 });
  }
}

