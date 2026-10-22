import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Platform, Pressable, Text, View, useColorScheme, useWindowDimensions } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { GradientButton } from '@/components/ui/gradient-button';
import { Colors } from '@/constants/theme';
import { longDateEs } from '@gastify/core/format/spanishDates';
import { dateText, parseDateText } from '@gastify/core/transactions/movementForm';

// A date as a tappable field that opens the system calendar (the web opens one too). The value is the
// local day as AAAA-MM-DD, the format the forms and core use.
export function DateField({ label, value, onChange }: { label: string; value: string; onChange: (day: string) => void }) {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const wide = useWindowDimensions().width >= 768;
  const colors = Colors[dark ? 'dark' : 'light'];
  const date = parseDateText(value) ?? new Date();
  const [iosOpen, setIosOpen] = useState(false);
  const [draft, setDraft] = useState(date);

  // Closes the calendar keeping what was picked (the draft), used by "Listo" and by a tap outside.
  const keepAndClose = () => {
    onChange(dateText(draft));
    setIosOpen(false);
  };

  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: date,
        mode: 'date',
        onValueChange: (_, picked) => onChange(dateText(picked)),
      });
    } else {
      setDraft(date);
      setIosOpen(true);
    }
  };

  return (
    <View className="gap-2">
      <Text className="font-inter-medium text-sm text-gf-text-muted">{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${longDateEs(date)}. Cambiar fecha`}
        onPress={open}
        className="h-[52px] flex-row items-center justify-between rounded-full border border-gf-border bg-gf-surface px-5">
        <Text className="font-inter text-base text-gf-text">{longDateEs(date)}</Text>
        <Ionicons name="calendar-outline" size={22} color={colors.accent} />
      </Pressable>

      {Platform.OS === 'ios' && (
        <BottomSheet visible={iosOpen} onClose={keepAndClose} wideWidth={440} ambient={false}>
            {/* One solid color all the way down, so the calendar has no band of another color behind it. On an iPad it is
                a centered card; on a phone, a sheet from the bottom. */}
            <View
              style={{
                paddingHorizontal: 20,
                paddingTop: 16,
                paddingBottom: wide ? 20 : 34,
                gap: 12,
              }}>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={keepAndClose} hitSlop={10}>
                  <Ionicons name="close" size={24} color={dark ? '#ffffff' : '#1b103d'} />
                </Pressable>
              </View>
              <View style={{ alignItems: 'center' }}>
                <DateTimePicker
                  value={draft}
                  mode="date"
                  display="inline"
                  locale="es-MX"
                  themeVariant={dark ? 'dark' : 'light'}
                  accentColor="#9333ea"
                  onValueChange={(_, picked) => setDraft(picked)}
                  style={{ width: wide ? 400 : '100%' }}
                />
              </View>
              <GradientButton
                label="Listo"
                onPress={() => {
                  onChange(dateText(draft));
                  setIosOpen(false);
                }}
              />
            </View>
        </BottomSheet>
      )}
    </View>
  );
}
