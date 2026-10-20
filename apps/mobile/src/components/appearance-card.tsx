import { Text } from 'react-native';

import { Segmented } from '@/components/segmented';
import { Card } from '@/components/ui/card';
import { useThemeMode } from '@/hooks/use-theme-mode';
import type { ThemeMode } from '@/lib/theme-mode';

// Light, dark, or follow the phone: the phone's version of the web's sun / moon button. It is in "Más" and in
// the profile, so it is always one tap away.
export function AppearanceCard() {
  const { mode, setMode } = useThemeMode();
  return (
    <Card title="Apariencia">
      <Segmented<ThemeMode>
        options={[
          { value: 'light', label: 'Claro' },
          { value: 'dark', label: 'Oscuro' },
          { value: 'system', label: 'Automático' },
        ]}
        value={mode}
        onChange={setMode}
      />
      <Text className="font-inter text-sm text-gf-text-muted">Automático sigue el modo de tu teléfono.</Text>
    </Card>
  );
}
