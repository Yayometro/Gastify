import { useSyncExternalStore } from "react";

// The recurring charges waiting for the person's amount, shared by the window that asks and the bell that reminds.
export interface PendingRecurringItem {
  recurringId: string;
  name: string;
  dueDate: string;
  amount: number;
  currency: string | null;
  frequency: string;
}

interface State {
  items: PendingRecurringItem[];
  open: boolean;
}

let state: State = { items: [], open: false };
const listeners = new Set<() => void>();

function emit(next: State): void {
  state = next;
  listeners.forEach((listener) => listener());
}

export function setPendingRecurring(items: PendingRecurringItem[], open?: boolean): void {
  emit({ items, open: open ?? state.open });
}
export function openPendingRecurring(): void {
  if (state.items.length > 0) emit({ ...state, open: true });
}
export function closePendingRecurring(): void {
  emit({ ...state, open: false });
}
export function pendingKey(item: PendingRecurringItem): string {
  return `${item.recurringId}|${item.dueDate}`;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function usePendingRecurring(): State {
  return useSyncExternalStore(subscribe, () => state, () => state);
}
