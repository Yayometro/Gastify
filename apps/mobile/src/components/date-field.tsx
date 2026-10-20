import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Platform, Pressable, Text, View, useColorScheme } from 'react-native';

import { AmbientBackground, DARK_BASE } from '@/components/ambient-background';
import { GradientButton } from '@/components/ui/gradient-button';
import { Colors } from '@/constants/theme';
import { longDateEs } from '@gastify/core/format/spanishDates';
import { dateText, parseDateText } from '@gastify/core/transactions/movementForm';

// A date as a tappable field that opens the system calendar (the web opens one too). The value is the
// local day as AAAA-MM-DD, the format the forms and core use.
export function DateField({ label, value, onChange }: { label: string; value: string; onChange: (day: string) => void }) {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const colors = Colors[dark ? 'dark' : 'light'];
  const date = parseDateText(value) ?? new Date();
  const [iosOpen, setIosOpen] = useState(false);
  const [draft, setDraft] = useState(date);

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
        <Modal visible={iosOpen} animationType="slide" transparent onRequestClose={() => setIosOpen(false)}>
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <View style={{ backgroundColor: dark ? DARK_BASE : colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', paddingBottom: 28 }}>
              <AmbientBackground />
              <View className="gap-3 p-6">
                <DateTimePicker value={draft} mode="date" display="inline" locale="es-MX" themeVariant={dark ? 'dark' : 'light'} onValueChange={(_, picked) => setDraft(picked)} />
                <GradientButton
                  label="Listo"
                  onPress={() => {
                    onChange(dateText(draft));
                    setIosOpen(false);
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
