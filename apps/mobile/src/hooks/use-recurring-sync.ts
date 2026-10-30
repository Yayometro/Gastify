import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { reloadAfterWrite } from '@/hooks/use-load-app-data';
import { syncRecurring } from '@/lib/recurring-pending';
import type { AppDispatch } from '@/store';

// Once per opening of the signed-in app: creates the recurring charges that fell due and raises the ones that need the
// person's amount. Mounted by the tabs, next to the data loads.
export function useRecurringSync(): void {
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    let alive = true;
    void syncRecurring().then((created) => {
      if (alive && created > 0) void reloadAfterWrite(dispatch);
    });
    return () => {
      alive = false;
    };
  }, [dispatch]);
}
