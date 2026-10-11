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
  Settings,
  ClipboardList,
  Star,
} from "lucide-react";
import { isAdminAuthenticated, getAdminActor } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import AdminApprovals from "@/components/AdminApprovals";
import AdminActions from "@/components/AdminActions";
import AdminFacilities from "@/components/AdminFacilities";
import AdminSettings from "@/components/AdminSettings";
import AdminAdmins from "@/components/AdminAdmins";
import AdminVerifyQueue from "@/components/AdminVerifyQueue";
import AdminRequests from "@/components/AdminRequests";
import AdminReviews from "@/components/AdminReviews";
import AdminLive from "@/components/AdminLive";
import ActivityHub from "@/components/ActivityHub";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

type Tab = "approvals" | "live" | "verify" | "requests" | "reviews" | "facilities" | "activity" | "sync" | "settings";

const TABS: { value: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { value: "approvals", label: "অনুমোদন", icon: UserCheck },
  { value: "live", label: "লাইভ", icon: BadgeCheck },
  { value: "verify", label: "যাচাই", icon: ShieldCheck },
  { value: "requests", label: "অনুরোধ", icon: ClipboardList },
  { value: "reviews", label: "রিভিউ", icon: Star },
  { value: "facilities", label: "প্রতিষ্ঠান", icon: Hospital },
  { value: "activity", label: "অ্যাক্টিভিটি", icon: Activity },
  { value: "sync", label: "সিংক", icon: RefreshCw },
  { value: "settings", label: "সেটিংস", icon: Settings },
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
  const actor = (await getAdminActor()) ?? "unknown";

  const sb = getSupabaseAdmin();
  // Tolerant reads: new tables/columns need the trust-engagement migration;
  // anything missing resolves to empty so the panel never crashes.
  async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await fn();
    } catch {
      return fallback;
    }
  }
  const [{ count: total }, { count: approved }] = await Promise.all([
    sb.from("doctors").select("*", { count: "exact", head: true }),
    sb.from("doctors").select("*", { count: "exact", head: true }).eq("status", "APPROVED"),
  ]);
  // Approvals queue = hidden PENDING + live-but-unverified (instant-live policy).
  const pendRows = await safe(async () => {
    const { data } = await sb
      .from("doctors")
      .select("id,name_bn,specialty_bn,location_district,location_upazila_area,appointment_contact,status,reports,chamber_address_bn,visiting_hours_bn,visiting_fee_approx,fee_min,bmdc_reg_no")
      .eq("status", "PENDING")
      .order("created_at", { ascending: false })
      .limit(100);
    return (data ?? []) as never[];
  }, [] as never[]);
  const unverifiedRows = await safe(async () => {
    const { data } = await sb
      .from("doctors")
      .select("id,name_bn,specialty_bn,location_district,location_upazila_area,appointment_contact,status,reports,chamber_address_bn,visiting_hours_bn,visiting_fee_approx,fee_min,bmdc_reg_no")
      .eq("status", "APPROVED")
      .eq("verified", false)
      .order("created_at", { ascending: false })
      .limit(100);
    return (data ?? []) as never[];
  }, [] as never[]);
  const queueRows = [...(unverifiedRows as never[]), ...(pendRows as never[])].slice(0, 100);
  const liveRows = await safe(async () => {
    const { data } = await sb
      .from("doctors")
      .select("id,name_bn,specialty_bn,location_district,location_upazila_area,chamber_address_bn,appointment_contact,visiting_hours_bn,visiting_fee_approx,bmdc_reg_no,reports,created_at")
      .eq("status", "APPROVED")
      .order("created_at", { ascending: false })
      .limit(30);
    const rows: Record<string, unknown>[] = ((data ?? []) as Record<string, unknown>[]);
    // verified/schedule columns need migration — merge when available.
    try {
      const { data: extra } = await sb.from("doctors").select("id,verified,consult_available,schedule").eq("status", "APPROVED").order("created_at", { ascending: false }).limit(30);
      const m = new Map(((extra ?? []) as { id: string }[]).map((r) => [r.id, r]));
      return rows.map((r) => ({ ...r, ...(m.get(r.id as string) ?? {}) }));
    } catch {
      return rows;
    }
  }, [] as Record<string, unknown>[]);
  const { count: facilCount } = await sb
    .from("facilities")
    .select("*", { count: "exact", head: true });

  // Verification queue (unreviewed) + doctor names in one extra query.
  const verifRaw = await safe(async () => {
    const { data } = await sb
      .from("doctor_verifications")
      .select("id,doctor_id,target,action,note,created_at")
      .eq("reviewed", false)
      .order("created_at", { ascending: false })
      .limit(100);
    return (data ?? []) as { id: string; doctor_id: string; target: string; action: string; note: string; created_at: string }[];
  }, [] as { id: string; doctor_id: string; target: string; action: string; note: string; created_at: string }[]);

  const serials = await safe(async () => {
    const { data } = await sb.from("serial_requests").select("*").order("created_at", { ascending: false }).limit(50);
    return (data ?? []) as never[];
  }, [] as never[]);
  const claims = await safe(async () => {
    const { data } = await sb.from("profile_claims").select("*").order("created_at", { ascending: false }).limit(30);
    return (data ?? []) as never[];
  }, [] as never[]);
  const reviews = await safe(async () => {
    const { data } = await sb.from("doctor_reviews").select("*").order("created_at", { ascending: false }).limit(50);
    // ip_hash needs phase-3-tolerant read — column may be absent pre-migration.
    return (data ?? []) as never[];
  }, [] as never[]);
  const audits = await safe(async () => {
    const { data } = await sb.from("admin_actions").select("*").order("created_at", { ascending: false }).limit(40);
    // actor column needs phase-3 migration — tolerate its absence.
    return ((data ?? []) as { id: string; action: string; doctor_id: string | null; detail: string; actor?: string; created_at: string }[]).map((a) => ({
      id: a.id,
      action: a.action,
      doctor_id: a.doctor_id,
      detail: a.actor ? `[${a.actor}] ${a.detail}` : a.detail,
      created_at: a.created_at,
    }));
  }, [] as { id: string; action: string; doctor_id: string | null; detail: string; created_at: string }[]);
  const eventsRaw = await safe(async () => {
    const { data } = await sb.from("events").select("id,kind,doctor_id,query,meta,created_at").order("created_at", { ascending: false }).limit(500);
    return (data ?? []) as { id: string; kind: string; doctor_id: string | null; query: string; meta: string; created_at: string }[];
  }, [] as { id: string; kind: string; doctor_id: string | null; query: string; meta: string; created_at: string }[]);

  // One doctor-name lookup shared by verifs/serials/claims/reviews/audits/events.
  const nameIds = [...new Set([
    ...verifRaw.map((v) => v.doctor_id),
    ...(serials as { doctor_id: string }[]).map((s) => s.doctor_id),
    ...(claims as { doctor_id: string }[]).map((c) => c.doctor_id),
    ...(reviews as { doctor_id: string }[]).map((r) => r.doctor_id),
    ...audits.map((a) => a.doctor_id).filter(Boolean) as string[],
    ...eventsRaw.map((e) => e.doctor_id).filter(Boolean) as string[],
  ])].slice(0, 200);
  const nameMap = await (async () => {
    if (!nameIds.length) return new Map<string, { name_bn: string; location_district: string; appointment_contact: string }>();
    return safe(async () => {
      const { data } = await sb.from("doctors").select("id,name_bn,location_district,appointment_contact").in("id", nameIds);
      return new Map(((data ?? []) as { id: string; name_bn: string; location_district: string; appointment_contact: string }[]).map((d) => [d.id, d]));
    }, new Map<string, { name_bn: string; location_district: string; appointment_contact: string }>());
  })();
  const verifs = verifRaw.map((v) => ({
    ...v,
    doctor_name: nameMap.get(v.doctor_id)?.name_bn,
    doctor_district: nameMap.get(v.doctor_id)?.location_district,
    doctor_phone: nameMap.get(v.doctor_id)?.appointment_contact,
  }));
  const serialsNamed = (serials as Record<string, never>[]).map((s) => ({ ...s, doctor_name: nameMap.get(s.doctor_id as string)?.name_bn }));
  const claimsNamed = (claims as Record<string, never>[]).map((c) => ({ ...c, doctor_name: nameMap.get(c.doctor_id as string)?.name_bn }));
  const reviewsNamed = (reviews as Record<string, never>[]).map((r) => ({ ...r, doctor_name: nameMap.get(r.doctor_id as string)?.name_bn }));
  const auditsNamed = audits.map((a) => ({ ...a, doctor_name: a.doctor_id ? nameMap.get(a.doctor_id)?.name_bn : undefined }));
  const events = eventsRaw.map((e) => ({ ...e, doctor_name: e.doctor_id ? nameMap.get(e.doctor_id)?.name_bn : undefined }));

  // Aggregates for the activity hub
  const contactCounts = new Map<string, number>();
  const queryCounts = new Map<string, number>();
  for (const e of eventsRaw) {
    if ((e.kind === "call_tap" || e.kind === "whatsapp_tap") && e.doctor_id)
      contactCounts.set(e.doctor_id, (contactCounts.get(e.doctor_id) ?? 0) + 1);
    if (e.kind === "search" && e.query.trim()) queryCounts.set(e.query.trim(), (queryCounts.get(e.query.trim()) ?? 0) + 1);
  }
  const topContacts = [...contactCounts.entries()].map(([key, count]) => ({ key, name: nameMap.get(key)?.name_bn, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  const topQueries = [...queryCounts.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  // Data gaps: searches whose beacon reported zero results, ranked by frequency.
  const gapMap = new Map<string, { query: string; label: string; times: number; lastAt: string }>();
  for (const e of eventsRaw) {
    if (e.kind !== "search" || !e.meta.includes("ফলাফল:0")) continue;
    const label = e.meta.split("•").slice(0, -1).join("•").trim() || "সকল ডাক্তার";
    const key = `${e.query}||${label}`;
    const g = gapMap.get(key) ?? { query: e.query, label, times: 0, lastAt: e.created_at };
    g.times++;
    if (e.created_at > g.lastAt) g.lastAt = e.created_at;
    gapMap.set(key, g);
  }
  const gaps = [...gapMap.values()].sort((a, b) => b.times - a.times).slice(0, 20);

  const pendSerials = (serials as { status: string }[]).filter((s) => s.status === "PENDING").length;
  const pendReviews = (reviews as { status: string }[]).filter((r) => r.status === "PENDING").length;
  const pendClaims = (claims as { status: string }[]).filter((c) => c.status === "PENDING").length;

  const stats = [
    { label: "মোট ডাক্তার", value: total ?? 0, icon: Users, tint: "bg-gray-900" },
    { label: "যাচাই বাকি", value: queueRows.length, icon: Clock, tint: "bg-amber-500" },
    { label: "লাইভ", value: approved ?? 0, icon: BadgeCheck, tint: "bg-emerald-600" },
    { label: "যাচাই জমা", value: verifs.length, icon: ShieldCheck, tint: "bg-sky-600" },
  ];

  const counts: Record<Tab, number | undefined> = {
    approvals: queueRows.length,
    live: approved ?? 0,
    verify: verifs.length,
    requests: pendSerials + pendClaims,
    reviews: pendReviews,
    facilities: facilCount ?? 0,
    activity: eventsRaw.length,
    sync: undefined,
    settings: undefined,
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
          Instant-live চালু: নতুন জমা ⏳ ব্যাজসহ লাইভ হয় — Verify চাপলে ✓ হয়। DB জিতবে, Sheet মিরর।
        </p>
      </aside>

      <div className="min-w-0 flex-1 pb-24 md:pb-8">
        {/* Topbar */}
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg font-bold">অ্যাডমিন ড্যাশবোর্ড <span className="ml-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800">👤 {actor}</span></h1>
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
                যাচাই বাকি ({queueRows.length}/100)
              </h2>
            </div>
            <p className="mt-1 text-[11px] text-gray-500">
              নতুন জমা ⏳ ব্যাজসহ <b>লাইভই আছে</b> — Verify/Approve চাপলে ✓ ব্যাজ পাবে। Duplicate নম্বরে সতর্ক হোন।
            </p>
            <div className="mt-2.5">
              <AdminApprovals rows={queueRows as never} />
            </div>
          </section>
        )}

        {tab === "live" && (
          <section className="mt-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4">
            <h2 className="flex items-center gap-1.5 text-sm font-bold">
              <BadgeCheck size={15} className="text-emerald-700" /> লাইভ ডাক্তার (সাম্প্রতিক 30)
            </h2>
            <p className="mt-1 text-[11px] text-gray-500">এডিট করলে প্রোফাইল + Sheet দুটোতেই লেখা হয়। ⚑ রিপোর্টেড আগে দেখুন।</p>
            <div className="mt-2.5">
              <AdminLive rows={liveRows as never} />
            </div>
          </section>
        )}

        {tab === "verify" && (
          <section className="mt-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4">
            <h2 className="flex items-center gap-1.5 text-sm font-bold">
              <ShieldCheck size={15} className="text-emerald-700" /> যাচাইকরণ কিউ ({verifs.length})
            </h2>
            <p className="mt-1 text-[11px] text-gray-500">
              সংশোধনীতে Apply চাপলে প্রোফাইল + Sheet-এ লেখা হয়। সময়/ফি/চেম্বারে একই মান ৩ বার এলে <b>স্বয়ংক্রিয়ভাবে</b> প্রয়োগ হয়; ফোন/BMDC সবসময় হাতে।
            </p>
            <div className="mt-2.5">
              <AdminVerifyQueue items={verifs as never} />
            </div>
          </section>
        )}

        {tab === "requests" && (
          <section className="mt-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4">
            <h2 className="flex items-center gap-1.5 text-sm font-bold">
              <ClipboardList size={15} className="text-emerald-700" /> অনুরোধ ইনবক্স
            </h2>
            <div className="mt-2.5">
              <AdminRequests serials={serialsNamed as never} claims={claimsNamed as never} />
            </div>
          </section>
        )}

        {tab === "reviews" && (
          <section className="mt-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4">
            <h2 className="flex items-center gap-1.5 text-sm font-bold">
              <Star size={15} className="text-emerald-700" /> রিভিউ মডারেশন
            </h2>
            <div className="mt-2.5">
              <AdminReviews rows={reviewsNamed as never} />
            </div>
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
              <Flag size={15} className="text-emerald-700" /> অ্যাক্টিভিটি হাব
            </h2>
            <div className="mt-2.5">
              <ActivityHub
                events={events as never}
                audits={auditsNamed as never}
                topContacts={topContacts}
                topQueries={topQueries}
                totalEvents={eventsRaw.length}
                gaps={gaps}
              />
            </div>
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

        {tab === "settings" && (
          <section className="mt-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4">
            <h2 className="flex items-center gap-1.5 text-sm font-bold">
              <Settings size={15} className="text-emerald-700" /> সেটিংস — মানচিত্র + API কী
            </h2>
            <p className="mt-1 text-[11px] text-gray-500">
              মানচিত্র এখন ফ্রি OSM (কী লাগে না)। ভবিষ্যতে CARTO/অন্য provider লাগলে এখানে Tile
              URL + কী বসান — কোড বদলাতে হবে না।
            </p>
            <div className="mt-2.5">
              <AdminSettings />
            </div>
            <AdminAdmins />
          </section>
        )}
      </div>
    </div>
  );
}
