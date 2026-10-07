import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Users,
  Clock,
  BadgeCheck,
  ShieldCheck,
  LayoutDashboard,
  UserCheck,
  Hospital,
  Flag,
  RefreshCw,
  Activity,
} from "lucide-react";
import { isAdminAuthenticated } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import AdminApprovals from "@/components/AdminApprovals";
import AdminActions from "@/components/AdminActions";
import AdminFacilities from "@/components/AdminFacilities";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

type Tab = "approvals" | "live" | "verify" | "facilities" | "activity" | "sync";

const TABS: { value: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { value: "approvals", label: "অনুমোদন", icon: UserCheck },
  { value: "live", label: "লাইভ", icon: BadgeCheck },
  { value: "verify", label: "যাচাই", icon: ShieldCheck },
  { value: "facilities", label: "প্রতিষ্ঠান", icon: Hospital },
  { value: "activity", label: "অ্যাক্টিভিটি", icon: Activity },
  { value: "sync", label: "সিংক", icon: RefreshCw },
];

export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 text-xl font-bold">
        Supabase env বসান (ADMIN সেটআপ বাকি)।
      </div>
    );
  }

  const sp = await searchParams;
  const tab: Tab = TABS.some((t) => t.value === sp.tab) ? (sp.tab as Tab) : "approvals";

  const sb = getSupabaseAdmin();
  const [{ count: total }, { count: pending }, { count: approved }] = await Promise.all([
    sb.from("doctors").select("*", { count: "exact", head: true }),
    sb.from("doctors").select("*", { count: "exact", head: true }).eq("status", "PENDING"),
    sb.from("doctors").select("*", { count: "exact", head: true }).eq("status", "APPROVED"),
  ]);
  const { data: pendRows } = await sb
    .from("doctors")
    .select("id,name_bn,specialty_bn,location_district,location_upazila_area,appointment_contact,status,reports")
    .eq("status", "PENDING")
    .order("created_at", { ascending: false })
    .limit(100);
  const { data: liveRows } = await sb
    .from("doctors")
    .select("id,name_bn,specialty_bn,location_district,appointment_contact,created_at")
    .eq("status", "APPROVED")
    .order("created_at", { ascending: false })
    .limit(12);
  const { data: votes } = await sb
    .from("doctor_votes")
    .select("id,doctor_id,kind,reason,created_at")
    .order("created_at", { ascending: false })
    .limit(10);
  const { count: facilCount } = await sb
    .from("facilities")
    .select("*", { count: "exact", head: true });

  let verifs: {
    id: string;
    doctor_id: string;
    target?: string;
    action: string;
    note?: string;
    phone?: string;
  }[] = [];
  try {
    const { data } = await sb
      .from("doctor_verifications")
      .select("id,doctor_id,target,action,note,created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    verifs = (data ?? []) as never[];
  } catch {
    try {
      const { data } = await sb
        .from("phone_verifications")
        .select("id,doctor_id,action,phone,created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      verifs = (
        (data ?? []) as { id: string; doctor_id: string; action: string; phone: string }[]
      ).map((r) => ({ ...r, target: "phone", note: r.phone }));
    } catch {
      verifs = [];
    }
  }

  const stats = [
    { label: "মোট ডাক্তার", value: total ?? 0, icon: Users, tint: "bg-gray-900" },
    { label: "পেন্ডিং", value: pending ?? 0, icon: Clock, tint: "bg-amber-500" },
    { label: "লাইভ", value: approved ?? 0, icon: BadgeCheck, tint: "bg-emerald-600" },
    { label: "যাচাই জমা", value: verifs.length, icon: ShieldCheck, tint: "bg-sky-600" },
  ];

  const counts: Record<Tab, number | undefined> = {
    approvals: pending ?? 0,
    live: approved ?? 0,
    verify: verifs.length,
    facilities: facilCount ?? 0,
    activity: votes?.length ?? 0,
    sync: undefined,
  };

  return (
    <div className="mx-auto flex max-w-6xl gap-4 px-3 py-5">
      {/* Sidebar (desktop CMS nav) */}
      <aside className="sticky top-20 hidden h-fit w-56 shrink-0 rounded-2xl bg-emerald-950 p-3 text-white md:block">
        <p className="flex items-center gap-2 px-2 py-1 text-sm font-bold">
          <LayoutDashboard size={16} /> CMS প্যানেল
        </p>
        <nav className="mt-2 flex flex-col gap-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.value;
            return (
              <Link
                key={t.value}
                href={`/admin?tab=${t.value}`}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-bold ${
                  active ? "bg-white text-emerald-950" : "text-emerald-100 hover:bg-white/10"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Icon size={15} /> {t.label}
                </span>
                {counts[t.value] !== undefined && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] ${
                      active ? "bg-emerald-950 text-white" : "bg-white/15"
                    }`}
                  >
                    {counts[t.value]}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <p className="mt-3 px-2 text-[11px] leading-relaxed text-emerald-200">
          Approve করলে verified তথ্য Sheet-এর Approved ট্যাবে লেখা হয়।
        </p>
      </aside>

      <div className="min-w-0 flex-1 pb-24 md:pb-8">
        {/* Topbar */}
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg font-bold">অ্যাডমিন ড্যাশবোর্ড</h1>
          <LogoutButton />
        </div>

        {/* Mobile tab pills */}
        <nav className="mt-3 flex gap-1.5 overflow-x-auto pb-1 md:hidden" aria-label="অ্যাডমিন ট্যাব">
          {TABS.map((t) => (
            <Link
              key={t.value}
              href={`/admin?tab=${t.value}`}
              className={`flex shrink-0 items-center gap-1 rounded-full border p-3 text-xs font-bold ${
                tab === t.value
                  ? "border-emerald-700 bg-emerald-700 text-white"
                  : "border-gray-200 bg-white text-gray-700"
              }`}
            >
              {t.label}
              {counts[t.value] !== undefined && <> ({counts[t.value]})</>}
            </Link>
          ))}
        </nav>

        {/* Stat cards */}
        <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex items-center gap-2.5 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white ${s.tint}`}>
                  <Icon size={17} />
                </span>
                <span>
                  <span className="block text-xl font-bold leading-none">{s.value}</span>
                  <span className="mt-1 block text-[11px] text-gray-500">{s.label}</span>
                </span>
              </div>
            );
          })}
        </div>

        {/* Tab panels */}
        {tab === "approvals" && (
          <section className="mt-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-sm font-bold">
                <UserCheck size={15} className="text-emerald-700" />
                Pending অনুমোদন ({pendRows?.length ?? 0}/100)
              </h2>
            </div>
            <p className="mt-1 text-[11px] text-gray-500">
              টিক দিয়ে bulk Approve — প্রতিটি verified রেকর্ড Sheet-এর <b>Approved</b> ট্যাবে update/append হয়।
            </p>
            <div className="mt-2.5">
              <AdminApprovals rows={pendRows ?? []} />
            </div>
          </section>
        )}

        {tab === "live" && (
          <section className="mt-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4">
            <h2 className="flex items-center gap-1.5 text-sm font-bold">
              <BadgeCheck size={15} className="text-emerald-700" /> লাইভ ডাক্তার (সাম্প্রতিক 12)
            </h2>
            <ul className="mt-2.5 flex flex-col gap-1.5">
              {(liveRows ?? []).map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 px-3 py-2 text-[13px]">
                  <span className="min-w-0">
                    <b className="truncate">{d.name_bn}</b>
                    <span className="block truncate text-[11px] text-gray-500">
                      {d.specialty_bn} • {d.location_district} • {d.appointment_contact || "নম্বর নেই"}
                    </span>
                  </span>
                  <Link href={`/doctor/${d.id}`} className="shrink-0 rounded-lg border border-emerald-700 px-2.5 py-1.5 text-[11px] font-bold text-emerald-800">
                    দেখুন
                  </Link>
                </li>
              ))}
              {!liveRows?.length && <p className="text-sm text-gray-500">কোনো লাইভ রেকর্ড নেই।</p>}
            </ul>
          </section>
        )}

        {tab === "verify" && (
          <section className="mt-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4">
            <h2 className="flex items-center gap-1.5 text-sm font-bold">
              <ShieldCheck size={15} className="text-emerald-700" /> যাচাইকরণ কিউ ({verifs.length})
            </h2>
            <p className="mt-1 text-[11px] text-gray-500">ফোন / চেম্বার / ফি / সময় / BMDC — confirm ও correction প্রস্তাব।</p>
            {!verifs.length ? (
              <p className="mt-2 text-sm text-gray-500">কোনো যাচাই জমা নেই।</p>
            ) : (
              <ul className="mt-2.5 flex flex-col gap-1.5">
                {verifs.map((v) => (
                  <li key={v.id} className="rounded-xl border border-gray-100 px-3 py-2 text-[13px]">
                    <b className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-800">
                      {v.target ?? "phone"}:{v.action}
                    </b>{" "}
                    <span className="text-gray-500">{v.doctor_id.slice(0, 8)}…</span>{" "}
                    {v.note || v.phone ? <b>“{v.note || v.phone}”</b> : ""}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {tab === "facilities" && (
          <section className="mt-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4">
            <AdminFacilities />
          </section>
        )}

        {tab === "activity" && (
          <section className="mt-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4">
            <h2 className="flex items-center gap-1.5 text-sm font-bold">
              <Flag size={15} className="text-emerald-700" /> ভোট / রিপোর্ট
            </h2>
            {!votes?.length ? (
              <p className="mt-2 text-sm text-gray-500">কোনো ভোট নেই।</p>
            ) : (
              <ul className="mt-2.5 flex flex-col gap-1.5">
                {votes.map((v) => (
                  <li key={v.id} className="rounded-xl border border-gray-100 px-3 py-2 text-[13px]">
                    <b>{v.kind}</b> — <span className="text-gray-500">{v.doctor_id.slice(0, 8)}…</span>{" "}
                    {v.reason ? `“${v.reason}”` : ""}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {tab === "sync" && (
          <section className="mt-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4">
            <h2 className="flex items-center gap-1.5 text-sm font-bold">
              <RefreshCw size={15} className="text-emerald-700" /> Sheet ↔ DB
            </h2>
            <AdminActions />
          </section>
        )}
      </div>
    </div>
  );
}
