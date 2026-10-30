import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { Screen } from '@/components/screen';
import { TourTarget } from '@/components/tour/tour-target';
import { useToast } from '@/components/toast';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Card } from '@/components/ui/card';
import { GradientButton } from '@/components/ui/gradient-button';
import { SkeletonRows } from '@/components/ui/skeleton';
import { TextField } from '@/components/ui/text-field';
import { Colors } from '@/constants/theme';
import { reloadAfterWrite } from '@/hooks/use-load-app-data';
import { usePrimaryCurrency } from '@/hooks/use-primary-currency';
import { useLocale, useT } from '@/i18n/client';
import { messageOf, sendWrite } from '@/lib/write';
import type { AppDispatch, RootState } from '@/store';
import { shortDate } from '@gastify/core/i18n/dates';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import { analyzePerson, MIN_TRIGGER_DAYS, sharedMovementIds, type ContactFrequency, type ContactPattern, type PeopleMovement, type PersonLike } from '@gastify/core/transformers/peopleAnalysis';

type Person = {
  id: string;
  name: string;
  relationship: string;
  icon: string | null;
  color: string | null;
  categoryId: string | null;
  subCategoryIds: string[];
  tagNames: string[];
  accountId: string | null;
  contact: { pattern: string; days: number[]; frequency: string };
  limit: { amount: number; period: 'monthly' | 'per_meeting' } | null;
  archived: boolean;
};

const RELATIONSHIPS = ['partner', 'family', 'friend', 'coworker', 'group', 'other'] as const;
const FREQUENCIES: ContactFrequency[] = ['daily', 'few_per_week', 'weekly', 'biweekly', 'monthly', 'sporadic'];
const PATTERNS: ContactPattern[] = ['weekdays', 'weekends', 'daily', 'random', 'custom'];
const SUBS = ['food', 'outings', 'gifts', 'transport', 'trips', 'other'] as const;
const COLORS = ['#a855f7', '#ec4899', '#f59e0b', '#22c55e', '#3b82f6', '#14b8a6', '#ef4444', '#84cc16'];
const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0];

const toLike = (person: Person): PersonLike => ({
  id: person.id,
  categoryId: person.categoryId,
  subCategoryIds: person.subCategoryIds,
  tagNames: person.tagNames,
  accountId: person.accountId,
  contact: { pattern: person.contact.pattern as ContactPattern, days: person.contact.days, frequency: person.contact.frequency as ContactFrequency },
  limit: person.limit,
});

type Draft = { name: string; relationship: (typeof RELATIONSHIPS)[number]; frequency: ContactFrequency; pattern: ContactPattern; days: number[]; subs: string[]; tags: string; limitAmount: string; limitPeriod: 'monthly' | 'per_meeting' };
const NEW_DRAFT: Draft = { name: '', relationship: 'partner', frequency: 'weekly', pattern: 'weekends', days: [], subs: ['food', 'outings'], tags: '', limitAmount: '', limitPeriod: 'monthly' };

// "Personas": the people the spending is around. Each one is a category (created with the person) with sub-categories; the
// analysis says how much, how often, whether the day's total changes and how it stands against the limit. Same numbers as the
// web: core's analyzePerson. The wording is neutral: it describes spending, never the person.
export default function PeopleScreen() {
  const t = useT();
  const locale = useLocale();
  const toast = useToast();
  const dispatch = useDispatch<AppDispatch>();
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const currency = usePrimaryCurrency();
  const movements = useSelector((state: RootState) => state.transacctionsReducer.data) as unknown as PeopleMovement[];
  const [people, setPeople] = useState<Person[] | null>(null);
  const [wizard, setWizard] = useState(false);
  const [draft, setDraft] = useState<Draft>(NEW_DRAFT);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/more'));

  const load = useCallback(async () => {
    try {
      setPeople(await sendWrite<Person[]>('general-data/people/get', {}));
    } catch (error) {
      setPeople([]);
      toast.show(messageOf(error));
    }
  }, [toast]);
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const likes = useMemo(() => (people ?? []).filter((person) => !person.archived).map(toLike), [people]);
  const sharedIds = useMemo(() => sharedMovementIds(likes, movements), [likes, movements]);
  const analyses = useMemo(() => new Map((people ?? []).map((person) => [person.id, analyzePerson({ person: toLike(person), movements, months: 6, sharedIds })])), [people, movements, sharedIds]);
  const money = (value: number) => formatMoneyMajor(value, currency);
  const phrase = (pattern: string) => t(`people.phrase.${pattern}`);

  const chip = (text: string, active: boolean, onPress: () => void, key: string) => (
    <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} className="rounded-full border px-3 py-1.5" style={{ borderColor: active ? colors.accent : colors.border, backgroundColor: active ? colors.accentSoft : 'transparent' }}>
      <Text className="font-inter-medium text-sm text-gf-text">{text}</Text>
    </Pressable>
  );

  const create = async () => {
    setBusy(true);
    try {
      await sendWrite('general-data/people/new', {
        name: draft.name,
        relationship: draft.relationship,
        color: COLORS[(people?.length ?? 0) % COLORS.length],
        icon: 'md/MdFavorite',
        subCategories: draft.subs.map((sub) => t(`people.wiz.sub.${sub}`)),
        tagNames: draft.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        contact: { pattern: draft.pattern, days: draft.pattern === 'custom' ? draft.days : [], frequency: draft.frequency },
        limit: Number(draft.limitAmount) > 0 ? { amount: Number(draft.limitAmount), period: draft.limitPeriod } : null,
      });
      toast.show(t('people.wiz.created', { p1: draft.name }));
      setWizard(false);
      setDraft(NEW_DRAFT);
      setStep(0);
      await load();
      void reloadAfterWrite(dispatch);
    } catch (error) {
      toast.show(messageOf(error));
    } finally {
      setBusy(false);
    }
  };

  const call = async (path: string, body: Record<string, unknown>, okKey: string) => {
    try {
      await sendWrite(`general-data/people/${path}`, body);
      toast.show(t(okKey));
      await load();
      void reloadAfterWrite(dispatch);
      return true;
    } catch (error) {
      toast.show(messageOf(error));
      return false;
    }
  };

  const open = people?.find((person) => person.id === openId) ?? null;
  const analysis = open ? analyses.get(open.id) : null;
  const monthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <>
            <Text className="font-inter text-sm text-gf-text-muted">{t('people.wiz.q1Help')}</Text>
            <TextField label={t('people.wiz.name')} value={draft.name} onChangeText={(text) => setDraft({ ...draft, name: text })} placeholder={t('people.wiz.namePlaceholder')} maxLength={40} autoCapitalize="sentences" />
            <Text className="font-inter-medium text-sm text-gf-text-muted">{t('people.wiz.relationship')}</Text>
            <View className="flex-row flex-wrap gap-2">{RELATIONSHIPS.map((rel) => chip(t(`people.relationship.${rel}`), draft.relationship === rel, () => setDraft({ ...draft, relationship: rel }), rel))}</View>
          </>
        );
      case 1:
        return <View className="flex-row flex-wrap gap-2">{FREQUENCIES.map((value) => chip(t(`people.wiz.freq.${value}`), draft.frequency === value, () => setDraft({ ...draft, frequency: value }), value))}</View>;
      case 2:
        return (
          <>
            <Text className="font-inter text-sm text-gf-text-muted">{t('people.wiz.q3Help')}</Text>
            <View className="flex-row flex-wrap gap-2">{PATTERNS.map((value) => chip(t(`people.wiz.pattern.${value}`), draft.pattern === value, () => setDraft({ ...draft, pattern: value }), value))}</View>
            {draft.pattern === 'custom' && (
              <View className="flex-row flex-wrap gap-2">
                {WEEKDAYS.map((day) => chip(new Date(2026, 0, 4 + day).toLocaleDateString(locale, { weekday: 'short' }), draft.days.includes(day), () => setDraft({ ...draft, days: draft.days.includes(day) ? draft.days.filter((other) => other !== day) : [...draft.days, day] }), `d${day}`))}
              </View>
            )}
          </>
        );
      case 3:
        return (
          <>
            <Text className="font-inter text-sm text-gf-text-muted">{t('people.wiz.q4Help')}</Text>
            <View className="flex-row flex-wrap gap-2">{SUBS.map((sub) => chip(t(`people.wiz.sub.${sub}`), draft.subs.includes(sub), () => setDraft({ ...draft, subs: draft.subs.includes(sub) ? draft.subs.filter((other) => other !== sub) : [...draft.subs, sub] }), sub))}</View>
          </>
        );
      case 4:
        return (
          <>
            <Text className="font-inter text-sm text-gf-text-muted">{t('people.wiz.q5Help')}</Text>
            <TextField label={t('people.wiz.tags')} value={draft.tags} onChangeText={(text) => setDraft({ ...draft, tags: text })} />
          </>
        );
      default:
        return (
          <>
            <Text className="font-inter text-sm text-gf-text-muted">{t('people.wiz.q6Help')}</Text>
            <TextField label={t('people.wiz.limitAmount')} value={draft.limitAmount} onChangeText={(text) => setDraft({ ...draft, limitAmount: text.replace(/[^0-9.]/g, '') })} keyboardType="decimal-pad" placeholder="0.00" />
            <View className="flex-row gap-2">
              {chip(t('people.wiz.limitMonthly'), draft.limitPeriod === 'monthly', () => setDraft({ ...draft, limitPeriod: 'monthly' }), 'monthly')}
              {chip(t('people.wiz.limitMeeting'), draft.limitPeriod === 'per_meeting', () => setDraft({ ...draft, limitPeriod: 'per_meeting' }), 'meeting')}
            </View>
            <Text className="font-inter-bold text-[11px] uppercase text-gf-text-muted">{t('people.wiz.summary')}</Text>
            <Text className="font-inter text-sm text-gf-text">{draft.name} · {t(`people.relationship.${draft.relationship}`)} · {t(`people.wiz.freq.${draft.frequency}`)} · {phrase(draft.pattern)}</Text>
          </>
        );
    }
  };

  return (
    <Screen tutorial="m-people" title={t('people.title')} titleInfo={{ title: t('people.title'), text: t('people.help') }} subtitle={t('people.intro')} backLabel={t('mobile.mas')} onBack={back}>
      <TourTarget id="m-people-add"><GradientButton label={t('people.add')} onPress={() => { setDraft(NEW_DRAFT); setStep(0); setWizard(true); }} /></TourTarget>
      {people === null ? (
        <SkeletonRows count={3} />
      ) : people.length === 0 ? (
        <Card><Text className="font-inter text-sm text-gf-text-muted">{t('people.empty')}</Text></Card>
      ) : (
        people.map((person, index) => {
          const a = analyses.get(person.id);
          const spent = a?.monthly.find((month) => month.month === monthKey)?.total ?? 0;
          return (
            <Pressable key={person.id} accessibilityRole="button" onPress={() => { setOpenId(person.id); setRemoving(false); }}>
              <Card tour={index === 0 ? 'm-people-first' : undefined}>
                <View style={{ opacity: person.archived ? 0.6 : 1 }} className="gap-3">
                  <View className="flex-row items-center gap-3">
                    <View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: person.color || colors.accent }}>
                      <Text className="font-inter-bold text-base" style={{ color: '#ffffff' }}>{person.name.slice(0, 1).toUpperCase()}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-inter-semibold text-base text-gf-text" numberOfLines={1}>{person.name}</Text>
                      <Text className="font-inter text-xs text-gf-text-muted">{t(`people.relationship.${person.relationship}`)} · {t(`people.wiz.freq.${person.contact.frequency}`)}{person.archived ? ` · ${t('people.card.archived')}` : ''}</Text>
                    </View>
                  </View>
                  <View className="flex-row gap-3">
                    <View className="flex-1"><Text className="font-inter-bold text-[10px] uppercase text-gf-text-muted">{t('people.card.month')}</Text><Text className="font-inter-bold text-base text-gf-text">{money(spent)}</Text></View>
                    <View className="flex-1"><Text className="font-inter-bold text-[10px] uppercase text-gf-text-muted">{t('people.card.avgOuting')}</Text><Text className="font-inter-bold text-base text-gf-text">{money(a?.totals.avgPerOuting ?? 0)}</Text></View>
                  </View>
                  {a?.limit && (
                    <View className="gap-1">
                      <View className="h-2 overflow-hidden rounded-full bg-gf-surface"><View style={{ width: `${Math.min(100, a.limit.ratio * 100)}%`, height: '100%', borderRadius: 999, backgroundColor: a.limit.ratio >= 1 ? '#ef4444' : a.limit.ratio >= 0.8 ? '#f59e0b' : colors.accent }} /></View>
                      <Text className="font-inter text-xs text-gf-text-muted">{t('people.card.limit', { p1: money(a.limit.amount) })}</Text>
                    </View>
                  )}
                </View>
              </Card>
            </Pressable>
          );
        })
      )}

      <BottomSheet visible={wizard} onClose={() => setWizard(false)} maxHeight="88%">
        <View className="gap-1 px-6 pb-2 pt-5">
          <Text className="font-inter-bold text-xl text-gf-text">{t(`people.wiz.q${step + 1}`)}</Text>
          <Text className="font-inter text-xs text-gf-text-muted">{t('people.wiz.step', { p1: step + 1, p2: 6 })}</Text>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, gap: 12 }} keyboardShouldPersistTaps="handled">
          {renderStep()}
          <View className="flex-row gap-3 pt-2">
            <Pressable accessibilityRole="button" disabled={step === 0} onPress={() => setStep(step - 1)} className="flex-1 items-center rounded-full border border-gf-border py-3" style={{ opacity: step === 0 ? 0.4 : 1 }}>
              <Text className="font-inter-semibold text-base text-gf-text-muted">{t('people.wiz.back')}</Text>
            </Pressable>
            {step < 5 ? (
              <Pressable accessibilityRole="button" disabled={step === 0 && !draft.name.trim()} onPress={() => setStep(step + 1)} className="flex-1 items-center rounded-full py-3" style={{ backgroundColor: colors.accent, opacity: step === 0 && !draft.name.trim() ? 0.5 : 1 }}>
                <Text className="font-inter-semibold text-base" style={{ color: '#ffffff' }}>{t('people.wiz.next')}</Text>
              </Pressable>
            ) : (
              <Pressable accessibilityRole="button" disabled={busy || !draft.name.trim()} onPress={() => void create()} className="flex-1 items-center rounded-full py-3" style={{ backgroundColor: colors.accent, opacity: busy ? 0.6 : 1 }}>
                <Text className="font-inter-semibold text-base" style={{ color: '#ffffff' }}>{busy ? t('people.wiz.creating') : t('people.wiz.create')}</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </BottomSheet>

      <BottomSheet visible={open !== null && analysis !== null} onClose={() => setOpenId(null)} maxHeight="88%">
        {open && analysis && (
          <>
            <View className="px-6 pb-2 pt-5"><Text className="font-inter-bold text-xl text-gf-text">{open.name}</Text></View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, gap: 14 }}>
              {analysis.totals.count === 0 ? (
                <Text className="font-inter text-sm text-gf-text-muted">{t('people.detail.empty')}</Text>
              ) : (
                <>
                  <View className="flex-row flex-wrap gap-2">
                    {[
                      [t('people.detail.total'), money(analysis.totals.total)],
                      [t('people.detail.outings'), String(analysis.totals.outings)],
                      [t('people.detail.avgOuting'), money(analysis.totals.avgPerOuting)],
                      [t('people.detail.avgMonth'), money(analysis.totals.avgPerMonth)],
                      [t('people.detail.share'), `${Math.round(analysis.totals.shareOfSpending * 100)}%`],
                      [t('people.detail.trend'), analysis.totals.trendPct === null ? t('people.detail.trendNone') : `${analysis.totals.trendPct >= 0 ? '+' : ''}${Math.round(analysis.totals.trendPct)}%`],
                    ].map(([name, value]) => (
                      <View key={name} className="min-w-[46%] flex-1 rounded-2xl border border-gf-border p-3">
                        <Text className="font-inter-bold text-[10px] uppercase text-gf-text-muted">{name}</Text>
                        <Text className="font-inter-bold text-sm text-gf-text" numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
                      </View>
                    ))}
                  </View>

                  <Text className="font-inter-bold text-[11px] uppercase text-gf-text-muted">{t('people.detail.contact')}</Text>
                  <View style={{ height: 70 }} className="flex-row items-end gap-1.5">
                    {WEEKDAYS.map((day) => {
                      const peak = Math.max(1, ...analysis.contact.byWeekday);
                      return (
                        <View key={day} className="h-full flex-1 items-center justify-end gap-1">
                          <View style={{ width: '70%', maxWidth: 28, height: Math.max(2, (analysis.contact.byWeekday[day] / peak) * 40), borderTopLeftRadius: 5, borderTopRightRadius: 5, backgroundColor: '#ec4899', opacity: 0.8 }} />
                          <Text className="font-inter text-[10px] text-gf-text-muted">{new Date(2026, 0, 4 + day).toLocaleDateString(locale, { weekday: 'short' })}</Text>
                        </View>
                      );
                    })}
                  </View>
                  <Text className="font-inter text-xs text-gf-text-muted">
                    {analysis.contact.declared === 'match'
                      ? t('people.detail.contactMatch', { p1: phrase(open.contact.pattern) })
                      : analysis.contact.declared === 'different'
                        ? t('people.detail.contactDifferent', { p1: phrase(open.contact.pattern), p2: `${Math.round(analysis.contact.weekendShare * 100)}%` })
                        : t('people.detail.contactUnknown', { p1: `${Math.round(analysis.contact.weekendShare * 100)}%` })}{' '}
                    {t('people.detail.perWeek', { p1: analysis.contact.perWeek.toFixed(1) })}
                  </Text>

                  <Text className="font-inter-bold text-[11px] uppercase text-gf-text-muted">{t('people.detail.trigger')}</Text>
                  <Text className="font-inter text-sm text-gf-text">
                    {!analysis.trigger.enough || analysis.trigger.liftPct === null
                      ? t('people.detail.triggerNone', { p1: MIN_TRIGGER_DAYS })
                      : Math.abs(analysis.trigger.liftPct) < 5
                        ? t('people.detail.triggerSame')
                        : analysis.trigger.liftPct > 0
                          ? t('people.detail.triggerMore', { p1: `${Math.round(analysis.trigger.liftPct)}%` })
                          : t('people.detail.triggerLess', { p1: `${Math.round(Math.abs(analysis.trigger.liftPct))}%` })}
                  </Text>
                  <Text className="font-inter text-xs text-gf-text-muted">{t('people.detail.triggerNote')}</Text>

                  <Text className="font-inter-bold text-[11px] uppercase text-gf-text-muted">{t('people.detail.limit')}</Text>
                  {analysis.limit ? (
                    analysis.limit.period === 'monthly' ? (
                      <>
                        <Text className="font-inter text-sm text-gf-text">{t('people.detail.limitMonthly', { p1: money(analysis.limit.spent), p2: money(analysis.limit.amount), p3: `${Math.round(analysis.limit.ratio * 100)}%` })}</Text>
                        {analysis.limit.projected !== null && <Text className="font-inter text-xs text-gf-text-muted">{t('people.detail.limitProjected', { p1: money(analysis.limit.projected) })}</Text>}
                        {analysis.limit.outingsLeft !== null && <Text className="font-inter text-xs text-gf-text-muted">{t('people.detail.limitLeft', { p1: analysis.limit.outingsLeft })}</Text>}
                      </>
                    ) : (
                      <Text className="font-inter text-sm text-gf-text">{t('people.detail.limitMeeting', { p1: money(analysis.limit.spent), p2: money(analysis.limit.amount), p3: `${Math.round(analysis.limit.ratio * 100)}%` })}</Text>
                    )
                  ) : (
                    <Text className="font-inter text-xs text-gf-text-muted">{t('people.detail.limitNone')}</Text>
                  )}

                  <Text className="font-inter-bold text-[11px] uppercase text-gf-text-muted">{t('people.detail.subs')}</Text>
                  {analysis.subs.map((sub) => (
                    <View key={`${open.id}::${sub.id}`} className="flex-row items-center gap-2">
                      <Text className="w-28 font-inter text-xs text-gf-text" numberOfLines={1}>{sub.id === 'none' ? t('people.detail.noSub') : sub.name}</Text>
                      <View className="h-2 flex-1 overflow-hidden rounded-full bg-gf-surface"><View style={{ width: `${sub.share * 100}%`, height: '100%', backgroundColor: colors.accent, borderRadius: 999 }} /></View>
                      <Text className="w-24 text-right font-inter-semibold text-xs text-gf-text">{money(sub.total)}</Text>
                    </View>
                  ))}

                  <Text className="font-inter-bold text-[11px] uppercase text-gf-text-muted">{t('people.detail.movements')}</Text>
                  {analysis.movements.slice(0, 30).map((movement, index) => (
                    <Pressable key={`${movement.id}-${index}`} accessibilityRole="button" disabled={!movement.id} onPress={() => { setOpenId(null); router.push({ pathname: '/movements/[id]', params: { id: movement.id, returnTo: '/more/people' } }); }} className="flex-row items-center justify-between gap-3 border-t border-gf-border py-2.5">
                      <View className="flex-1">
                        <Text className="font-inter-medium text-sm text-gf-text" numberOfLines={1}>{movement.name}{movement.shared ? ` · ${t('people.detail.shared')}` : ''}</Text>
                        <Text className="font-inter text-xs text-gf-text-muted">{shortDate(new Date(movement.date), locale)}</Text>
                      </View>
                      <Text className="font-inter-semibold text-sm" style={{ color: colors.expense }}>{money(movement.amount)}</Text>
                    </Pressable>
                  ))}
                </>
              )}

              <View className="gap-2 border-t border-gf-border pt-3">
                {removing ? (
                  <>
                    <Text className="font-inter-semibold text-sm text-gf-text">{t('people.detail.removeAsk')}</Text>
                    <Text className="font-inter text-xs text-gf-text-muted">{t('people.detail.removeNote')}</Text>
                    <Pressable accessibilityRole="button" onPress={async () => { if (await call('remove', { id: open.id, deleteCategory: false }, 'people.detail.removed')) setOpenId(null); }} className="items-center rounded-full border border-gf-border py-2.5"><Text className="font-inter-semibold text-sm text-gf-text">{t('people.detail.removeKeep')}</Text></Pressable>
                    <Pressable accessibilityRole="button" onPress={async () => { if (await call('remove', { id: open.id, deleteCategory: true }, 'people.detail.removed')) setOpenId(null); }} className="items-center rounded-full border py-2.5" style={{ borderColor: '#ef4444' }}><Text className="font-inter-semibold text-sm" style={{ color: '#ef4444' }}>{t('people.detail.removeAll')}</Text></Pressable>
                  </>
                ) : (
                  <View className="flex-row gap-2">
                    <Pressable accessibilityRole="button" onPress={() => void call('update', { id: open.id, archived: !open.archived }, 'people.detail.saved')} className="rounded-full border border-gf-border px-4 py-2"><Text className="font-inter-semibold text-sm text-gf-text">{open.archived ? t('people.detail.restore') : t('people.detail.archive')}</Text></Pressable>
                    <Pressable accessibilityRole="button" onPress={() => setRemoving(true)} className="rounded-full border px-4 py-2" style={{ borderColor: '#ef4444' }}><Text className="font-inter-semibold text-sm" style={{ color: '#ef4444' }}>{t('people.detail.remove')}</Text></Pressable>
                  </View>
                )}
              </View>
            </ScrollView>
          </>
        )}
      </BottomSheet>
    </Screen>
  );
}
