import { useSelector } from 'react-redux';

import type { RootState } from '@/store';

// The wallet's primary currency: every total in the app is shown in it, as on the web (MXN until
// the wallet has loaded).
export function usePrimaryCurrency(): string {
  return useSelector(
    (state: RootState) => (state.walletReducer.data as { primaryCurrency?: string } | null | undefined)?.primaryCurrency || 'MXN'
  );
}
