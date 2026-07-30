# Plan: Projections/Budgets follow-up fixes (round 2)

> Written by Claude Sonnet 5, 2026-07-29, right after the user populated real data into Projections (a real biweekly income source, real Budgets) and reported a batch of confusion points + bugs. Read this before continuing if picking this up cold.

## Context

After using the freshly-built Projections feature with real data, the user flagged real issues (not just polish):
1. A genuine bug: income occurrence counting only works forward from `anchorDate`, so any income source whose anchor date is set to a date after some months (e.g. "first payment 3 Aug 2026" when in reality paid biweekly since before) shows 0 expected occurrences for earlier months.
2. A confirmed, explained-but-confusing design gap: the current month's total can legitimately exceed real spend so far (MAX-blend picks a Budget's ceiling when real spend hasn't reached it yet) — this is correct behavior but needs in-app explanation, not just docs.
3. Missing UI: no way to manually fix a past month's account balance, no "total money right now" summary, no amount field on the Account edit modal, raw unformatted numbers, wrong modal component (no click-outside-to-close), wrong date picker, missing income-side "unexpected" buffer, past months showing far less modal detail than the current month.

## Fixes to implement

### 1. Bug fix: bidirectional occurrence counting
`src/helpers/transformers/projectionsChange.js` — `countIntervalOccurrences` currently clamps `k = Math.max(0, ...)`, so it never counts occurrences for months before `anchorDate`. Remove the clamp so `k` can go negative and the periodic sequence is walked correctly in both directions. `monthly`/`semimonthly` recurrences are unaffected (fixed counts), only `biweekly`/`weekly`.

### 2. Currency formatting everywhere in Projections/Budgets
Reuse the existing `usdFormatChanger` (`src/helpers/transformers/transactionsChange.js`, wraps `currency-formatter`) instead of raw `.toFixed(2)` in `ProjectionsView.jsx`, `ProjectionMonthDetailModal.jsx`, `BudgetBarRow.jsx`, `IncomeSourcesPanel.jsx`. Fixes the "0 x 52" readability issue (was always `52000`, just unformatted).

### 3. Modal component: switch to the app's real reusable modal
`ProjectionMonthDetailModal.jsx` and `BudgetEditModal.jsx` were hand-rolled (only the X button closes them). The app already has `src/components/modals/basicModal/BasicModal.jsx`, used everywhere else (e.g. the category picker), whose backdrop `onClick={close}` closes on an outside click too. Refactor both to render through `BasicModal` (`renderContent` prop) instead of a custom fixed-position wrapper.

### 4. Past months show a real summary too
`ProjectionMonthDetailModal.jsx` currently only renders the income/expense summary grid for `type === "current"`. Extend it to render for `"actual"` (past, real totals, no estimate columns) and `"estimate"` (future, pure estimate) too — just with different labels, so clicking June is as informative as clicking July.

### 5. Manual per-month balance override for past months
The user needs a way to record what their real balance was in a closed month, since the app can't compute it automatically (`Account.amount` is a live, manually-maintained snapshot). Add `monthlyBalances: [{month: Number, balance: Number}]` to `ProjectionSettings` (one sparse array per wallet+year). Extend `projections/update/route.js` to upsert one month's entry when `monthBalance: {month, balance}` is sent. In `ProjectionMonthDetailModal.jsx`, for past months only, show an editable "Set actual balance for this month" input (prefilled if already set); in `ProjectionsView.jsx`, show that saved value in the Balance column instead of "—" once set. This does not feed into the forward-projected running balance (which still anchors on today's live account total) — it's a historical record, not a new anchor point, to keep the scope contained.

### 6. "Total money today" summary above the table
`ProjectionsClient.jsx` already computes `startingBalance` (sum of non-credit `Account.amount`). Surface it as a labeled line above `ProjectionsView`, with a tooltip explaining it's a live snapshot of today's account totals (excluding credit accounts).

### 7. Tooltips throughout Projections
Reuse the exact `Tooltip` (antd) + question-mark icon pattern already used in `BudgetCont.jsx`/`AccountClient.jsx` (`<Tooltip title="..."><UniversalCategoIcon type="fa/FaRegQuestionCircle" siz={15}/></Tooltip>`). Add next to: the Net column header, the Balance column header, the "unexpected buffer" inputs, the "expected income" section, and the "total money today" line.

### 8. "How Projections works" explainer modal
A dedicated info modal (not just a hover tooltip) — plain-language explanation of Net vs Balance, why past-month Balance needs a manual entry, and the current-month MAX-blend rule (why the current month's total can be higher than what you've actually spent so far). Triggered by a help icon near the table header. Built with `BasicModal` (see #3).

### 9. Separate "unexpected income" buffer
Today only `unexpectedBuffer` (expense side) exists on `ProjectionSettings`. Add a second field `unexpectedIncomeBuffer` (default 0), added into `shadowIncome` the same way the expense buffer is added into `shadowExpense`. Two separate inputs in the modal, both saved via `projections/update`.

### 10. Real date picker for "first payment date"
`IncomeSourcesPanel.jsx` uses a native `<input type="date">`. Replace with the same MUI `MobileDateTimePicker` (`@mui/x-date-pickers`) pattern already used in `AddTransactionComp.jsx`, for visual/UX consistency.

### 11. Account balance becomes editable
`EditAccountModal.jsx` has never had an `amount` input (pre-existing gap, confirmed by reading the original file — the state included `amount` but the form never rendered it). Add the input. No model/route change needed — `Account.amount` and `accounts/update-account` already accept it; this reuses the exact same value Projections already sums for the "total money today" line, so fixing an out-of-sync balance here immediately corrects Projections too.

## Files touched
```
src/helpers/transformers/projectionsChange.js   — bidirectional occurrence fix, unexpectedIncomeBuffer in shadowIncome
src/model/ProjectionSettings.js                 — + unexpectedIncomeBuffer, + monthlyBalances[]
src/app/api/general-data/projections/update/route.js — accept unexpectedIncomeBuffer + monthBalance upsert
src/components/multiUsedComp/Projections/ProjectionsClient.jsx      — total-money line, pass monthlyBalances through
src/components/multiUsedComp/Projections/ProjectionsView.jsx       — currency formatting, tooltips, monthly balance display
src/components/multiUsedComp/Projections/ProjectionMonthDetailModal.jsx — BasicModal refactor, past-month summary, manual balance input, two buffer inputs, tooltips
src/components/multiUsedComp/Projections/ProjectionsInfoModal.jsx   — new, "how this works" explainer
src/components/multiUsedComp/Projections/IncomeSourcesPanel.jsx    — currency formatting, MUI date picker
src/components/multiUsedComp/Budgets/BudgetEditModal.jsx           — BasicModal refactor
src/components/multiUsedComp/Budgets/BudgetBarRow.jsx              — currency formatting
src/components/multiUsedComp/EditAccountModal.jsx                  — + amount input
```

## Verification
1. Set an income source's anchor date to a past/mid-year date, confirm earlier months in the same recurrence cycle now show correct occurrence counts.
2. Confirm every money value in Projections/Budgets shows thousand separators.
3. Click a past month, a current month, and a future month — confirm all three show a populated summary block (not just current).
4. Click outside (on the blurred backdrop) of the month-detail modal and the budget edit modal — confirm they close.
5. Set a manual balance for June, confirm it persists and displays in the table; confirm it does NOT change July's anchor/computed balance.
6. Confirm a "Total money today" line appears above the table and matches the sum of non-credit accounts.
7. Hover the Net/Balance tooltips, confirm the text is clear; open the "how this works" info modal, confirm it explains the MAX-blend rule in plain language.
8. Add an unexpected-income amount, confirm it raises future months' expected income the same way the expense buffer raises expected expense.
9. Edit an account's `amount` on `/dashboard/accounts`, confirm Projections' "Total money today" updates to match.
