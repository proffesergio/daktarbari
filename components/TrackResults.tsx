"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/track";

// Mount-once search-result beacon: records query + result count so the
// admin data-gap dashboard knows which searches return nothing.
export default function TrackResults({ query, meta, count }: { query: string; meta: string; count: number }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    const t = setTimeout(() => track("search", undefined, `${meta} • ফলাফল:${count}`, query), 0);
    return () => clearTimeout(t);
  }, [query, meta, count]);
  return null;
}
