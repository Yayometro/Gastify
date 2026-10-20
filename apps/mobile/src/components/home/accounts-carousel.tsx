import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { GlassSurface } from '@/components/ui/glass';
import type { AccountData } from '@gastify/core/features/accountsSlice';
import { ACCOUNT_TYPES } from '@gastify/core/accounts/accountForm';
import { idOf } from '@gastify/core/categories/categoryForm';
import { formatMoneyMajor } from '@gastify/core/money/currencies';

const TYPE_LABEL: Record<string, string> = Object.fromEntries(ACCOUNT_TYPES.map((type) => [type.value, type.label]));
const TYPE_COLOR: Record<string, string> = { debit: '#3b82f6', credit: '#a855f7', savings: '#22c55e', cash: '#f59e0b' };

// The accounts as cards you swipe through, like the web's account cards. Tap one to edit it.
export function AccountsCarousel({ accounts, primary }: { accounts: AccountData[]; primary: string }) {
  if (accounts.length === 0) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 8 }} className="-mx-6" style={{ flexGrow: 0 }}>
      <View style={{ width: 12 }} />
      {accounts.map((account) => {
        const type = account.accountType ?? 'debit';
        return (
          <Pressable
            key={idOf(account)}
            accessibilityRole="button"
            accessibilityLabel={`Cuenta ${account.name}`}
            onPress={() => router.push({ pathname: '/more/accounts/[id]', params: { id: idOf(account) } })}>
            <GlassSurface radius={22} style={{ width: 210, padding: 16, gap: 18 }}>
              <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, backgroundColor: TYPE_COLOR[type] ?? '#7e22ce' }} />
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 font-inter-semibold text-base text-gf-text" numberOfLines={1}>{account.name}</Text>
                <Text className="font-inter-medium text-xs text-gf-text-muted">{account.currency || primary}</Text>
              </View>
              <View>
                <Text className="font-inter-bold text-2xl text-gf-text" numberOfLines={1} adjustsFontSizeToFit>{formatMoneyMajor(account.amount ?? 0, account.currency || primary)}</Text>
                <Text className="font-inter text-xs text-gf-text-muted">{[TYPE_LABEL[type] ?? type, account.institution].filter(Boolean).join(' · ')}</Text>
              </View>
            </GlassSurface>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
