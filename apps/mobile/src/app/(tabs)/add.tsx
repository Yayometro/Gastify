import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { useDispatch } from 'react-redux';

import { AccountForm } from '@/components/forms/account-form';
import { BudgetForm } from '@/components/forms/budget-form';
import { CategoryForm } from '@/components/forms/category-form';
import { MovementForm } from '@/components/movement-form';
import { Screen } from '@/components/screen';
import type { MobileComponentTourId } from '@gastify/core/tour/mobileSteps';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/toast';
import { TransferForm } from '@/components/transfer-form';
import { Colors } from '@/constants/theme';
import { reloadAfterWrite } from '@/hooks/use-load-app-data';
import { usePrimaryCurrency } from '@/hooks/use-primary-currency';
import { sendWrite } from '@/lib/write';
import type { AppDispatch } from '@/store';
import { type CreateKind } from '@gastify/core/info/createInfo';
import { emptyBudgetValues } from '@gastify/core/budgets/budgetForm';
import { useT, useInfo } from "@/i18n/client";
import type { TranslateFn } from "@gastify/core/i18n/translate";

type Kind = CreateKind;
type IconName = ComponentProps<typeof Ionicons>['name'];

// The tutorial of the form that is open: the title's compass explains it.
const FORM_TOUR: Record<Kind, MobileComponentTourId> = {
  expense: 'm-movform',
  income: 'm-movform',
  transfer: 'm-transferform',
  account: 'm-accform',
  category: 'm-catform',
  budget: 'm-budform',
  saving: 'm-budform',
  project: 'm-budform',
};

const KINDS = (t: TranslateFn): { value: Kind; label: string; icon: IconName }[] => ([
  { value: 'expense', label: t("mobile.gasto"), icon: 'arrow-down-circle-outline' },
  { value: 'income', label: t("mobile.ingreso"), icon: 'arrow-up-circle-outline' },
  { value: 'transfer', label: t("mobile.transferir"), icon: 'swap-horizontal-outline' },
  { value: 'account', label: t("mobile.cuenta"), icon: 'wallet-outline' },
  { value: 'category', label: t("mobile.categoria"), icon: 'pricetag-outline' },
  { value: 'budget', label: t("mobile.presupuesto"), icon: 'pie-chart-outline' },
  { value: 'saving', label: t("mobile.ahorro"), icon: 'cash-outline' },
  { value: 'project', label: t("mobile.proyecto"), icon: 'airplane-outline' },
]);

// The "+" of the bottom bar: a quick way to create anything, not only movements. Pick what to create
// and its form appears below; what is saved goes to the same API routes the web uses.
export default function AddScreen() {
  const { CREATE_KIND_INFO, CREATE_KIND_SUMMARY } = useInfo();
  const t = useT();
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const currency = usePrimaryCurrency();
  const [kind, setKind] = useState<Kind>('expense');
  const [round, setRound] = useState(0);

  const done = (message: string) => {
    toast.show(message);
    setRound((n) => n + 1);
    reloadAfterWrite(dispatch);
  };

  const form = () => {
    switch (kind) {
      case 'expense':
      case 'income':
        return (
          <MovementForm
            key={`${kind}-${round}`}
            hideType
            type={kind}
            allowRecurring
            submitLabel={t("mobile.guardar.movimiento")}
            onSubmit={async (body, recurring) => {
              const created = await sendWrite<{ _id?: string; date?: string }>('general-data/transactions/new-transaction', body);
              if (recurring) {
                try {
                  await sendWrite('general-data/recurring/new', {
                    name: body.name,
                    amount: body.amount,
                    account: body.account || null,
                    category: body.category || null,
                    subCategory: body.subCategory || null,
                    budget: body.budget || null,
                    tags: body.tags,
                    frequency: recurring.frequency,
                    isVariable: recurring.isVariable,
                    anchorDate: created?.date || body.date,
                    sourceTransactionId: created?._id,
                  });
                } catch {
                  toast.show(t('movements.new.recurringError'));
                }
              }
              done(kind === 'income' ? t("mobile.ingreso.guardado") : t("mobile.gasto.guardado"));
            }}
          />
        );
      case 'transfer':
        return (
          <TransferForm
            key={`transfer-${round}`}
            onSubmit={async (body) => {
              await sendWrite('general-data/transactions/transfer', body);
              done(t("mobile.transferencia.guardada"));
            }}
          />
        );
      case 'account':
        return (
          <AccountForm
            key={`account-${round}`}
            submitLabel={t("mobile.crear.cuenta")}
            onSubmit={async (values) => {
              await sendWrite('general-data/accounts/new-account', values);
              done(t("mobile.cuenta.creada"));
            }}
          />
        );
      case 'category':
        return (
          <CategoryForm
            key={`category-${round}`}
            submitLabel={t("mobile.crear.categoria")}
            onSubmit={async (values) => {
              await sendWrite('general-data/categories/new-category', values);
              done(t("mobile.categoria.creada"));
            }}
          />
        );
      default:
        return (
          <BudgetForm
            key={`${kind}-${round}`}
            initial={emptyBudgetValues(kind === 'budget' ? 'spending' : kind, currency)}
            submitLabel={t("mobile.crear")}
            onSubmit={async (body) => {
              await sendWrite('general-data/budget/new', body);
              done(kind === 'saving' ? t("mobile.meta.de.ahorro.creada") : kind === 'project' ? t("mobile.proyecto.creado") : t("mobile.presupuesto.creado"));
            }}
          />
        );
    }
  };

  return (
    <Screen tutorial={FORM_TOUR[kind]} title={t("mobile.crear")} subtitle={t("mobile.elige.que.quieres.agregar")}>
      {/* The same import as in Movimientos and on the web's Crear button: the Excel template, filled and uploaded. */}
      <Pressable accessibilityRole="button" onPress={() => router.push('/movements/import')} className="flex-row items-center justify-center gap-2 rounded-full py-3" style={{ backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.border }}>
        <Ionicons name="document-attach-outline" size={18} color={colors.accent} />
        <Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>{t("mobile.importar.desde.excel")}</Text>
      </Pressable>
      <View className="flex-row flex-wrap gap-2">
        {KINDS(t).map((item) => {
          const selected = item.value === kind;
          return (
            <Pressable
              key={item.value}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => setKind(item.value)}
              className="items-center gap-1 rounded-2xl border px-1 py-2.5"
              style={{
                width: '23.5%',
                borderColor: selected ? colors.accent : colors.border,
                backgroundColor: selected ? colors.accentSoft : colors.backgroundElement,
              }}>
              <Ionicons name={item.icon} size={24} color={selected ? colors.accent : colors.text} />
              <Text className="font-inter-medium text-xs" style={{ color: selected ? colors.accent : colors.text }} numberOfLines={1}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Card title={KINDS(t).find((item) => item.value === kind)?.label ?? ''} info={CREATE_KIND_INFO[kind]}>
        <Text className="font-inter text-sm text-gf-text-muted">{CREATE_KIND_SUMMARY[kind]}</Text>
      </Card>
      <View>{form()}</View>
    </Screen>
  );
}
