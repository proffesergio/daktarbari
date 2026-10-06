"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => { await fetch("/api/admin/logout", { method: "POST" }); router.push("/admin/login"); }}
      className="rounded-xl border-2 px-4 py-2 text-lg font-bold"
    >
      লগআউট
    </button>
  );
}
