# History Page Comparatives + Snapshots Plan

**Status:** Phases A, B, and C done and verified live against real data. Not yet pushed - Luis
reviews before each push on this initiative.
**Owner:** Luis, implemented by Claude Code

## Motivation

`/dashboard/history` (`HistoryClient.jsx`) shows three sections - income/bills over time, a
categories breakdown, and top-N movements - but every section only ever shows **one** time period
at a time. Luis wants to compare periods directly: this year vs. last year, the last 3 months vs.
the same 3 months last year, or any other pair of ranges - for both the income/bills chart and the
categories breakdown, plus a brand new comparative view for how Budgets performed over time (which
doesn't exist anywhere in the app today).

This is step one of a larger goal: a later **Snapshots** feature (monthly summary, budget
compliance analysis, trend tables, PDF export, eventually readable by the AI connector for deeper
spending-pattern analysis) explicitly depends on solid period-over-period comparison primitives
existing first - hence doing History's comparatives before Snapshots.

## Current architecture (as of 2026-08-28, before this work)

- `HistoryClient.jsx` renders three independent Controller/View pairs, each with its **own**
  local `timePeriod = [start, end]` state - there is no shared time filter across the page, and no
  "compare to another period" capability anywhere in the codebase.
- All aggregation is client-side over `ccTransacciones.data` (every transaction for the wallet,
  fetched once into Redux via `fetchTrans`, unfiltered by date) - each component/section
  re-filters/re-aggregates the same in-memory array by whatever range it cares about.
- Currency-safe summation always goes through `getPrimaryAmount(item)`
  (`src/helpers/transformers/transactionsChange.js`) - every new comparison transformer must too.
- `transactionsToMonths`/`reduceTransToTransMonths` bucket by **calendar month name**
  (january/february/...), which only works correctly within a single year at a time - fine for
  today's single-period views, but wrong for a "vs" comparison whose two ranges span different
  years or don't share calendar months (e.g. "last 3 months" vs "the 3 months before that").
- Controller/View split, Redux Toolkit slices for fetched data, local `useState` for UI-only
  state, `SelecterFilter` (preset dropdown) + `TimeRange` (custom start/end pickers) as the
  standard time-filter UI trio - see `TabsTogglerMontlyController/View.jsx` and
  `HistoricalComparativeCategories(Controller/View).jsx`.
- Budgets have real, mostly-reusable comparison primitives already:
  `getBudgetActualSpend`, `matchBillToBudget`, `getBudgetPeriodRange`, `getValueActiveInMonth`,
  and especially `buildYearProjectionTable` (`src/helpers/transformers/projectionsChange.js`),
  which already builds a 12-month actual-vs-budgeted table for Projections. History currently
  fetches zero budget data.
- **Known gap**: `POST /api/general-data/budget/get` excludes `archived: true` budgets entirely.
  This isn't data loss - `Budget.history[]` (the append-only config log) is preserved forever once
  written, archiving just flips a display flag - but a historical comparative built naively on top
  of that route would silently drop an archived budget's past months. Phase C must query archived
  budgets too when their `history[]` overlaps the requested range.

## Phase A: Income/Bills "vs" comparative

- New state on `TabsTogglerMontlyController`: `compareEnabled` (bool) + `comparePeriod`
  (`[start, end]`, independent of the existing `timePeriod`).
- **New transformer** (`transactionsChange.js`): buckets by **position within the range**
  (month 0, 1, 2...) rather than calendar month name, so two ranges of unequal calendar alignment
  (different years, or non-adjacent ranges) still pair up correctly bar-for-bar. The existing
  `transactionsToMonths` stays untouched (still used by the non-comparison tabs and elsewhere) -
  this is additive, not a refactor of shared code with other call sites.
- UI: a "Compare vs another period" toggle + a second `SelecterFilter`/`TimeRange` pair (reusing
  the exact same filter components, just a second instance), with quick presets derived from the
  primary period (e.g. "same range, 1 year earlier" computed automatically, not just manual).
- Chart: extends the existing "Comparative" tab rather than replacing it - when compare is off,
  behavior is pixel-identical to today; when on, adds period A/B as a further grouping dimension
  on the existing `@ant-design/plots` grouped Column chart.

**Phase A implementation notes:** additive, not a rework - the existing "Comparative"/"Bills"/
"Incomes" tabs are pixel-identical when the new "Compare vs another period" checkbox is off. When
on, a 4th "Compare periods" tab appears with a second `SelecterFilter`+`TimeRange` pair (defaults
to the primary range shifted back exactly one year) and a chart (income/bill × period A/period B)
using the new `transactionsToRelativeMonths` bucketing. Two bugs caught in live testing and fixed
before shipping:
- The base `ColumnChartAntComparative`'s default label divides by its `totalValue` prop to show a
  percentage, but that prop is a JSX summary block here (not a number) - NaN% until
  `generatePropForChartColAntPeriodCompare` overrode `label.text` to show the formatted amount
  directly instead.
- **First shipped version grouped all 4 bars side by side per month** (income A, bill A, income
  B, bill B in a row) - Luis's feedback: this read as confusing left-right scanning rather than a
  clear "this period vs that period" comparison. Changed to a **mirrored/diverging layout**:
  period A's bars render above the zero line, period B's (values negated in the controller) below
  it - the same month position on the x-axis, one period up, the other down. Labels/tooltip show
  `Math.abs(value)` so a downward bar never reads as "negative spending."

Verified live against real transaction data (2026 vs. 2025, 3-month range) both before and after
the mirrored-layout fix: correct per-period totals/balance, correct month-by-month alignment
across the year boundary, correct tooltip, no negative-looking labels.

## Phase B: Categories "vs" comparative

- Reuses Phase A's dual-range filter UI/state as-is.
- Aggregation is simpler than Phase A - `reduceAndTransforToCategories` per range (period totals,
  not month-bucketed), then paired by category name/id across the two periods.
- Needs a decision on categories present in one period but not the other (render as zero in the
  missing period's bar rather than hiding the category).

## Phase C: Budgets comparative (new section) - done and verified live (2026-08-28)

New "Budgets comparative" section on `dashboard/history`, after Categories comparative - this
page's own time-range filter (`SelecterFilter`+`TimeRange`, same pattern as every other section),
no "vs another period" toggle here (unlike A/B - this isn't a two-period comparison, it's a
month-by-month view of one selected range, which is what Luis actually asked for: "ponerle el
filtro de tiempo en budget... poder ver los budgets de cada mes").

- **New route**: `POST /budget/get-historical` (`src/app/api/general-data/budget/get-historical/
  route.js`) - same populate shape as `/budget/get` but deliberately does **not** exclude
  `archived: true` budgets. Archiving only flips a display flag; `history[]` (the append-only
  config log) is never deleted, so an archived budget's past months would otherwise silently
  vanish from a historical view. Kept as a separate route rather than adding a flag to `/budget/
  get`, to avoid touching behavior every other consumer (Budgets page, Projections) depends on.
- **New transformer**: `buildBudgetHistoricalComparative({ budgets, transactions, startDate,
  endDate })` in `src/helpers/transformers/budgetHistoricalComparative.js`:
  - Scoped to **spending budgets only** (`isSpendingBudget`) - saving budgets accumulate toward a
    goal via linked accounts and project budgets link to one-off transactions directly, neither
    tracks a recurring monthly limit the way spending budgets do, so "typically met vs exceeded"
    doesn't apply to them the same way. Documented scope boundary, not an oversight.
  - Per spending budget, per calendar month in the picked range: resolves the goalAmount that was
    actually in effect that month via `getValueActiveInMonth(budget.history, monthStart)` (same
    primitive Projections' `buildYearProjectionTable` uses) - a month with **no** resolvable
    historical config is skipped entirely (not defaulted to a $0 goal), since that means the
    budget didn't exist with that config yet, not that it was violated. Falls back to the budget's
    current config for the whole range only when `history[]` is empty, still respecting
    `createdAt` so months before the budget existed are excluded.
  - A period other than `monthly` (quarterly/biannual/yearly) has its goalAmount divided by the
    period's month count (3/6/12) to get a fair monthly-equivalent share, rather than being
    excluded or compared against the full multi-month goal.
  - Rows are sorted **worst-compliance-first** - the budgets habitually exceeded surface at the
    top, directly matching Luis's "para que se pueda hacer un análisis de por qué esos budgets
    siempre son sobrepasados."
  - 7 unit tests cover: met/exceeded classification, the period-divisor math, excluding
    pre-creation months, historical (not current) goalAmount resolution, saving/project exclusion,
    and the worst-first sort.
- **UI**: `HistoricalBudgetsComparative` (Controller) + `HistoricalBudgetsComparativeView` +
  `BudgetHistoricalComparativeRow` - each budget is a row (icon, name, "X of Y months met", a
  compliance % headline) plus a strip of small colored month-cells (green/red via the existing
  `getBudgetBarColor` helper, same visual language as `BudgetBarRow`'s progress bar elsewhere),
  each cell's exact actual-vs-goal figures available on hover.
- **Verified live** against real budget/transaction data: correct compliance percentages, correct
  recalculation when switching the time filter (e.g. "Last 3 months" -> "All 2026"), correct
  worst-first ordering, no console errors beyond the pre-existing unrelated `@nivo/core`
  `defaultProps` deprecation warning.

### Visual redesign round 2 (2026-08-28, same day) - Luis's feedback on the first cut

First-cut cells (plain colored squares, no visible info) weren't intuitive - Luis: "no te
explican qué es de cada qué." Presented 3 mockup options as an Artifact (colored cells / mini bar
chart / click-through modal) since the in-chat interactive-widget preview wasn't rendering for
him; he approved a hybrid of the bar-chart option (shows magnitude, not just pass/fail) plus
labeled cells (info visible without hovering) plus the modal. Shipped:

- **`BudgetHistoricalComparativeRow`** rebuilt as a mini bar chart - bar height is the
  **actual/goal ratio** (not raw dollars), so the dashed "goal" reference line lands in the same
  place every month even when the dollar goal itself changed (period/history changes) or differs
  budget-to-budget. Each bar shows its own compact amount above it and month label below (no
  hover needed to know what's being shown), plus the exact figures still on hover. The whole row
  is clickable (and keyboard-operable) to open the detail modal.
- **`BudgetHistoricalDetailModal`** (new) - opens via the app's existing `useModalBasic`/
  `BasicModal` pattern (same one `HistoricalComparativeCategories`' top-item modal uses). Full
  month-by-month table: month, actual, goal, result:
  - Renders its own header/close-button chrome rather than relying on `BasicModal`'s default
    wrapper - required by that pattern (`renderContent` bypasses the default chrome entirely, so
    the content component supplies its own, matching `ModalContentTopMonthItem`).
- **Real bug found and fixed during this round's live testing** (not present in round 1's simpler
  UI, only became visible once individual months were): `buildBudgetHistoricalComparative` didn't
  exclude months that hadn't started yet - selecting "All 2026" in August counted
  September-December as "met" purely because their $0 actual (nothing had happened yet) was
  ≤ any positive goal, inflating a budget's real 0%-so-far compliance up to a misleading 80%.
  Fixed by skipping any month whose start is after `today` (new optional `today` param on
  `buildBudgetHistoricalComparative`, defaults to `new Date()` in real use, injectable in tests).
  New regression test added alongside the original 7.
- Mockup delivery note: the in-chat interactive-widget preview didn't render for Luis in this
  session - worked around by publishing the mockup as a Claude Artifact instead, which did.

### Round 3 (2026-08-29) - extrapolate backward instead of excluding pre-history months

Live-testing round 2 surfaced that budgets created mid-2026 (verified directly in MongoDB -
`E-accounts`/`Comida - Despensa` both `createdAt: 2026-07-29`) only showed one real month even
across "All 2026," which read as broken/pointless for historical analysis. Root cause: no bug -
those budgets genuinely have no `history[]` coverage before their creation date, so
`resolveMonthlyGoalAmount` correctly had nothing to compare against and skipped those months.
Luis's call: don't skip - extrapolate backward using the **earliest known goal** (oldest
`history[]` entry, or current `goalAmount` when there's no history at all) so real spend before
the budget existed still shows, clearly flagged as an estimate rather than a verified figure.

- `getEarliestKnownGoal(budget)` (new) finds the oldest history entry (or falls back to current
  `goalAmount`/`createdAt` when there's no history array at all).
- `resolveMonthlyGoalAmount` now always returns a goal (never skips) - `{goalAmount, estimated}`.
  A month covered by a real history entry is `estimated: false`; a month before the earliest
  known config uses that earliest goal and is `estimated: true`.
- Each `monthlySeries` entry now carries `estimated`; each row carries a `monthsEstimated` count.
- UI: estimated bars get a diagonal-stripe pattern + reduced opacity (not just a tooltip
  difference - visible without hovering), a `*` on the month label, and the row's "X of Y months
  met" line appends "· N estimated" with an explanatory hover. The detail modal marks the same
  months with `*` plus a footnote. 2 new tests replace the old "excludes pre-creation months"
  test (which no longer reflects the real behavior) and cover both the no-history and
  has-history extrapolation paths - 165/165 total passing.
- Verified live: "All 2026" on `E-accounts (entertainment)` now correctly shows 8 months
  (Jan-Aug), 7 marked estimated (striped) and 1 real (solid, August), matching what really
  happened in Mongo.
### Round 4 (2026-08-29) - switched to the real chart library, widened the modal

Luis approved round 3's data fix but confirmed he didn't like the hand-rolled div bars - asked to
switch to whichever chart component (Ant Design or Nivo) is easiest to customize, plus widen the
detail modal's table for better distribution.

- **`BudgetHistoricalComparativeRow` rebuilt on `ColumnChartAntComparative`** (the same component
  Phase A/B's "Compare periods" tabs use) instead of hand-rolled flex/div bars. New
  `propsForBudgetMonthlyChart.js` shapes each budget's `monthlySeries` into a **grouped bar
  chart**: two bars per month, "Actual" (colored by met/exceeded via the existing
  `getBudgetBarColor`, dimmed via `fillOpacity` when `estimated`) and "Goal" (flat neutral gray
  reference) - this reads correctly even when the goal itself changed month to month, since each
  month draws its own goal bar rather than relying on one shared reference line.
  - Real interactive tooltip (not a native `title` attribute) showing month, actual, goal, and
    result, with "(estimated goal)" appended when applicable - looked up from the closed-over
    `monthlySeries` by month label rather than trusting the chart library's undocumented
    `items[].origin` shape.
  - Chart now fills the row's full width responsively, matching every other chart on the page.
  - The whole card (header + chart) stays clickable to open the detail modal, per Luis's original
    ask that clicking anywhere on a budget - bars included - opens it.
- **`BudgetHistoricalDetailModal` widened** from `max-w-[420px]` to `max-w-[640px]`, with more
  padding/row height, so the table isn't cramped.
- Verified live: real Ant tooltip on hover (exact figures + estimated flag), click-to-open still
  works from the chart area, modal visibly wider with better-distributed columns, no console
  errors, 165/165 tests, 0 lint errors.

### Round 5 (2026-08-29) - Top elements section: rows instead of boxes, plus a compare table

Luis asked to redesign the "Top 6 elements by month" section (transactions and categories under
Bills/Incomes) - not the chart, the actual list layout. Kept the colors (undecided whether to
change them later) and kept click-to-open-modal working exactly as before for both transactions
and categories - only the "cells" changed.

- **New `TopTransactionRow.jsx`** - literally reuses the real `TransactionItemList` component
  (same row used everywhere else transactions are listed), wrapped in a clickable layer so a click
  anywhere on the row opens `ModalContentTopMonthItem`, stacked one per line instead of tiled
  AtomicTop squares.
- **New `TopCategoryRow.jsx`** - deliberately mirrors `TransactionItemList`'s shape (icon circle
  left, name + amount stacked to its right) since a category aggregate can't reuse that component
  directly, plus a rank number (1, 2, 3...) on the far left, per Luis's spec.
- **`TopMonthItem.jsx`/`TopMonthContainer.jsx`** - swapped the AtomicTop grid for a `mode`-driven
  stack of `TopTransactionRow`/`TopCategoryRow`, one full-width column per month instead of a
  2-3-column grid of month boxes (rows need the width). Both components are used exclusively by
  this History section, so nothing else on the site (Dashboard's own Top3/AtomicTop usage) was
  touched.
- **New "Compare vs another period" table** for this section, matching the toggle UI already used
  by Categories comparative - but rendered as a literal two-column table (not a chart), per Luis's
  spec: the *earlier* of the two picked periods always renders on the left, the later one on the
  right, with rows aligned by relative month position (`orderItemsInRelativeMonth` +
  `mergeTopElementsForCompareTable`, new tested helpers in `transactionsChange.js`) so a
  2025-vs-2026 comparison lines up January with January regardless of which side the user picked
  first. New `TopElementsCompareTable.jsx` renders both a Transactions-comparative and a
  Categories-comparative section, reusing the same row components and the same detail modal.
- Verified live: transaction rows render as real `TransactionItemList` rows with working
  click-to-open; category rows show rank + icon + name + amount and open the right category modal;
  toggling "Compare vs another period" adds "Compare bills"/"Compare incomes" tabs showing the
  earlier period on the left and the later on the right, month-aligned (June 2025 next to June
  2026, etc.), with working click-to-open from inside the compare table too. No new console
  errors (one pre-existing unrelated Nivo `defaultProps` warning from the separate Categories
  chart). 169/169 tests, 0 lint errors.

### Round 6 (2026-08-29) - fixed a width bug, restored the horizontal month layout, polished labels

Live feedback on round 5: Luis loved the compare table exactly as built, just wanted the month
labels inside it more visually distinct. But the non-compare Bills/Incomes view (the regular
Top 6 Transactions/Categories, no comparison) had a real problem: months were stacked vertically
one under another instead of side by side like before, wasting horizontal space, and the
Categories box rendered noticeably narrower than the Transactions box even though both use the
same grid.

- **Root cause of the narrow-Categories bug**: `TopMonthContainer`'s outer wrapper div had no
  `w-full` - as a flex item under an `items-center` ancestor with no definite width of its own, it
  was shrink-wrapping to its content's natural size instead of stretching to the available width.
  Transaction rows are naturally wider (icon + name/account/tags on one side, amount + date on the
  other), so that instance's wrapper shrank to a wider size than the Categories instance's wrapper
  (whose rows are more compact) - same CSS, two different resolved widths, which is exactly what
  looked "chiquito." Fixed by adding `w-full` to the outer wrapper (matching the pattern already
  used successfully in `TopElementsCompareTable`), so every instance now stretches to the same,
  real available width regardless of its content.
- **Restored the horizontal month grid** - `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3` (was
  temporarily forced to a single stacked column in round 5) so months tile side by side again;
  with the default "Last 3 months" filter and a normal desktop width, June/July/August now render
  as three columns like they did before the round-5 redesign, not stacked.
- **`TopCategoryRow` layout tweak** (a second live-feedback round in the same sitting): moved the
  category title next to the icon circle (was stacked below it) and the amount out to the far
  right in bigger, bolder text - mirrors `TransactionItemList`'s actual left/right split instead
  of the icon-over-name-over-amount stack, which is what the "también sé sumamente parecido" ask
  in round 5 was really going for once seen live.
- **Compare table month labels**: `CompareCell` now renders each `monthLabel` ("June 2026") as a
  bold, colored pill instead of small gray text - reuses the exact same per-calendar-month color
  palette (`mapedMonths` in `timeFunctions.js`) the rest of the app already color-codes months
  with, so June reads as the same color here as everywhere else on the page rather than an
  arbitrary new one.
- Verified live: Top 6 Transactions/Categories render three months side by side at equal width;
  Categories no longer looks squeezed next to Transactions; category rows now read
  icon+name-left/amount-right like a transaction row; compare table's June/July/August labels are
  bold and colored (cyan/purple/orange) consistently across both compared periods. 169/169 tests,
  0 lint errors.

### Round 7 (2026-08-29) - toned down the month colors, numbers instead of icons

More live feedback, same sitting: the round-6 rainbow month colors gave Luis a literal headache
looking at a full range of months, and the compare table's newly-colored month-label pills weren't
what he meant - he wanted the *text* colored, centered, not a colored background block.

- **`TopMonthItem` (non-compare Top 6 Transactions/Categories)**: dropped the per-calendar-month
  rainbow background entirely - every month card is now one flat, subtle `bg-purple-50` instead of
  a different color per month. The little top-left circle badge used to show a Material icon that
  happened to encode the calendar month number (e.g. `MdOutlineFilter6` for June) - kept the badge
  and the numbering idea, but swapped the icon glyph for the literal number it always represented,
  extracted straight out of the icon name. Month titles ("JUNE", "JULY") now render in
  `text-purple-700` instead of default black, so they stay legible against the flat purple card
  without needing a different color per month.
- **`TopElementsCompareTable`'s month labels**: reverted the round-6 colored-background-pill
  treatment - no background at all now, just bold `text-purple-800` text, and centered (matching
  how the regular Top 6 month titles are already centered) instead of left-aligned. Dropped the
  per-calendar-month color lookup entirely here too, in favor of one consistent dark purple that
  matches Gastify's existing purple identity.
- Verified live: Top 6 Transactions/Categories all show the same muted purple card with numbered
  badges (6/7/8 for June/July/August) instead of rainbow colors and month icons; compare table's
  "June 2025"/"June 2026" labels render as centered, bold dark-purple text with no background.
  No new console errors. 169/169 tests, 0 lint errors.

### Round 8 (2026-08-29) - fixed the original "Compare periods" chart, unified the toggle everywhere

Luis sent a screenshot with hand-drawn annotations on the Transactions History page's
"Compare periods" tab (the income/bills mirrored chart built early in this session, before the
Top-elements/Categories work) - the up/down bars weren't actually paired/centered despite an
earlier fix claiming so, the income/bills/balance stats were stacked instead of side by side, and
the "Compare vs another period" checkbox looked bad and should be circular and on-brand. Since
that exact checkbox+filter-row block had been copy-pasted three times this session (Transactions
History, Categories comparative, Top elements), this became a shared-component extraction instead
of three separate patches.

- **Root cause of the misaligned bars**: `TabsTogglerMontlyController`'s compare-chart data
  bucketed only by `type` = `"Month 1"` / `"Month 2"` / etc., so all 4 series (income A, income B,
  bill A, bill B) landed in the *same* x-axis bucket together. `ColumnChartAntComparative`'s
  `group:true` then spread all 4 side by side in whatever order the color field happened to sort
  to - income and bill bars ended up interleaved instead of income-over-income and bill-over-bill.
  Fixed by folding the metric into the bucket key too (`"Month 1 Income"`, `"Month 1 Bill"`, ...),
  so each x-axis bucket only ever contains the 2 bars actually being compared - they render
  directly stacked/centered on the same x position, up above zero for the current period and down
  below it for the compared one. Verified live: `MXN $152,307.95` (income, current period) sits
  directly above `MXN $129,725.00` (income, compared period) at the same x position, with the bill
  pair likewise centered in the next bucket over.
- **Stats block turned side by side with a VS between**, in both
  `propsColTabsToggler.js` (income/bills) and `propsForCategoryCompareChart.js` (categories) -
  was stacked vertically with a plain divider line; now reads "this period vs that period" left
  to right in one glance, matching what Luis actually meant by "sepáralo mejor, uno izquierda uno
  derecha."
- **New shared `PeriodFiltersWithCompare` component** (`multiUsedComp/periodFiltersWithCompare/`)
  replaces the checkbox+two-filter-rows block that had been duplicated verbatim in
  `TabsTogglerMontlyView`, `HistoricalComparativeCategoriesView`, and `HistoricalMovementsView`.
  One implementation now backs all three "Compare" toggles on the page:
  - Circular checkbox (`appearance-none` + `checked:bg-purple-600`) instead of a native square
    checkbox, matching Gastify's purple.
  - Label shortened to just "Compare" with the previous "Compare vs another period" wording moved
    into a hover tooltip, plus the same "?" question-mark icon used for every other inline help
    hint on this page.
  - Responsive layout: the primary period filter and (once compare is on) the second period's
    filter sit side by side with "VS" between them on `lg+` screens; below that breakpoint (and on
    mobile) they stack vertically, VS still between them - matches Luis's "uno arriba/abajo en
    teléfono, uno izquierda/derecha en desktop" ask exactly.
  - `HistoricalMovementsView`'s extra `SelecterItemsToDisplay` control (top-N picker, unique to
    that section) passes through via a new `extraControls` slot rather than being lost in the
    consolidation.
- Verified live at desktop width: all three "Compare" toggles render as filled purple circles;
  enabling one puts the primary filter on the left, "VS" centered, the second filter on the right,
  all in one row. Resized to 400px (mobile): the same two filters stack vertically with VS between
  them, as intended. No new console errors. 169/169 tests, 0 lint errors.

### Round 9 (2026-08-29) - two more bugs found via a second annotated screenshot

Luis tested round 8 with two periods of genuinely different data (not two periods that happened to
resolve to identical dates) and sent another annotated screenshot: the paired bars still didn't
look "one behind the other," and there was a visible gap under the right-hand filter block that
wasn't under the left one. Both turned out to be real, narrowly-scoped bugs, reproduced live before
fixing.

- **Bar pairs had a real gap, not just a perception issue**: `style.inset: 0.2` (inherited from
  `ColumnChartAntComparative`'s usual default) pads every bar within its slot - invisible when the
  two compared values happen to be equal (a same-vs-same test looks like one continuous shape
  either way) but a visible gap once they differ, which is exactly why "Last 3 months vs Last 3
  months" looked right and a real custom comparison didn't. Set `inset: 0` in both
  `generatePropForChartColAntPeriodCompare` (income/bills) and `generatePropForCategoryCompareChart`
  (categories) - confirmed live the two bars in a pair now render flush, touching, with zero gap
  between them regardless of how different their heights are.
- **Root cause of the filter-row asymmetry**: `PeriodFiltersWithCompare`'s primary block rendered
  two lines (a "From: ... to: ..." label above its controls) while the compare block rendered only
  one (just the controls, no label) - measured live via `getBoundingClientRect()`: primary block
  49px tall, compare block 29px tall, both vertically centered by the row's `items-center`, so the
  shorter block sat a few pixels off from the taller one - read as "space under the right side."
  Added the same From/To label above the compare block's controls (using `comparePeriod` instead
  of `timePeriod`) - re-measured live, both blocks now report identical 49px height and the same
  `top` offset. This also means the second period's actual date range is labeled now, which it
  wasn't before.
- Verified live by reproducing Luis's exact scenario (primary "Last 3 months" preset vs. a manual
  2026-03-01–2026-05-31 compare range): bar pairs flush with no gap, both filter blocks the same
  height and vertically aligned, no new console errors. 169/169 tests, 0 lint errors.

### Round 10 (2026-08-29) - the actual root cause: `dodgeX`, not spacing

Round 9's `inset: 0` closed the visible gap between a pair's two bars but didn't fix the real bug -
Luis sent a third annotated screenshot showing the two bars still offset from each other
horizontally (not sharing an x position at all, just touching). He suspected the chart library
itself (guessed Nivo) might not be capable of this and asked to either fix it for real or go find
an alternative. It's actually `@ant-design/plots` (G2 under the hood), not Nivo - Nivo is used
elsewhere on this page (`ResponsiveBarsChartComponent`, the single-period Bills/Incomes tabs) but
not for this "Compare periods" chart.

- **Actual root cause, found in `@ant-design/plots`' own source**
  (`node_modules/@ant-design/plots/lib/core/constants/index.js`): the base `ColumnChartAntComparative`
  hardcodes `group: true`, and this library maps `group: true` directly to a G2 `dodgeX` transform -
  literally "split same-x-category bars into side-by-side sub-slots." That transform is what moved
  the two compared bars apart; `inset` only controls padding *within* whatever sub-slot dodgeX
  already assigned, so shrinking it to 0 could only close the gap, never the underlying horizontal
  offset. Confirmed the mapping directly in the library source before touching anything, rather
  than guessing at the config.
- **Fix**: override `group: false` in the `propPlus` for both mirrored-compare charts
  (`generatePropForChartColAntPeriodCompare` for income/bills, `generatePropForCategoryCompareChart`
  for categories) - `false` still produces a transform entry but with `available: false`, which G2
  treats as disabled. Without dodgeX, the two bars sharing an x-category (this period, that period)
  now render as one visual column split at the zero line - each independently anchored at 0 (up for
  the current period, down for the already-negated compared period), sharing the exact same x pixel
  range instead of sitting in adjacent sub-slots.
- Verified live, reproducing Luis's same-scenario test (primary "Last 3 months" vs. manual
  2026-03-01–2026-05-31): zoomed into "Month 1 Bill" - `MXN $113,843.06` (up) and `MXN $178,150.63`
  (down) now render as a single two-toned column with identical left/right edges, no horizontal
  offset. Same check on the Categories "Compare bills" chart (per-category pairs, e.g. "House"):
  same result. No new console errors. 169/169 tests, 0 lint errors.

### Round 11 (2026-08-29) - inline labels get unreadable at wide date ranges

Once the alignment was actually right, Luis noticed a new problem at wider comparisons: "All 2026
vs All 2025" (12 months = 24 x-axis buckets) looked cluttered - the `MXN $XX,XXX.XX`-formatted
labels are wider than each bucket gets once there are that many, so adjacent labels visually pile
on top of each other. He'd already correctly diagnosed the geometry (labels anchor to the bar's
far tip for the up series and near the zero line for the down series) and proposed the fix himself:
past some bar count, drop the always-on labels and let the tooltip (already showing the same
numbers on hover) carry the detail instead.

- **`generatePropForChartColAntPeriodCompare`** (income/bills "Compare periods" tab): added
  `showInlineLabels = new Set(compareData.map(d => d.type)).size <= 12` and set `label: false` when
  it's over that count. 12 buckets = 6 months, comfortably above the 3-month/6-bucket case Luis
  confirmed looks good and safely below the 24-bucket full-year case that didn't. The tooltip is
  untouched - it already renders both compared values on hover regardless of the inline-label
  setting, so nothing is actually lost past the threshold, just moved from always-visible to
  on-hover.
- **Categories "Compare bills/incomes" chart left as-is** - it's already hard-capped to the top 10
  categories by combined amount (`mergeCategoriesForCompareChart`'s `limit` param), which stays
  under the 12-bucket threshold that caused problems elsewhere, so there's no reported (or
  reproduced) breakage there to fix.
- Verified live: switched the primary filter to "All 2026" and the compare filter to "All 2025" (24
  buckets) - chart renders clean with zero inline labels and no visual clutter, bars still correctly
  paired/aligned per Round 10's fix. Re-checked the 3-month case still shows its labels normally.
  No new console errors. 169/169 tests, 0 lint errors.

### Round 12 (2026-08-29) - Categories comparative's mirrored chart replaced with a table

Luis found a real structural problem, not a styling one: Categories comparative's "Compare
bills"/"Compare incomes" chart put both periods' categories on one shared x-axis, ordered by
combined (A+B) value - so the row order didn't match either period's own individual ranking. His
concrete example: 2026's real top 5 bill categories are Vacations, House, Electronics, Health,
Food; 2025's are House, Family, Electronics, Food, Restaurant. The shared-axis chart instead showed
one merged order (Vacation, House, Family, Electronics, Food, Restaurant, Clothes, Health,
Entertainment, Taxes) that doesn't represent what either year actually looked like. He correctly
identified this as inherent to a shared-x-axis chart, not a config bug, and asked for an alternative
- possibly a table.

- **Replaced the chart with a table** - new `CategoriesCompareTable.jsx` renders two independent
  columns (period A left, period B right), each its own top-10 ranked purely by that period's own
  values via the same `reduceAndTransforToCategories()` output already computed for the regular
  Bills/Incomes tabs (no shared ordering constraint at all). Reuses `TopCategoryRow` (the same row
  component from the Top-elements section) for a consistent look and working click-to-open-modal.
- **`HistoricalComparativeCategories.jsx`** simplified accordingly: the compare effect now just
  keeps each period's already-correctly-sorted `reduceAndTransforToCategories()` array instead of
  merging them into one joint-ordered, sign-flipped chart dataset.
- **Removed now-dead code**: `mergeCategoriesForCompareChart` (`transactionsChange.js`) and
  `propsForCategoryCompareChart.js` had no other callers once the table replaced their only
  consumer - deleted rather than left as unused code.
- Verified live reproducing Luis's exact scenario ("All 2026" vs "All 2025", Compare bills): left
  column reads Vacations → House → Electronics → Health → Food → Restaurant; right column reads
  House → Family → Electronics → Food → Restaurant → Vacations - matching his own reported
  per-year rankings exactly, each column independently ordered. Click-to-open still works (opened
  "Vacations" from the left column, modal listed the real underlying transactions). No console
  errors. 169/169 tests, 0 lint errors.

### Round 13 (2026-08-31) - real month names on the axis, preset names instead of raw ranges

Two small-but-annoying labeling issues, both about the same underlying idea: show the user-facing
name they'd recognize, not an internal identifier or a raw computed value.

- **"Month 1 Income"/"Month 2 Bill" → real month names** on the Transactions History "Compare
  periods" chart's x-axis. `transactionsToRelativeMonths()` already computes a `monthLabel` per
  bucket ("June 2026") alongside the generic `type` ("Month 1") used for x-axis bucketing -
  `TabsTogglerMontlyController`'s `tagOne()` now derives the shared bucket name from period A's
  `monthLabel` (dropping the year, since the totals header above the chart already shows each
  period's full range) instead of the generic `Month N`, giving axis labels like "June Income",
  "June Bill", ... "December Income", "December Bill". Falls back to period B's month name (or
  `Month N` as a last resort) for the rare case where A has no data at that relative index at all.
- **New `getPeriodLabel(periodOptions, range)` helper** (`timeFunctions.js`) - looks up whether a
  `[start, end]` range resolves to one of the named presets already in the SelecterFilter's options
  list (matched by timestamp, not string identity) and returns that preset's name ("All 2026")
  instead of the raw "2026-01-01 to 2026-12-31" wherever a period gets labeled in a comparative
  view; falls back to the raw range only for a genuinely custom/manual pick, which has no name.
  Applied everywhere a `labelA`/`labelB` (or `labelLeft`/`labelRight`) pair is built: Transactions
  History's income/bills compare, Categories comparative, and the Top-elements compare table - all
  three had the same copy-pasted raw-range construction. Each controller's `timePeriodsForSelecter`
  array (previously rebuilt fresh on every render, defined near the bottom of the component) moved
  into a `useMemo(() => [...], [])` near the top instead, both so it can sit safely in the compare
  effect's dependency array (a fresh array reference every render would otherwise re-trigger that
  effect in a loop) and so `getPeriodLabel` has it available before the effect that needs it runs.
- Verified live in all three sections: Transactions History's "Compare periods" tab shows "June
  Income"/"June Bill"/... "December Income"/"December Bill" as x-axis labels, and its totals header
  reads "All 2026" / "All 2025" instead of the ISO date range; Categories comparative's "Compare
  bills" headers show the same; Top-elements compare table shows "All 2025"/"All 2026" once both
  sides are actually set to a matching preset (confirmed the raw-range fallback is correct, not a
  bug, when the compare side's default doesn't match any preset - a separate, pre-existing default
  mismatch not part of this round's ask). No console errors. 172/172 tests (added
  `timeFunctions.test.js` for `getPeriodLabel`), 0 lint errors.

### Round 15 (2026-08-31) - compare-only tabs going blank when toggled off mid-view

Luis found this happening identically in all three "Compare" sections (Transactions History's
"Compare periods", Categories comparative's "Compare bills"/"Compare incomes", Top elements'
"Compare bills"/"Compare incomes"): enable Compare, switch to the compare-only tab, look at it,
then click the Compare checkbox again while still on that tab - the content goes blank instead of
showing anything.

- **Root cause, in the one shared `TabsToggler.jsx`** every "Compare" section uses: its `active`
  tab is local `useState`, initialized once from `tabs[0]` at mount and never revisited. Each
  controller's `tabs` array is rebuilt on every render and only includes "Compare periods" (or
  "Compare bills"/"Compare incomes") while `compareEnabled` is true - so toggling Compare back off
  while that tab is active removes it from `tabs`, but `active` keeps pointing at the now-gone tab
  name. `compontentsArray.filter(...)` then matches nothing, and `TabsToggler` fell through to its
  `EmptyModule` fallback - a silent blank instead of an error, which is exactly why it looked like
  the content had simply vanished.
- **Fix**: added a `useEffect` that checks, whenever `tabs` changes, whether `active` still exists
  in it - if not, resets `active` to `tabs[0]`. Since `TabsToggler` is the single shared component
  behind every tab strip on the History page, this one change fixes all three reported spots (and
  any future one) at once, rather than patching each controller separately.
- Verified live in all three sections, reproducing Luis's exact steps (enable Compare → switch to
  the compare tab → toggle Compare off while still on it): each one now falls back to its first
  tab ("Comparative", "Bills") with real content instead of going blank. No console errors.
  172/172 tests, 0 lint errors.

## Later: Snapshots (not scoped yet, explicitly after History work lands)

A richer monthly summary than picking a month in Wallet gives you today - same building blocks
(Transactions Resume, Top 6 transactions/categories, Budget performance) plus: which budgets were
exceeded vs. met, a trend table (this month vs. the established yearly trend - in line with it or
an exception), exportable as PDF, and eventually exposed as MCP tool(s) so Claude/ChatGPT can pull
a wallet's spending-pattern data for deeper analysis (trends, peak-spending months, YoY
comparisons) - directly building on Phase C's per-period aggregation work.
