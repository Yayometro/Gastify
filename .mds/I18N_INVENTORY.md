# Inventario de textos para la i18n

Generado el 2026-10-24 con `node scripts/i18n-scan.mjs`. Es la Fase 0 de [I18N_PLAN.md](I18N_PLAN.md).

Es un conteo de **piso**, no exacto: encuentra el texto JSX, los atributos que lee la persona, los mensajes de la API, los botones de `Alert.alert`, los avisos (`runNotify`, `toast`...) y los textos del core. No ve texto armado en piezas, texto que solo llega a la pantalla por una variable ni plantillas largas. Cada conteo es una cadena candidata; algunas son nombres de ejemplo o datos, no texto de interfaz.

## Totales

| Área | Archivos con texto | Textos |
|---|---:|---:|
| web | 175 | 1545 |
| mobile | 93 | 824 |
| core | 16 | 419 |
| **Total** | **284** | **2788** |

Textos distintos: 1994 (un mismo texto aparece en varias pantallas; el trabajo de traducción cuenta una vez cada texto distinto).

Por tipo: texto JSX 1309 · atributo visible 565 · mensaje de API 355 · Alert.alert 55 · aviso al usuario 85 · texto del core 419

## Inicio y pantallas públicas

Las páginas que se ven antes de entrar: `/` (inicio), `/login`, `/register` y `/verify-2fa`. Son las primeras que debe ver el usuario en su idioma.

| Archivo | Textos |
|---|---:|
| `src/app/page.tsx` | 28 |

Pantallas de autenticación (login, registro, 2FA, passkeys): 44 textos en 4 archivos.

## Por zona

| Zona | Archivos | Texto JSX | Atributos | API | Alertas | Avisos | Core | Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| movements (incl. import y categorizador) | 28 | 260 | 52 | 0 | 0 | 26 | 0 | **338** |
| core/info | 2 | 0 | 0 | 0 | 0 | 0 | 261 | **261** |
| wallet-analyzer | 12 | 180 | 21 | 0 | 0 | 0 | 0 | **201** |
| mobile/app/more | 11 | 97 | 75 | 0 | 12 | 0 | 0 | **184** |
| budgets | 12 | 103 | 29 | 0 | 0 | 4 | 0 | **136** |
| mobile/components/raíz | 27 | 52 | 72 | 0 | 0 | 0 | 0 | **124** |
| compartidos (componentes) | 17 | 82 | 24 | 0 | 0 | 13 | 0 | **119** |
| api/transactions | 11 | 0 | 0 | 88 | 0 | 0 | 0 | **88** |
| categories | 16 | 52 | 20 | 0 | 0 | 7 | 0 | **79** |
| projections | 7 | 50 | 19 | 0 | 0 | 5 | 0 | **74** |
| mobile/components/profile | 6 | 23 | 20 | 0 | 24 | 3 | 0 | **70** |
| mobile/components/analyzer | 3 | 48 | 16 | 0 | 0 | 0 | 0 | **64** |
| dashboard | 7 | 50 | 11 | 0 | 0 | 0 | 0 | **61** |
| mobile/components/projections | 4 | 30 | 18 | 0 | 8 | 5 | 0 | **61** |
| core/accounts | 2 | 0 | 0 | 0 | 0 | 0 | 49 | **49** |
| mobile/app/raíz | 4 | 29 | 18 | 0 | 0 | 0 | 0 | **47** |
| auth (login, registro, 2FA, passkeys) | 4 | 34 | 3 | 0 | 0 | 7 | 0 | **44** |
| mobile/components/history | 6 | 29 | 15 | 0 | 0 | 0 | 0 | **44** |
| accounts | 3 | 34 | 7 | 0 | 0 | 2 | 0 | **43** |
| mobile/components/home | 7 | 18 | 25 | 0 | 0 | 0 | 0 | **43** |
| mobile/app/budgets | 2 | 17 | 17 | 0 | 4 | 0 | 0 | **38** |
| mobile/app/movements | 3 | 18 | 12 | 0 | 7 | 0 | 0 | **37** |
| mobile/components/movements | 3 | 14 | 20 | 0 | 0 | 2 | 0 | **36** |
| api/accounts | 5 | 0 | 0 | 33 | 0 | 0 | 0 | **33** |
| navbar y accesos rápidos | 5 | 20 | 13 | 0 | 0 | 0 | 0 | **33** |
| core/transactions | 3 | 0 | 0 | 0 | 0 | 0 | 32 | **32** |
| mobile/components/forms | 3 | 13 | 17 | 0 | 0 | 0 | 0 | **30** |
| api/categories | 5 | 0 | 0 | 29 | 0 | 0 | 0 | **29** |
| mobile/components/auth | 4 | 6 | 17 | 0 | 0 | 6 | 0 | **29** |
| api/budget | 5 | 0 | 0 | 28 | 0 | 0 | 0 | **28** |
| inicio | 1 | 23 | 5 | 0 | 0 | 0 | 0 | **28** |
| core/history | 1 | 0 | 0 | 0 | 0 | 0 | 27 | **27** |
| api/projection-baseline | 3 | 0 | 0 | 24 | 0 | 0 | 0 | **24** |
| profile | 1 | 15 | 4 | 0 | 0 | 5 | 0 | **24** |
| core/budgets | 2 | 0 | 0 | 0 | 0 | 0 | 24 | **24** |
| api/subcategory | 4 | 0 | 0 | 23 | 0 | 0 | 0 | **23** |
| api/files | 4 | 0 | 0 | 22 | 0 | 0 | 0 | **22** |
| api/income-sources | 4 | 0 | 0 | 22 | 0 | 0 | 0 | **22** |
| core/transformers | 3 | 0 | 0 | 0 | 0 | 0 | 18 | **18** |
| api/tags | 3 | 0 | 0 | 16 | 0 | 0 | 0 | **16** |
| api/api-tokens | 3 | 0 | 0 | 15 | 0 | 0 | 0 | **15** |
| api/user | 3 | 0 | 0 | 14 | 0 | 0 | 0 | **14** |
| api/wallet | 2 | 0 | 0 | 12 | 0 | 0 | 0 | **12** |
| api/projections | 2 | 0 | 0 | 11 | 0 | 0 | 0 | **11** |
| api/category-rules | 2 | 0 | 0 | 10 | 0 | 0 | 0 | **10** |
| history | 4 | 7 | 3 | 0 | 0 | 0 | 0 | **10** |
| mobile/components/tools | 2 | 5 | 3 | 0 | 0 | 0 | 0 | **8** |
| api/fx | 1 | 0 | 0 | 5 | 0 | 0 | 0 | **5** |
| mobile/components/ui | 4 | 0 | 5 | 0 | 0 | 0 | 0 | **5** |
| core/money | 1 | 0 | 0 | 0 | 0 | 0 | 4 | **4** |
| api/otras | 1 | 0 | 0 | 3 | 0 | 0 | 0 | **3** |
| mobile/components/charts | 3 | 0 | 3 | 0 | 0 | 0 | 0 | **3** |
| core/profile | 1 | 0 | 0 | 0 | 0 | 0 | 3 | **3** |
| mobile/components/budgets | 1 | 0 | 1 | 0 | 0 | 0 | 0 | **1** |
| core/banks | 1 | 0 | 0 | 0 | 0 | 0 | 1 | **1** |

## Checklist por zona

Cada archivo con sus textos. Marca la casilla cuando esté migrado y sin texto fijo.

<details><summary><strong>movements (incl. import y categorizador)</strong> — 338 textos en 28 archivos</summary>

- [ ] `src/components/multiUsedComp/Movements.tsx` — 108 (texto JSX 87, atributo visible 14, aviso al usuario 7)
- [ ] `src/components/multiUsedComp/MovementsGuideModal.tsx` — 33 (texto JSX 25, atributo visible 8)
- [ ] `src/components/multiUsedComp/EditSingleTransModal.tsx` — 24 (texto JSX 19, atributo visible 4, aviso al usuario 1)
- [ ] `src/components/multiUsedComp/ReadFileComp.tsx` — 20 (texto JSX 10, atributo visible 2, aviso al usuario 8)
- [ ] `src/components/multiUsedComp/EditMultipleTransModal.tsx` — 18 (texto JSX 15, atributo visible 3)
- [ ] `src/components/multiUsedComp/AddTransactionComp.tsx` — 16 (texto JSX 13, atributo visible 3)
- [ ] `src/components/multiUsedComp/TransferExchangeModal.tsx` — 15 (texto JSX 9, atributo visible 3, aviso al usuario 3)
- [ ] `src/components/multiUsedComp/QuickEditModal.tsx` — 13 (texto JSX 8, atributo visible 2, aviso al usuario 3)
- [ ] `src/components/multiUsedComp/TabsComponents/tabsMontlyTransactions/propsForColumnChartAntComparative-tabsToggler/propsColTabsToggler.tsx` — 13 (texto JSX 13)
- [ ] `src/components/multiUsedComp/HistoricalMovementsandCategories/HistoricalMovementsController.tsx` — 8 (texto JSX 8)
- [ ] `src/components/Transactions/ItemList/TransactionItemList.tsx` — 7 (texto JSX 7)
- [ ] `src/components/multiUsedComp/DuplicateComparisonTable.tsx` — 7 (texto JSX 5, atributo visible 2)
- [ ] `src/components/multiUsedComp/ResumeTabsTrans.tsx` — 7 (texto JSX 4, atributo visible 3)
- [ ] `src/components/multiUsedComp/TransDetailsGrandContainer.tsx` — 7 (texto JSX 5, atributo visible 2)
- [ ] `src/components/multiUsedComp/CategorySuggestions/CategorySuggestionsSection.tsx` — 6 (texto JSX 6)
- [ ] `src/components/multiUsedComp/CategorySuggestions/UncategorizedSuggestionsTab.tsx` — 6 (texto JSX 4, aviso al usuario 2)
- [ ] `src/components/multiUsedComp/ImportFromExcelButton.tsx` — 4 (texto JSX 2, atributo visible 2)
- [ ] `src/components/multiUsedComp/TransResumeChart.tsx` — 4 (texto JSX 4)
- [ ] `src/components/multiUsedComp/CategorySuggestions/SuggestionsList.tsx` — 3 (texto JSX 1, aviso al usuario 2)
- [ ] `src/components/multiUsedComp/CategorySuggestionsModal.tsx` — 3 (texto JSX 3)
- [ ] `src/components/multiUsedComp/HistoricalMovementsandCategories/HistoricalMovementsView.tsx` — 3 (texto JSX 2, atributo visible 1)
- [ ] `src/components/multiUsedComp/LatestMovementsCard.tsx` — 3 (texto JSX 3)
- [ ] `src/components/multiUsedComp/TransactionsResumeCont.tsx` — 3 (texto JSX 2, atributo visible 1)
- [ ] `src/components/multiUsedComp/AddTransactionModal.tsx` — 2 (texto JSX 1, atributo visible 1)
- [ ] `src/components/multiUsedComp/TabsTrans.tsx` — 2 (texto JSX 2)
- [ ] `src/components/multiUsedComp/MovementsClient.tsx` — 1 (texto JSX 1)
- [ ] `src/components/multiUsedComp/TabsComponents/tabsMontlyTransactions/TabsTogglerMontlyView.tsx` — 1 (atributo visible 1)
- [ ] `src/components/multiUsedComp/ToolsModal.tsx` — 1 (texto JSX 1)

</details>

<details><summary><strong>core/info</strong> — 261 textos en 2 archivos</summary>

- [ ] `packages/core/src/info/appInfo.ts` — 203 (texto del core 203)
- [ ] `packages/core/src/info/createInfo.ts` — 58 (texto del core 58)

</details>

<details><summary><strong>wallet-analyzer</strong> — 201 textos en 12 archivos</summary>

- [ ] `src/components/multiUsedComp/HistoricalWalletAnalyzer/HistoricalWalletAnalyzer.tsx` — 77 (texto JSX 74, atributo visible 3)
- [ ] `src/components/multiUsedComp/walletAnalyzer/WalletAnalyzerView.tsx` — 58 (texto JSX 54, atributo visible 4)
- [ ] `src/components/multiUsedComp/walletAnalyzer/InsightDetailModal.tsx` — 31 (texto JSX 20, atributo visible 11)
- [ ] `src/components/multiUsedComp/HistoricalWalletAnalyzer/BudgetPeriodDetailModal.tsx` — 7 (texto JSX 7)
- [ ] `src/components/multiUsedComp/walletAnalyzer/WalletAnalyzerProjectionCard.tsx` — 7 (texto JSX 5, atributo visible 2)
- [ ] `src/components/multiUsedComp/walletAnalyzer/WalletAnalyzerTrendChart.tsx` — 5 (texto JSX 5)
- [ ] `src/components/multiUsedComp/walletAnalyzer/WeekdaySpendingDetailModal.tsx` — 5 (texto JSX 5)
- [ ] `src/components/multiUsedComp/HistoricalWalletAnalyzer/HistoricalProjectionsTable.tsx` — 4 (texto JSX 4)
- [ ] `src/components/multiUsedComp/walletAnalyzer/WalletAnalyzerInsightsStrip.tsx` — 2 (texto JSX 2)
- [ ] `src/components/multiUsedComp/walletAnalyzer/WalletAnalyzerTeaser.tsx` — 2 (texto JSX 1, atributo visible 1)
- [ ] `src/components/multiUsedComp/walletAnalyzer/WalletAnalyzerWeekdayChart.tsx` — 2 (texto JSX 2)
- [ ] `src/components/multiUsedComp/walletAnalyzer/MonthlyChampionsModal.tsx` — 1 (texto JSX 1)

</details>

<details><summary><strong>mobile/app/more</strong> — 184 textos en 11 archivos</summary>

- [ ] `apps/mobile/src/app/more/analyzer.tsx` — 66 (texto JSX 52, atributo visible 14)
- [ ] `apps/mobile/src/app/more/categories/[id].tsx` — 22 (texto JSX 10, atributo visible 4, Alert.alert 8)
- [ ] `apps/mobile/src/app/more/history.tsx` — 21 (texto JSX 7, atributo visible 14)
- [ ] `apps/mobile/src/app/more/accounts/[id].tsx` — 15 (texto JSX 6, atributo visible 5, Alert.alert 4)
- [ ] `apps/mobile/src/app/more/profile.tsx` — 14 (texto JSX 2, atributo visible 12)
- [ ] `apps/mobile/src/app/more/projections.tsx` — 13 (texto JSX 9, atributo visible 4)
- [ ] `apps/mobile/src/app/more/index.tsx` — 12 (texto JSX 2, atributo visible 10)
- [ ] `apps/mobile/src/app/more/categories/index.tsx` — 10 (texto JSX 4, atributo visible 6)
- [ ] `apps/mobile/src/app/more/accounts/index.tsx` — 9 (texto JSX 5, atributo visible 4)
- [ ] `apps/mobile/src/app/more/accounts/new.tsx` — 1 (atributo visible 1)
- [ ] `apps/mobile/src/app/more/categories/new.tsx` — 1 (atributo visible 1)

</details>

<details><summary><strong>budgets</strong> — 136 textos en 12 archivos</summary>

- [ ] `src/components/multiUsedComp/Budgets/BudgetEditModal.tsx` — 24 (texto JSX 22, atributo visible 2)
- [ ] `src/components/multiUsedComp/Budgets/UnbudgetedSpending.tsx` — 23 (texto JSX 18, atributo visible 4, aviso al usuario 1)
- [ ] `src/components/multiUsedComp/Budgets/BudgetDetailModal.tsx` — 18 (texto JSX 12, atributo visible 4, aviso al usuario 2)
- [ ] `src/components/multiUsedComp/Budgets/BudgetsClient.tsx` — 18 (texto JSX 10, atributo visible 7, aviso al usuario 1)
- [ ] `src/components/multiUsedComp/Budgets/ProjectBudgetDetailModal.tsx` — 18 (texto JSX 15, atributo visible 3)
- [ ] `src/components/multiUsedComp/BudgetCont.tsx` — 11 (texto JSX 7, atributo visible 4)
- [ ] `src/components/multiUsedComp/Budgets/SpendingSummaryDetailModal.tsx` — 7 (texto JSX 7)
- [ ] `src/components/multiUsedComp/historicalBudgetsComparative/BudgetHistoricalDetailModal.tsx` — 7 (texto JSX 6, atributo visible 1)
- [ ] `src/components/multiUsedComp/historicalBudgetsComparative/HistoricalBudgetsComparativeView.tsx` — 5 (texto JSX 3, atributo visible 2)
- [ ] `src/components/multiUsedComp/historicalBudgetsComparative/BudgetHistoricalComparativeRow.tsx` — 2 (texto JSX 1, atributo visible 1)
- [ ] `src/components/multiUsedComp/historicalBudgetsComparative/propsForBudgetMonthlyChart.tsx` — 2 (texto JSX 2)
- [ ] `src/components/multiUsedComp/Budgets/BudgetBarRow.tsx` — 1 (atributo visible 1)

</details>

<details><summary><strong>mobile/components/raíz</strong> — 124 textos en 27 archivos</summary>

- [ ] `apps/mobile/src/components/movement-form.tsx` — 17 (texto JSX 7, atributo visible 10)
- [ ] `apps/mobile/src/components/budget-summary-sheet.tsx` — 13 (texto JSX 9, atributo visible 4)
- [ ] `apps/mobile/src/components/top-ranking.tsx` — 13 (texto JSX 9, atributo visible 4)
- [ ] `apps/mobile/src/components/compact-time-filter.tsx` — 7 (texto JSX 1, atributo visible 6)
- [ ] `apps/mobile/src/components/transfer-form.tsx` — 7 (texto JSX 2, atributo visible 5)
- [ ] `apps/mobile/src/components/category-picker.tsx` — 6 (texto JSX 2, atributo visible 4)
- [ ] `apps/mobile/src/components/export-sheet.tsx` — 6 (texto JSX 4, atributo visible 2)
- [ ] `apps/mobile/src/components/account-card-color.tsx` — 5 (texto JSX 1, atributo visible 4)
- [ ] `apps/mobile/src/components/color-picker.tsx` — 5 (texto JSX 3, atributo visible 2)
- [ ] `apps/mobile/src/components/icon-picker.tsx` — 5 (texto JSX 3, atributo visible 2)
- [ ] `apps/mobile/src/components/month-grid-modal.tsx` — 4 (texto JSX 1, atributo visible 3)
- [ ] `apps/mobile/src/components/toast.tsx` — 4 (texto JSX 1, atributo visible 3)
- [ ] `apps/mobile/src/components/bank-picker.tsx` — 3 (texto JSX 1, atributo visible 2)
- [ ] `apps/mobile/src/components/date-field.tsx` — 3 (atributo visible 3)
- [ ] `apps/mobile/src/components/info-tip.tsx` — 3 (atributo visible 3)
- [ ] `apps/mobile/src/components/month-switcher.tsx` — 3 (atributo visible 3)
- [ ] `apps/mobile/src/components/picker-modal.tsx` — 3 (texto JSX 2, atributo visible 1)
- [ ] `apps/mobile/src/components/totals-card.tsx` — 3 (texto JSX 3)
- [ ] `apps/mobile/src/components/appearance-card.tsx` — 2 (texto JSX 1, atributo visible 1)
- [ ] `apps/mobile/src/components/budget-progress.tsx` — 2 (atributo visible 2)
- [ ] `apps/mobile/src/components/chip-picker.tsx` — 2 (texto JSX 1, atributo visible 1)
- [ ] `apps/mobile/src/components/period-controls.tsx` — 2 (atributo visible 2)
- [ ] `apps/mobile/src/components/side-nav.tsx` — 2 (atributo visible 2)
- [ ] `apps/mobile/src/components/account-card.tsx` — 1 (atributo visible 1)
- [ ] `apps/mobile/src/components/date-rail.tsx` — 1 (atributo visible 1)
- [ ] `apps/mobile/src/components/info-content.tsx` — 1 (texto JSX 1)
- [ ] `apps/mobile/src/components/option-sheet.tsx` — 1 (atributo visible 1)

</details>

<details><summary><strong>compartidos (componentes)</strong> — 119 textos en 17 archivos</summary>

- [ ] `src/components/Verify2FAClient.tsx` — 35 (texto JSX 26, atributo visible 5, aviso al usuario 4)
- [ ] `src/components/multiUsedComp/TwoFactorPanel.tsx` — 31 (texto JSX 19, atributo visible 5, aviso al usuario 7)
- [ ] `src/components/multiUsedComp/ApiTokensPanel.tsx` — 11 (texto JSX 9, atributo visible 1, aviso al usuario 1)
- [ ] `src/components/multiUsedComp/DedupPreviewModal.tsx` — 10 (texto JSX 8, atributo visible 2)
- [ ] `src/components/Filters/timeRange/TimeRange.tsx` — 4 (atributo visible 4)
- [ ] `src/components/icons/IconsPreviewClient.tsx` — 4 (texto JSX 3, atributo visible 1)
- [ ] `src/components/multiUsedComp/chartsComponents/responsiveBarsChartComponent/ResponsiveBarsChartComponent.tsx` — 4 (texto JSX 4)
- [ ] `src/components/multiUsedComp/ChargedElsewhereSection.tsx` — 3 (texto JSX 2, atributo visible 1)
- [ ] `src/components/multiUsedComp/DeletePreviewRow.tsx` — 3 (texto JSX 3)
- [ ] `src/components/multiUsedComp/InfoTip.tsx` — 3 (texto JSX 1, atributo visible 2)
- [ ] `src/components/multiUsedComp/PrimaryCurrencySelector.tsx` — 3 (texto JSX 1, atributo visible 1, aviso al usuario 1)
- [ ] `src/components/toltips/tooltipsForCharts/TooltipForChart.tsx` — 3 (texto JSX 3)
- [ ] `src/components/inputs/search/SearchInput.tsx` — 1 (texto JSX 1)
- [ ] `src/components/multiUsedComp/AmountEquivalentPreview.tsx` — 1 (atributo visible 1)
- [ ] `src/components/multiUsedComp/InfoContent.tsx` — 1 (texto JSX 1)
- [ ] `src/components/multiUsedComp/TabsComponents/TabsToggler.tsx` — 1 (atributo visible 1)
- [ ] `src/components/multiUsedComp/Tag.tsx` — 1 (texto JSX 1)

</details>

<details><summary><strong>api/transactions</strong> — 88 textos en 11 archivos</summary>

- [ ] `src/app/api/general-data/transactions/[id]/route.ts` — 16 (mensaje de API 16)
- [ ] `src/app/api/general-data/transactions/transfer/route.ts` — 13 (mensaje de API 13)
- [ ] `src/app/api/general-data/transactions/edit-many/route.ts` — 9 (mensaje de API 9)
- [ ] `src/app/api/general-data/transactions/get-all/route.ts` — 9 (mensaje de API 9)
- [ ] `src/app/api/general-data/transactions/speech-add/route.ts` — 9 (mensaje de API 9)
- [ ] `src/app/api/general-data/transactions/remove-transaction/[id]/route.ts` — 6 (mensaje de API 6)
- [ ] `src/app/api/general-data/transactions/transfer/remove/route.ts` — 6 (mensaje de API 6)
- [ ] `src/app/api/general-data/transactions/get-transactions/route.ts` — 5 (mensaje de API 5)
- [ ] `src/app/api/general-data/transactions/link-budget/route.ts` — 5 (mensaje de API 5)
- [ ] `src/app/api/general-data/transactions/new-transaction/route.ts` — 5 (mensaje de API 5)
- [ ] `src/app/api/general-data/transactions/remove-many/route.ts` — 5 (mensaje de API 5)

</details>

<details><summary><strong>categories</strong> — 79 textos en 16 archivos</summary>

- [ ] `src/components/multiUsedComp/EditCategoryModal.tsx` — 13 (texto JSX 7, atributo visible 1, aviso al usuario 5)
- [ ] `src/components/multiUsedComp/CategoriesClient.tsx` — 11 (texto JSX 6, atributo visible 5)
- [ ] `src/components/multiUsedComp/CategoryTreemap.tsx` — 11 (texto JSX 9, atributo visible 2)
- [ ] `src/components/multiUsedComp/historicalComparativeCategories/CategoriesCompareTable.tsx` — 6 (texto JSX 6)
- [ ] `src/components/multiUsedComp/CategoryColorPicker.tsx` — 5 (texto JSX 4, atributo visible 1)
- [ ] `src/components/multiUsedComp/DisplayerCategoryCirclePacking.tsx` — 5 (texto JSX 2, atributo visible 3)
- [ ] `src/components/multiUsedComp/DisplayerCategoryTreemap.tsx` — 5 (texto JSX 2, atributo visible 3)
- [ ] `src/components/multiUsedComp/CategoryBreakdownCard.tsx` — 4 (texto JSX 4)
- [ ] `src/components/multiUsedComp/CategoryCirclePacking.tsx` — 4 (texto JSX 4)
- [ ] `src/components/categories/categoryCircleWithChilds/CategoryCircleWithChilds.tsx` — 3 (texto JSX 2, atributo visible 1)
- [ ] `src/components/multiUsedComp/CategoryList.tsx` — 3 (texto JSX 1, atributo visible 1, aviso al usuario 1)
- [ ] `src/components/multiUsedComp/SubCategoryList.tsx` — 3 (texto JSX 1, atributo visible 1, aviso al usuario 1)
- [ ] `src/components/categories/categoriesModalList/CategoriesModalList.tsx` — 2 (texto JSX 1, atributo visible 1)
- [ ] `src/components/multiUsedComp/historicalComparativeCategories/view/HistoricalComparativeCategoriesView.tsx` — 2 (texto JSX 1, atributo visible 1)
- [ ] `src/components/buttons/buttonWrappers/selectBtnCategoryWithContext.jsx/BtnSelectCategoryContext.tsx` — 1 (texto JSX 1)
- [ ] `src/components/buttons/selectCategoryBtn/SelectCategoryBtn.tsx` — 1 (texto JSX 1)

</details>

<details><summary><strong>projections</strong> — 74 textos en 7 archivos</summary>

- [ ] `src/components/multiUsedComp/Projections/ProjectionMonthDetailModal.tsx` — 24 (texto JSX 16, atributo visible 5, aviso al usuario 3)
- [ ] `src/components/multiUsedComp/Projections/HistoricalBaselinePanel.tsx` — 15 (texto JSX 8, atributo visible 6, aviso al usuario 1)
- [ ] `src/components/multiUsedComp/Projections/ProjectionAccuracyReport.tsx` — 10 (texto JSX 8, atributo visible 2)
- [ ] `src/components/multiUsedComp/Projections/ProjectionsView.tsx` — 10 (texto JSX 7, atributo visible 3)
- [ ] `src/components/multiUsedComp/Projections/IncomeSourcesPanel.tsx` — 9 (texto JSX 7, atributo visible 1, aviso al usuario 1)
- [ ] `src/components/multiUsedComp/Projections/ProjectionsClient.tsx` — 4 (texto JSX 2, atributo visible 2)
- [ ] `src/components/multiUsedComp/Projections/ProjectionVarianceCell.tsx` — 2 (texto JSX 2)

</details>

<details><summary><strong>mobile/components/profile</strong> — 70 textos en 6 archivos</summary>

- [ ] `apps/mobile/src/components/profile/two-factor-card.tsx` — 18 (texto JSX 7, atributo visible 6, Alert.alert 4, aviso al usuario 1)
- [ ] `apps/mobile/src/components/profile/api-tokens-card.tsx` — 15 (texto JSX 6, atributo visible 4, Alert.alert 4, aviso al usuario 1)
- [ ] `apps/mobile/src/components/profile/access-card.tsx` — 13 (texto JSX 3, atributo visible 6, Alert.alert 4)
- [ ] `apps/mobile/src/components/profile/delete-account-card.tsx` — 12 (texto JSX 5, atributo visible 2, Alert.alert 4, aviso al usuario 1)
- [ ] `apps/mobile/src/components/profile/passkeys-card.tsx` — 7 (texto JSX 2, atributo visible 1, Alert.alert 4)
- [ ] `apps/mobile/src/components/profile/currency-card.tsx` — 5 (atributo visible 1, Alert.alert 4)

</details>

<details><summary><strong>mobile/components/analyzer</strong> — 64 textos en 3 archivos</summary>

- [ ] `apps/mobile/src/components/analyzer/sheets.tsx` — 35 (texto JSX 26, atributo visible 9)
- [ ] `apps/mobile/src/components/analyzer/supplement.tsx` — 28 (texto JSX 22, atributo visible 6)
- [ ] `apps/mobile/src/components/analyzer/detail-sheet.tsx` — 1 (atributo visible 1)

</details>

<details><summary><strong>dashboard</strong> — 61 textos en 7 archivos</summary>

- [ ] `src/components/modals/contents/modalForTopMonthItem/ModalContentTopMonthItem.tsx` — 32 (texto JSX 27, atributo visible 5)
- [ ] `src/components/Dashboard.tsx` — 17 (texto JSX 14, atributo visible 3)
- [ ] `src/components/multiUsedComp/TopElementContainerView.tsx` — 6 (texto JSX 4, atributo visible 2)
- [ ] `src/components/multiUsedComp/TopElementsContainer.tsx` — 2 (texto JSX 2)
- [ ] `src/components/multiUsedComp/top3/topMonthContainer/TopMonthItem.tsx` — 2 (texto JSX 1, atributo visible 1)
- [ ] `src/components/multiUsedComp/MultiCreditCard.tsx` — 1 (texto JSX 1)
- [ ] `src/components/multiUsedComp/top3/topRankColumn/TopRankColumn.tsx` — 1 (texto JSX 1)

</details>

<details><summary><strong>mobile/components/projections</strong> — 61 textos en 4 archivos</summary>

- [ ] `apps/mobile/src/components/projections/historical-references-card.tsx` — 19 (texto JSX 7, atributo visible 5, Alert.alert 4, aviso al usuario 3)
- [ ] `apps/mobile/src/components/projections/income-sources-card.tsx` — 18 (texto JSX 6, atributo visible 6, Alert.alert 4, aviso al usuario 2)
- [ ] `apps/mobile/src/components/projections/month-sheet.tsx` — 18 (texto JSX 12, atributo visible 6)
- [ ] `apps/mobile/src/components/projections/accuracy-card.tsx` — 6 (texto JSX 5, atributo visible 1)

</details>

<details><summary><strong>core/accounts</strong> — 49 textos en 2 archivos</summary>

- [ ] `packages/core/src/accounts/cardStyle.ts` — 42 (texto del core 42)
- [ ] `packages/core/src/accounts/accountForm.ts` — 7 (texto del core 7)

</details>

<details><summary><strong>mobile/app/raíz</strong> — 47 textos en 4 archivos</summary>

- [ ] `apps/mobile/src/app/explore.tsx` — 24 (texto JSX 19, atributo visible 5)
- [ ] `apps/mobile/src/app/index.tsx` — 13 (texto JSX 7, atributo visible 6)
- [ ] `apps/mobile/src/app/notifications.tsx` — 7 (texto JSX 2, atributo visible 5)
- [ ] `apps/mobile/src/app/add.tsx` — 3 (texto JSX 1, atributo visible 2)

</details>

<details><summary><strong>auth (login, registro, 2FA, passkeys)</strong> — 44 textos en 4 archivos</summary>

- [ ] `src/components/LoginComponent.tsx` — 18 (texto JSX 14, atributo visible 1, aviso al usuario 3)
- [ ] `src/components/RegisterComp.tsx` — 15 (texto JSX 14, atributo visible 1)
- [ ] `src/components/multiUsedComp/PasskeysPanel.tsx` — 10 (texto JSX 6, atributo visible 1, aviso al usuario 3)
- [ ] `src/lib/auth/stepUpRedirect.ts` — 1 (aviso al usuario 1)

</details>

<details><summary><strong>mobile/components/history</strong> — 44 textos en 6 archivos</summary>

- [ ] `apps/mobile/src/components/history/extra-insights.tsx` — 12 (texto JSX 9, atributo visible 3)
- [ ] `apps/mobile/src/components/history/budgets-comparative.tsx` — 7 (texto JSX 6, atributo visible 1)
- [ ] `apps/mobile/src/components/history/month-by-month.tsx` — 7 (texto JSX 5, atributo visible 2)
- [ ] `apps/mobile/src/components/history/own-period-categories.tsx` — 7 (texto JSX 5, atributo visible 2)
- [ ] `apps/mobile/src/components/history/projections-teaser.tsx` — 7 (texto JSX 4, atributo visible 3)
- [ ] `apps/mobile/src/components/history/period-bar.tsx` — 4 (atributo visible 4)

</details>

<details><summary><strong>accounts</strong> — 43 textos en 3 archivos</summary>

- [ ] `src/components/multiUsedComp/EditAccountModal.tsx` — 18 (texto JSX 14, atributo visible 3, aviso al usuario 1)
- [ ] `src/components/multiUsedComp/AccountClient.tsx` — 15 (texto JSX 11, atributo visible 4)
- [ ] `src/components/multiUsedComp/DeleteAccountPanel.tsx` — 10 (texto JSX 9, aviso al usuario 1)

</details>

<details><summary><strong>mobile/components/home</strong> — 43 textos en 7 archivos</summary>

- [ ] `apps/mobile/src/components/home/summary-carousel.tsx` — 13 (texto JSX 5, atributo visible 8)
- [ ] `apps/mobile/src/components/home/tablet-wallet-header.tsx` — 12 (texto JSX 3, atributo visible 9)
- [ ] `apps/mobile/src/components/home/summary-widget.tsx` — 9 (texto JSX 5, atributo visible 4)
- [ ] `apps/mobile/src/components/home/insights-widget.tsx` — 3 (texto JSX 1, atributo visible 2)
- [ ] `apps/mobile/src/components/home/budgets-widget.tsx` — 2 (texto JSX 2)
- [ ] `apps/mobile/src/components/home/category-table.tsx` — 2 (texto JSX 1, atributo visible 1)
- [ ] `apps/mobile/src/components/home/top-elements.tsx` — 2 (texto JSX 1, atributo visible 1)

</details>

<details><summary><strong>mobile/app/budgets</strong> — 38 textos en 2 archivos</summary>

- [ ] `apps/mobile/src/app/budgets/[id].tsx` — 19 (texto JSX 9, atributo visible 6, Alert.alert 4)
- [ ] `apps/mobile/src/app/budgets/index.tsx` — 19 (texto JSX 8, atributo visible 11)

</details>

<details><summary><strong>mobile/app/movements</strong> — 37 textos en 3 archivos</summary>

- [ ] `apps/mobile/src/app/movements/index.tsx` — 19 (texto JSX 12, atributo visible 4, Alert.alert 3)
- [ ] `apps/mobile/src/app/movements/[id].tsx` — 11 (texto JSX 3, atributo visible 4, Alert.alert 4)
- [ ] `apps/mobile/src/app/movements/import.tsx` — 7 (texto JSX 3, atributo visible 4)

</details>

<details><summary><strong>mobile/components/movements</strong> — 36 textos en 3 archivos</summary>

- [ ] `apps/mobile/src/components/movements/movement-filters.tsx` — 19 (texto JSX 9, atributo visible 10)
- [ ] `apps/mobile/src/components/movements/bulk-edit-sheet.tsx` — 16 (texto JSX 5, atributo visible 9, aviso al usuario 2)
- [ ] `apps/mobile/src/components/movements/movement-row.tsx` — 1 (atributo visible 1)

</details>

<details><summary><strong>api/accounts</strong> — 33 textos en 5 archivos</summary>

- [ ] `src/app/api/general-data/accounts/update-account/route.ts` — 11 (mensaje de API 11)
- [ ] `src/app/api/general-data/accounts/new-account/route.ts` — 7 (mensaje de API 7)
- [ ] `src/app/api/general-data/accounts/get-account/route.ts` — 5 (mensaje de API 5)
- [ ] `src/app/api/general-data/accounts/remove-account/route.ts` — 5 (mensaje de API 5)
- [ ] `src/app/api/general-data/accounts/reorder/route.ts` — 5 (mensaje de API 5)

</details>

<details><summary><strong>navbar y accesos rápidos</strong> — 33 textos en 5 archivos</summary>

- [ ] `src/components/Navbar.tsx` — 16 (texto JSX 11, atributo visible 5)
- [ ] `src/components/multiUsedComp/NotificationsBell.tsx` — 7 (texto JSX 4, atributo visible 3)
- [ ] `src/components/multiUsedComp/IconDisplayerMenu.tsx` — 5 (texto JSX 3, atributo visible 2)
- [ ] `src/components/multiUsedComp/notifications/AlertCelebration.tsx` — 3 (texto JSX 2, atributo visible 1)
- [ ] `src/components/multiUsedComp/ToolsFab.tsx` — 2 (atributo visible 2)

</details>

<details><summary><strong>core/transactions</strong> — 32 textos en 3 archivos</summary>

- [ ] `packages/core/src/transactions/movementFilters.ts` — 16 (texto del core 16)
- [ ] `packages/core/src/transactions/movementForm.ts` — 11 (texto del core 11)
- [ ] `packages/core/src/transactions/duplicateSettings.ts` — 5 (texto del core 5)

</details>

<details><summary><strong>mobile/components/forms</strong> — 30 textos en 3 archivos</summary>

- [ ] `apps/mobile/src/components/forms/budget-form.tsx` — 13 (texto JSX 6, atributo visible 7)
- [ ] `apps/mobile/src/components/forms/category-form.tsx` — 9 (texto JSX 4, atributo visible 5)
- [ ] `apps/mobile/src/components/forms/account-form.tsx` — 8 (texto JSX 3, atributo visible 5)

</details>

<details><summary><strong>api/categories</strong> — 29 textos en 5 archivos</summary>

- [ ] `src/app/api/general-data/categories/get-all/route.ts` — 7 (mensaje de API 7)
- [ ] `src/app/api/general-data/categories/get-categories/route.ts` — 6 (mensaje de API 6)
- [ ] `src/app/api/general-data/categories/update-category/route.ts` — 6 (mensaje de API 6)
- [ ] `src/app/api/general-data/categories/new-category/route.ts` — 5 (mensaje de API 5)
- [ ] `src/app/api/general-data/categories/remove-category/route.ts` — 5 (mensaje de API 5)

</details>

<details><summary><strong>mobile/components/auth</strong> — 29 textos en 4 archivos</summary>

- [ ] `apps/mobile/src/components/auth/login-screen.tsx` — 16 (texto JSX 2, atributo visible 10, aviso al usuario 4)
- [ ] `apps/mobile/src/components/auth/no-two-factor-screen.tsx` — 5 (texto JSX 2, atributo visible 3)
- [ ] `apps/mobile/src/components/auth/two-factor-screen.tsx` — 5 (texto JSX 2, atributo visible 3)
- [ ] `apps/mobile/src/components/auth/code-step.tsx` — 3 (atributo visible 1, aviso al usuario 2)

</details>

<details><summary><strong>api/budget</strong> — 28 textos en 5 archivos</summary>

- [ ] `src/app/api/general-data/budget/update/route.ts` — 7 (mensaje de API 7)
- [ ] `src/app/api/general-data/budget/new/route.ts` — 6 (mensaje de API 6)
- [ ] `src/app/api/general-data/budget/remove/route.ts` — 6 (mensaje de API 6)
- [ ] `src/app/api/general-data/budget/get/route.ts` — 5 (mensaje de API 5)
- [ ] `src/app/api/general-data/budget/get-historical/route.ts` — 4 (mensaje de API 4)

</details>

<details><summary><strong>inicio</strong> — 28 textos en 1 archivos</summary>

- [ ] `src/app/page.tsx` — 28 (texto JSX 23, atributo visible 5)

</details>

<details><summary><strong>core/history</strong> — 27 textos en 1 archivos</summary>

- [ ] `packages/core/src/history/periodComparison.ts` — 27 (texto del core 27)

</details>

<details><summary><strong>api/projection-baseline</strong> — 24 textos en 3 archivos</summary>

- [ ] `src/app/api/general-data/projection-baseline/update/route.ts` — 12 (mensaje de API 12)
- [ ] `src/app/api/general-data/projection-baseline/delete/route.ts` — 8 (mensaje de API 8)
- [ ] `src/app/api/general-data/projection-baseline/get/route.ts` — 4 (mensaje de API 4)

</details>

<details><summary><strong>profile</strong> — 24 textos en 1 archivos</summary>

- [ ] `src/components/ProfileClient.tsx` — 24 (texto JSX 15, atributo visible 4, aviso al usuario 5)

</details>

<details><summary><strong>core/budgets</strong> — 24 textos en 2 archivos</summary>

- [ ] `packages/core/src/budgets/budgetAlerts.ts` — 12 (texto del core 12)
- [ ] `packages/core/src/budgets/budgetForm.ts` — 12 (texto del core 12)

</details>

<details><summary><strong>api/subcategory</strong> — 23 textos en 4 archivos</summary>

- [ ] `src/app/api/general-data/subcategory/get-sub-categories/route.ts` — 6 (mensaje de API 6)
- [ ] `src/app/api/general-data/subcategory/new/route.ts` — 6 (mensaje de API 6)
- [ ] `src/app/api/general-data/subcategory/update/route.ts` — 6 (mensaje de API 6)
- [ ] `src/app/api/general-data/subcategory/remove/route.ts` — 5 (mensaje de API 5)

</details>

<details><summary><strong>api/files</strong> — 22 textos en 4 archivos</summary>

- [ ] `src/app/api/general-data/files/template/[email]/route.ts` — 7 (mensaje de API 7)
- [ ] `src/app/api/general-data/files/deduplicate/[id]/route.ts` — 6 (mensaje de API 6)
- [ ] `src/app/api/general-data/files/upload/[id]/route.ts` — 6 (mensaje de API 6)
- [ ] `src/app/api/general-data/files/export/[email]/route.ts` — 3 (mensaje de API 3)

</details>

<details><summary><strong>api/income-sources</strong> — 22 textos en 4 archivos</summary>

- [ ] `src/app/api/general-data/income-sources/update/route.ts` — 7 (mensaje de API 7)
- [ ] `src/app/api/general-data/income-sources/remove/route.ts` — 6 (mensaje de API 6)
- [ ] `src/app/api/general-data/income-sources/get/route.ts` — 5 (mensaje de API 5)
- [ ] `src/app/api/general-data/income-sources/new/route.ts` — 4 (mensaje de API 4)

</details>

<details><summary><strong>core/transformers</strong> — 18 textos en 3 archivos</summary>

- [ ] `packages/core/src/transformers/walletAnalyzer.ts` — 16 (texto del core 16)
- [ ] `packages/core/src/transformers/budgetHistoricalComparative.ts` — 1 (texto del core 1)
- [ ] `packages/core/src/transformers/projectionsChange.ts` — 1 (texto del core 1)

</details>

<details><summary><strong>api/tags</strong> — 16 textos en 3 archivos</summary>

- [ ] `src/app/api/general-data/tags/update/route.ts` — 6 (mensaje de API 6)
- [ ] `src/app/api/general-data/tags/new/route.ts` — 5 (mensaje de API 5)
- [ ] `src/app/api/general-data/tags/remove/route.ts` — 5 (mensaje de API 5)

</details>

<details><summary><strong>api/api-tokens</strong> — 15 textos en 3 archivos</summary>

- [ ] `src/app/api/general-data/api-tokens/remove/route.ts` — 6 (mensaje de API 6)
- [ ] `src/app/api/general-data/api-tokens/new/route.ts` — 5 (mensaje de API 5)
- [ ] `src/app/api/general-data/api-tokens/list/route.ts` — 4 (mensaje de API 4)

</details>

<details><summary><strong>api/user</strong> — 14 textos en 3 archivos</summary>

- [ ] `src/app/api/general-data/user/update-user/route.ts` — 6 (mensaje de API 6)
- [ ] `src/app/api/general-data/user/get-user/route.ts` — 4 (mensaje de API 4)
- [ ] `src/app/api/general-data/user/remove-user/route.ts` — 4 (mensaje de API 4)

</details>

<details><summary><strong>api/wallet</strong> — 12 textos en 2 archivos</summary>

- [ ] `src/app/api/general-data/wallet/route.ts` — 7 (mensaje de API 7)
- [ ] `src/app/api/general-data/wallet/get-wallet/route.ts` — 5 (mensaje de API 5)

</details>

<details><summary><strong>api/projections</strong> — 11 textos en 2 archivos</summary>

- [ ] `src/app/api/general-data/projections/update/route.ts` — 6 (mensaje de API 6)
- [ ] `src/app/api/general-data/projections/get/route.ts` — 5 (mensaje de API 5)

</details>

<details><summary><strong>api/category-rules</strong> — 10 textos en 2 archivos</summary>

- [ ] `src/app/api/general-data/category-rules/apply-suggestions/route.ts` — 6 (mensaje de API 6)
- [ ] `src/app/api/general-data/category-rules/suggest/route.ts` — 4 (mensaje de API 4)

</details>

<details><summary><strong>history</strong> — 10 textos en 4 archivos</summary>

- [ ] `src/components/multiUsedComp/periodFiltersWithCompare/PeriodFiltersWithCompare.tsx` — 4 (texto JSX 3, atributo visible 1)
- [ ] `src/components/multiUsedComp/top3/topMonthContainer/TopElementsCompareTable.tsx` — 4 (texto JSX 2, atributo visible 2)
- [ ] `src/components/multiUsedComp/HistoryClient.tsx` — 1 (texto JSX 1)
- [ ] `src/components/multiUsedComp/loaders/HistoryGate.tsx` — 1 (texto JSX 1)

</details>

<details><summary><strong>mobile/components/tools</strong> — 8 textos en 2 archivos</summary>

- [ ] `apps/mobile/src/components/tools/categorizer.tsx` — 4 (texto JSX 4)
- [ ] `apps/mobile/src/components/tools/tools-fab.tsx` — 4 (texto JSX 1, atributo visible 3)

</details>

<details><summary><strong>api/fx</strong> — 5 textos en 1 archivos</summary>

- [ ] `src/app/api/general-data/fx/quote/route.ts` — 5 (mensaje de API 5)

</details>

<details><summary><strong>mobile/components/ui</strong> — 5 textos en 4 archivos</summary>

- [ ] `apps/mobile/src/components/ui/skeleton.tsx` — 2 (atributo visible 2)
- [ ] `apps/mobile/src/components/ui/bottom-sheet.tsx` — 1 (atributo visible 1)
- [ ] `apps/mobile/src/components/ui/card.tsx` — 1 (atributo visible 1)
- [ ] `apps/mobile/src/components/ui/text-field.tsx` — 1 (atributo visible 1)

</details>

<details><summary><strong>core/money</strong> — 4 textos en 1 archivos</summary>

- [ ] `packages/core/src/money/currencies.ts` — 4 (texto del core 4)

</details>

<details><summary><strong>api/otras</strong> — 3 textos en 1 archivos</summary>

- [ ] `src/app/api/register/route.ts` — 3 (mensaje de API 3)

</details>

<details><summary><strong>mobile/components/charts</strong> — 3 textos en 3 archivos</summary>

- [ ] `apps/mobile/src/components/charts/category-bubbles.tsx` — 1 (atributo visible 1)
- [ ] `apps/mobile/src/components/charts/category-donut.tsx` — 1 (atributo visible 1)
- [ ] `apps/mobile/src/components/charts/category-treemap.tsx` — 1 (atributo visible 1)

</details>

<details><summary><strong>core/profile</strong> — 3 textos en 1 archivos</summary>

- [ ] `packages/core/src/profile/profileForm.ts` — 3 (texto del core 3)

</details>

<details><summary><strong>mobile/components/budgets</strong> — 1 textos en 1 archivos</summary>

- [ ] `apps/mobile/src/components/budgets/budget-card.tsx` — 1 (atributo visible 1)

</details>

<details><summary><strong>core/banks</strong> — 1 textos en 1 archivos</summary>

- [ ] `packages/core/src/banks/banks.ts` — 1 (texto del core 1)

</details>

## Muestras de la página de inicio

Lo que se encontró en `/`, `/login`, `/register` y `/verify-2fa`, para revisar a mano:

**`src/app/page.tsx`**

- L15 · atributo visible · "alt: Gastify"
- L25 · texto JSX · "Register me"
- L42 · texto JSX · "Discover"
- L44 · texto JSX · "your spending habits in"
- L45 · texto JSX · "1 min"
- L48 · texto JSX · "Register your expenses, import your Bank Statements directly using Excel or XML files"
- L56 · texto JSX · "Login 🤓"
- L62 · texto JSX · "Register me ❤️"
- L71 · atributo visible · "alt: Gastify dashboard on a laptop"
- L83 · atributo visible · "alt: Import your bank statements from Excel"
- L91 · texto JSX · "Import"
- L95 · texto JSX · "Bank Statements"
- L99 · texto JSX · "directly using Excel or XML"
- L103 · texto JSX · "Forget about register manually all your bills and incomes. Just download your bank statements and au"
- L118 · atributo visible · "alt: Custom charts of your spending"
- L126 · texto JSX · "Get all"
- L130 · texto JSX · "cash movements"
- L133 · texto JSX · "in customizable charts. Don’t forget anything!"
- L137 · texto JSX · "Analyze your cash flow with responsive and dynamic charts."
- L149 · texto JSX · "Ready to take the control over your finances?"
- L153 · texto JSX · "In less than a minute you’ll be ready to use the app. Register!"
- L160 · texto JSX · "REGISTER ME ❤️"
- L168 · atributo visible · "alt: Gastify on your devices"
- L177 · texto JSX · "Gastify"
- L178 · texto JSX · "All rights reserved by Gastify"
- …y 3 más

## Límites del conteo

- **Qué sí cuenta:** texto JSX, atributos visibles, mensajes de la API (`message`, `error`, `new Error(...)`), botones y textos de `Alert.alert`, avisos al usuario, y en el core las claves `title`, `label`, `message`, `text`, `description`, `placeholder`, `tooltip`, `subtitle`, `emMessage`, `hint` y las validaciones `errors.campo = "..."`.
- **Qué no cuenta:** texto que se arma con concatenación o variables antes de mostrarse; textos dentro de `className`, claves y valores de datos; los nombres de categorías y bancos que vienen de la base de datos; los textos de `.js`/`.jsx` (ya no quedan en `src/`).
- **Falsos positivos posibles:** ejemplos en comentarios de código de prueba, nombres de iconos o de monedas que pasan la heurística. Se revisan al migrar la zona.
- **Zonas:** se asignan por el nombre del archivo y la carpeta. Un archivo compartido por dos pantallas cae en la primera zona que coincide; el listado completo está en el checklist.

