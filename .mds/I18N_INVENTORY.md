# Inventario de textos para la i18n

Generado el 2026-10-24 con `node scripts/i18n-scan.mjs`. Es la Fase 0 de [I18N_PLAN.md](I18N_PLAN.md).

Es un conteo de **piso**, no exacto: encuentra el texto JSX, los atributos que lee la persona, los mensajes de la API, los botones de `Alert.alert`, los avisos (`runNotify`, `toast`...) y los textos del core. No ve texto armado en piezas, texto que solo llega a la pantalla por una variable ni plantillas largas. Cada conteo es una cadena candidata; algunas son nombres de ejemplo o datos, no texto de interfaz.

## Totales

| Área | Archivos con texto | Textos |
|---|---:|---:|
| web | 77 | 148 |
| mobile | 47 | 61 |
| core | 14 | 158 |
| **Total** | **138** | **367** |

Textos distintos: 296 (un mismo texto aparece en varias pantallas; el trabajo de traducción cuenta una vez cada texto distinto).

Por tipo: texto JSX 2 · atributo visible 95 · mensaje de API 86 · Alert.alert 4 · aviso al usuario 22 · texto del core 158

## Inicio y pantallas públicas

Las páginas que se ven antes de entrar: `/` (inicio), `/login`, `/register` y `/verify-2fa`. Son las primeras que debe ver el usuario en su idioma.

_No se encontraron textos en la página de inicio._

Pantallas de autenticación (login, registro, 2FA, passkeys): 2 textos en 2 archivos.

## Por zona

| Zona | Archivos | Texto JSX | Atributos | API | Alertas | Avisos | Core | Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| core/accounts | 2 | 0 | 0 | 0 | 0 | 0 | 49 | **49** |
| core/transactions | 3 | 0 | 0 | 0 | 0 | 0 | 32 | **32** |
| core/history | 1 | 0 | 0 | 0 | 0 | 0 | 27 | **27** |
| core/budgets | 2 | 0 | 0 | 0 | 0 | 0 | 24 | **24** |
| categories | 9 | 0 | 13 | 0 | 0 | 5 | 0 | **18** |
| mobile/components/raíz | 15 | 0 | 18 | 0 | 0 | 0 | 0 | **18** |
| core/transformers | 3 | 0 | 0 | 0 | 0 | 0 | 18 | **18** |
| api/transactions | 8 | 0 | 0 | 15 | 0 | 0 | 0 | **15** |
| api/accounts | 3 | 0 | 0 | 14 | 0 | 0 | 0 | **14** |
| api/projection-baseline | 3 | 0 | 0 | 12 | 0 | 0 | 0 | **12** |
| mobile/app/more | 4 | 2 | 7 | 0 | 0 | 0 | 0 | **9** |
| api/budget | 4 | 0 | 0 | 8 | 0 | 0 | 0 | **8** |
| compartidos (componentes) | 6 | 0 | 7 | 0 | 0 | 1 | 0 | **8** |
| movements (incl. import y categorizador) | 4 | 0 | 0 | 0 | 0 | 8 | 0 | **8** |
| wallet-analyzer | 3 | 0 | 8 | 0 | 0 | 0 | 0 | **8** |
| api/income-sources | 4 | 0 | 0 | 7 | 0 | 0 | 0 | **7** |
| api/files | 3 | 0 | 0 | 6 | 0 | 0 | 0 | **6** |
| profile | 1 | 0 | 2 | 0 | 0 | 4 | 0 | **6** |
| budgets | 5 | 0 | 5 | 0 | 0 | 1 | 0 | **6** |
| mobile/components/analyzer | 2 | 0 | 5 | 0 | 0 | 0 | 0 | **5** |
| mobile/components/history | 4 | 0 | 5 | 0 | 0 | 0 | 0 | **5** |
| mobile/components/profile | 5 | 0 | 1 | 0 | 4 | 0 | 0 | **5** |
| api/categories | 3 | 0 | 0 | 4 | 0 | 0 | 0 | **4** |
| api/projections | 2 | 0 | 0 | 4 | 0 | 0 | 0 | **4** |
| mobile/components/home | 3 | 0 | 4 | 0 | 0 | 0 | 0 | **4** |
| core/money | 1 | 0 | 0 | 0 | 0 | 0 | 4 | **4** |
| api/subcategory | 3 | 0 | 0 | 3 | 0 | 0 | 0 | **3** |
| api/tags | 3 | 0 | 0 | 3 | 0 | 0 | 0 | **3** |
| api/user | 3 | 0 | 0 | 3 | 0 | 0 | 0 | **3** |
| api/wallet | 1 | 0 | 0 | 3 | 0 | 0 | 0 | **3** |
| navbar y accesos rápidos | 2 | 0 | 3 | 0 | 0 | 0 | 0 | **3** |
| mobile/components/charts | 3 | 0 | 3 | 0 | 0 | 0 | 0 | **3** |
| mobile/components/forms | 2 | 0 | 3 | 0 | 0 | 0 | 0 | **3** |
| core/profile | 1 | 0 | 0 | 0 | 0 | 0 | 3 | **3** |
| api/category-rules | 2 | 0 | 0 | 2 | 0 | 0 | 0 | **2** |
| api/otras | 1 | 0 | 0 | 2 | 0 | 0 | 0 | **2** |
| auth (login, registro, 2FA, passkeys) | 2 | 0 | 0 | 0 | 0 | 2 | 0 | **2** |
| history | 1 | 0 | 2 | 0 | 0 | 0 | 0 | **2** |
| mobile/components/auth | 2 | 0 | 1 | 0 | 0 | 1 | 0 | **2** |
| mobile/components/movements | 2 | 0 | 2 | 0 | 0 | 0 | 0 | **2** |
| dashboard | 1 | 0 | 1 | 0 | 0 | 0 | 0 | **1** |
| mobile/app/movements | 1 | 0 | 1 | 0 | 0 | 0 | 0 | **1** |
| mobile/app/raíz | 1 | 0 | 1 | 0 | 0 | 0 | 0 | **1** |
| mobile/components/budgets | 1 | 0 | 1 | 0 | 0 | 0 | 0 | **1** |
| mobile/components/projections | 1 | 0 | 1 | 0 | 0 | 0 | 0 | **1** |
| mobile/components/ui | 1 | 0 | 1 | 0 | 0 | 0 | 0 | **1** |
| core/banks | 1 | 0 | 0 | 0 | 0 | 0 | 1 | **1** |

## Checklist por zona

Cada archivo con sus textos. Marca la casilla cuando esté migrado y sin texto fijo.

<details><summary><strong>core/accounts</strong> — 49 textos en 2 archivos</summary>

- [ ] `packages/core/src/accounts/cardStyle.ts` — 42 (texto del core 42)
- [ ] `packages/core/src/accounts/accountForm.ts` — 7 (texto del core 7)

</details>

<details><summary><strong>core/transactions</strong> — 32 textos en 3 archivos</summary>

- [ ] `packages/core/src/transactions/movementFilters.ts` — 16 (texto del core 16)
- [ ] `packages/core/src/transactions/movementForm.ts` — 11 (texto del core 11)
- [ ] `packages/core/src/transactions/duplicateSettings.ts` — 5 (texto del core 5)

</details>

<details><summary><strong>core/history</strong> — 27 textos en 1 archivos</summary>

- [ ] `packages/core/src/history/periodComparison.ts` — 27 (texto del core 27)

</details>

<details><summary><strong>core/budgets</strong> — 24 textos en 2 archivos</summary>

- [ ] `packages/core/src/budgets/budgetAlerts.ts` — 12 (texto del core 12)
- [ ] `packages/core/src/budgets/budgetForm.ts` — 12 (texto del core 12)

</details>

<details><summary><strong>categories</strong> — 18 textos en 9 archivos</summary>

- [ ] `src/components/multiUsedComp/CategoriesClient.tsx` — 4 (atributo visible 4)
- [ ] `src/components/multiUsedComp/EditCategoryModal.tsx` — 3 (aviso al usuario 3)
- [ ] `src/components/multiUsedComp/CategoryList.tsx` — 2 (atributo visible 1, aviso al usuario 1)
- [ ] `src/components/multiUsedComp/DisplayerCategoryCirclePacking.tsx` — 2 (atributo visible 2)
- [ ] `src/components/multiUsedComp/DisplayerCategoryTreemap.tsx` — 2 (atributo visible 2)
- [ ] `src/components/multiUsedComp/SubCategoryList.tsx` — 2 (atributo visible 1, aviso al usuario 1)
- [ ] `src/components/categories/categoriesModalList/CategoriesModalList.tsx` — 1 (atributo visible 1)
- [ ] `src/components/categories/categoryCircleWithChilds/CategoryCircleWithChilds.tsx` — 1 (atributo visible 1)
- [ ] `src/components/multiUsedComp/CategoryColorPicker.tsx` — 1 (atributo visible 1)

</details>

<details><summary><strong>mobile/components/raíz</strong> — 18 textos en 15 archivos</summary>

- [ ] `apps/mobile/src/components/account-card-color.tsx` — 2 (atributo visible 2)
- [ ] `apps/mobile/src/components/movement-form.tsx` — 2 (atributo visible 2)
- [ ] `apps/mobile/src/components/transfer-form.tsx` — 2 (atributo visible 2)
- [ ] `apps/mobile/src/components/account-card.tsx` — 1 (atributo visible 1)
- [ ] `apps/mobile/src/components/budget-progress.tsx` — 1 (atributo visible 1)
- [ ] `apps/mobile/src/components/budget-summary-sheet.tsx` — 1 (atributo visible 1)
- [ ] `apps/mobile/src/components/category-picker.tsx` — 1 (atributo visible 1)
- [ ] `apps/mobile/src/components/chip-picker.tsx` — 1 (atributo visible 1)
- [ ] `apps/mobile/src/components/color-picker.tsx` — 1 (atributo visible 1)
- [ ] `apps/mobile/src/components/compact-time-filter.tsx` — 1 (atributo visible 1)
- [ ] `apps/mobile/src/components/date-field.tsx` — 1 (atributo visible 1)
- [ ] `apps/mobile/src/components/export-sheet.tsx` — 1 (atributo visible 1)
- [ ] `apps/mobile/src/components/info-tip.tsx` — 1 (atributo visible 1)
- [ ] `apps/mobile/src/components/month-switcher.tsx` — 1 (atributo visible 1)
- [ ] `apps/mobile/src/components/top-ranking.tsx` — 1 (atributo visible 1)

</details>

<details><summary><strong>core/transformers</strong> — 18 textos en 3 archivos</summary>

- [ ] `packages/core/src/transformers/walletAnalyzer.ts` — 16 (texto del core 16)
- [ ] `packages/core/src/transformers/budgetHistoricalComparative.ts` — 1 (texto del core 1)
- [ ] `packages/core/src/transformers/projectionsChange.ts` — 1 (texto del core 1)

</details>

<details><summary><strong>api/transactions</strong> — 15 textos en 8 archivos</summary>

- [ ] `src/app/api/general-data/transactions/[id]/route.ts` — 4 (mensaje de API 4)
- [ ] `src/app/api/general-data/transactions/edit-many/route.ts` — 4 (mensaje de API 4)
- [ ] `src/app/api/general-data/transactions/transfer/route.ts` — 2 (mensaje de API 2)
- [ ] `src/app/api/general-data/transactions/new-transaction/route.ts` — 1 (mensaje de API 1)
- [ ] `src/app/api/general-data/transactions/remove-many/route.ts` — 1 (mensaje de API 1)
- [ ] `src/app/api/general-data/transactions/remove-transaction/[id]/route.ts` — 1 (mensaje de API 1)
- [ ] `src/app/api/general-data/transactions/speech-add/route.ts` — 1 (mensaje de API 1)
- [ ] `src/app/api/general-data/transactions/transfer/remove/route.ts` — 1 (mensaje de API 1)

</details>

<details><summary><strong>api/accounts</strong> — 14 textos en 3 archivos</summary>

- [ ] `src/app/api/general-data/accounts/update-account/route.ts` — 8 (mensaje de API 8)
- [ ] `src/app/api/general-data/accounts/new-account/route.ts` — 4 (mensaje de API 4)
- [ ] `src/app/api/general-data/accounts/remove-account/route.ts` — 2 (mensaje de API 2)

</details>

<details><summary><strong>api/projection-baseline</strong> — 12 textos en 3 archivos</summary>

- [ ] `src/app/api/general-data/projection-baseline/update/route.ts` — 8 (mensaje de API 8)
- [ ] `src/app/api/general-data/projection-baseline/delete/route.ts` — 3 (mensaje de API 3)
- [ ] `src/app/api/general-data/projection-baseline/get/route.ts` — 1 (mensaje de API 1)

</details>

<details><summary><strong>mobile/app/more</strong> — 9 textos en 4 archivos</summary>

- [ ] `apps/mobile/src/app/more/analyzer.tsx` — 3 (atributo visible 3)
- [ ] `apps/mobile/src/app/more/projections.tsx` — 3 (texto JSX 1, atributo visible 2)
- [ ] `apps/mobile/src/app/more/accounts/[id].tsx` — 2 (atributo visible 2)
- [ ] `apps/mobile/src/app/more/accounts/index.tsx` — 1 (texto JSX 1)

</details>

<details><summary><strong>api/budget</strong> — 8 textos en 4 archivos</summary>

- [ ] `src/app/api/general-data/budget/update/route.ts` — 3 (mensaje de API 3)
- [ ] `src/app/api/general-data/budget/new/route.ts` — 2 (mensaje de API 2)
- [ ] `src/app/api/general-data/budget/remove/route.ts` — 2 (mensaje de API 2)
- [ ] `src/app/api/general-data/budget/get/route.ts` — 1 (mensaje de API 1)

</details>

<details><summary><strong>compartidos (componentes)</strong> — 8 textos en 6 archivos</summary>

- [ ] `src/components/Filters/timeRange/TimeRange.tsx` — 2 (atributo visible 2)
- [ ] `src/components/multiUsedComp/DedupPreviewModal.tsx` — 2 (atributo visible 2)
- [ ] `src/components/multiUsedComp/AmountEquivalentPreview.tsx` — 1 (atributo visible 1)
- [ ] `src/components/multiUsedComp/InfoTip.tsx` — 1 (atributo visible 1)
- [ ] `src/components/multiUsedComp/PrimaryCurrencySelector.tsx` — 1 (aviso al usuario 1)
- [ ] `src/i18n/LanguageSwitch.tsx` — 1 (atributo visible 1)

</details>

<details><summary><strong>movements (incl. import y categorizador)</strong> — 8 textos en 4 archivos</summary>

- [ ] `src/components/multiUsedComp/ReadFileComp.tsx` — 4 (aviso al usuario 4)
- [ ] `src/components/multiUsedComp/Movements.tsx` — 2 (aviso al usuario 2)
- [ ] `src/components/multiUsedComp/CategorySuggestions/UncategorizedSuggestionsTab.tsx` — 1 (aviso al usuario 1)
- [ ] `src/components/multiUsedComp/QuickEditModal.tsx` — 1 (aviso al usuario 1)

</details>

<details><summary><strong>wallet-analyzer</strong> — 8 textos en 3 archivos</summary>

- [ ] `src/components/multiUsedComp/walletAnalyzer/InsightDetailModal.tsx` — 4 (atributo visible 4)
- [ ] `src/components/multiUsedComp/HistoricalWalletAnalyzer/HistoricalWalletAnalyzer.tsx` — 2 (atributo visible 2)
- [ ] `src/components/multiUsedComp/walletAnalyzer/WalletAnalyzerView.tsx` — 2 (atributo visible 2)

</details>

<details><summary><strong>api/income-sources</strong> — 7 textos en 4 archivos</summary>

- [ ] `src/app/api/general-data/income-sources/update/route.ts` — 3 (mensaje de API 3)
- [ ] `src/app/api/general-data/income-sources/remove/route.ts` — 2 (mensaje de API 2)
- [ ] `src/app/api/general-data/income-sources/get/route.ts` — 1 (mensaje de API 1)
- [ ] `src/app/api/general-data/income-sources/new/route.ts` — 1 (mensaje de API 1)

</details>

<details><summary><strong>api/files</strong> — 6 textos en 3 archivos</summary>

- [ ] `src/app/api/general-data/files/upload/[id]/route.ts` — 3 (mensaje de API 3)
- [ ] `src/app/api/general-data/files/deduplicate/[id]/route.ts` — 2 (mensaje de API 2)
- [ ] `src/app/api/general-data/files/template/[email]/route.ts` — 1 (mensaje de API 1)

</details>

<details><summary><strong>profile</strong> — 6 textos en 1 archivos</summary>

- [ ] `src/components/ProfileClient.tsx` — 6 (atributo visible 2, aviso al usuario 4)

</details>

<details><summary><strong>budgets</strong> — 6 textos en 5 archivos</summary>

- [ ] `src/components/multiUsedComp/BudgetCont.tsx` — 2 (atributo visible 2)
- [ ] `src/components/multiUsedComp/Budgets/BudgetDetailModal.tsx` — 1 (atributo visible 1)
- [ ] `src/components/multiUsedComp/Budgets/BudgetsClient.tsx` — 1 (aviso al usuario 1)
- [ ] `src/components/multiUsedComp/Budgets/UnbudgetedSpending.tsx` — 1 (atributo visible 1)
- [ ] `src/components/multiUsedComp/historicalBudgetsComparative/BudgetHistoricalComparativeRow.tsx` — 1 (atributo visible 1)

</details>

<details><summary><strong>mobile/components/analyzer</strong> — 5 textos en 2 archivos</summary>

- [ ] `apps/mobile/src/components/analyzer/sheets.tsx` — 4 (atributo visible 4)
- [ ] `apps/mobile/src/components/analyzer/supplement.tsx` — 1 (atributo visible 1)

</details>

<details><summary><strong>mobile/components/history</strong> — 5 textos en 4 archivos</summary>

- [ ] `apps/mobile/src/components/history/own-period-categories.tsx` — 2 (atributo visible 2)
- [ ] `apps/mobile/src/components/history/month-by-month.tsx` — 1 (atributo visible 1)
- [ ] `apps/mobile/src/components/history/period-bar.tsx` — 1 (atributo visible 1)
- [ ] `apps/mobile/src/components/history/projections-teaser.tsx` — 1 (atributo visible 1)

</details>

<details><summary><strong>mobile/components/profile</strong> — 5 textos en 5 archivos</summary>

- [ ] `apps/mobile/src/components/profile/access-card.tsx` — 1 (Alert.alert 1)
- [ ] `apps/mobile/src/components/profile/api-tokens-card.tsx` — 1 (Alert.alert 1)
- [ ] `apps/mobile/src/components/profile/currency-card.tsx` — 1 (Alert.alert 1)
- [ ] `apps/mobile/src/components/profile/delete-account-card.tsx` — 1 (atributo visible 1)
- [ ] `apps/mobile/src/components/profile/passkeys-card.tsx` — 1 (Alert.alert 1)

</details>

<details><summary><strong>api/categories</strong> — 4 textos en 3 archivos</summary>

- [ ] `src/app/api/general-data/categories/update-category/route.ts` — 2 (mensaje de API 2)
- [ ] `src/app/api/general-data/categories/new-category/route.ts` — 1 (mensaje de API 1)
- [ ] `src/app/api/general-data/categories/remove-category/route.ts` — 1 (mensaje de API 1)

</details>

<details><summary><strong>api/projections</strong> — 4 textos en 2 archivos</summary>

- [ ] `src/app/api/general-data/projections/get/route.ts` — 2 (mensaje de API 2)
- [ ] `src/app/api/general-data/projections/update/route.ts` — 2 (mensaje de API 2)

</details>

<details><summary><strong>mobile/components/home</strong> — 4 textos en 3 archivos</summary>

- [ ] `apps/mobile/src/components/home/summary-widget.tsx` — 2 (atributo visible 2)
- [ ] `apps/mobile/src/components/home/category-table.tsx` — 1 (atributo visible 1)
- [ ] `apps/mobile/src/components/home/summary-carousel.tsx` — 1 (atributo visible 1)

</details>

<details><summary><strong>core/money</strong> — 4 textos en 1 archivos</summary>

- [ ] `packages/core/src/money/currencies.ts` — 4 (texto del core 4)

</details>

<details><summary><strong>api/subcategory</strong> — 3 textos en 3 archivos</summary>

- [ ] `src/app/api/general-data/subcategory/new/route.ts` — 1 (mensaje de API 1)
- [ ] `src/app/api/general-data/subcategory/remove/route.ts` — 1 (mensaje de API 1)
- [ ] `src/app/api/general-data/subcategory/update/route.ts` — 1 (mensaje de API 1)

</details>

<details><summary><strong>api/tags</strong> — 3 textos en 3 archivos</summary>

- [ ] `src/app/api/general-data/tags/new/route.ts` — 1 (mensaje de API 1)
- [ ] `src/app/api/general-data/tags/remove/route.ts` — 1 (mensaje de API 1)
- [ ] `src/app/api/general-data/tags/update/route.ts` — 1 (mensaje de API 1)

</details>

<details><summary><strong>api/user</strong> — 3 textos en 3 archivos</summary>

- [ ] `src/app/api/general-data/user/get-user/route.ts` — 1 (mensaje de API 1)
- [ ] `src/app/api/general-data/user/remove-user/route.ts` — 1 (mensaje de API 1)
- [ ] `src/app/api/general-data/user/update-user/route.ts` — 1 (mensaje de API 1)

</details>

<details><summary><strong>api/wallet</strong> — 3 textos en 1 archivos</summary>

- [ ] `src/app/api/general-data/wallet/route.ts` — 3 (mensaje de API 3)

</details>

<details><summary><strong>navbar y accesos rápidos</strong> — 3 textos en 2 archivos</summary>

- [ ] `src/components/Navbar.tsx` — 2 (atributo visible 2)
- [ ] `src/components/multiUsedComp/NotificationsBell.tsx` — 1 (atributo visible 1)

</details>

<details><summary><strong>mobile/components/charts</strong> — 3 textos en 3 archivos</summary>

- [ ] `apps/mobile/src/components/charts/category-bubbles.tsx` — 1 (atributo visible 1)
- [ ] `apps/mobile/src/components/charts/category-donut.tsx` — 1 (atributo visible 1)
- [ ] `apps/mobile/src/components/charts/category-treemap.tsx` — 1 (atributo visible 1)

</details>

<details><summary><strong>mobile/components/forms</strong> — 3 textos en 2 archivos</summary>

- [ ] `apps/mobile/src/components/forms/budget-form.tsx` — 2 (atributo visible 2)
- [ ] `apps/mobile/src/components/forms/account-form.tsx` — 1 (atributo visible 1)

</details>

<details><summary><strong>core/profile</strong> — 3 textos en 1 archivos</summary>

- [ ] `packages/core/src/profile/profileForm.ts` — 3 (texto del core 3)

</details>

<details><summary><strong>api/category-rules</strong> — 2 textos en 2 archivos</summary>

- [ ] `src/app/api/general-data/category-rules/apply-suggestions/route.ts` — 1 (mensaje de API 1)
- [ ] `src/app/api/general-data/category-rules/suggest/route.ts` — 1 (mensaje de API 1)

</details>

<details><summary><strong>api/otras</strong> — 2 textos en 1 archivos</summary>

- [ ] `src/app/api/register/route.ts` — 2 (mensaje de API 2)

</details>

<details><summary><strong>auth (login, registro, 2FA, passkeys)</strong> — 2 textos en 2 archivos</summary>

- [ ] `src/components/LoginComponent.tsx` — 1 (aviso al usuario 1)
- [ ] `src/lib/auth/stepUpRedirect.ts` — 1 (aviso al usuario 1)

</details>

<details><summary><strong>history</strong> — 2 textos en 1 archivos</summary>

- [ ] `src/components/multiUsedComp/top3/topMonthContainer/TopElementsCompareTable.tsx` — 2 (atributo visible 2)

</details>

<details><summary><strong>mobile/components/auth</strong> — 2 textos en 2 archivos</summary>

- [ ] `apps/mobile/src/components/auth/code-step.tsx` — 1 (aviso al usuario 1)
- [ ] `apps/mobile/src/components/auth/no-two-factor-screen.tsx` — 1 (atributo visible 1)

</details>

<details><summary><strong>mobile/components/movements</strong> — 2 textos en 2 archivos</summary>

- [ ] `apps/mobile/src/components/movements/bulk-edit-sheet.tsx` — 1 (atributo visible 1)
- [ ] `apps/mobile/src/components/movements/movement-row.tsx` — 1 (atributo visible 1)

</details>

<details><summary><strong>dashboard</strong> — 1 textos en 1 archivos</summary>

- [ ] `src/components/modals/contents/modalForTopMonthItem/ModalContentTopMonthItem.tsx` — 1 (atributo visible 1)

</details>

<details><summary><strong>mobile/app/movements</strong> — 1 textos en 1 archivos</summary>

- [ ] `apps/mobile/src/app/movements/index.tsx` — 1 (atributo visible 1)

</details>

<details><summary><strong>mobile/app/raíz</strong> — 1 textos en 1 archivos</summary>

- [ ] `apps/mobile/src/app/notifications.tsx` — 1 (atributo visible 1)

</details>

<details><summary><strong>mobile/components/budgets</strong> — 1 textos en 1 archivos</summary>

- [ ] `apps/mobile/src/components/budgets/budget-card.tsx` — 1 (atributo visible 1)

</details>

<details><summary><strong>mobile/components/projections</strong> — 1 textos en 1 archivos</summary>

- [ ] `apps/mobile/src/components/projections/income-sources-card.tsx` — 1 (atributo visible 1)

</details>

<details><summary><strong>mobile/components/ui</strong> — 1 textos en 1 archivos</summary>

- [ ] `apps/mobile/src/components/ui/card.tsx` — 1 (atributo visible 1)

</details>

<details><summary><strong>core/banks</strong> — 1 textos en 1 archivos</summary>

- [ ] `packages/core/src/banks/banks.ts` — 1 (texto del core 1)

</details>

## Muestras de la página de inicio

Lo que se encontró en `/`, `/login`, `/register` y `/verify-2fa`, para revisar a mano:

## Límites del conteo

- **Qué sí cuenta:** texto JSX, atributos visibles, mensajes de la API (`message`, `error`, `new Error(...)`), botones y textos de `Alert.alert`, avisos al usuario, y en el core las claves `title`, `label`, `message`, `text`, `description`, `placeholder`, `tooltip`, `subtitle`, `emMessage`, `hint` y las validaciones `errors.campo = "..."`.
- **Qué no cuenta:** texto que se arma con concatenación o variables antes de mostrarse; textos dentro de `className`, claves y valores de datos; los nombres de categorías y bancos que vienen de la base de datos; los textos de `.js`/`.jsx` (ya no quedan en `src/`).
- **Falsos positivos posibles:** ejemplos en comentarios de código de prueba, nombres de iconos o de monedas que pasan la heurística. Se revisan al migrar la zona.
- **Zonas:** se asignan por el nombre del archivo y la carpeta. Un archivo compartido por dos pantallas cae en la primera zona que coincide; el listado completo está en el checklist.

