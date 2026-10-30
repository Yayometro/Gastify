import { useSyncExternalStore } from 'react';

import { getApi } from '@gastify/core/api/client';

// The recurring charges waiting for the person's amount, shared by the window that asks, the bell and the notices list.
export type PendingRecurring = {
  recurringId: string;
  name: string;
  dueDate: string;
  amount: number;
  currency: string | null;
  frequency: string;
};

type State = { items: PendingRecurring[]; open: boolean };

let state: State = { items: [], open: false };
const listeners = new Set<() => void>();

function emit(next: State): void {
  state = next;
  listeners.forEach((listener) => listener());
}

export function setPendingRecurring(items: PendingRecurring[], open?: boolean): void {
  emit({ items, open: open ?? state.open });
}
export function openPendingRecurring(): void {
  if (state.items.length > 0) emit({ ...state, open: true });
}
export function closePendingRecurring(): void {
  emit({ ...state, open: false });
}
export function pendingKey(item: PendingRecurring): string {
  return `${item.recurringId}|${item.dueDate}`;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function usePendingRecurring(): State {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

// The catch-up the server runs when the app opens: the fixed-price charges that fell due are created there, and the
// variable ones come back to be confirmed. Returns how many charges it created (so the lists can be reloaded).
export async function syncRecurring(): Promise<number> {
  try {
    const answer = await getApi().post<{ ok?: boolean; data?: { created?: number; pending?: PendingRecurring[] } }>('general-data/recurring/sync', {});
    const data = answer?.data;
    if (!answer?.ok || !data) return 0;
    const pending = data.pending ?? [];
    setPendingRecurring(pending, pending.length > 0);
    return data.created ?? 0;
  } catch {
    // The catch-up is a convenience: the next time the app opens it tries again.
    return 0;
  }
}
