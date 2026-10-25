import { useMemo, useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { useAccountCountry, useLocale, useT } from '@/i18n/client';
import { Card } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { useToast } from '@/components/toast';
import { Colors } from '@/constants/theme';
import { messageOf, sendWrite } from '@/lib/write';
import type { AppDispatch, RootState } from '@/store';
import { countryOptions, normalizeCountry } from '@gastify/core/i18n/countries';
import { updateUser, type UserData } from '@gastify/core/features/userSlice';

// How many countries the search shows at once: the list lives inside the profile's scroll, so it stays short.
const SHOWN = 40;

// The country the person picks. While the language is automatic, it decides the language. It is their own choice, saved on the
// account (the same as the web's): nothing here reads the location, and "Automático" goes back to the phone's region.
export function CountryCard() {
  const t = useT();
  const locale = useLocale();
  const current = normalizeCountry(useAccountCountry());
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.userReducer.data) as UserData;
  const toast = useToast();
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const options = useMemo(() => countryOptions(locale), [locale]);

  const currentName = current ? options.find((option) => option.code === current)?.name ?? current : t('profile.country.automatic');

  const shown = useMemo(() => {
    const text = query.trim().toLowerCase();
    const matches = text ? options.filter((option) => option.name.toLowerCase().includes(text) || option.code.toLowerCase() === text) : options;
    return matches.slice(0, SHOWN);
  }, [options, query]);

  const choose = async (next: string | null) => {
    if (busy || next === current) return;
    setBusy(true);
    try {
      const updated = await sendWrite<UserData | null>('general-data/user/update-user', { country: next });
      // The server answers with the whole account; if it does not, the account we have keeps everything else.
      dispatch(updateUser(updated && typeof updated === 'object' ? updated : { ...user, country: next }));
      toast.show(t('profile.country.saved'));
      setOpen(false);
      setQuery('');
    } catch (error) {
      toast.show(messageOf(error), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title={t('profile.country.title')}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((value) => !value)}
        className="flex-row items-center justify-between py-1">
        <View className="flex-1">
          <Text className="font-inter-semibold text-base text-gf-text" numberOfLines={1}>{currentName}</Text>
          <Text className="font-inter text-sm text-gf-text-muted">{t('profile.country.hint')}</Text>
        </View>
        <View className="rounded-full px-4 py-2" style={{ backgroundColor: colors.accentSoft }}>
          <Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>{open ? t('profile.access.close') : t('profile.access.open')}</Text>
        </View>
      </Pressable>

      {open && (
        <View className="gap-3">
          <TextField label={t('profile.country.search')} value={query} onChangeText={setQuery} onClear={() => setQuery('')} autoCorrect={false} />
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: current === null }}
            onPress={() => choose(null)}
            className={`rounded-2xl px-4 py-3 ${current === null ? 'bg-purple-600' : 'bg-gf-surface'}`}>
            <Text className={`font-inter-semibold text-base ${current === null ? 'text-white' : 'text-gf-text'}`}>{t('profile.country.automatic')}</Text>
          </Pressable>
          {shown.map((option) => {
            const selected = option.code === current;
            return (
              <Pressable
                key={option.code}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => choose(option.code)}
                className={`flex-row items-center justify-between rounded-2xl px-4 py-3 ${selected ? 'bg-purple-600' : 'bg-gf-surface'}`}>
                <Text className={`flex-1 font-inter text-base ${selected ? 'text-white' : 'text-gf-text'}`}>{option.name}</Text>
                <Text className={`font-inter-semibold text-sm ${selected ? 'text-white' : 'text-gf-text-muted'}`}>{option.code}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </Card>
  );
}
