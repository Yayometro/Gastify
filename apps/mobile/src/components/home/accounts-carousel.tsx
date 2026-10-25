import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { ACCOUNT_CARD_WIDTH, AccountCard } from '@/components/account-card';
import type { AccountActivity } from '@gastify/core/accounts/accountActivity';
import { idOf } from '@gastify/core/categories/categoryForm';
import type { AccountData } from '@gastify/core/features/accountsSlice';
import type { RatesToPrimary } from '@gastify/core/transformers/budgetCurrency';

// The accounts as credit cards you swipe through, like the web's. Each card stops at the left edge; tap one to open it.
export function AccountsCarousel({
  accounts,
  primary,
  activity = {},
  rates = {},
}: {
  accounts: AccountData[];
  primary: string;
  activity?: Record<string, AccountActivity>;
  rates?: RatesToPrimary;
}) {
  if (accounts.length === 0) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={ACCOUNT_CARD_WIDTH + 12}
      decelerationRate="fast"
      contentContainerStyle={{ gap: 12, paddingHorizontal: 24, paddingVertical: 6 }}
      className="-mx-6"
      style={{ flexGrow: 0 }}>
      {accounts.map((account) => (
        <View key={idOf(account)}>
          <AccountCard
            account={account}
            primary={primary}
            width={ACCOUNT_CARD_WIDTH}
            activity={activity[idOf(account)]}
            rate={rates[account.currency ?? '']}
            onPress={() => router.navigate({ pathname: '/more/accounts/[id]', params: { id: idOf(account), returnTo: '/' } })}
          />
        </View>
      ))}
    </ScrollView>
  );
}
