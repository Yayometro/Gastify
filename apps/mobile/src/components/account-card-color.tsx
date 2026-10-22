import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { useDispatch } from 'react-redux';

import { CardPattern } from '@/components/account-card-pattern';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/toast';
import { Colors } from '@/constants/theme';
import { reloadAfterWrite } from '@/hooks/use-load-app-data';
import { cardPalette, isLightColor } from '@/lib/account-card-style';
import { messageOf, sendWrite } from '@/lib/write';
import type { AppDispatch } from '@/store';
import { accountGradient } from '@gastify/core/accounts/accountActivity';
import { CARD_COLORS, CARD_PATTERNS, DEFAULT_CARD_COLOR, DEFAULT_CARD_PATTERN, type CardColorGroup } from '@gastify/core/accounts/cardStyle';
import { idOf } from '@gastify/core/categories/categoryForm';
import type { AccountData } from '@gastify/core/features/accountsSlice';

const INFO = {
  title: 'Color y patrón de la tarjeta',
  text: 'Elige cómo se ve esta tarjeta. «Automática» es el color que la app le asigna a la cuenta. Los demás son colores fijos, agrupados por familia, y el texto de la tarjeta cambia solo para leerse bien: oscuro sobre los claros, claro sobre los oscuros. El patrón es el dibujo de fondo: círculos, puntos, rayas, cuadrícula, ondas o liso. Todo se guarda en la cuenta: lo verás igual en todos tus dispositivos y en la web.',
};

// The groups in the order they are listed.
const GROUPS = Array.from(new Set(CARD_COLORS.map((option) => option.group))) as CardColorGroup[];

// The color and the pattern of one account's card. Each choice is saved on the account at once and redraws the card here
// and everywhere it shows; if the save fails, the choice goes back and the reason is shown.
export function CardColorPicker({ account }: { account: AccountData }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const id = idOf(account);
  const [color, setColor] = useState(account.cardColor ?? DEFAULT_CARD_COLOR);
  const [pattern, setPattern] = useState(account.cardPattern ?? DEFAULT_CARD_PATTERN);
  const [autoFrom, autoTo] = accountGradient(id || 'cuenta');

  // The account is the source of truth: when it reloads (here or on another device's change), the picker follows it.
  useEffect(() => {
    setColor(account.cardColor ?? DEFAULT_CARD_COLOR);
    setPattern(account.cardPattern ?? DEFAULT_CARD_PATTERN);
  }, [account.cardColor, account.cardPattern]);

  const save = async (next: { cardColor?: string; cardPattern?: string }) => {
    const previous = { color, pattern };
    if (next.cardColor !== undefined) setColor(next.cardColor);
    if (next.cardPattern !== undefined) setPattern(next.cardPattern);
    try {
      await sendWrite('general-data/accounts/update-account', { accountId: id, ...next });
      reloadAfterWrite(dispatch);
    } catch (error) {
      setColor(previous.color);
      setPattern(previous.pattern);
      toast.show(messageOf(error), 'error');
    }
  };

  const palette = cardPalette(color, [autoFrom, autoTo]);

  return (
    <Card title="Color y patrón" info={INFO}>
      {GROUPS.map((group) => (
        <View key={group} className="gap-2">
          <Text className="font-inter-medium text-xs uppercase text-gf-text-muted">{group}</Text>
          <View className="flex-row flex-wrap gap-2.5">
            {group === 'Neutros' && (
              <Swatch selected={color === DEFAULT_CARD_COLOR} label="Automática" stops={[autoFrom, autoTo]} onPress={() => save({ cardColor: DEFAULT_CARD_COLOR })} accent={colors.accent} border={colors.border} text={colors.text} />
            )}
            {CARD_COLORS.filter((option) => option.group === group).map((option) => (
              <Swatch key={option.id} selected={color === option.id} label={option.label} stops={option.stops} onPress={() => save({ cardColor: option.id })} accent={colors.accent} border={colors.border} text={colors.text} />
            ))}
          </View>
        </View>
      ))}

      <View className="gap-2">
        <Text className="font-inter-medium text-xs uppercase text-gf-text-muted">Patrón</Text>
        <View className="flex-row flex-wrap gap-2.5">
          {CARD_PATTERNS.map((option) => {
            const selected = pattern === option.id;
            return (
              <Pressable key={option.id} accessibilityRole="radio" accessibilityLabel={`Patrón ${option.label.toLowerCase()}`} accessibilityState={{ checked: selected }} onPress={() => save({ cardPattern: option.id })} className="gap-1" style={{ width: 84 }}>
                <View style={{ height: 56, borderRadius: 14, overflow: 'hidden', borderWidth: selected ? 3 : 1, borderColor: selected ? colors.accent : colors.border }}>
                  <LinearGradient colors={palette.stops as [string, string, ...string[]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
                  <CardPattern pattern={option.id} tint={palette.tint} />
                </View>
                <Text className="font-inter-medium text-xs text-center" numberOfLines={1} style={{ color: selected ? colors.accent : colors.text }}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </Card>
  );
}

function Swatch({ selected, label, stops, onPress, accent, border, text }: { selected: boolean; label: string; stops: string[]; onPress: () => void; accent: string; border: string; text: string }) {
  const light = isLightColor(stops[0]);
  return (
    <Pressable accessibilityRole="radio" accessibilityLabel={`Tarjeta ${label.toLowerCase()}`} accessibilityState={{ checked: selected }} onPress={onPress} className="items-center gap-1" style={{ width: 62 }}>
      <View className="items-center justify-center rounded-xl" style={{ width: 48, height: 48, borderWidth: selected ? 3 : 1, borderColor: selected ? accent : border, overflow: 'hidden' }}>
        <LinearGradient colors={stops as [string, string, ...string[]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
        {selected ? <Ionicons name="checkmark" size={20} color={light ? '#111827' : '#ffffff'} /> : null}
      </View>
      <Text className="font-inter-medium text-[11px] text-center" numberOfLines={1} style={{ color: selected ? accent : text }}>{label}</Text>
    </Pressable>
  );
}
