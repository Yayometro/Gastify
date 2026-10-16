# @gastify/core

Code shared by the web app (repo root, Next.js) and the mobile app (`apps/mobile`, Expo).

**Rule:** only pure TypeScript here. No React, no DOM (`window`, `document`, `localStorage`), no Node APIs,
no Next.js, no Mongoose. If it needs one of those, it does not belong in this package.

How it is wired (stage 1, deliberately simple, not an npm workspace yet):

- Imports look like `@gastify/core/money/currencies` and map to `packages/core/src/money/currencies`.
- Web: `tsconfig.json` `paths` (Next reads it) and the alias in `vitest.config.mjs`.
- Mobile: `apps/mobile/tsconfig.json` `paths` and `apps/mobile/metro.config.js` (`watchFolders`).
- Third-party packages used here (today only `decimal.js`) are resolved from the repo root `node_modules`;
  they are listed in this package's `package.json` so they are not forgotten.
- Tests live next to the code (`*.test.ts`) and run with the web's `npm test`.

| Folder | What | Moved from |
|---|---|---|
| `money/` | currencies, minor/major units, conversion, display currency | `src/lib/money` |
| `format/` | `percentOf`, `readableTextColor` | `src/helpers` |
| `time/` | periods, ranges and date helpers for the dashboard and charts | `src/helpers/timeFunctions` |
| `order/` | sorting helpers | `src/helpers/orderFunctions` |
| `transactions/` | recent/history window, history-ready rule, the Mongo date filter | `src/lib/transactions` |

Next candidates (see `.mds/MOBILE_REACT_NATIVE_PLAN.md`, phase 1): `helpers/transformers`, the Redux slices and
`helpers/fetcher.ts` once they take the base URL and the auth headers as parameters, the Fluent icon manifest.
