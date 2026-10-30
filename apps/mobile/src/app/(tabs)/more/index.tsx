import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import { Text, View, useColorScheme, useWindowDimensions } from 'react-native';

import { authClient } from '@/auth-client';
import { Screen } from '@/components/screen';
import { AppearanceCard } from '@/components/appearance-card';
import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { NAV_ICON } from '@/lib/nav-icons';
import { WIDE_BAR_MIN_WIDTH } from '@/components/floating-tab-bar';
import { useT } from "@/i18n/client";
import { tNow } from '@/i18n/now';

import { TourPressable, TourTarget } from '@/components/tour/tour-target';
import { useTour } from '@/components/tour/tour-provider';
type IconName = ComponentProps<typeof Ionicons>['name'];

// A row of the menu: the section's own glyph (the same as the iPad's side bar) or a plain Ionicons one.
function MenuRow({
  label,
  icon,
  glyph,
  onPress,
  soon = false,
  tourId,
}: {
  label: string;
  icon?: IconName;
  glyph?: (color: string) => ReactNode;
  onPress?: () => void;
  soon?: boolean;
  tourId?: string;
}) {
  const t = useT();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  return (
    <TourPressable id={tourId}
      accessibilityRole="button"
      accessibilityLabel={soon ? tNow("mobile.p1.proximamente", { p1: label }) : label}
      accessibilityState={{ disabled: soon }}
      disabled={soon}
      onPress={onPress}
      className="flex-row items-center gap-3 py-3"
      style={{ opacity: soon ? 0.5 : 1 }}>
      <View style={{ width: 28, alignItems: 'center' }}>{glyph ? glyph(colors.text) : icon ? <Ionicons name={icon} size={22} color={colors.text} /> : null}</View>
      <Text className="flex-1 font-inter-medium text-base text-gf-text">{label}</Text>
      {soon ? (
        <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.proximamente")}</Text>
      ) : (
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      )}
    </TourPressable>
  );
}

// The sections that are not in the bottom bar: Cuentas, Categorías, Historial, Proyecciones and Perfil.
export default function MoreScreen() {
  const t = useT();
  const tour = useTour();
  // On a wide screen the bottom bar already has Analizador and Proyecciones.
  const onBar = useWindowDimensions().width >= WIDE_BAR_MIN_WIDTH;
  return (
    <Screen title={t("mobile.mas")} subtitle={t("mobile.tus.cuentas.categorias.y.perfil")}>
      <Card tour="m-more-menu">
        <MenuRow label={t("mobile.notificaciones")} icon="notifications-outline" onPress={() => router.push('/notifications')} />
        <View className="h-px bg-gf-border" />
        <MenuRow label={t("mobile.cuentas")} glyph={(c) => NAV_ICON.accounts(c)} onPress={() => router.push('/more/accounts')} />
        <View className="h-px bg-gf-border" />
        <MenuRow label={t("mobile.categorias")} glyph={(c) => NAV_ICON.categories(c)} onPress={() => router.push('/more/categories')} />
        <View className="h-px bg-gf-border" />
        {!onBar && (
          <>
            <MenuRow label={t("mobile.analizador.de.cartera")} glyph={(c) => NAV_ICON.analyzer(c)} onPress={() => router.push('/more/analyzer')} />
            <View className="h-px bg-gf-border" />
          </>
        )}
        <MenuRow label={t("navbar.people")} icon="heart-outline" onPress={() => router.push('/more/people')} />
        <View className="h-px bg-gf-border" />
        <MenuRow label={t("recurring.manage.title")} icon="repeat-outline" onPress={() => router.push('/more/recurring')} />
        <View className="h-px bg-gf-border" />
        <MenuRow label={t("mobile.historial")} glyph={(c) => NAV_ICON.history(c)} onPress={() => router.push('/more/history')} />
        <View className="h-px bg-gf-border" />
        {!onBar && (
          <>
            <MenuRow label={t("mobile.proyecciones")} glyph={(c) => NAV_ICON.projections(c)} onPress={() => router.push('/more/projections')} />
            <View className="h-px bg-gf-border" />
          </>
        )}
        <MenuRow label={t("mobile.perfil")} icon="person-circle-outline" onPress={() => router.push('/more/profile')} />
        <View className="h-px bg-gf-border" />
        <MenuRow tourId="m-more-tutorial" label={t("tour.mEntry.row")} icon="compass-outline" onPress={tour.openMenu} />
      </Card>
      <TourTarget id="m-more-appearance">
        <AppearanceCard />
      </TourTarget>
      <TourPressable id="m-more-signout"
        accessibilityRole="button"
        accessibilityLabel={t("mobile.cerrar.sesion")}
        onPress={() => authClient.signOut()}
        className="items-center rounded-3xl bg-gf-surface p-4">
        <Text className="font-inter-semibold text-base text-red-500">{t("mobile.cerrar.sesion")}</Text>
      </TourPressable>
    </Screen>
  );
}
