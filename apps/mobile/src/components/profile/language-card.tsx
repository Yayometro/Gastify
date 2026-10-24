import { Pressable, Text, View } from 'react-native';

import { useLocale, useSetLocale, useT } from '@/i18n/client';
import { Card } from '@/components/ui/card';
import { LOCALES, type Locale } from '@gastify/core/i18n/locales';

// The language names are written in their own language, so each one is readable from anywhere.
const NAMES: Record<Locale, string> = { es: 'Español', en: 'English' };

// The app's language: the two options, the one in use marked. The choice is kept on this device.
export function LanguageCard() {
  const t = useT();
  const locale = useLocale();
  const setLocale = useSetLocale();
  return (
    <Card title={t('mobile.idioma')}>
      <View className="flex-row gap-2">
        {LOCALES.map((item) => {
          const active = item === locale;
          return (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setLocale(item)}
              className={`flex-1 items-center rounded-full border border-gf-border py-2 ${active ? 'bg-purple-600' : 'bg-gf-surface'}`}>
              <Text className={`font-inter-semibold text-sm ${active ? 'text-white' : 'text-gf-text'}`}>{NAMES[item]}</Text>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}
