import { Stack } from 'expo-router';

// "Más" keeps its own stack, so the screens opened from it (Cuentas) return to this list.
export default function MoreLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
