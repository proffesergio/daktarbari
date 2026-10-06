import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import AdminTable from "@/components/AdminTable";
import AdminActions from "@/components/AdminActions";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return <div className="mx-auto max-w-4xl px-4 py-10 text-2xl font-bold">Supabase env বসান (ADMIN সেটআপ বাকি)।</div>;
  }

  const sb = getSupabaseAdmin();
  const [{ count: total }, { count: pending }, { count: approved }] = await Promise.all([
    sb.from("doctors").select("*", { count: "exact", head: true }),
    sb.from("doctors").select("*", { count: "exact", head: true }).eq("status", "PENDING"),
    sb.from("doctors").select("*", { count: "exact", head: true }).eq("status", "APPROVED"),
  ]);
  const { data: pendRows } = await sb.from("doctors").select("id,name_bn,specialty_bn,location_district,location_upazila_area,appointment_contact,status,reports").eq("status", "PENDING").order("created_at", { ascending: false }).limit(20);
  const { data: votes } = await sb.from("doctor_votes").select("id,doctor_id,kind,reason,created_at").order("created_at", { ascending: false }).limit(10);

  const card = "rounded-2xl border-2 p-4 text-center";
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">অ্যাডমিন ড্যাশবোর্ড</h1>
        <LogoutButton />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className={card}><p className="text-4xl font-bold">{total ?? 0}</p><p className="text-lg">মোট</p></div>
        <div className={card}><p className="text-4xl font-bold text-amber-600">{pending ?? 0}</p><p className="text-lg">পেন্ডিং</p></div>
        <div className={card}><p className="text-4xl font-bold text-emerald-700">{approved ?? 0}</p><p className="text-lg">লাইভ</p></div>
      </div>
      <h2 className="mt-6 text-2xl font-bold">⏳ Pending অনুমোদন ({pendRows?.length ?? 0})</h2>
      <AdminTable rows={pendRows ?? []} />
      <AdminActions />
      <h2 className="mt-6 text-2xl font-bold">📝 সাম্প্রতিক ভোট / রিপোর্ট</h2>
      {!votes?.length ? <p className="mt-2 text-lg">কোনো ভোট নেই।</p> : (
        <ul className="mt-2 flex flex-col gap-2">
          {votes.map((v) => <li key={v.id} className="rounded-xl border p-3 text-lg"><b>{v.kind}</b> — {v.doctor_id.slice(0, 8)}… {v.reason ? `“${v.reason}”` : ""}</li>)}
        </ul>
      )}
    </div>
  );
}
