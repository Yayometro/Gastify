# Plan: Budgets Management Section (`/dashboard/budgets`)

> Written by Claude Sonnet 5, 2026-07-29, as part of the same session that built `/dashboard/projections`. If you are picking this up cold (different AI, different session, ran out of tokens), read this whole file before touching code — it explains what already exists, what's being added, and why.

## Context / why this exists

Gastify has had a `Budget` Mongoose model and two READ-ONLY visual widgets (`GoalGaugeRange.jsx` for spending budgets, `GoalSavingsRange.jsx` for savings budgets, both rendered inside `BudgetCont.jsx` on the main dashboard) since early in the project — but **no UI has ever existed to create, edit, rename, or delete a Budget**. The user confirmed this directly: budgets that exist today were created by hand in the database, never through the app. This plan adds that missing CRUD surface as its own dashboard section, separate from the read-only dashboard widgets (which are left untouched).

This follows immediately after the Projections feature (`/dashboard/projections`, see git history + `AI_COORDINATION_LOG.md` entries around 2026-07-29) which already reads `Budget.goalAmount` to build expense estimates. **Any Budget created/edited/deleted through this new page must flow into Projections automatically** — see "Projections integration" below; this is basically free because both pages read from the same Redux store.

## What already exists (confirmed by reading the code — don't re-derive this)

- **`src/model/Budget.js`**: `{ name, isSaving, savingAmount, user, wallet, goalAmount, isSurpassed, category, subCategory, archived, history[] }`. The `archived`/`history[]` fields were added earlier in this same session for the Projections feature (soft-delete + versioning) — **already fully wired up**, do not duplicate this work.
- **API routes** (`src/app/api/general-data/budget/{new,update,remove,get}/route.js`): all four already exist and already handle everything this new UI needs, **including** history versioning on `update` and soft-delete on `remove`. **No backend changes needed for this feature** — it is a pure new UI layer over existing routes.
- **Redux** (`src/lib/features/budgetSlice.js`): flat-array slice, store key `state.budgetReducer`, already exports `addNewBudget`, `updateBudget`, `removeBudget` action creators plus `fetchBudget` thunk. Reuse these directly so the new page's writes update the SAME store that Projections and the dashboard widgets read from — no extra fetch/sync logic needed.
- **`GoalSavingsRange.jsx` reveals an important, non-obvious model quirk**: for a saving-type Budget (`isSaving: true`), `savingAmount` is used as **the current amount saved so far** (manually updated by the user over time), while `goalAmount` is the **savings target**. This is the opposite of what the field names suggest at first glance. For a spending-type Budget, `goalAmount` is simply the spending ceiling and there is no "current amount" field on the model — actual spend is always computed live from real transactions.
- **Category/SubCategory picker, already built and used elsewhere** (e.g. `AddTransactionComp.jsx`): wrap the relevant form in `<SelectCategories>` (`src/components/categories/SelectCategoryProvider/SelectCategories.jsx`), then inside it use `useModal()` (`src/hooks/useModalBasic.js`) for open/close state, render `<BtnSelectCategoryContext onClose={handleClose} />` as the picker button (reads the current selection from `SelectCategoryContext`), and conditionally render `<BasicModal close={handleClose} renderContent={<ModalCategoryContent close={handleClose} getSelected={handleCategory} />} />`. `handleCategory(cat)` must replicate the exact logic from `AddTransactionComp.jsx` (~line 154): if `cat.fatherCategory` exists, set `subCategory: cat._id, category: fatherCategoryId`; else set `category: cat._id, subCategory: ""`. **Reuse this exact pattern verbatim** — do not build a new category picker.
- **`EditAccountModal.jsx`** is the closest existing precedent for a create/edit-in-one-modal component (mode prop `"creation"|"edition"`, delete button only shown in edition mode, `fetcher()` + local `useState` form, dispatches the matching Redux action on success). Follow this shape for `BudgetEditModal.jsx`.
- **Dashboard route pattern**: every `/dashboard/*` page is a server component doing `getServerSession()` + redirect-if-absent, rendering one client wrapper. See `src/app/dashboard/projections/page.jsx` (just built) for the freshest example to copy.
- **Navbar**: `src/components/Navbar.jsx`, single shared `<ul className="nav-full">` (visible on desktop always, and toggled open on mobile by the same arrow button) — this is where nav `<li>`s go. Icons are imported individually at the top of the file (not via the dynamic `CategoIcon` helper) from `react-icons/*`.

## What this plan adds

### 1. Route + nav
- `src/app/dashboard/budgets/page.jsx` — copy the exact shape of `projections/page.jsx`, rendering `BudgetsClient`.
- `src/components/multiUsedComp/Budgets/BudgetsClient.jsx` (new folder, same convention as `Projections/`).
- Navbar: new `<li>` with a fresh icon import (`MdSavings` from `react-icons/md` — not already imported/used by anything else) linking to `/dashboard/budgets`, placed in the shared `<ul className="nav-full">`.

### 2. List view — colored bar per Budget, not the old Gauge
`GoalGaugeRange`/`GoalSavingsRange` render one Ant Design `Gauge` each — heavy for a list that may contain many budgets, and the user already called the old gauge look dated when we discussed Projections. For a management LIST page, use a lightweight **horizontal progress bar** (plain styled `<div>`, width = `min(ratio, 1) * 100%`, no charting library): cheaper to render N of, and exactly matches what the user asked for ("una barra... coloreada").

**Color thresholds** (a judgment call — documented here so it's easy to tune later, not hidden in code):
- **Spending budget** (`isSaving` falsy) — `ratio = actualSpend / goalAmount`. High ratio is bad (you're near/over your ceiling):
  - `ratio < 0.6` → green
  - `0.6 ≤ ratio < 0.85` → yellow
  - `0.85 ≤ ratio ≤ 1.0` → orange ("muy cerca del límite")
  - `ratio > 1.0` → red ("lo sobrepasamos")
- **Saving budget** (`isSaving: true`) — `ratio = savingAmount / goalAmount`. Here a HIGH ratio is good (you've hit/exceeded your savings target), so the same 4 buckets are mirrored, not reused as-is:
  - `ratio < 0.3` → red (far from goal)
  - `0.3 ≤ ratio < 0.6` → orange
  - `0.6 ≤ ratio < 0.85` → yellow
  - `ratio ≥ 0.85` → green (on track / goal met)

Put this in one small helper, e.g. `getBudgetBarColor(ratio, isSaving)` in `src/helpers/transformers/budgetHistory.js` (already exists from the Projections work) or a new `budgetColors.js` — either is fine, just don't inline the thresholds twice.

**Actual spend for spending budgets** is computed the same way `GoalGaugeRange` already does it (reuse, don't reinvent): filter transactions to a selected date range, then filter by `subCategory._id` if the Budget has one (precedence over `category`, never both — same rule used everywhere else in this codebase, including the Projections helper `matchBillToBudget` in `projectionsChange.js`), else by `category._id`, then sum `amount`. Reuse the SAME duration-selector UX already established in `BudgetCont.jsx`/`GoalGaugeRange.jsx` (Yesterday/Week/15/30/60/90 days, default 30) for consistency — this page is a general management view, not tied to a calendar month like Projections is.

### 3. Create/Edit modal
`BudgetEditModal.jsx` (mode: `"creation"` | `"edition"`), fields:
- `name` (text)
- `isSaving` (toggle) — flips which of the next two fields is shown/relevant
- `goalAmount` (number) — spending ceiling OR savings target, depending on `isSaving`
- `savingAmount` (number, only shown/editable when `isSaving` is true) — current amount saved so far; the user updates this manually over time as they save (there is no automatic derivation, matching how `GoalSavingsRange` already works)
- Category/SubCategory picker — via `<SelectCategories>` + `BtnSelectCategoryContext` + `ModalCategoryContent`, exactly as described above. Optional for saving budgets (the schema allows it either way), required in practice for spending budgets since that's how actual spend gets matched.
- Delete button (edition mode only) — calls `general-data/budget/remove` (already a soft-delete), dispatches `removeBudget(id)`.
- Submit calls `general-data/budget/new` or `general-data/budget/update` (both already exist and already handle everything needed, including history versioning), dispatches `addNewBudget`/`updateBudget`.

### 4. Projections integration
No code change needed beyond what's above — `ProjectionsClient.jsx` already reads `budgets` from `useGetDataFromProvider()` (the same Redux store this page writes to via the shared action creators), so a Budget created/edited/archived here is picked up by `buildYearProjectionTable` the next time Projections renders. **Verification step**: create a Budget on `/dashboard/budgets`, navigate to `/dashboard/projections`, confirm a future month's expense estimate includes it (this exact check was already done manually once during the Projections build for a test budget and worked correctly).

## Files to create
```
src/app/dashboard/budgets/page.jsx
src/components/multiUsedComp/Budgets/BudgetsClient.jsx
src/components/multiUsedComp/Budgets/BudgetBarRow.jsx
src/components/multiUsedComp/Budgets/BudgetEditModal.jsx
```

## Files to modify
```
src/components/Navbar.jsx        — add nav <li> (MdSavings icon)
src/helpers/transformers/budgetHistory.js  — add getBudgetBarColor(ratio, isSaving) helper
```

No model or API route changes — everything needed already exists from the Projections work earlier this session.

## Verification
1. `npm run dev`, open `/dashboard/budgets`, confirm existing real budgets list with correct colored bars matching their real spend/savings ratio.
2. Create a new spending budget tied to a category, confirm it appears immediately in the list with a green/yellow/orange/red bar matching real transactions in that category.
3. Edit an existing budget's `goalAmount`, confirm the bar color updates and (per the history versioning already built) a new `history[]` entry is appended in Mongo.
4. Create a saving budget, confirm the color logic is mirrored correctly (near/at goal = green, not red).
5. Delete a budget, confirm it disappears from this list AND from the main dashboard's `BudgetCont` widget (soft-delete, `archived: true`), while still contributing correctly to any PAST month in Projections (already covered by the history-versioning verification done for Projections).
6. Navigate to `/dashboard/projections` after creating/editing a budget here, confirm the change is reflected in future months' expense estimate without needing a hard refresh.
