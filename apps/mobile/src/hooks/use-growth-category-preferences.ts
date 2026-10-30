import { useCallback, useEffect, useState } from 'react';
import { getApi } from '@gastify/core/api/client';
import { sendWrite } from '@/lib/write';

export type GrowthCategoryPreference = { categoryId: string; reductionPercent: number };

export function useGrowthCategoryPreferences() {
  const [preferences, setPreferences] = useState<GrowthCategoryPreference[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getApi().get<{ preferences?: GrowthCategoryPreference[] }>('general-data/growth-category-preferences')
      .then((answer) => { if (!Array.isArray(answer.preferences)) throw new Error('Preferences unavailable'); if (active) { setPreferences(answer.preferences); setError(false); } })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const save = useCallback(async (categoryId: string, reductionPercent: number) => {
    try {
      await sendWrite('general-data/growth-category-preferences', { categoryId, reductionPercent });
      setPreferences((current) => [...current.filter((item) => item.categoryId !== categoryId), ...(reductionPercent > 0 ? [{ categoryId, reductionPercent }] : [])]);
      setError(false);
      return true;
    } catch { setError(true); return false; }
  }, []);

  return { preferences, error, loading, save };
}
