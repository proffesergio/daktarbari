"use client";

import { MessageCircle } from "lucide-react";
import { whatsappLink, isValidBdPhone } from "@/lib/completeness";

// One-tap WhatsApp serial booking (only when a valid BD number exists).
export default function MissingInfoCta({
  phone,
  name,
  specialty,
}: {
  phone?: string | null;
  name: string;
  specialty: string;
}) {
  if (!isValidBdPhone(phone)) return null;
  const wa = whatsappLink(
    phone,
    `আসসালামু আলাইকুম, আমি ${name} (${specialty})-এর সিরিয়াল নিতে চাই। কখন আসতে পারবো?`,
  );
  if (!wa) return null;
  return (
    <a
      href={wa}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white hover:brightness-95"
    >
      <MessageCircle size={18} /> WhatsApp-এ সিরিয়াল নিন
    </a>
  );
}
