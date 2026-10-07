import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import AdminTable from "@/components/AdminTable";
import AdminActions from "@/components/AdminActions";
import AdminFacilities from "@/components/AdminFacilities";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return <div className="mx-auto max-w-4xl px-4 py-10 text-xl font-bold">Supabase env বসান (ADMIN সেটআপ বাকি)।</div>;
  }

  const sb = getSupabaseAdmin();
  const [{ count: total }, { count: pending }, { count: approved }] = await Promise.all([
    sb.from("doctors").select("*", { count: "exact", head: true }),
    sb.from("doctors").select("*", { count: "exact", head: true }).eq("status", "PENDING"),
    sb.from("doctors").select("*", { count: "exact", head: true }).eq("status", "APPROVED"),
  ]);
  const { data: pendRows } = await sb.from("doctors").select("id,name_bn,specialty_bn,location_district,location_upazila_area,appointment_contact,status,reports").eq("status", "PENDING").order("created_at", { ascending: false }).limit(20);
  const { data: votes } = await sb.from("doctor_votes").select("id,doctor_id,kind,reason,created_at").order("created_at", { ascending: false }).limit(10);

  // Universal verification queue (new table) + legacy phone fallback
  let verifs: { id: string; doctor_id: string; target?: string; action: string; note?: string; phone?: string; created_at: string }[] = [];
  try {
    const { data } = await sb.from("doctor_verifications").select("id,doctor_id,target,action,note,created_at").order("created_at", { ascending: false }).limit(20);
    verifs = (data ?? []) as never[];
  } catch {
    try {
      const { data } = await sb.from("phone_verifications").select("id,doctor_id,action,phone,created_at").order("created_at", { ascending: false }).limit(20);
      verifs = ((data ?? []) as { id: string; doctor_id: string; action: string; phone: string; created_at: string }[]).map((r) => ({ ...r, target: "phone", note: r.phone }));
    } catch {
      verifs = [];
    }
  }

  const card = "rounded-2xl border p-4 text-center bg-white";
  return (
    <div className="mx-auto max-w-5xl px-3 py-5 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">অ্যাডমিন ড্যাশবোর্ড</h1>
        <LogoutButton />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className={card}><p className="text-2xl font-bold">{total ?? 0}</p><p className="text-sm">মোট</p></div>
        <div className={card}><p className="text-2xl font-bold text-amber-600">{pending ?? 0}</p><p className="text-sm">পেন্ডিং</p></div>
        <div className={card}><p className="text-2xl font-bold text-emerald-700">{approved ?? 0}</p><p className="text-sm">লাইভ</p></div>
      </div>
      <h2 className="mt-5 text-base font-bold">Pending অনুমোদন ({pendRows?.length ?? 0})</h2>
      <AdminTable rows={pendRows ?? []} />
      <AdminActions />

      <h2 className="mt-5 text-base font-bold">✅ যাচাইকরণ কিউ ({verifs.length}) — ফোন/চেম্বার/ফি/সময়/BMDC</h2>
      {!verifs.length ? <p className="mt-1.5 text-sm text-gray-500">কোনো যাচাই জমা নেই।</p> : (
        <ul className="mt-2 flex flex-col gap-1.5">
          {verifs.map((v) => (
            <li key={v.id} className="rounded-xl border bg-white p-2.5 text-sm">
              <b>[{v.target ?? "phone"}:{v.action}]</b> — {v.doctor_id.slice(0, 8)}… {v.note || v.phone ? `“${v.note || v.phone}”` : ""}
            </li>
          ))}
        </ul>
      )}

      <AdminFacilities />

      <h2 className="mt-5 text-base font-bold">📝 সাম্প্রতিক ভোট / রিপোর্ট</h2>
      {!votes?.length ? <p className="mt-1.5 text-sm text-gray-500">কোনো ভোট নেই।</p> : (
        <ul className="mt-2 flex flex-col gap-1.5">
          {votes.map((v) => <li key={v.id} className="rounded-xl border bg-white p-2.5 text-sm"><b>{v.kind}</b> — {v.doctor_id.slice(0, 8)}… {v.reason ? `“${v.reason}”` : ""}</li>)}
        </ul>
      )}
    </div>
  );
}
