import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, Text, View, useColorScheme, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AmbientBackground, DARK_BASE } from '@/components/ambient-background';
import { Categorizer } from '@/components/tools/categorizer';
import { BottomTabInset, Colors } from '@/constants/theme';

type Tool = { id: string; label: string; title: string; about: string; render: () => React.JSX.Element };

// Array-driven, like the web's: a new tool is one more entry here, and the tabs appear once there are two.
const TOOLS: Tool[] = [
  {
    id: 'uncategorized',
    label: 'Sin categoría',
    title: 'Transaction Categorizer',
    about: 'Busca tus movimientos sin categoría y sugiere una según las reglas que guardaste (nombre del comercio, monto). Nada cambia hasta que revises y apliques.',
    render: () => <Categorizer />,
  },
];

// The web's floating "Tools" button (the sparkles) and the sheet it opens. It floats above every screen: bottom
// right on the phone (above the tab bar) and on the iPad.
export function ToolsFab() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const colors = Colors[dark ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();
  const wide = useWindowDimensions().width >= 768;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(TOOLS[0].id);
  const current = TOOLS.find((tool) => tool.id === active) ?? TOOLS[0];

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Abrir herramientas"
        onPress={() => setOpen(true)}
        style={[
          { position: 'absolute', right: 16, bottom: wide ? insets.bottom + 16 : BottomTabInset + 8, width: 48, height: 48, zIndex: 50 },
          Platform.select({ ios: { shadowColor: '#7e22ce', shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }, default: { elevation: 8 } }),
        ]}>
        <LinearGradient colors={['#e879f9', '#9333ea']} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={{ flex: 1, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="sparkles" size={22} color="#ffffff" />
        </LinearGradient>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, justifyContent: wide ? 'center' : 'flex-end', alignItems: 'center' }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={() => setOpen(false)} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.55)' }} />
          <View
            style={{
              width: wide ? 640 : '100%',
              maxHeight: '90%',
              borderRadius: wide ? 28 : 0,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              overflow: 'hidden',
              backgroundColor: dark ? DARK_BASE : colors.background,
            }}>
            <AmbientBackground />
            <SafeAreaView edges={['bottom']}>
              <View className="items-center px-6 pb-2 pt-5">
                <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={() => setOpen(false)} hitSlop={10} style={{ position: 'absolute', right: 20, top: 18 }}>
                  <Ionicons name="close" size={26} color={colors.text} />
                </Pressable>
                <Text className="font-inter-bold text-2xl text-gf-text">Tools</Text>
                <Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>{current.title}</Text>
                <Text className="pt-1 text-center font-inter text-xs text-gf-text-muted">{current.about}</Text>
              </View>
              {TOOLS.length > 1 && (
                <View className="flex-row justify-center gap-2 pb-2">
                  {TOOLS.map((tool) => (
                    <Pressable
                      key={tool.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active === tool.id }}
                      onPress={() => setActive(tool.id)}
                      className="rounded-full px-4 py-1.5"
                      style={{ backgroundColor: active === tool.id ? '#9333ea' : undefined }}>
                      <Text className="font-inter-medium text-sm" style={{ color: active === tool.id ? '#ffffff' : colors.textSecondary }}>{tool.label}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
              <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 28 }} keyboardShouldPersistTaps="handled">
                {open && current.render()}
              </ScrollView>
            </SafeAreaView>
          </View>
        </View>
      </Modal>
    </>
  );
}
