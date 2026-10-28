import * as SecureStore from 'expo-secure-store';
import { useEffect, useMemo, useState } from 'react';

import { alertDate, seeNotices, type AlertTimes } from '@gastify/core/budgets/alertTimes';

// When each budget notice first showed up on this phone (the rule is in packages/core alertTimes.ts). Null when there is no record yet.
const STORE_KEY = 'budget_alert_times';

async function readTimes(): Promise<AlertTimes | null> {
  try {
    const raw = await SecureStore.getItemAsync(STORE_KEY);
    return raw ? (JSON.parse(raw) as AlertTimes) : null;
  } catch {
    // Unreadable is not the same as no record: an empty record keeps the dates already there from being cleared.
    return {};
  }
}

// The date of each notice on this phone. Read once, then kept up to date as notices appear. Until the record is read, no date.
export function useAlertDates(keys: string[]): (key: string) => string | null {
  const [stored, setStored] = useState<AlertTimes | null | undefined>(undefined);
  const joined = keys.join('|');

  useEffect(() => {
    void readTimes().then(setStored);
  }, []);

  useEffect(() => {
    if (stored === undefined) return;
    const next = seeNotices(stored, keys, new Date().toISOString());
    if (JSON.stringify(next) === JSON.stringify(stored)) return;
    setStored(next);
    SecureStore.setItemAsync(STORE_KEY, JSON.stringify(next)).catch(() => {
      // Not being able to remember it only means the date may not survive a restart.
    });
    // Keyed by the joined keys: the array itself changes on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored, joined]);

  return useMemo(() => (key: string) => alertDate(stored ?? null, key), [stored]);
}
