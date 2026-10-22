import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';

// The notices the person swiped away. Kept on the device (a notice is about this period and this budget, so it does not
// need the server), and read once: a notice that was dismissed is not listed again nor shown as a toast.
const KEY = 'budget_alerts_dismissed';

let cache: string[] | null = null;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function load(): Promise<void> {
  if (!loading) {
    loading = (async () => {
      try {
        const raw = await SecureStore.getItemAsync(KEY);
        cache = raw ? (JSON.parse(raw) as string[]) : [];
      } catch {
        cache = [];
      }
      emit();
    })();
  }
  return loading;
}

export async function dismissAlert(key: string): Promise<void> {
  await load();
  const next = [...(cache ?? []).filter((item) => item !== key), key].slice(-300);
  cache = next;
  emit();
  try {
    await SecureStore.setItemAsync(KEY, JSON.stringify(next));
  } catch {
    // Not remembered: the notice may come back once, the next time the app opens.
  }
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const EMPTY: string[] = [];

// The keys dismissed so far (an empty list until the device's copy is read).
export function useDismissedAlertKeys(): string[] {
  void load();
  return useSyncExternalStore(subscribe, () => cache ?? EMPTY, () => EMPTY);
}
