import { Stack } from 'expo-router';

import { useIsTablet } from '@/hooks/use-device-class';

// "Más" keeps its own stack, so the screens opened from it (Cuentas) return to this list. On a tablet the screens change at
// once, as the web does; the slide is for the phone.
export default function MoreLayout() {
  const tablet = useIsTablet();
  return <Stack screenOptions={{ headerShown: false, animation: tablet ? 'none' : 'slide_from_right' }} />;
}
