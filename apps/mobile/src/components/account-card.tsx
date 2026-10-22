import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { BankBadge } from '@/components/bank-badge';
import { formatCardNumber } from '@gastify/core/banks/banks';

import type { AccountActivity } from '@gastify/core/accounts/accountActivity';
import { accountGradient } from '@gastify/core/accounts/accountActivity';
import { ACCOUNT_TYPES } from '@gastify/core/accounts/accountForm';
import { idOf } from '@gastify/core/categories/categoryForm';
import type { AccountData } from '@gastify/core/features/accountsSlice';
import { formatMoneyMajor } from '@gastify/core/money/currencies';

const TYPE_LABEL: Record<string, string> = Object.fromEntries(ACCOUNT_TYPES.map((type) => [type.value, type.label]));

export const ACCOUNT_CARD_WIDTH = 300;

// An account drawn like a credit card, as on the web: a gradient (always the same one for the same account), its
// name, the balance in its own currency, what that is worth in the main currency, and what came in and went out in
// the period shown.
export function AccountCard({
  account,
  primary,
  activity,
  rate,
  onPress,
  width,
}: {
  account: AccountData;
  primary: string;
  activity?: AccountActivity;
  rate?: number;
  onPress?: () => void;
  width?: number | undefined;
}) {
  const [reveal, setReveal] = useState(false);
  const [from, to] = accountGradient(idOf(account) || account.name || 'cuenta');
  const code = account.currency || primary;
  const balance = account.amount ?? 0;
  const equivalent = code !== primary && rate ? balance * rate : null;
  const type = account.accountType ?? 'debit';
  const money = (value: number) => formatMoneyMajor(value, code, { showCode: false });

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Cuenta ${account.name}`} onPress={onPress} disabled={!onPress} style={{ width: width ?? '100%' }}>
      <LinearGradient
        colors={[from, to]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          { borderRadius: 26, padding: 18, minHeight: 190, justifyContent: 'space-between', overflow: 'hidden' },
          Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } }, default: { elevation: 8 } }),
        ]}>
        <View pointerEvents="none" style={{ position: 'absolute', right: -40, top: -40, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.12)' }} />
        <View pointerEvents="none" style={{ position: 'absolute', right: 30, bottom: -60, width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.08)' }} />
        <View className="flex-row items-center justify-between gap-3">
          {account.bankId ? <BankBadge bankId={account.bankId} size={34} /> : null}
          <Text className="flex-1 font-inter-semibold text-lg" numberOfLines={1} style={{ color: '#ffffff' }}>{account.name || 'Cuenta'}</Text>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text className="font-inter-medium text-[11px]" style={{ color: '#ffffff' }}>{TYPE_LABEL[type] ?? type}</Text>
          </View>
        </View>
        <View>
          <Text className="font-inter-medium text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>{code}{account.institution ? ` · ${account.institution}` : ''}</Text>
          <Text className="font-inter-bold text-3xl" numberOfLines={1} adjustsFontSizeToFit style={{ color: '#ffffff' }}>{money(balance)}</Text>
          {equivalent !== null && (
            <Text className="font-inter text-xs" style={{ color: 'rgba(255,255,255,0.85)' }}>≈ {formatMoneyMajor(equivalent, primary, { showCode: false })} {primary}</Text>
          )}
        </View>
        {account.cardNumber ? (
          <Pressable accessibilityRole="button" accessibilityLabel={reveal ? 'Ocultar el número' : 'Mostrar el número'} onPress={() => setReveal((value) => !value)} hitSlop={8} className="flex-row items-center gap-2 self-start">
            <Text className="font-inter-medium text-sm" style={{ color: 'rgba(255,255,255,0.92)', letterSpacing: 1 }}>{formatCardNumber(account.cardNumber, reveal)}</Text>
            <Ionicons name={reveal ? 'eye-off-outline' : 'eye-outline'} size={18} color="rgba(255,255,255,0.9)" />
          </Pressable>
        ) : null}
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-row items-center gap-1">
            <Ionicons name="arrow-up-circle" size={18} color="#86efac" />
            <Text className="font-inter-semibold text-sm" numberOfLines={1} style={{ color: '#ffffff' }}>{money(activity?.incomes ?? 0)}</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Ionicons name="arrow-down-circle" size={18} color="#fda4af" />
            <Text className="font-inter-semibold text-sm" numberOfLines={1} style={{ color: '#ffffff' }}>{money(activity?.spending ?? 0)}</Text>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}
