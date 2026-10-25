import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { BANK_LOGOS } from '@/lib/bank-logos';
import { bankById } from '@gastify/core/banks/banks';

// A bank's mark in a round tile: its logo when the app has it, otherwise its initials on its brand color. Every bank
// gets the same size and shape so a list of them reads evenly.
export function BankBadge({ bankId, size = 36 }: { bankId?: string | null; size?: number }) {
  const bank = bankById(bankId);
  if (!bank) return null;
  const logo = BANK_LOGOS[bank.id];
  return (
    <View
      accessibilityLabel={bank.name}
      style={{ width: size, height: size, borderRadius: size * 0.28, backgroundColor: logo ? '#ffffff' : bank.color, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' }}>
      {logo ? (
        <Image source={logo} alt={bank.name} style={{ width: size * 0.86, height: size * 0.86 }} contentFit="contain" />
      ) : (
        <Text className="font-inter-bold" numberOfLines={1} adjustsFontSizeToFit style={{ color: '#ffffff', fontSize: Math.max(9, size * 0.3), paddingHorizontal: 2 }}>{bank.short}</Text>
      )}
    </View>
  );
}
