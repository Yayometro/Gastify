import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { BankBadge } from '@/components/bank-badge';
import { CardPattern } from '@/components/account-card-pattern';
import { cardPalette } from '@/lib/account-card-style';
import { bankById, formatCardNumber } from '@gastify/core/banks/banks';

import type { AccountActivity } from '@gastify/core/accounts/accountActivity';
import { accountGradient } from '@gastify/core/accounts/accountActivity';
import { ACCOUNT_TYPES } from '@gastify/core/accounts/accountForm';
import { DEFAULT_CARD_PATTERN } from '@gastify/core/accounts/cardStyle';
import { idOf } from '@gastify/core/categories/categoryForm';
import type { AccountData } from '@gastify/core/features/accountsSlice';
import { formatMoneyMajor } from '@gastify/core/money/currencies';

const TYPE_LABEL: Record<string, string> = Object.fromEntries(ACCOUNT_TYPES.map((type) => [type.value, type.label]));

export const ACCOUNT_CARD_WIDTH = 300;

// An account drawn like a credit card, as on the web: a color (the one saved on the account, or the one the app picks
// from it), a pattern over it, its name, the balance in its own currency, what that is worth in the main currency, and
// what came in and went out in the period shown. The text takes its color from the card, so it always reads.
export function AccountCard({
  account,
  primary,
  activity,
  rate,
  onPress,
  onEdit,
  width,
}: {
  account: AccountData;
  primary: string;
  activity?: AccountActivity;
  rate?: number;
  onPress?: () => void;
  // The pencil in the card's corner: opens the account's edition under the card.
  onEdit?: () => void;
  width?: number | undefined;
}) {
  const [reveal, setReveal] = useState(false);
  const bank = bankById(account.bankId);
  const id = idOf(account);
  const { stops, ink, tint, light } = cardPalette(account.cardColor, accountGradient(id || account.name || 'cuenta'));
  const up = light ? '#15803d' : '#86efac';
  const down = light ? '#be123c' : '#fda4af';
  const code = account.currency || primary;
  const balance = account.amount ?? 0;
  const equivalent = code !== primary && rate ? balance * rate : null;
  const type = account.accountType ?? 'debit';
  const money = (value: number) => formatMoneyMajor(value, code, { showCode: false });

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Cuenta ${account.name}`} onPress={onPress} disabled={!onPress} style={{ width: width ?? '100%' }}>
      <LinearGradient
        colors={stops as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          { borderRadius: 26, padding: 18, minHeight: 190, justifyContent: 'space-between', overflow: 'hidden' },
          light ? { borderWidth: 1, borderColor: 'rgba(17,24,39,0.12)' } : null,
          Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } }, default: { elevation: 8 } }),
        ]}>
        <CardPattern pattern={account.cardPattern ?? DEFAULT_CARD_PATTERN} tint={tint} />
        <View className="flex-row items-center justify-between gap-3">
          {account.bankId ? <BankBadge bankId={account.bankId} size={44} /> : null}
          <Text className="flex-1 font-inter-semibold text-lg" numberOfLines={1} style={{ color: ink }}>{account.name || 'Cuenta'}</Text>
          <View style={{ backgroundColor: tint(0.22), borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text className="font-inter-medium text-[11px]" style={{ color: ink }}>{TYPE_LABEL[type] ?? type}</Text>
          </View>
          {onEdit ? (
            <Pressable accessibilityRole="button" accessibilityLabel={`Editar ${account.name || 'la cuenta'}`} onPress={onEdit} hitSlop={10} style={{ backgroundColor: tint(0.22), borderRadius: 12, padding: 6 }}>
              <Ionicons name="pencil" size={15} color={ink} />
            </Pressable>
          ) : null}
        </View>
        <View>
          <Text className="font-inter-medium text-xs" style={{ color: tint(0.8) }}>{code}{bank ? ` · ${bank.name}` : account.institution ? ` · ${account.institution}` : ''}</Text>
          <Text className="font-inter-bold text-3xl" numberOfLines={1} adjustsFontSizeToFit style={{ color: ink }}>{money(balance)}</Text>
          {equivalent !== null && (
            <Text className="font-inter text-xs" style={{ color: tint(0.85) }}>≈ {formatMoneyMajor(equivalent, primary, { showCode: false })} {primary}</Text>
          )}
        </View>
        {account.cardNumber ? (
          <Pressable accessibilityRole="button" accessibilityLabel={reveal ? 'Ocultar el número' : 'Mostrar el número'} onPress={() => setReveal((value) => !value)} hitSlop={8} className="flex-row items-center gap-2 self-start">
            <Text className="font-inter-medium text-sm" style={{ color: tint(0.92), letterSpacing: 1 }}>{formatCardNumber(account.cardNumber, reveal)}</Text>
            <Ionicons name={reveal ? 'eye-off-outline' : 'eye-outline'} size={18} color={tint(0.9)} />
          </Pressable>
        ) : null}
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-row items-center gap-1">
            <Ionicons name="arrow-up-circle" size={18} color={up} />
            <Text className="font-inter-semibold text-sm" numberOfLines={1} style={{ color: ink }}>{money(activity?.incomes ?? 0)}</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Ionicons name="arrow-down-circle" size={18} color={down} />
            <Text className="font-inter-semibold text-sm" numberOfLines={1} style={{ color: ink }}>{money(activity?.spending ?? 0)}</Text>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}
