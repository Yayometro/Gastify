import { Stack } from 'expo-router';

// "Más" keeps its own stack, so the screens opened from it (Cuentas, Categorías…) return to this list. The screens change
// at once, on every size: a slide on the way back, when the tab is tapped again, showed the list twice.
export default function MoreLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'none' }} />;
}
