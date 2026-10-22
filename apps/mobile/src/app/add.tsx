import { Ionicons } from '@expo/vector-icons';
import { useState, type ComponentProps } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { useDispatch } from 'react-redux';

import { AccountForm } from '@/components/forms/account-form';
import { BudgetForm } from '@/components/forms/budget-form';
import { CategoryForm } from '@/components/forms/category-form';
import { MovementForm } from '@/components/movement-form';
import { Screen } from '@/components/screen';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/toast';
import { TransferForm } from '@/components/transfer-form';
import { Colors } from '@/constants/theme';
import { reloadAfterWrite } from '@/hooks/use-load-app-data';
import { usePrimaryCurrency } from '@/hooks/use-primary-currency';
import { sendWrite } from '@/lib/write';
import type { AppDispatch } from '@/store';
import { CREATE_KIND_INFO, CREATE_KIND_SUMMARY, CREATE_SCREEN_INFO, type CreateKind } from '@/lib/create-info';
import { emptyBudgetValues } from '@gastify/core/budgets/budgetForm';

type Kind = CreateKind;
type IconName = ComponentProps<typeof Ionicons>['name'];

const KINDS: { value: Kind; label: string; icon: IconName }[] = [
  { value: 'expense', label: 'Gasto', icon: 'arrow-down-circle-outline' },
  { value: 'income', label: 'Ingreso', icon: 'arrow-up-circle-outline' },
  { value: 'transfer', label: 'Transferir', icon: 'swap-horizontal-outline' },
  { value: 'account', label: 'Cuenta', icon: 'wallet-outline' },
  { value: 'category', label: 'Categoría', icon: 'pricetag-outline' },
  { value: 'budget', label: 'Presupuesto', icon: 'pie-chart-outline' },
  { value: 'saving', label: 'Ahorro', icon: 'cash-outline' },
  { value: 'project', label: 'Proyecto', icon: 'airplane-outline' },
];

// The "+" of the bottom bar: a quick way to create anything, not only movements. Pick what to create
// and its form appears below; what is saved goes to the same API routes the web uses.
export default function AddScreen() {
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
            submitLabel="Guardar movimiento"
            onSubmit={async (body) => {
              await sendWrite('general-data/transactions/new-transaction', body);
              done(kind === 'income' ? 'Ingreso guardado' : 'Gasto guardado');
            }}
          />
        );
      case 'transfer':
        return (
          <TransferForm
            key={`transfer-${round}`}
            onSubmit={async (body) => {
              await sendWrite('general-data/transactions/transfer', body);
              done('Transferencia guardada');
            }}
          />
        );
      case 'account':
        return (
          <AccountForm
            key={`account-${round}`}
            submitLabel="Crear cuenta"
            onSubmit={async (values) => {
              await sendWrite('general-data/accounts/new-account', values);
              done('Cuenta creada');
            }}
          />
        );
      case 'category':
        return (
          <CategoryForm
            key={`category-${round}`}
            submitLabel="Crear categoría"
            onSubmit={async (values) => {
              await sendWrite('general-data/categories/new-category', values);
              done('Categoría creada');
            }}
          />
        );
      default:
        return (
          <BudgetForm
            key={`${kind}-${round}`}
            initial={emptyBudgetValues(kind === 'budget' ? 'spending' : kind, currency)}
            submitLabel="Crear"
            onSubmit={async (body) => {
              await sendWrite('general-data/budget/new', body);
              done(kind === 'saving' ? 'Meta de ahorro creada' : kind === 'project' ? 'Proyecto creado' : 'Presupuesto creado');
            }}
          />
        );
    }
  };

  return (
    <Screen title="Crear" subtitle="Elige qué quieres agregar." titleInfo={CREATE_SCREEN_INFO}>
      <View className="flex-row flex-wrap gap-2">
        {KINDS.map((item) => {
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
      <Card title={KINDS.find((item) => item.value === kind)?.label ?? ''} info={CREATE_KIND_INFO[kind]}>
        <Text className="font-inter text-sm text-gf-text-muted">{CREATE_KIND_SUMMARY[kind]}</Text>
      </Card>
      <View>{form()}</View>
    </Screen>
  );
}
