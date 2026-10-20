import { Stack } from 'expo-router';

// "Presupuestos" keeps its own stack: a budget opened from the list comes back to the list.
export default function BudgetsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
