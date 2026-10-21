import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';

import { DetailSheet } from '@/components/analyzer/detail-sheet';
import { CategoryBadge } from '@/components/category-badge';
import { Colors } from '@/constants/theme';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import { buildSpendPatternAnalysis } from '@gastify/core/transformers/spendPatternAnalysis';
import type {
  BiggestSpendPatternsData,
  WalletAnalyzerBudgetRow,
  WalletAnalyzerInsightItem,
  WalletAnalyzerMonthlyChampionEntry,
  WalletAnalyzerWeekdaySpendingData,
} from '@gastify/core/transformers/walletAnalyzer';

// The detail sheets of the Wallet Analyzer, one per card, in the web's words. They are shared by the Analyzer and the
// History screen, so both explain the same numbers the same way.

function Row({ label, right, met, bold = false }: { label: string; right: string; met?: boolean; bold?: boolean }) {
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  return (
    <View className="flex-row items-center justify-between gap-3 border-t border-gf-border py-2.5">
      <Text className={`flex-1 text-base text-gf-text ${bold ? 'font-inter-semibold' : 'font-inter'}`}>{label}</Text>
      <Text className="font-inter-semibold text-base text-gf-text">{right}</Text>
      {met !== undefined && <Text className="w-6 text-center font-inter-bold text-base" style={{ color: met ? colors.income : colors.expense }}>{met ? '✓' : '✗'}</Text>}
    </View>
  );
}

// ▲ / ▼ / ▬ with the web's meaning of color: green when the change is good, red when it is bad, orange when it is flat.
// `invert` is for expenses, where going up is the bad direction.
export function Indicator({ delta, invert = false, size = 15 }: { delta: number | null; invert?: boolean; size?: number }) {
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const flat = delta === null || Math.abs(delta) < 0.5;
  const up = (delta ?? 0) > 0;
  const good = invert ? !up : up;
  const color = flat ? '#f59e0b' : good ? colors.income : colors.expense;
  return <Text style={{ color, fontSize: size, fontWeight: '700', minWidth: 18, textAlign: 'center' }}>{flat ? '▬' : up ? '▲' : '▼'}</Text>;
}

export const Explain = ({ children }: { children: ReactNode }) => <Text className="font-inter text-sm text-gf-text-muted">{children}</Text>;

type D = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

// "Why" sheet for every insight type (the web's InsightDetailModal): a plain explanation and the months behind it.
export function InsightSheet({ insight, currency, onClose }: { insight: WalletAnalyzerInsightItem | null; currency: string; onClose: () => void }) {
  const money = (value: number) => formatMoneyMajor(value, currency);
  const d = (insight?.data ?? {}) as D;
  let explanation: ReactNode = null;
  let rows: ReactNode[] = [];

  switch (insight?.type) {
    case 'budget':
      explanation = <Explain>Presupuesto mensual de {money(d.limit)} para {d.category}. Racha actual: {d.streakMonths} {d.streakMonths === 1 ? 'mes' : 'meses'} bajo presupuesto.</Explain>;
      rows = (d.monthlySeries ?? []).map((m: D) => <Row key={m.label} label={m.label} right={`${money(m.actual)} / ${money(m.goal)}`} met={m.met} />);
      break;
    case 'category_anomaly':
      explanation = <Explain>Promedio de los últimos {d.monthlyTotals?.length || 6} meses (sin contar este mes): {money(d.average)}. Se necesitan al menos 3 meses de historial para calcularlo.</Explain>;
      rows = [...(d.monthlyTotals ?? []).map((m: D) => <Row key={m.label} label={m.label} right={money(m.amount)} />), <Row key="now" label="Este mes" right={money(d.current)} bold />];
      break;
    case 'subscription':
      explanation = <Explain>Detectada porque el mismo nombre se repite en al menos 2 de los últimos 3 meses con un monto que varía menos de 15% — categoría {d.categoryName}.</Explain>;
      rows = (d.occurrences ?? []).map((o: D, i: number) => <Row key={i} label={new Date(o.date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })} right={money(o.amount)} />);
      break;
    case 'monthly_average':
      explanation = <Explain>Promedio de los últimos {d.trend?.length || 6} meses: {money(d.avgIncome)} de ingresos, {money(d.avgExpense)} de gastos y {Math.round(d.avgTransactionCount || 0)} transacciones por mes.</Explain>;
      rows = (d.trend ?? []).map((m: D) => <Row key={m.label} label={m.label} right={`${money(m.income)} / ${money(m.expense)} / ${m.transactionCount}`} />);
      break;
    case 'savings_rate':
      explanation = <Explain>Tasa de ahorro = balance del mes ÷ ingresos del mes.</Explain>;
      rows = (d.savingsHistoryLabeled ?? []).map((m: D) => <Row key={m.label} label={m.label} right={`${Math.round(m.rate * 100)}%`} />);
      break;
    case 'peak_month': {
      const m = d.peakMonth ?? {};
      explanation = <Explain>De todos los meses dentro de este periodo, {m.label} fue el que más gasto acumuló.</Explain>;
      rows = [
        <Row key="t" label={m.label} right={money(m.total)} bold />,
        ...(m.biggestCategory ? [<Row key="c" label="Categoría con más gasto" right={`${m.biggestCategory.name} — ${money(m.biggestCategory.total)}`} />] : []),
        ...(m.biggestTransaction ? [<Row key="x" label="Transacción más grande" right={`${m.biggestTransaction.name} — ${money(m.biggestTransaction.amount)}`} />] : []),
      ];
      break;
    }
    case 'peak_month_vs_previous':
      explanation = <Explain>Comparación entre el mes de mayor gasto de este periodo y el del periodo anterior equivalente.</Explain>;
      rows = [<Row key="a" label={`Este periodo — ${d.current?.label}`} right={money(d.current?.total ?? 0)} />, <Row key="b" label={`Periodo anterior — ${d.previous?.label}`} right={money(d.previous?.total ?? 0)} />];
      break;
    case 'peak_quarter':
      explanation = <Explain>De todos los trimestres dentro de este periodo, {d.peakQuarter?.label} fue el que más gasto acumuló.</Explain>;
      rows = (d.peakQuarter?.months ?? []).map((m: D) => <Row key={m.label} label={m.label} right={money(m.total)} />);
      break;
    case 'spending_pace':
      explanation = <Explain>Compara cuánto llevas gastado este mes (al día {d.dayOfMonth}) contra cuánto habías gastado, para ese mismo día del mes, en cada uno de los últimos {d.monthlyDetail?.length || 6} meses.</Explain>;
      rows = [...(d.monthlyDetail ?? []).map((m: D) => <Row key={m.label} label={`${m.label} (día ${m.throughDay})`} right={money(m.amount)} />), <Row key="now" label={`Este mes (día ${d.dayOfMonth})`} right={money(d.spentSoFar)} bold />];
      break;
    default:
      explanation = <Explain>Esta señal se calcula con tus movimientos del periodo.</Explain>;
  }

  return (
    <DetailSheet
      visible={Boolean(insight)}
      title={insight ? `${insight.icon ?? ''} ${insight.title}`.trim() : ''}
      info={{ title: 'Cómo leer esto', text: 'Cada renglón es un mes (o una fecha) que sirvió para calcular la señal. ✓ significa que se cumplió el límite o la meta; ✗, que no. Los montos están en tu moneda principal.' }}
      onClose={onClose}>
      {explanation}
      <View>{rows}</View>
    </DetailSheet>
  );
}

// A budget's last months (the web opens this from the analyzer's budget rows): spent against the limit, month by month.
export function BudgetSeriesSheet({ row, currency, onClose }: { row: WalletAnalyzerBudgetRow | null; currency: string; onClose: () => void }) {
  const money = (value: number) => formatMoneyMajor(value, currency);
  const series = row?.monthlySeries ?? [];
  return (
    <DetailSheet
      visible={Boolean(row)}
      title={row?.category ?? ''}
      subtitle={row ? `Límite mensual ${money(row.limit)} · racha ${row.streakMonths} ${row.streakMonths === 1 ? 'mes' : 'meses'}` : undefined}
      info={{ title: 'Cumplimiento del presupuesto', text: 'Cada mes se compara lo gastado en la categoría con el límite del presupuesto. ✓ si no lo superaste, ✗ si sí. La racha cuenta los meses seguidos, hasta el actual, dentro del límite. Si el presupuesto es nuevo, los meses anteriores usan su meta más antigua como estimado.' }}
      onClose={onClose}>
      {series.length === 0 && <Explain>Todavía no hay meses suficientes para mostrar.</Explain>}
      <View>{series.map((m) => <Row key={m.label} label={m.label} right={`${money(m.actual)} / ${money(m.goal)}`} met={m.met} />)}</View>
      {row && (
        <Pressable accessibilityRole="button" onPress={() => { onClose(); router.push({ pathname: '/budgets/[id]', params: { id: row.budgetId } }); }} className="items-center rounded-full border border-gf-border py-3">
          <Text className="font-inter-semibold text-sm text-gf-text">Abrir el presupuesto</Text>
        </Pressable>
      )}
    </DetailSheet>
  );
}

export type ChampionKind = 'transaction' | 'category' | 'subCategory';
const CHAMPION_TITLES: Record<ChampionKind, string> = { transaction: 'Transacción más grande por mes', category: 'Categoría con más gasto por mes', subCategory: 'Subcategoría con más gasto por mes' };

// The leader of each of the last months (biggest movement, category or sub-category), biggest first.
export function ChampionsSheet({ kind, months, currency, onClose }: { kind: ChampionKind | null; months: WalletAnalyzerMonthlyChampionEntry[]; currency: string; onClose: () => void }) {
  const money = (value: number) => formatMoneyMajor(value, currency);
  const rows = kind
    ? months
        .map((entry) => ({ entry, champion: (kind === 'transaction' ? entry.biggestTransaction : kind === 'category' ? entry.biggestCategory : entry.biggestSubcategory) as D | null }))
        .filter((r): r is { entry: WalletAnalyzerMonthlyChampionEntry; champion: D } => Boolean(r.champion))
        .sort((a, b) => (b.champion.amount ?? b.champion.total) - (a.champion.amount ?? a.champion.total))
    : [];
  return (
    <DetailSheet
      visible={kind !== null}
      title={kind ? CHAMPION_TITLES[kind] : ''}
      info={{ title: 'Líderes por mes', text: 'Para cada uno de los últimos doce meses se busca el movimiento, la categoría o la subcategoría con más gasto. La lista va de mayor a menor para que se vea cuál ganó en el año. En categorías, el % es su parte del gasto de los doce meses.' }}
      onClose={onClose}>
      {rows.map(({ entry, champion }) => (
        <Pressable
          key={entry.label}
          accessibilityRole="button"
          disabled={kind !== 'transaction' || !champion._id}
          onPress={() => { onClose(); router.push({ pathname: '/movements/[id]', params: { id: String(champion._id) } }); }}
          className="flex-row items-center gap-3 border-t border-gf-border py-2.5">
          <CategoryBadge icon={champion.icon ?? champion.categoryIcon} color={champion.color ?? champion.categoryColor} size={38} />
          <View className="flex-1">
            <Text className="font-inter-semibold text-xs uppercase text-gf-text-muted">{entry.label}</Text>
            <Text className="font-inter-medium text-base text-gf-text" numberOfLines={1}>{champion.name}</Text>
            {kind !== 'transaction' && champion.pctOfWindowTotal !== undefined && <Text className="font-inter text-xs text-gf-text-muted">{Math.round(champion.pctOfWindowTotal)}% del total de los 12 meses</Text>}
          </View>
          <Text className="font-inter-bold text-base text-gf-text">{money(champion.amount ?? champion.total)}</Text>
        </Pressable>
      ))}
      {rows.length === 0 && <Explain>No hay gastos en estos meses.</Explain>}
    </DetailSheet>
  );
}

// "Ver análisis": the plain-language reading of the biggest spending, from computed facts only.
export function SpendAnalysisSheet({ patterns, visible, onClose }: { patterns: BiggestSpendPatternsData | null; visible: boolean; onClose: () => void }) {
  const bullets = patterns ? buildSpendPatternAnalysis(patterns) : [];
  return (
    <DetailSheet
      visible={visible && Boolean(patterns)}
      title="Análisis de grandes gastos"
      info={{ title: 'De dónde sale este análisis', text: 'No usa inteligencia artificial: cada frase es la lectura directa de un cálculo sobre tus últimos doce meses (si la transacción más grande está en la categoría líder, qué parte del gasto es la categoría, qué tan aislado fue el gasto y qué etiqueta se repite).' }}
      onClose={onClose}>
      {bullets.map((bullet, index) => <Text key={index} className="border-t border-gf-border py-2.5 font-inter text-base text-gf-text">• {bullet}</Text>)}
    </DetailSheet>
  );
}

// "Ver detalle" of the weekday pattern (the web's modal): the heaviest week, how the averages are worked out, and every day.
export function WeekdaySheet({ data, visible, currency, onClose }: { data: WalletAnalyzerWeekdaySpendingData | null; visible: boolean; currency: string; onClose: () => void }) {
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const money = (value: number) => formatMoneyMajor(value, currency);
  const best = data ? [...(data.weeks ?? [])].sort((a, b) => b.total - a.total)[0] : undefined;
  const max = Math.max(1, ...(data?.dailyBreakdown ?? []).map((day) => day.total));
  return (
    <DetailSheet
      visible={visible && Boolean(data)}
      title="Patrones por día de la semana"
      info={{ title: 'Cómo se calcula', text: 'Se suma el gasto de cada día de la semana (todos los lunes, todos los martes…) durante el mes y se divide entre cuántas veces cayó ese día; un mes tiene 4 o 5 de cada uno, así que dividir hace justa la comparación.' }}
      onClose={onClose}>
      {best && (
        <View className="gap-0.5 rounded-2xl p-3" style={{ backgroundColor: colors.accentSoft }}>
          <Text className="font-inter-semibold text-xs uppercase text-gf-text-muted">Semana con más gasto</Text>
          <Text className="font-inter-bold text-lg text-gf-text">{best.label} — {money(best.total)}</Text>
          <Text className="font-inter text-xs text-gf-text-muted">{best.count} transacciones</Text>
        </View>
      )}
      {data && (
        <Explain>
          {data.insight} Se suma el gasto de cada día de la semana a lo largo del mes y se divide entre cuántas veces cayó ese día. El promedio entre semana fue {money(data.weekdayAvg)} y el de fin de semana {money(data.weekendAvg)}.
        </Explain>
      )}
      <Text className="font-inter-semibold text-xs uppercase text-gf-text-muted">Detalle día por día</Text>
      {(data?.dailyBreakdown ?? []).map((day) => (
        <View key={day.dayOfMonth} className="flex-row items-center gap-3 border-t border-gf-border py-2">
          <Text className="w-16 font-inter text-xs text-gf-text-muted">{day.dayName.slice(0, 3)} {day.dayOfMonth}</Text>
          <View className="h-2 flex-1 overflow-hidden rounded-full bg-gf-surface"><View style={{ width: `${(day.total / max) * 100}%`, height: '100%', backgroundColor: colors.accent }} /></View>
          <Text className="w-24 text-right font-inter-semibold text-sm text-gf-text">{money(day.total)}</Text>
        </View>
      ))}
    </DetailSheet>
  );
}
