import { Text } from 'react-native';

import { Segmented } from '@/components/segmented';
import { Card } from '@/components/ui/card';
import { useThemeMode } from '@/hooks/use-theme-mode';
import type { ThemeMode } from '@/lib/theme-mode';
import { useT } from "@/i18n/client";

// Light, dark, or follow the phone: the phone's version of the web's sun / moon button. It is in "Más" and in
// the profile, so it is always one tap away.
export function AppearanceCard() {
  const t = useT();
  const { mode, setMode } = useThemeMode();
  return (
    <Card title={t("mobile.apariencia")}>
      <Segmented<ThemeMode>
        options={[
          { value: 'light', label: t("mobile.claro") },
          { value: 'dark', label: t("mobile.oscuro") },
          { value: 'system', label: t("mobile.automatico") },
        ]}
        value={mode}
        onChange={setMode}
      />
      <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.automatico.sigue.el.modo.de")}</Text>
    </Card>
  );
}
