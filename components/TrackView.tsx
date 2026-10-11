"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";

// Mount-once profile-view beacon.
export default function TrackView({ doctorId }: { doctorId: string }) {
  useEffect(() => {
    const t = setTimeout(() => track("profile_view", doctorId), 0);
    return () => clearTimeout(t);
  }, [doctorId]);
  return null;
}
