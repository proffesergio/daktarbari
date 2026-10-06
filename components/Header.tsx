import Link from "next/link";
import { Plus, Stethoscope } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b-2 border-emerald-800 bg-white">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="flex items-center gap-3" aria-label="ডাক্তার বাড়ি মূল পাতা">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-700 text-white">
            <Stethoscope size={32} />
          </span>
          <span>
            <span className="block text-2xl font-bold text-emerald-900">ডাক্তার বাড়ি</span>
            <span className="block text-base text-gray-600">বাংলাদেশের ডাক্তার ডিরেক্টরি</span>
          </span>
        </Link>
        <Link
          href="/add"
          className="touch-target flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 text-xl font-bold text-white hover:bg-emerald-800"
        >
          <Plus size={24} /> আপনার তথ্য যুক্ত করুন
        </Link>
      </div>
    </header>
  );
}
