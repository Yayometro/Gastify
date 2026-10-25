import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View, useColorScheme } from 'react-native';
import { useDispatch } from 'react-redux';

import { CategoryBadge } from '@/components/category-badge';
import { useToast } from '@/components/toast';
import { GradientButton } from '@/components/ui/gradient-button';
import { Colors } from '@/constants/theme';
import { reloadAfterWrite } from '@/hooks/use-load-app-data';
import { usePrimaryCurrency } from '@/hooks/use-primary-currency';
import { messageOf, sendWrite } from '@/lib/write';
import type { AppDispatch } from '@/store';
import { getApi } from '@gastify/core/api/client';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import { useT } from "@/i18n/client";
import { tNow } from '@/i18n/now';

type Ref = { _id?: string; name?: string; color?: string | null; icon?: string | null } | null | undefined;
type Entry = {
  transaction: { _id?: string; name?: string; amount?: number | string; category?: Ref; subCategory?: Ref };
  suggestion: { category?: Ref; subCategory?: Ref; confidence?: string };
};

// The Transaction Categorizer: it looks at the movements without a category and, from the rules saved before,
// suggests one for each. Nothing changes until the person reviews them and applies the ones they keep.
export function Categorizer({ onApplied }: { onApplied?: () => void }) {
  const t = useT();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const currency = usePrimaryCurrency();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [skipped, setSkipped] = useState<Record<string, boolean>>({});
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getApi().post<{ ok?: boolean; data?: Entry[]; message?: string }>('general-data/category-rules/suggest', {});
      if (!res?.ok) throw new Error(res?.message || t("mobile.no.pudimos.buscar.sugerencias"));
      setEntries(res.data ?? []);
      setSkipped({});
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const chosen = entries.filter((entry) => !skipped[String(entry.transaction._id)]);

  const apply = async () => {
    setApplying(true);
    try {
      const applications = chosen.map((entry) => ({
        transactionId: String(entry.transaction._id),
        category: entry.suggestion.category?._id ?? null,
        subCategory: entry.suggestion.subCategory?._id ?? null,
      }));
      await sendWrite('general-data/category-rules/apply-suggestions', { applications });
      toast.show(tNow("mobile.movimientos.categorizados", { count: applications.length, p1: applications.length }));
      reloadAfterWrite(dispatch);
      onApplied?.();
      await load();
    } catch (e) {
      toast.show(messageOf(e), 'error');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <View className="items-center gap-2 py-10">
        <ActivityIndicator color={colors.accent} />
        <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.buscando.movimientos.sin.categoria")}</Text>
      </View>
    );
  }
  if (error) return <Text className="font-inter text-sm text-red-500">{error}</Text>;
  if (entries.length === 0) {
    return <Text className="py-10 text-center font-inter text-base text-gf-text-muted">{t("mobile.sin.sugerencias.por.ahora.estas")}</Text>;
  }

  return (
    <View className="gap-3">
      <Text className="text-center font-inter text-sm text-gf-text-muted">
        {t("mobile.p1.p2.con.una.regla", { p1: entries.length, p2: tNow("mobile.movimientos.sin.categoria.coinciden", { count: entries.length }) })}
      </Text>
      {entries.map((entry) => {
        const id = String(entry.transaction._id);
        const skip = Boolean(skipped[id]);
        const low = entry.suggestion.confidence === 'low';
        const target = entry.suggestion.subCategory?.name || entry.suggestion.category?.name || t("history.noCategory");
        const icon = entry.suggestion.subCategory?.icon || entry.suggestion.category?.icon;
        const color = entry.suggestion.subCategory?.color || entry.suggestion.category?.color;
        return (
          <Pressable
            key={id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: !skip }}
            onPress={() => setSkipped((current) => ({ ...current, [id]: !skip }))}
            className="gap-2 rounded-2xl border border-gf-border p-3"
            style={{ opacity: skip ? 0.5 : 1, backgroundColor: low ? 'rgba(245, 158, 11, 0.12)' : undefined }}>
            <View className="flex-row items-center gap-3">
              <Ionicons name={skip ? 'square-outline' : 'checkbox'} size={22} color={skip ? colors.textSecondary : colors.accent} />
              <Text className="flex-1 font-inter-medium text-base text-gf-text" numberOfLines={1}>{entry.transaction.name || t("errors.api.movement")}</Text>
              <Text className="font-inter-semibold text-sm text-gf-text">{formatMoneyMajor(Math.abs(Number(entry.transaction.amount) || 0), currency)}</Text>
            </View>
            <View className="flex-row items-center gap-2 pl-8">
              <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.sin.categoria")}</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.textSecondary} />
              <CategoryBadge icon={icon ?? undefined} color={color ?? undefined} size={24} />
              <Text className="flex-1 font-inter-semibold text-sm text-gf-text" numberOfLines={1}>{target}</Text>
              {low && <Text className="font-inter-medium text-xs" style={{ color: '#d97706' }}>{t("mobile.revisar")}</Text>}
            </View>
          </Pressable>
        );
      })}
      <GradientButton label={chosen.length === 0 ? t("mobile.nada.seleccionado") : tNow("mobile.aplicar.p1", { p1: chosen.length })} onPress={apply} loading={applying} disabled={applying || chosen.length === 0} />
    </View>
  );
}
