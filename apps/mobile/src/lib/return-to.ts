import { router } from 'expo-router';

// Screens opened from another section (a movement opened from Historial or from an account, the account's
// movements) receive `returnTo`: the path they came from. Going back returns there instead of to a default
// tab, so the person lands where they were.
export function returnParam(value: string | string[] | undefined): string | undefined {
  const text = Array.isArray(value) ? value[0] : value;
  return text && text.startsWith('/') ? text : undefined;
}

export function goBackTo(returnTo: string | undefined, fallback: () => void): void {
  if (returnTo) router.navigate(returnTo as never);
  else fallback();
}

// The label of the back button for a `returnTo` path.
export function returnLabel(returnTo: string | undefined, fallback: string): string {
  if (!returnTo) return fallback;
  if (returnTo.startsWith('/more/history')) return 'Historial';
  if (returnTo.startsWith('/more/accounts/')) return 'Cuenta';
  if (returnTo.startsWith('/budgets/')) return 'Presupuesto';
  return fallback;
}
