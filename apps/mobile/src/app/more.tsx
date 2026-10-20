import { Pressable, Text, View } from 'react-native';

import { authClient } from '@/auth-client';
import { CategoryIcon } from '@/components/category-icon';
import { PlaceholderScreen } from '@/components/placeholder-screen';

// Sample of how category icons are drawn; the real lists come in phase 4.
const SAMPLES = [
  { name: 'fluent/pizza', label: 'fluent/pizza (nombre nuevo)' },
  { name: 'gi/GiHamburger', label: 'gi/GiHamburger (nombre viejo, se traduce)' },
  { name: 'md/MdFlightTakeoff', label: 'md/MdFlightTakeoff (nombre viejo, se traduce)' },
  { name: 'md/MdFilterNone', label: 'md/MdFilterNone (sin ícono todavía)' },
];

export default function MoreScreen() {
  return (
    <PlaceholderScreen
      title="Más"
      text="Aquí van las demás secciones: Cuentas, Categorías, Historial, Proyecciones y Perfil.">
      <View className="gap-3 rounded-3xl bg-gf-surface p-4">
        <Text className="font-inter-semibold text-sm text-gf-text">Íconos de categorías (muestra)</Text>
        {SAMPLES.map((sample) => (
          <View key={sample.name} className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-gf-accent-soft-bg">
              <CategoryIcon name={sample.name} size={30} />
            </View>
            <Text className="flex-1 font-inter text-sm text-gf-text-muted">{sample.label}</Text>
          </View>
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cerrar sesión"
        onPress={() => authClient.signOut()}
        className="items-center rounded-3xl bg-gf-surface p-4">
        <Text className="font-inter-semibold text-base text-red-500">Cerrar sesión</Text>
      </Pressable>
    </PlaceholderScreen>
  );
}
