import { configureStore } from '@reduxjs/toolkit';
import { createWrapper } from 'next-redux-wrapper';
import { setupListeners } from '@reduxjs/toolkit/query/react';

import { rootReducer } from './rootReducer';
import { configureApi } from '@gastify/core/api/client';
import { goToStepUp } from '@/lib/auth/goToStepUp';
import { configurePerf } from '@gastify/core/perf/hooks';
import { perfMark, debugDelay } from '@/lib/perf/perfMark';

// The shared slices (packages/core) reach the API and the perf marks through these settings.
// The web app sets them here, once, before any request can run.
configureApi({ baseUrl: process.env.NEXT_PUBLIC_API_ROUTE ?? '', onStepUpRequired: goToStepUp });
configurePerf({ mark: perfMark, delay: debugDelay });

export const store = configureStore({
    reducer: rootReducer,
    // middleware: (getDefaultMiddleware) => 
    //     getDefaultMiddleware().concat(apiSlice.middleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;

export const wrapper = createWrapper<AppStore>(() => store);

//Set up listeners for API consults:
setupListeners(store.dispatch);
