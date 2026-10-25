import { router } from 'expo-router';
import { tNow } from '@/i18n/now';

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
  if (returnTo === '/') return tNow("mobile.inicio");
  if (returnTo.startsWith('/more/history')) return tNow("mobile.historial");
  if (returnTo.startsWith('/more/analyzer')) return tNow("mobile.analizador.de.cartera");
  if (returnTo.startsWith('/more/accounts/')) return tNow("dashboard.bulk.account");
  if (returnTo.startsWith('/budgets/')) return tNow("budgets.alert.defaultName");
  return fallback;
}
