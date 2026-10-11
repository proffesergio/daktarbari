import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/auth";
import { issueDoctorToken } from "@/lib/doctorTokens";
import { logAdmin } from "@/lib/audit";

export const dynamic = "force-dynamic";

const schema = z.object({
  doctor_id: z.string().min(1),
  scope: z.enum(["edit", "inbox"]),
});

// Issue a doctor-scoped link (self-edit portal or chamber inbox).
// Response link is shown ONCE — admin forwards it to the doctor/chamber.
export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "অননুমোদিত" }, { status: 401 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "ভুল তথ্য" }, { status: 400 });
  const token = await issueDoctorToken(p.data.doctor_id, p.data.scope, 90);
  if (!token) return NextResponse.json({ error: "টোকেন তৈরি হয়নি (migration দেখুন)" }, { status: 500 });
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const path = p.data.scope === "edit" ? `/edit/${token}` : `/inbox/${token}`;
  await logAdmin(`portal_${p.data.scope}`, p.data.doctor_id, "link issued");
  return NextResponse.json({ ok: true, link: `${base}${path}` });
}
