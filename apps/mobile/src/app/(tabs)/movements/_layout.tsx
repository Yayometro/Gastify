import { Stack } from 'expo-router';

// "Movimientos" keeps its own stack, so a movement opened from the list comes back to the list.
export default function MovementsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
