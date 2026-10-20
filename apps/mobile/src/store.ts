import { configureStore } from '@reduxjs/toolkit';
import { configureApi } from '@gastify/core/api/client';
import { rootReducer } from '@gastify/core/features/rootReducer';

import { API_URL, authClient } from '@/auth-client';

// The same Redux slices and API client as the web app (packages/core). Every request carries the
// session cookie that the auth client keeps in secure storage; `credentials: "omit"` stops the
// platform cookie jar from interfering with it.
configureApi({
  baseUrl: API_URL,
  credentials: 'omit',
  getHeaders: async () => ({ Cookie: (await authClient.getCookie()) ?? '' }),
});

// The serializable and immutability checks walk the whole state on every action: with a few thousand movements that
// costs more than the action itself (and fills the dev screen with warnings). The data comes from the
// JSON API, so it is serializable by construction.
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
