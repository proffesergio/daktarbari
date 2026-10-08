"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type DistrictStat = { district: string; count: number };

export type DistrictStats = {
  total: number;
  byDistrict: Record<string, number>;
  districts: DistrictStat[];
  live: boolean;
  updatedAt?: string;
  loading: boolean;
  error: boolean;
  refresh: () => void;
};

const POLL_MS = 60_000;

export function useDistrictStats(): DistrictStats {
  const [total, setTotal] = useState(0);
  const [byDistrict, setByDistrict] = useState<Record<string, number>>({});
  const [districts, setDistricts] = useState<DistrictStat[]>([]);
  const [live, setLive] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/stats/districts", {
        signal,
        next: undefined,
        cache: "no-store",
      } as RequestInit);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setTotal(json.total ?? 0);
      setByDistrict(json.byDistrict ?? {});
      setDistricts(json.districts ?? []);
      setLive(Boolean(json.live));
      setUpdatedAt(json.updatedAt);
      setError(false);
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    // Deferred so the initial fetch (which calls setState on resolve) runs
    // outside the effect body — satisfies react-hooks/set-state-in-effect.
    const t = setTimeout(() => load(ctrl.signal), 0);
    timer.current = setInterval(() => load(), POLL_MS);
    return () => {
      ctrl.abort();
      clearTimeout(t);
      if (timer.current) clearInterval(timer.current);
    };
  }, [load]);

  const refresh = useCallback(() => {
    setLoading(true);
    load();
  }, [load]);

  return { total, byDistrict, districts, live, updatedAt, loading, error, refresh };
}
