import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AmbientBackground, DARK_BASE } from '@/components/ambient-background';
import { GradientButton } from '@/components/ui/gradient-button';
import { Colors } from '@/constants/theme';

export type InfoText = { title: string; text: string };

// The "?" next to a title: it opens a sheet that explains what the section shows, like the web's info icons.
export function InfoTip({ info }: { info: InfoText }) {
  const [open, setOpen] = useState(false);
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const colors = Colors[dark ? 'dark' : 'light'];

  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel={`Qué es ${info.title}`} onPress={() => setOpen(true)} hitSlop={10}>
        <Ionicons name="help-circle-outline" size={20} color={colors.textSecondary} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ borderRadius: 28, overflow: 'hidden', backgroundColor: dark ? DARK_BASE : colors.background }}>
            <AmbientBackground />
            <SafeAreaView edges={[]} className="gap-4 p-6">
              <Text className="font-inter-bold text-xl text-gf-text">{info.title}</Text>
              <Text className="font-inter text-base text-gf-text-muted">{info.text}</Text>
              <GradientButton label="Entendido" onPress={() => setOpen(false)} />
            </SafeAreaView>
          </View>
        </View>
      </Modal>
    </>
  );
}
