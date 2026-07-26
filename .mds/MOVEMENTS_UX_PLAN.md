# Plan: Movements UX follow-up (category picker modal, delete-list previews, duplicate comparison view)

> **Metadata**
> - **Written by**: Claude Sonnet 5 (Anthropic), research-only — **nothing in this document has been implemented**.
> - **Intended executor**: Gemini (or whichever AI/session picks this up next).
> - **Date**: 2026-07-25
> - **Why this doc exists**: the user tested the exact-amount/Category/SubCategory filters added to `Movements.jsx` (see `AI_COORDINATION_LOG.md` Entry #11) and asked for 3 follow-up UX changes, but wanted them fully researched and documented rather than implemented in the same session (token budget). Every file/line reference below was verified by directly reading the source, not guessed — check `AI_COORDINATION_LOG.md` Entry #11/#12 for the session this came out of if anything here seems stale.

All work in this doc is scoped to **`src/components/multiUsedComp/Movements.jsx`** plus a handful of already-existing shared components it will need to import. No backend/API/model changes are needed for any of the 3 items.

---

## Part 1 — Category/SubCategory filter: replace the dropdowns with the existing "Select Category" modal

### Current state (already implemented, works, but not what the user wants visually)
`Movements.jsx` currently has `categoryFilter`/`subCategoryFilter` state (two separate `_id` strings, `""` = inactive) rendered as **two native `<select>` dropdowns** at lines **667-714**, each with its own `MdClose` clear button. Filtering logic is at lines **141-146**; reset logic in `handleCleanFilter` (lines **246-260**); summary text in `buildFilterSummary` (lines **270-277**). All of that plumbing is correct and should **stay** — only the *trigger UI* changes, from two `<select>`s to one button that opens the existing category-picker modal.

### What the user wants instead
A **single button** (not two dropdowns) that opens the same modal already used elsewhere in the app for picking a category or subcategory — the one you see when creating a transaction and tapping the category field. Next to the button, a "?" tooltip explaining "here you filter by Category or SubCategory", matching the tooltip pattern already used for the date filter.

### The existing modal system (fully traced, verified by reading every file)
- **Context provider**: `src/components/categories/SelectCategoryProvider/SelectCategoryProvider.jsx` (wrapped for use via `src/components/categories/SelectCategoryProvider/SelectCategories.jsx`). Fetches categories+subcategories, builds a tree via `organizedCategoriesAndSubCategories()` (`src/helpers/transformers/categoriesTransformers.js`), exposes `itemSelected`, `handleSelect(category, callBack, close)`, `handleClean()` via `SelectCategoryContext`.
- **Trigger button**: `src/components/buttons/buttonWrappers/selectBtnCategoryWithContext.jsx` (`BtnSelectCategoryContext`) → renders `SelectCategoryBtn` (`src/components/buttons/selectCategoryBtn/SelectCategoryBtn.jsx`). Shows "Selected: {itemSelected?.name || 'Nothing...'}" and opens the modal on click via its `onClose` prop (badly named — it's actually the *open* trigger, see below).
- **Modal chrome**: `src/components/modals/basicModal/BasicModal.jsx`, content: `src/components/modals/contents/selectCategory/ModalCategoryContent.jsx` (this is the exact file containing the `content absolute bg-slate-100 border-2 border-purple-600 ... z-[10002]` div the user found via inspector, at line 22), which renders `CategoriesModalList.jsx` (grid of category circles, `cat-container` divs at lines 31/39) and `RenderCategoriesSearch.jsx` (search results, `cat-container` div at line 10).
- **Open/close mechanism**: `src/hooks/useModalBasic.js` — a **toggle boolean**, not a real `isOpen` state:
  ```js
  const [close, setClose] = useState(false);
  const handleClose = useCallback(() => { setClose(prev => !prev); setModalContent(null); }, []);
  ```
  `close` is passed to `BtnSelectCategoryContext`'s `onClose` prop (opens it — flips `false→true`) **and** to `ModalCategoryContent`'s `close` prop (closes it — flips `true→false`, called automatically after a selection via `handleSelect`, see below). The modal is conditionally mounted: `{close && <BasicModal ... />}`.
- **Reference implementation to copy**: `src/components/multiUsedComp/QuickEditModal.jsx` lines **34, 48-55, 146-156** — this is the cleanest existing example of "a component wants to pick one category-or-subcategory and store it as local state." Copy this pattern almost verbatim.
- **Selection callback / payload shape**: when the user clicks a category or subcategory in the modal, `SelectCategoryProvider.handleSelect(category, callBack, close)` fires `callBack(category)` — your `getSelected` prop — with **the raw Mongo document** (`{_id, name, color, icon, fatherCategory?, ...}`), no wrapper object. Distinguish category vs subcategory by checking `cat?.fatherCategory` (truthy = it's a subcategory; the parent category is `cat.fatherCategory`). This exact branching already exists in `QuickEditModal.jsx:48-55`:
  ```js
  const handleCategory = (cat) => {
    if (!cat) return;
    if (cat?.fatherCategory) {
      setValue((v) => ({ ...v, subCategory: cat._id, category: cat.fatherCategory._id }));
    } else {
      setValue((v) => ({ ...v, category: cat._id, subCategory: "" }));
    }
  };
  ```

### Implementation plan for Movements.jsx
1. Import `SelectCategories` (provider), `BtnSelectCategoryContext`, `BasicModal`, `ModalCategoryContent`, and `useModal` from `src/hooks/useModalBasic.js`.
2. Wrap the filter bar (or the whole `Movements` return tree — simplest and safest) in `<SelectCategories>` so `useContext(SelectCategoryContext)` works inside.
3. Inside the component: `const { close, handleClose } = useModal();`
4. Replace the two `<select>` blocks (lines 667-714) with:
   ```jsx
   <Tooltip title="Filter by Category or SubCategory — pick either one 🤓">
     <div className="text-black w-[10px]">
       <UniversalCategoIcon type="fa/FaRegQuestionCircle" siz={15} />
     </div>
   </Tooltip>
   <BtnSelectCategoryContext onClose={handleClose} />
   {close && (
     <BasicModal
       close={handleClose}
       renderContent={<ModalCategoryContent close={handleClose} getSelected={handleCategoryFilter} />}
     />
   )}
   {(categoryFilter || subCategoryFilter) && (
     <button onClick={handleClearCategoryFilter} className="text-slate-400 hover:text-slate-600 transition-colors">
       <UniversalCategoIcon type="md/MdClose" siz={13} />
     </button>
   )}
   ```
5. Add the handler (mirrors `QuickEditModal`'s `handleCategory`, but sets the **existing** `categoryFilter`/`subCategoryFilter` state instead of a form-value object — no other filtering code changes needed, `filtered.filter(...)` at lines 141-146 stays exactly as-is):
   ```js
   const handleCategoryFilter = (cat) => {
     if (!cat) return;
     if (cat?.fatherCategory) {
       setSubCategoryFilter(cat._id);
       setCategoryFilter("");
     } else {
       setCategoryFilter(cat._id);
       setSubCategoryFilter("");
     }
   };
   const handleClearCategoryFilter = () => {
     setCategoryFilter("");
     setSubCategoryFilter("");
     handleClean(); // from SelectCategoryContext — see gotcha below
   };
   ```
6. Add `handleClean` from `useContext(SelectCategoryContext)` alongside `handleSelect`/`itemSelected` if you destructure the context directly, or expose it however the codebase idiom prefers.
7. Update `handleCleanFilter` (the global "Clear filters" button, lines 246-260) to also call the context's `handleClean()`, not just `setCategoryFilter("")`/`setSubCategoryFilter("")` — see gotcha below.

### ⚠️ Gotcha to get right (found during research, not obvious from a shallow read)
`BtnSelectCategoryContext`'s displayed label ("Selected: X") is driven by `itemSelected` in `SelectCategoryContext` — **separate state from your `categoryFilter`/`subCategoryFilter`**. If you only clear your own filter state and forget to also call the context's `handleClean()`, the button will keep showing the old category name even though the filter was actually cleared (desynced UI). Every place that resets the category filter (`handleClearCategoryFilter`, `handleCleanFilter`) must clear **both**.

### The modal has no built-in "clear" row
Confirmed by reading `CategoriesModalList.jsx`/`RenderCategoriesSearch.jsx` — every click path requires a real category doc; `handleSelect` early-returns on falsy input. Deselection is only possible from *outside* the modal (your own clear button, per above), not from inside it. Don't try to add a "None" option inside the modal grid — follow the existing precedent (`QuickEditModal.jsx:79` calls `handleClean()` externally after a successful edit) instead.

### Also in Part 1: widen the "Exact amount" input
Small, unrelated CSS tweak requested in the same feedback. Current:
```jsx
className="bg-white border border-slate-200 rounded-2xl px-2 py-0.5 w-[90px] outline-none focus:border-purple-400 transition-colors"
```
(the `<input type="number">` for `exactAmountFilter`, in the filter bar near the other filters). Just bump `w-[90px]` to something like `w-[130px]` — user said "un poquito más ancho," no exact target width given, use judgment (enough to comfortably show something like `$12,345.67` without clipping).

---

## Part 2 — Delete-confirmation modals should list the actual transactions

### Current state
Two `antd <Modal>`s in `Movements.jsx`:
- **Single delete** — lines **537-553** (`isRemoveModal` state, confirms via `transRemovableId`, a single ID). Body is just one line of text: *"Are you sure you want to permanently delete this transaction? This action cannot be undone."*
- **Bulk delete** — lines **554-574** (`isRemoveModalMany` state, confirms via `selectedTrans`, an array of IDs). Body: *"Are you sure you want to permanently delete N transactions? This action cannot be undone."*

Both are also reused by the **Find Duplicates → Select possible duplicates → Delete N selected** flow (line ~865 area, `showRemoveModal("many", selectedTrans)`) — so fixing the bulk modal automatically covers that path too; no separate work needed there.

### What the user wants
Below (or above) the confirmation text, list the actual transactions that will be deleted, using a **smaller version of the existing transaction-row look** — the circular category-color icon, name, category/subcategory/account line, tags, and on the right the amount + date. This is exactly what's already rendered for every row in the main list, at **lines 1092-1176** (`{allMovements.map((movement) => (...))}`). Don't rebuild this from scratch — extract/copy the visual structure (icon circle at line ~1105-1113, name/category/account/tags block at ~1114-1145, amount+date block at ~1150-1176) into a compact variant.

### Implementation plan
1. Add a lookup helper (transactions aren't otherwise available by ID inside the modals — only IDs are stored in `transRemovableId`/`selectedTrans`):
   ```js
   const getTransById = (id) => rdxTransactions?.find((t) => String(t._id) === String(id));
   ```
   (`rdxTransactions` — the full Redux array — is safer than `allMovements` here, since a transaction could theoretically be selected for deletion while filtered out of the currently-visible list in an edge case; using the full unfiltered array avoids that bug.)
2. Build a small local component (or an inline `.map()`) — call it e.g. `DeletePreviewRow` — that takes one transaction and renders a **compact** version of lines 1092-1176: smaller icon (e.g. 30px instead of 50px), name + category/account on one line (skip the tags row or keep it thin), amount+date on the right, no delete/edit buttons (this is a read-only preview, not an interactive row). Reuse `movement.category?.color`, `UniversalCategoIcon`, `currencyFormatter`, `dayjs` exactly as the existing block does — don't reinvent formatting.
3. In the single-delete modal (line ~552), replace the plain `<p>` with the confirmation text **plus** one `<DeletePreviewRow transaction={getTransById(transRemovableId)} />` below it (guard for `transRemovableId` being empty/not-yet-set).
4. In the bulk-delete modal (line ~569-573), same idea but `.map()` over `selectedTrans`, rendering a `<DeletePreviewRow>` per ID, inside a scrollable container (`max-h-[...] overflow-y-auto`) since `selectedTrans` could be large (the duplicate-finder flow alone can select dozens — see Part 3, "Select all matches" can be 60+ items per the user's own example).

### Verification
Open Movements with a real session → select 2-3 transactions → click delete → confirm the preview list shows the right items with the right amounts/dates before confirming. Also test via Find Duplicates → Select possible duplicates → Delete N selected, to confirm the same modal instance covers that path.

---

## Part 3 — Find Duplicates: "Comparison in detail" modal (keep vs. delete, side by side)

### Current state (fully traced)
The duplicate-finder lives entirely inside `Movements.jsx`. Key existing pieces:
- `buildDupGroups(transactions, criteria, dateTol, amountTol)` (line ~231) — Union-Find grouping, returns arrays of **indices** per duplicate cluster (only clusters with 2+ members).
- `getDuplicatesToDelete(...)` (line ~288) — per group, keeps `group[0]`, returns IDs of everything else (`group.slice(1)`) → used when `dupDeleteAll === false` ("Delete only duplicates").
- `getAllMatchingIds(...)` (line ~296) — returns **every** ID in every group, nothing kept → used when `dupDeleteAll === true` ("Delete all matches").
- The "Select possible duplicates" button (search for `Select possible duplicates` in the file, in the duplicate-finder submenu) already computes `toDelete` via one of the two functions above depending on `dupDeleteAll`, then visually highlights those rows and sets `selectedTrans = toDelete`.
- **Important**: while `dupMode` is `true`, `allMovements` is already narrowed to *only* the flagged duplicate transactions (via `getDuplicates()`, which returns every transaction belonging to any 2+-member group) — this makes Part 3 much simpler than it first looks, see below.

### What the user wants
After clicking "Select possible duplicates," show a new button — "Comparison in detail" (or "In detail") — that opens a modal with **two columns**: left = transactions that will be **kept**, right = transactions that will be **deleted** (per whatever the algorithm/current `dupDeleteAll` mode determined). Inside that modal, a delete button labeled with the live count, e.g. "Delete 10 elements" / "Delete 64 elements".

### Why this is simpler than it sounds
Since `allMovements` in `dupMode` is already exactly "all transactions involved in some duplicate group," and `toDelete` (computed by the existing "Select possible duplicates" click handler) is already the full list of IDs to remove, the two columns are just:
```js
const keepList = allMovements.filter((m) => !toDelete.map(String).includes(String(m._id)));
const deleteList = allMovements.filter((m) => toDelete.map(String).includes(String(m._id)));
```
No new grouping/pairing logic is required — you don't need to show *which* kept item corresponds to *which* deleted duplicates, just two flat lists. (A "grouped" view — pairing each kept original with its specific duplicates — would be a nicer future iteration, but it's not what was asked for; flag it as a possible v2 if whoever implements this wants to go further, but don't block on it.)

**One real design decision to make explicit**: in "Delete all matches" mode (`dupDeleteAll === true`), `getAllMatchingIds` puts *everything* in `toDelete` — so `keepList` would be empty. That's semantically correct (nothing is being kept in that mode) — just make sure the left column shows an empty-state message ("Nothing kept — all matches will be deleted") rather than looking broken.

### Implementation plan
1. Store the computed `toDelete` array in state when "Select possible duplicates" is clicked (currently it's a local `const` inside the button's `onClick`, only used to drive `setSelectedTrans(toDelete)` — just also do `setDupToDeleteIds(toDelete)` or reuse `selectedTrans` directly, since it's already set to the same array — simplest: just reuse `selectedTrans` as the "delete" set, no new state needed).
2. Add a new button next to "Select possible duplicates" (only visible once it's been clicked, i.e. `dupMode && dupCount > 0 && selectedTrans.length > 0`): "Comparison in detail", opening a new modal (`dupCompareModalOpen` boolean state).
3. In that modal: two-column layout (e.g. `grid grid-cols-2 gap-3`), left header "Keeping (N)" + `keepList.map(...)`, right header "Deleting (N)" + `deleteList.map(...)`, each row using the **same `DeletePreviewRow` component built in Part 2** (don't build a second variant — reuse it).
4. Footer button: `Delete {deleteList.length} elements` → calls the existing `handleRemoveManyTransactions(selectedTrans)` (already does exactly this deletion, no new backend logic needed) and closes both this modal and the duplicate-finder panel on success (mirror what the existing "Delete N selected" button already does).

### Verification
Run Find Duplicates with some real overlapping transactions → Select possible duplicates → confirm the new "Comparison in detail" button appears → open it → confirm left/right columns match expectations in both "Delete only duplicates" and "Delete all matches" modes → confirm the delete button's count updates live and actually deletes only the right column's items.

---

## Suggested order of implementation
Part 1 and Part 2 are independent and can be done in either order. Part 3 depends on Part 2 (reuses `DeletePreviewRow`) — do Part 2 first.
