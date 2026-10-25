import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { fetchAccounts } from '@gastify/core/features/accountsSlice';
import { fetchBudget } from '@gastify/core/features/budgetSlice';
import { fetchCategories } from '@gastify/core/features/categoriesSlice';
import { fetchSubCat } from '@gastify/core/features/subCategorySlice';
import { fetchTrans, fetchTransHistory, resetHistory } from '@gastify/core/features/transacctionsSlice';
import { fetchUser } from '@gastify/core/features/userSlice';
import { fetchWallet } from '@gastify/core/features/walletSlice';
import type { AppDispatch, RootState } from '@/store';

// The same loads the web makes when a session opens (useFetchAndGetAllReduxInfo): every slice once,
// the recent movements first and the rest of the history in the background. The thunks take the
// e-mail the web passes; the API reads the user from the session, so the argument is undefined here.
// Mounted once, by the signed-in tabs. The screens only use useRefreshAppData.
export function useLoadAppData(): void {
  const dispatch = useDispatch<AppDispatch>();
  const userStatus = useSelector((state: RootState) => state.userReducer.status);
  const walletStatus = useSelector((state: RootState) => state.walletReducer.status);
  const accountsStatus = useSelector((state: RootState) => state.accountsReducer.status);
  const categoriesStatus = useSelector((state: RootState) => state.categoriesReducer.status);
  const subCategoriesStatus = useSelector((state: RootState) => state.subCategoryReducer.status);
  const transStatus = useSelector((state: RootState) => state.transacctionsReducer.status);
  const historyStatus = useSelector((state: RootState) => state.transacctionsReducer.historyStatus);
  const budgetStatus = useSelector((state: RootState) => state.budgetReducer.status);

  // Only "idle" starts a load, so a slice that is already loading or failed is not requested again
  // (the web behaves the same way).
  useEffect(() => {
    if (userStatus === 'idle') dispatch(fetchUser(undefined));
    if (walletStatus === 'idle') dispatch(fetchWallet(undefined));
    if (accountsStatus === 'idle') dispatch(fetchAccounts(undefined));
    if (categoriesStatus === 'idle') dispatch(fetchCategories(undefined));
    if (subCategoriesStatus === 'idle') dispatch(fetchSubCat(undefined));
    if (transStatus === 'idle') dispatch(fetchTrans(undefined));
    if (budgetStatus === 'idle') dispatch(fetchBudget(undefined));
  }, [
    dispatch,
    userStatus,
    walletStatus,
    accountsStatus,
    categoriesStatus,
    subCategoriesStatus,
    transStatus,
    budgetStatus,
  ]);

  // The recent months are in: fetch the rest of the history in the background.
  useEffect(() => {
    if (transStatus === 'succeeded' && historyStatus === 'idle') dispatch(fetchTransHistory());
  }, [dispatch, transStatus, historyStatus]);
}

// Pull-to-refresh for the screens. Movements already loaded from before the recent cutoff are kept
// by the slice when the recent part comes back (see fetchTrans.fulfilled).
export function useRefreshAppData(): { refresh: () => void; refreshing: boolean } {
  const dispatch = useDispatch<AppDispatch>();
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(() => {
    setRefreshing(true);
    Promise.allSettled([
      dispatch(fetchTrans(undefined)),
      dispatch(fetchAccounts(undefined)),
      dispatch(fetchBudget(undefined)),
      dispatch(fetchWallet(undefined)),
    ]).finally(() => setRefreshing(false));
  }, [dispatch]);

  return { refresh, refreshing };
}

// After a change is saved: the lists the change can touch are requested again. When the change is to
// a movement from before the recent cutoff, the older history is requested again too.
export function reloadAfterWrite(dispatch: AppDispatch, olderTouched = false): Promise<unknown> {
  if (olderTouched) dispatch(resetHistory());
  return Promise.allSettled([
    dispatch(fetchTrans(undefined)),
    dispatch(fetchAccounts(undefined)),
    dispatch(fetchBudget(undefined)),
    dispatch(fetchWallet(undefined)),
    dispatch(fetchCategories(undefined)),
    dispatch(fetchSubCat(undefined)),
  ]);
}
