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

export const store = configureStore({ reducer: rootReducer });

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
