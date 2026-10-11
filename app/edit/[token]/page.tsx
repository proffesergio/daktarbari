import Link from "next/link";
import EditPortalForm from "@/components/EditPortalForm";
import { getSupabaseAdmin } from "@/lib/supabase";
import { resolveDoctorToken } from "@/lib/doctorTokens";

export const dynamic = "force-dynamic";
export const metadata = { title: "প্রোফাইল হালনাগাদ | ডাক্তার বাড়ি" };

export default async function EditPortal({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const doctor_id = await resolveDoctorToken(token, "edit");
  if (!doctor_id) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-center">
        <p className="text-xl font-bold">লিংকটি ভুল বা মেয়াদোত্তীর্ণ</p>
        <p className="mt-1 text-sm text-gray-600">নতুন লিংকের জন্য অ্যাডমিনের সাথে যোগাযোগ করুন।</p>
        <Link href="/" className="mt-4 inline-block text-sm font-bold text-emerald-800">← মূল পাতা</Link>
      </div>
    );
  }
  let doctor = null;
  try {
    const sb = getSupabaseAdmin();
    const { data } = await sb.from("doctors").select("name_bn,specialty_bn,chamber_address_bn,visiting_hours_bn,visiting_fee_approx").eq("id", doctor_id).maybeSingle();
    if (data) {
      let extra: { consult_available?: boolean; schedule?: never } = {};
      try {
        const r = await sb.from("doctors").select("consult_available,schedule").eq("id", doctor_id).maybeSingle();
        extra = (r.data ?? {}) as typeof extra;
      } catch {
        /* pre-migration */
      }
      doctor = { ...data, ...extra };
    }
  } catch {
    doctor = null;
  }
  if (!doctor) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-center">
        <p className="text-xl font-bold">প্রোফাইল পাওয়া যায়নি</p>
        <Link href="/" className="mt-4 inline-block text-sm font-bold text-emerald-800">← মূল পাতা</Link>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-3xl px-3 py-5 pb-24 sm:pb-8">
      <h1 className="text-lg font-bold">✏️ প্রোফাইল হালনাগাদ</h1>
      <EditPortalForm token={token} doctor={doctor as never} />
    </div>
  );
}
