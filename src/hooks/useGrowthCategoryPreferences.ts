"use client";

import { useCallback, useEffect, useState } from "react";

export interface GrowthCategoryPreference {
  categoryId: string;
  reductionPercent: number;
}

export function useGrowthCategoryPreferences(enabled = true) {
  const [preferences, setPreferences] = useState<GrowthCategoryPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    fetch("/api/general-data/growth-category-preferences", { signal: controller.signal, credentials: "same-origin" })
      .then((response) => { if (!response.ok) throw new Error("Could not load preferences"); return response.json(); })
      .then((data) => { if (!controller.signal.aborted) setPreferences(Array.isArray(data.preferences) ? data.preferences : []); })
      .catch(() => { if (!controller.signal.aborted) setError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [enabled]);

  const save = useCallback(async (categoryId: string, reductionPercent: number) => {
    setError(false);
    try {
      const response = await fetch("/api/general-data/growth-category-preferences", {
        method: "PUT", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId, reductionPercent }),
      });
      if (!response.ok) throw new Error("Could not save preference");
      setPreferences((current) => [...current.filter((item) => item.categoryId !== categoryId), ...(reductionPercent > 0 ? [{ categoryId, reductionPercent }] : [])]);
      return true;
    } catch {
      setError(true);
      return false;
    }
  }, []);

  return { preferences, loading: enabled && loading, error, save };
}
