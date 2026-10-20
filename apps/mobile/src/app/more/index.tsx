import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';

import { authClient } from '@/auth-client';
import { Screen } from '@/components/screen';
import { AppearanceCard } from '@/components/appearance-card';
import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

function MenuRow({
  label,
  icon,
  onPress,
  soon = false,
}: {
  label: string;
  icon: IconName;
  onPress?: () => void;
  soon?: boolean;
}) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={soon ? `${label}, próximamente` : label}
      accessibilityState={{ disabled: soon }}
      disabled={soon}
      onPress={onPress}
      className="flex-row items-center gap-3 py-3"
      style={{ opacity: soon ? 0.5 : 1 }}>
      <Ionicons name={icon} size={22} color={colors.text} />
      <Text className="flex-1 font-inter-medium text-base text-gf-text">{label}</Text>
      {soon ? (
        <Text className="font-inter text-sm text-gf-text-muted">Próximamente</Text>
      ) : (
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      )}
    </Pressable>
  );
}

// The sections that are not in the bottom bar: Cuentas, Categorías, Historial, Proyecciones and Perfil.
export default function MoreScreen() {
  return (
    <Screen title="Más" subtitle="Tus cuentas, categorías y perfil.">
      <Card>
        <MenuRow label="Cuentas" icon="wallet-outline" onPress={() => router.push('/more/accounts')} />
        <View className="h-px bg-gf-border" />
        <MenuRow label="Categorías" icon="pricetags-outline" onPress={() => router.push('/more/categories')} />
        <View className="h-px bg-gf-border" />
        <MenuRow label="Historial" icon="time-outline" onPress={() => router.push('/more/history')} />
        <View className="h-px bg-gf-border" />
        <MenuRow label="Proyecciones" icon="trending-up-outline" onPress={() => router.push('/more/projections')} />
        <View className="h-px bg-gf-border" />
        <MenuRow label="Perfil" icon="person-circle-outline" onPress={() => router.push('/more/profile')} />
      </Card>
      <AppearanceCard />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cerrar sesión"
        onPress={() => authClient.signOut()}
        className="items-center rounded-3xl bg-gf-surface p-4">
        <Text className="font-inter-semibold text-base text-red-500">Cerrar sesión</Text>
      </Pressable>
    </Screen>
  );
}
