"use client";

import { useRouter } from "next/navigation";

// History-aware back button: pops back to the search results when the
// profile was opened from a results flow, otherwise pushes the fallback.
export default function BackButton({ fallback, label }: { fallback: string; label: string }) {
  const router = useRouter();

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  }

  return (
    <button onClick={goBack} className="text-sm font-bold text-emerald-800 hover:underline">
      {label}
    </button>
  );
}
