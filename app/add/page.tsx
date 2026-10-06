import DoctorForm from "@/components/DoctorForm";

export const metadata = { title: "ডাক্তারের তথ্য যুক্ত করুন | ডাক্তার বাড়ি" };

export default function AddPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-3xl font-bold">ডাক্তারের তথ্য যুক্ত করুন</h1>
      <DoctorForm />
    </div>
  );
}
