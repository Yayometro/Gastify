import { configureStore } from '@reduxjs/toolkit';
import { configureApi } from '@gastify/core/api/client';
import { rootReducer } from '@gastify/core/features/rootReducer';

// The same Redux slices and API client as the web app (packages/core). The API lives on
// Vercel; EXPO_PUBLIC_API_URL can point somewhere else while developing.
configureApi({
  baseUrl: process.env.EXPO_PUBLIC_API_URL ?? 'https://gastify-jair-vazquez-navarretes-projects.vercel.app',
});

export const store = configureStore({ reducer: rootReducer });

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
