import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View, useColorScheme } from 'react-native';

import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { CARD_STYLES, setAccountCardStyle, useAccountCardStyle, type CardStyleId } from '@/lib/account-card-style';
import { accountGradient } from '@gastify/core/accounts/accountActivity';

const INFO = {
  title: 'Color de la tarjeta',
  text: 'Elige cómo se ve esta tarjeta. «Automática» es el color que la app le asigna a la cuenta. Las demás son una lista fija de colores, para que todas las tarjetas se vean como tarjetas de Gastify. El texto de cada tarjeta cambia solo para leerse bien: oscuro sobre blanca y ámbar, claro sobre las demás. El cambio se ve en Inicio, en Cuentas y en esta pantalla. Se guarda en este teléfono.',
};

// The choice of color for one account's card: a swatch per option, the one in use marked. Changing it redraws the card
// at once, here and everywhere the card shows.
export function CardColorPicker({ accountId }: { accountId: string }) {
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const current = useAccountCardStyle(accountId);
  const [autoFrom, autoTo] = accountGradient(accountId || 'cuenta');

  const choose = (style: CardStyleId) => {
    if (style !== current) void setAccountCardStyle(accountId, style);
  };

  return (
    <Card title="Color de la tarjeta" info={INFO}>
      <View className="flex-row flex-wrap gap-3">
        {CARD_STYLES.map((option) => {
          const selected = option.id === current;
          const from = option.from ?? autoFrom;
          const to = option.to ?? autoTo;
          return (
            <Pressable key={option.id} accessibilityRole="radio" accessibilityLabel={`Tarjeta ${option.label.toLowerCase()}`} accessibilityState={{ checked: selected }} onPress={() => choose(option.id)} className="items-center gap-1.5" style={{ width: 72 }}>
              <View
                className="items-center justify-center rounded-2xl"
                style={{ width: 56, height: 56, borderWidth: selected ? 3 : 1, borderColor: selected ? colors.accent : colors.border, overflow: 'hidden' }}>
                <LinearGradient colors={[from, to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
                {selected ? <Ionicons name="checkmark" size={22} color={option.id === 'white' || option.id === 'amber' ? '#111827' : '#ffffff'} /> : null}
              </View>
              <Text className="font-inter-medium text-xs text-center" numberOfLines={1} style={{ color: selected ? colors.accent : colors.text }}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}
