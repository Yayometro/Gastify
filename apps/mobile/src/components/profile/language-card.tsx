import { Pressable, Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { useAccountLanguage, useT } from '@/i18n/client';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/toast';
import { messageOf, sendWrite } from '@/lib/write';
import type { AppDispatch, RootState } from '@/store';
import { LOCALES, type Locale } from '@gastify/core/i18n/locales';
import { updateUser, type UserData } from '@gastify/core/features/userSlice';

// The language names are written in their own language, so each one is readable from anywhere.

// The app's language, in the profile: automatic (where the phone says the person is), or one of ours. The choice is saved on
// the account, so it follows the person to every device.
export function LanguageCard() {
  const t = useT();
  // The names are the language's own name for the language, in the language on screen (Spanish reads "Spanish" in English).
  const NAMES: Record<Locale, string> = { es: t("common.languageSpanish"), en: 'English' };
  const account = useAccountLanguage();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.userReducer.data);
  const toast = useToast();

  const choose = async (choice: Locale | null) => {
    if (choice === account) return;
    try {
      const updated = await sendWrite<UserData | null>('general-data/user/update-user', { language: choice });
      // The server answers with the whole account; if it does not, the account we have keeps everything else.
      dispatch(updateUser(updated && typeof updated === 'object' ? updated : { ...user, language: choice }));
    } catch (error) {
      toast.show(messageOf(error), 'error');
    }
  };

  const options: { value: Locale | null; label: string }[] = [
    { value: null, label: t('profile.language.automatic') },
    ...LOCALES.map((item) => ({ value: item, label: NAMES[item] })),
  ];

  return (
    <Card title={t('mobile.idioma')}>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const active = option.value === account;
          return (
            <Pressable
              key={option.value ?? 'automatic'}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => choose(option.value)}
              className={`items-center rounded-full border border-gf-border px-4 py-2 ${active ? 'bg-purple-600' : 'bg-gf-surface'}`}>
              <Text className={`font-inter-semibold text-sm ${active ? 'text-white' : 'text-gf-text'}`}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text className="mt-2 font-inter text-xs text-gf-text-muted">{t('profile.language.hint')}</Text>
    </Card>
  );
}
