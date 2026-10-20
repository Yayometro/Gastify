import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { GradientButton } from '@/components/ui/gradient-button';
import { Colors } from '@/constants/theme';

export type InfoText = { title: string; text: string };

// The "?" at the top right of a card: it opens a sheet that explains what the section shows, like the web's info
// icons. Tapping outside the sheet closes it too.
export function InfoTip({ info }: { info: InfoText }) {
  const [open, setOpen] = useState(false);
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];

  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel={`Qué es ${info.title}`} onPress={() => setOpen(true)} hitSlop={10}>
        <Ionicons name="help-circle-outline" size={22} color={colors.textSecondary} />
      </Pressable>
      <BottomSheet visible={open} onClose={() => setOpen(false)}>
        <SafeAreaView edges={['bottom']} className="gap-4 p-6">
          <Text className="font-inter-bold text-xl text-gf-text">{info.title}</Text>
          <Text className="font-inter text-base text-gf-text-muted">{info.text}</Text>
          <GradientButton label="Entendido" onPress={() => setOpen(false)} />
        </SafeAreaView>
      </BottomSheet>
    </>
  );
}
