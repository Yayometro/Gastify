# Migración de Gastify a TypeScript — reglas y estado vivo

> Temporal: este archivo se borra cuando el usuario dé el visto bueno final a
> toda la migración. El historial permanente de hitos vive en
> [`migration-ts-logs.md`](migration-ts-logs.md).

## Regla de oro

**Nunca cambies comportamiento o lógica al migrar un archivo — solo agrega
tipos.** Si ves un bug real mientras migras, NO lo arregles tú: anótalo en el
`summary` de `submit_for_review` para que Claude lo evalúe aparte. La única
excepción son incompatibilidades que el propio compilador de TypeScript o el
chequeo de rutas de Next.js exigen para poder compilar (por ejemplo, un
`return` que no coincide con el tipo de retorno esperado) — esos sí se
corrigen, preservando el comportamiento en tiempo de ejecución exactamente
igual.

## Convención de tipos por categoría de archivo

- **Modelos Mongoose** (`src/model/*.js` → `.ts`): define `interface I<Nombre>`
  junto al schema, en el mismo archivo, reflejando los campos reales del
  schema (incluyendo campos legacy del multi-currency — quedan como
  opcionales, nunca se eliminan; ver `.mds/MULTI_CURRENCY_IMPLEMENTATION_PLAN.md`
  si hace falta contexto).
- **Rutas API** (`src/app/api/**/route.js` → `.ts`): tipa `request`/response.
  El proyecto ya usa `zod` como dependencia — prefiere definir el schema de
  validación de entrada con `zod` y derivar el tipo con `z.infer<>` en vez de
  escribir la interfaz a mano por separado. Cuidado especial: Next.js valida
  en build time que cada handler exportado retorne `void | Response` en
  TODAS sus ramas — revisa que ningún `return` regrese un objeto plano sin
  envolver en `NextResponse.json(...)`.
- **Componentes React** (`.jsx` → `.tsx`): tipa props explícitamente (nunca
  `any` implícito), usa los tipos de evento reales de React para handlers
  (`React.ChangeEvent<HTMLInputElement>`, etc.).
- **Slices de Redux** (`src/lib/features/*.js` → `.ts`): tipa el `state`
  inicial y el payload de cada reducer/acción; exporta el tipo del slice para
  poder componer `RootState` en `src/lib/store.js`.
- **Hooks** (`src/hooks/*.js` → `.ts`): tipa parámetros y valor de retorno
  explícito.

## Dónde viven los tipos compartidos

- `src/types/` para lo que cruza varios archivos (`RootState`, DTOs de API
  compartidos entre cliente y servidor, tipos de dinero/moneda reutilizados).
- Un tipo usado por un solo archivo se queda co-localizado ahí — no todo va a
  `src/types/`.

## Prohibido

- `any` implícito o explícito sin un comentario justificando por qué (caso
  raro: interoperar con una lib sin tipos).
- `// @ts-ignore` sin una nota explicando qué falta resolver.

## Checklist antes de `submit_for_review`

1. `npx tsc --noEmit` sobre el archivo (o el proyecto completo) sin errores
   nuevos atribuibles a este archivo.
2. Si el archivo tiene un test (`<archivo>.test.js` → confirmar que también
   se migra o al menos sigue pasando), correr `npx vitest run <archivo>`.
3. Solo si el archivo está marcado como **UI de alto riesgo** en la historia
   activa: abrir el navegador interno de Antigravity y confirmar que la
   pantalla/flujo relacionado sigue renderizando y funcionando igual que
   antes.
4. Llamar a `submit_for_review` en el MCP coordinator con un resumen real de
   qué cambió (no un genérico "migrado a TS").

## Estado vivo — historias de usuario

La fuente de verdad operativa (qué archivo está pendiente/reclamado/en
revisión/aprobado) vive en `tools/migration-coordinator/state.json`, servida
por el MCP server `gastify-ts-migration-coordinator` — consúltalo con
`list_files`/`get_story_status`, no asumas el estado leyendo este documento.

**Historia 1 — Login y autenticación completa: COMPLETA** (23/23 aprobados,
2026-09-23). Password+2FA, Google y passkey confirmados por el usuario en
vivo; registro y login por password puro quedaron pendientes de probar
(se harán después, no bloquean seguir). Dos archivos muertos/huérfanos
encontrados en el camino se borraron con aprobación del usuario, y un bug
de seguridad real fuera de alcance (IDOR en
`general-data/user/get-user/route.js`) se corrigió aparte de inmediato por
prioridad alta.

**Historia 1 (Login/Auth) y Historia 2 (Dashboard) completas.**

**Historia 3 (Profile) completa** - ProfileClient, ApiTokensPanel y sus 4
rutas de API. En el camino se encontraron y corrigieron 4 bugs de
seguridad IDOR reales fuera del flujo normal de migración (ver tabla en
`migration-ts-logs.md`) - mismo patron que el IDOR de `get-user` ya
corregido en Historia 1.

**Historia 4 (Componentes compartidos pequeños) completa** - 10/10
archivos (`CategoIcon`, `UniversalCategoIcon`, `EmptyModule`, `Tag`,
`SelecterFilter`, `SelecterItemsToDisplay`, `TimeRange`,
`MultiCreditCard`, `GoalBudget`, `DeletePreviewRow`). Ver
`migration-ts-logs.md` para la tabla consolidada de bugs pendientes
encontrados en el camino (no arreglados, fuera de alcance), incluyendo
la causa raiz confirmada del bug del dropdown de periodo del Dashboard
(`SelecterFilter.jsx`: `value: 30` duplicado entre "Last 30 days" y
"Last 90 days").

**Historia 5 (Accounts) completa** - 9/9 archivos, 0 rondas de rework.
2 fixes de seguridad mas encontrados en el camino (`get-wallet`,
`wallet/route.js` - ver tabla consolidada en `migration-ts-logs.md`).

**Historia 6 (Categories) completa** - 20/20 archivos, 3 rondas de
rework (mismo bug del typo `size`/`siz` en `UniversalCategoIcon`
repitiendose 3 veces + el patron de siempre en `EditCategoryModal`). 2
fixes de seguridad mas (`get-categories`/`get-sub-categories`, ver
tabla consolidada en `migration-ts-logs.md`). Ademas, a peticion
explicita del usuario, se corrigieron 3 bugs reales preexistentes en
`CategoriesClient.tsx` (dispatch faltante, condiciones `.length < 0`,
seccion "Default Sub Categories" duplicada) - commit `ef2059c`.

**Historia 7 (Budgets) completa** - 12/12 archivos (`dashboard/budgets/page`,
`BudgetsClient`, `BudgetBarRow`, `BudgetEditModal`, `BudgetDetailModal`,
`ProjectBudgetDetailModal`, `SpendingSummaryDetailModal`, modelo `Budget`,
y las 4 rutas `budget/new`/`update`/`remove`/`get-historical` -
`budget/get` ya estaba migrada desde Historia 2, donde tambien se
corrigio su review-miss de IDOR junto con las otras 4 rutas - 5 fixes de
seguridad mas, ver tabla consolidada). 2 rondas de rework: en
`BudgetEditModal` se revirtieron 3 cambios de comportamiento no forzados
(`||`->`??` en goalAmount/savingAmount, un ternario de icon); en
`BudgetDetailModal` se revirtio el typo `size`->`siz` repetido en
`CategoIcon` (otra vez, mismo patron de historias anteriores) y, mas
importante, se descubrio y se dejo documentado sin arreglar un bug real
preexistente: el boton "Delete transaction" de ese modal llama
`fetcher.post(...)` directo sobre el modulo en vez de la instancia
`fetcher()`, asi que siempre ha tirado `TypeError` y nunca borra en el
backend (el movimiento solo desaparece optimistamente del Redux) - ver
tabla de bugs pendientes. Deliberadamente NO incluye
`UnbudgetedSpending.jsx` ni el arbol de
`HistoricalBudgetsComparative`/`HistoricalWalletAnalyzer` (analytics
pesado, su propia historia futura).

**Historia 8 (Movements/Transacciones) completa** - 25/25 archivos
(`dashboard/movements/page`, `MovementsClient`, `Movements` [1466→1586
líneas, el más grande de toda la migración], `EditSingleTransModal`,
`EditMultipleTransModal`, `QuickEditModal`, `DuplicateComparisonTable`,
`BtnSelectCategoryContext`, `AddTransactionComp`, `ReadFileComp`,
`CategorySuggestions/` [3 archivos], modelos `Transaction` y `Tag`, y
10 rutas de `transactions/*`). El grupo Transactions del checklist de
seguridad quedó **100% auditado**: 10 fixes de sesión/IDOR durante la
historia más un 11vo (`get-transactions`, que ya estaba en `.ts` desde
antes pero nunca se había auditado) encontrado y corregido al cerrarla
- 33 fixes de seguridad acumulados en toda la migración, ver tabla
consolidada. Varios rounds de rework por el mismo patrón `<Space
direction="">` de Antd (bug visual real preexistente, revertido dos
veces) y un `Tag.create()` al que se le agregó `wallet` sin ser
necesario (revertido). Se encontraron y documentaron sin arreglar 4
bugs reales más (ver tabla de bugs pendientes filas 10-14), incluyendo
uno en `handleMultiTransEdit` (key de React duplicada entre modales) y
la inconsistencia de tags-sin-wallet en `edit-many`. Deliberadamente NO
incluye: `HistoricalMovementsController`/`HistoricalMovementsView` ni
el árbol `top3/` (analytics pesado de agregación, historia futura);
`AddTransactionModal`/`TransferExchangeModal` (flujo aparte de alta
rápida desde el Navbar); `UnbudgetedSpending.jsx` (ya excluido en
Historia 7). `EditTransModal.jsx` y `VoiceRecognicionComponent.jsx` son
código huérfano sin importadores en todo el repo - no se migraron, son
candidatos a borrar con aprobación del usuario (igual que los huérfanos
de Historia 1) - hay una tarea en cola para borrarlos.

**Historia 9 (Wallet Analyzer) completa** - 20/20 archivos: el widget de
análisis financiero del Dashboard (`WalletAnalyzer`,
`WalletAnalyzerTeaser`, `WalletAnalyzerView` [812→1157 líneas],
`WalletAnalyzerTrendChart`, `WalletAnalyzerInsightsStrip`,
`WalletAnalyzerProjectionCard`, `WalletAnalyzerWeekdayChart`,
`MonthlyChampionsModal`, `InsightDetailModal`,
`WeekdaySpendingDetailModal`, el transformer
`helpers/transformers/walletAnalyzer.ts` [1500→2273 líneas de pura
lógica de cálculo, revisado a fondo - su `walletAnalyzer.test.js` de
1129 líneas siguió pasando 76/76 idéntico], el hook
`useAccountsFxExposure`, los modelos `FxRateSnapshot`/`IncomeSource`/
`ProjectionSettings`/`ProjectionBaseline`, y las 4 rutas de solo
lectura `income-sources/get`, `projections/get`,
`projection-baseline/get`, `fx/quote`). Cero rondas de rework en toda
la historia. 3 de las 4 rutas de lectura tenían el mismo IDOR clásico
(`mail`/`id` del body sin verificar sesión) y se corrigieron - `fx/quote`
se confirmó correctamente como pública (cotizaciones sin datos de
usuario, no necesita sesión). Deliberadamente NO incluye:
`HistoricalWalletAnalyzer.jsx` ni `HistoricalProjectionsTable`/
`BudgetPeriodDetailModal` (la variante "History" del mismo widget,
renderizada en `dashboard/history/page.jsx` vía `HistoryClient.jsx` -
su propia historia futura "History"); `ModalContentTopMonthItem.jsx`
(compartido con el árbol pesado de analytics `top3/`, ya excluido antes
- se usa vía typed bridge); las rutas de escritura
`income-sources/new,update,remove` y `projections/update` y
`projection-baseline/update,delete` (pertenecen a la futura historia
"Projections" junto con la UI que las administra, aún sin
localizar/explorar).

**Historia 10 (History) completa** - 16/16 archivos: la página de
comparativas históricas (`dashboard/history/page.jsx`, `HistoryClient.jsx`,
la variante "History" de Wallet Analyzer completa
[`HistoricalWalletAnalyzer.jsx` 836→943 líneas, `HistoricalProjectionsTable.jsx`,
`BudgetPeriodDetailModal.jsx`], y sus dependencias chicas
[`TabsToggler`/`TabsTogglerMontlyController`/`TabsTogglerMontlyView`,
`DashboardLoadingMessage`, `usePeriodComparison`, `budgetHistory.js`,
`timeFunctions.js` [309→360 líneas, el helper de fechas compartido por
docenas de consumidores en toda la app], `useGetInfoFromProvider.js`,
`PeriodFiltersWithCompare.jsx`, `useProjectionTable.js` [248→421
líneas], `ProjectionsView.jsx`]). Todos los modelos y rutas de API que
este árbol necesita ya estaban migrados desde Historia 9 - historia
puramente de UI/lógica de cliente, sin backend nuevo que tocar y por lo
tanto sin fixes de seguridad nuevos. Solo 1 ronda de rework en toda la
historia (`budgetHistory.ts` traía un `[key: string]: any` no
justificado en un index signature que nadie consumía todavía - se quitó,
el genérico se infiere solo del array real). Encontró 3 ocurrencias más
del patrón "Redux action creator llamado sin `dispatch()`"
(`HistoryClient.tsx`/`setUser`, `TabsTogglerMontlyController.tsx`/
`setTransacctions`, ambas documentadas y preservadas sin arreglar) y 6
bugs de comportamiento reales más (año/fecha congelados a nivel de
módulo en `usePeriodComparison.ts` y `timeFunctions.ts`,
`comparePeriod` que no se resincroniza al cambiar `timePeriod`, el
parámetro `year` ignorado en una rama de
`generate_timeperiod_ranges_array_for_dashboard`, y una paleta de
colores de mes inconsistente entre `getYearMonthDateRange` y
`monthObjects`) - todos documentados en `migration-ts-logs.md`, ninguno
arreglado. Deliberadamente NO incluyó: `HistoricalMovementsController.jsx`,
`HistoricalComparativeCategories.jsx`, `HistoricalBudgetsComparative.jsx`
(los 3 árboles pesados de analytics, cada uno su propia historia futura,
aunque `HistoryClient.jsx` los renderiza directamente - se usan vía
typed bridge); `ModalContentTopMonthItem.jsx` (compartido con `top3/`,
ya excluido); `budgetHistoricalComparative.js` (compartido con
`HistoricalBudgetsComparative` excluido, ya funciona bien sin tipar
como dependencia de `walletAnalyzer.ts`).

**Historia 11 (Categories - analytics) completa** - 10/10 archivos, dos
árboles: (1) la sección "Category Details" del Dashboard con sus 3 tabs -
`TransDetailsGrandContainer.tsx` [entry, renderizado desde `Dashboard.tsx`
ya migrado], `DisplayerCategoryTreemap.tsx`, `CategoryTreemap.tsx` [666→819
líneas, algoritmo squarified treemap hecho a mano - el archivo de mayor
riesgo de la historia, revisado carácter por carácter contra el original,
cero diferencias en la matemática], `DisplayerCategoryCirclePacking.tsx`,
`CategoryCirclePacking.tsx` [Nivo `ResponsiveCirclePacking`, usa los
tipos oficiales del paquete], `TransactionsResumeCont.tsx`,
`TransResumeChart.tsx` [Nivo `ResponsiveSunburst`, también con tipos
oficiales]; (2) la comparativa histórica de categorías en
`/dashboard/history` - `HistoricalComparativeCategories.tsx`,
`CategoriesCompareTable.tsx`, `HistoricalComparativeCategoriesView.tsx`
(la que había sido explícitamente excluida de Historia 10 como "árbol
pesado de analytics, historia futura"). Historia puramente de UI/lógica
de cliente - no tocó modelos ni rutas de API nuevas, por lo tanto sin
fixes de seguridad nuevos. **1 ronda de rework**: en `TransResumeChart.tsx`
un `?.` agregado sin necesidad (`fatherId: cat?._id`) estuvo a punto de
tapar por accidente un bug real de crash (`TypeError` si una transacción
tiene subcategoría pero no categoría) que el propio resumen de agy decía
haber preservado - se detectó en revisión y se revirtió a `cat._id` para
mantener el crash original exacto. Encontró 2 ocurrencias más del patrón
"Redux action creator sin `dispatch()`" (`HistoricalComparativeCategories.tsx`
- `setUser`/`setTransacctions`, la 5ta y 6ta de toda la migración) y 5
bugs de comportamiento reales más (2 divisiones por cero en tooltips que
muestran "NaN%", un ícono con formato inconsistente que se resuelve a
`null`, un símbolo `$` fijo ignorando la moneda primaria de la wallet, y
el TypeError de `TransResumeChart.tsx` ya mencionado) - todos documentados
en `migration-ts-logs.md` (filas 22-28), ninguno arreglado.
Deliberadamente NO incluyó: `TopCategoryRow` (árbol `top3/`, ya excluido
en historias anteriores, usado vía typed bridge en
`CategoriesCompareTable.tsx`); `transactionsChange.js` (helper compartido
enorme usado por decenas de archivos en toda la app, incluye
`buildCategoryHierarchy`/`getTransactionsFromTimeRange`/etc - se queda sin
tipar, demasiado riesgoso para incluir de paso aquí, su propia historia
futura aparte).

**Historia 12 (Budgets - analytics) completa** - 7/7 archivos: la
sección "Budgets comparative" de `/dashboard/history` -
`HistoricalBudgetsComparative.tsx` [entry, renderizado desde
`HistoryClient.tsx` ya migrado vía typed bridge - el mismo bridge
existente, sin tocar, siguió compilando sin cambios],
`HistoricalBudgetsComparativeView.tsx`, `BudgetHistoricalComparativeRow.tsx`
[usa `ColumnChartAntComparative`, árbol de charts compartido ya excluido
y bridged desde Historia 10, y `propsForBudgetMonthlyChart.tsx`],
`BudgetHistoricalDetailModal.tsx` [modal de detalle mes a mes, usa
`CategoIcon.tsx` ya migrado], `propsForBudgetMonthlyChart.tsx` [100→172
líneas - migrado a `.tsx`, no `.ts`, porque el `.js` original ya
contenía JSX real en su callback de tooltip], `budgetHistoricalComparative.ts`
[108→208 líneas, el transformer principal - importa de
`budgetHistory.ts`/`timeFunctions.ts` ya migrados, y de
`transactionsChange.js`/`projectionsChange.js` aún sin migrar que se
quedan como están; su tipo de retorno ya era consumido sin verificar
por `walletAnalyzer.ts` desde Historia 9 - esta migración fue la
primera vez que ese cruce se validó de verdad por el compilador, y
pasó limpio - con su test suite `budgetHistoricalComparative.test.js`
corrida aparte, 9/9], y `budgetTypes.ts` [21→39 líneas, clasificación
de budget spending/saving/project - pequeño y ya usado por 6
consumidores TS existentes, todos siguieron compilando sin cambios].
La ruta de API `budget/get-historical` ya estaba migrada desde
Historia 7 - historia puramente de UI/lógica de cliente, **sin fixes
de seguridad nuevos**. **Cero rondas de rework en toda la historia.**
Encontró 7 bugs de comportamiento reales más (sin ocurrencias nuevas
del patrón dispatch-less esta vez): clasificación incorrecta de
budgets con `budgetType: "saving"` explícito pero `isSaving` falso,
fechas inválidas silenciosas y estimación incorrecta en el cálculo de
metas mensuales, sort sin desempate, falta de `preventDefault()` en
navegación por teclado, "0% compliance" indistinguible de "sin datos",
y un crash potencial de moneda no soportada sin fallback - todos
documentados en `migration-ts-logs.md` (filas 29-35), ninguno
arreglado. Deliberadamente NO incluyó: `transactionsChange.js` ni
`projectionsChange.js` (helpers compartidos enormes, pospuestos igual
que en Historias 10 y 11); `ColumnChartAntComparative` (árbol de
charts compartido, ya excluido, vía typed bridge igual que en
`TabsTogglerMontlyController.tsx`).

**Historia 13 (Navbar/alta rápida) completa** - 5/5 archivos: el shell
de navegación completo y el modal de alta rápida de transacciones -
`Navbar.tsx` [205→212 líneas, entry, renderizado desde
`dashboard/layout.tsx` ya migrado; incluye auth (`authClient`), theme
toggle (`useThemeMode`), y renderiza `AddTransactionModal`],
`AddTransactionModal.tsx` [100→106 líneas, modal de 4 tabs: Manual →
`AddTransactionComp.tsx` ya migrado, Excel → `ReadFileComp.tsx` ya
migrado, Categories → `EditCategoryModal` ya migrado Historia 6,
Transfer → `TransferExchangeModal.tsx`], `TransferExchangeModal.tsx`
[268→292 líneas, formulario de transferencia entre cuentas/conversión
de divisas - el archivo más sensible de esta historia por ser lógica
de dinero real, tuvo 1 ronda de rework por 2 guards no forzados que
casi tapaban 2 crashes preexistentes reales], `scrollLock.ts` [31
líneas, helper compartido de bloqueo de scroll con reference
counting], y `ThemeProvider.tsx` [75→86 líneas, contexto de tema
claro/oscuro]. Todas las rutas de API que este árbol necesita ya
estaban migradas desde Historias 7-9 - historia puramente de UI/lógica
de cliente, **sin fixes de seguridad nuevos**. Encontró 6 bugs de
comportamiento reales más: 2 crashes preexistentes en
`TransferExchangeModal.tsx` que casi se "arreglaron" por accidente
durante el rework (fecha `null` sin proteger, `user` sin proteger en
el submit de una transferencia real), el flag "pegajoso"
`destinationTouched`, el congelamiento de `EMPTY_FORM.date` a nivel de
módulo, redondeo sub-centavo bloqueando el submit, y una 3ra ocurrencia
del bug `ccUser.status` siempre `undefined` (mismo patrón raíz que el
bug #13 de `ReadFileComp.tsx`, Historia 8) - todos documentados en
`migration-ts-logs.md` (filas 36-41), ninguno arreglado. Deliberadamente
NO incluyó: `EditTransModal.jsx` (otro consumidor de `ThemeProvider`
pero fuera de este árbol, su propia historia futura si hiciera falta).

**Historia 14 (Projections) completa** - 16/16 archivos: la página
`/dashboard/projections` completa de gestión - distinta de la tabla de
solo-lectura `HistoricalProjectionsTable.tsx` ya migrada en Historia 10.
`ProjectionsClient.tsx` [221→239 líneas, entry], `IncomeSourcesPanel.tsx`
[256 líneas, CRUD de fuentes de ingreso], `HistoricalBaselinePanel.tsx`
[272 líneas, CRUD de baseline histórico], `ProjectionMonthDetailModal.tsx`
[325→379 líneas, el más grande, usa `Movements.tsx` ya migrado y
`CurrencyBreakdownChips.tsx`], `ProjectionAccuracyReport.tsx` [86
líneas], `ProjectionAccuracyInfoModal.tsx` [80 líneas],
`ProjectionsInfoModal.tsx` [74 líneas], `ProjectionVarianceCell.tsx`
[39 líneas], `CurrencyBreakdownChips.tsx` [38 líneas, pequeño y
compartido, también usado por `BudgetDetailModal.tsx` ya migrado], y
`dashboard/projections/page.tsx` [21→20 líneas, final]. **6 fixes de
seguridad nuevos (#37-42)** en las rutas de API de escritura que
Historia 9 dejó explícitamente pendientes para esta historia:
`projections/update`, `projection-baseline/update`,
`projection-baseline/delete` (confiaban en el `mail` del body),
`income-sources/update` y `income-sources/remove` (cero sesión NI
ownership, mismo nivel que el bug de `remove-many` de Historia 8), e
`income-sources/new` (forjaba `user`/`wallet` desde el body, mismo
patrón que `new-transaction`). **Cero rondas de rework** - incluyendo
`ProjectionsClient.tsx`, que cruzó por compilador las interfaces de los
6 hijos ya migrados sin ajustes. 36 bugs de comportamiento nuevos
documentados (filas 42-77 de `migration-ts-logs.md`), el conteo más
alto en una sola historia hasta ahora. Deliberadamente NO incluyó:
`projectionsChange.js` (helper compartido grande, pospuesto igual que
`transactionsChange.js`); `mcpProjections.js` (parte de la futura
historia de MCP tools).

**Historia 15 (MCP tools) completa** - 9/9 archivos: el servidor MCP
remoto de Gastify que expone herramientas - `create_transaction`,
`get_monthly_summary`, `get_projections`, etc. - a conectores de IA
(Claude, ChatGPT) vía HTTP autenticado por token personal.
`apiTokens.ts` [54→95 líneas], `currencies.ts` [88→131 líneas],
`transactionReadService.ts` [66→142 líneas], `fxRateService.ts`
[135→196 líneas], `createTransaction.ts` [184→227 líneas],
`mcpProjections.ts` [120→170 líneas], `buildGastifyMcpServer.ts`
[703→763 líneas, el más grande y sensible: las 12 MCP tools], y las 2
rutas de API que exponen el servidor (`app/api/mcp/route.ts` [31→32
líneas, auth por header Bearer] y `app/api/mcp/[token]/route.ts`
[34→47 líneas, auth por token en la URL]). **Sin fixes de seguridad
nuevos** - todo el árbol ya derivaba `user`/`wallet` del closure
autenticado por `resolveApiToken()`, nunca de ids del cliente. **Cero
rondas de rework**, incluyendo el archivo más grande y complejo de
toda la migración hasta ahora (`buildGastifyMcpServer.js`, revisado
verificando cada cast/guard individualmente). 14 bugs de comportamiento
nuevos documentados (filas 78-91 de `migration-ts-logs.md`). Los dos
transformers compartidos más grandes de la app (`transactionsChange.js`,
`projectionsChange.js`) se consumieron como `any` implícito SIN typed
bridge, mismo patrón que `useProjectionTable.ts` ya establecía
(corrección: en historias previas se dijo "consumidos vía typed
bridge" - impreciso, en realidad nunca hizo falta un bridge, `any`
implícito basta con `strict: false`).

**Historia 16 (Transformers restantes) completa** - 6/6 archivos: los 2
grandes (`transactionsChange.ts`, `projectionsChange.ts`) migrados
directamente por Claude por pedido explícito del usuario, y los 4 chicos
(`transactionDuplicates.ts`, `budgetCoverage.ts`, `categoryRuleMatcher.ts`,
`categoriesTransformers.ts`) migrados por agy y auditados por Claude (2
retrabajos hechos por Claude: tipos de `budgetCoverage.ts` y un guard no
forzado en `categoriesTransformers.ts`). Sin fixes de seguridad. Primera
vez que el compilador valida las ~38 llamadas de consumidores que antes
eran `any` implícito: ~30 errores, todos de tipos, resueltos sin cambiar
runtime. 28 bugs nuevos documentados (filas 92-119 de
`migration-ts-logs.md`).

**No hay historia activa en este momento.** Corrección importante: esta
sección decía antes que solo faltaban unos modelos/helpers de dinero y
`scripts/`; eso era incorrecto. Un `find` real en `src/` muestra **98
archivos `.js`/`.jsx` (sin contar tests) aún sin migrar**, además de ~10
scripts en `scripts/` y los configs raíz (`next.config.js`, etc.).
El inventario real está en la sección siguiente.

## Inventario de lo que falta migrar (Historias 17 en adelante)

Generado con un análisis de imports real sobre `src/` (estáticos y `import()` dinámicos), no a ojo. Total de `.js`/`.jsx` sin contar tests: **97 archivos / 9,560 líneas**; de ellos **71 están vivos (7,458 líneas)** y **26 son código muerto (2,102 líneas)**, sin ningún importador alcanzable desde una página, ruta o archivo `.ts/.tsx` (ver lista abajo). Una sola Historia con los 71 vivos sería ~4.5 veces la más grande hecha hasta ahora, y mezclaría fixes de seguridad con UI; se recomienda dividir en 5.


### Historia 17 — COMPLETA (2026-09-30): 13/13 rutas migradas, 12 fixes de seguridad (#43-54). Ver `migration-ts-logs.md`.

### Historia 18 — Fundaciones consumidas por código ya migrado: 17 archivos, 1033 líneas

`dbConnection.js` (50 importadores ya migrados), `fetcher.js` (38), `gastifyNotifier.js` (29), `Wallet.js` (12; permite borrar los `WalletModelBridge` de `apiTokens.ts` y `createTransaction.ts`) y el núcleo de dinero (`conversion`, `transactionMoney`, `transactionMoneyService`, `ecbClient`). Riesgo: mismo efecto que los transformers (~30 errores de tipos en consumidores).

- `app/api/dbConnection.js` (13)
- `helpers/defaultIconsDB.js` (240)
- `helpers/downloadBackupCodes.js` (23)
- `helpers/fetcher.js` (51)
- `helpers/gastifyNotifier.js` (54)
- `helpers/hooks/useLinkedAccountsTotal.js` (100)
- `helpers/orderFunctions/orderFunctions.js` (8)
- `lib/features/loadGeneralDataSlice.js` (16)
- `lib/features/tagsSlice.js` (16)
- `lib/files/gastifyTemplate.js` (59)
- `lib/money/conversion.js` (97)
- `lib/money/server/ecbClient.js` (94)
- `lib/money/server/transactionMoneyService.js` (66)
- `lib/money/transactionMoney.js` (74)
- `model/CategoryRule.js` (50)
- `model/Wallet.js` (39)
- `model/schemas/moneySchemas.js` (33)

### Historia 19 — Top3, movimientos históricos y modal de detalle: 16 archivos, 2284 líneas

Árbol conectado por `ModalContentTopMonthItem.jsx` (704 líneas, el más grande) y `TransactionItemList.jsx`. Va antes que la UI restante porque `DedupPreviewModal` depende de `TransactionItemList`.

- `components/Transactions/ItemList/TransactionItemList.jsx` (145)
- `components/modals/contents/modalForTopMonthItem/ModalContentTopMonthItem.jsx` (704)
- `components/multiUsedComp/HistoricalMovementsandCategories/HistoricalMovementsController.jsx` (286)
- `components/multiUsedComp/HistoricalMovementsandCategories/HistoricalMovementsView.jsx` (63)
- `components/multiUsedComp/TabsComponents/tabsMontlyTransactions/propsForColumnChartAntComparative-tabsToggler/propsColTabsToggler.js` (283)
- `components/multiUsedComp/Tooltips/BasicTooltip.jsx` (19)
- `components/multiUsedComp/TopElementContainerView.jsx` (87)
- `components/multiUsedComp/TopElementsContainer.jsx` (214)
- `components/multiUsedComp/top3/atomicTop/AtomicTop.jsx` (56)
- `components/multiUsedComp/top3/topMonthContainer/TopCategoryRow.jsx` (48)
- `components/multiUsedComp/top3/topMonthContainer/TopElementsCompareTable.jsx` (102)
- `components/multiUsedComp/top3/topMonthContainer/TopMonthContainer.jsx` (49)
- `components/multiUsedComp/top3/topMonthContainer/TopMonthItem.jsx` (90)
- `components/multiUsedComp/top3/topMonthContainer/TopTransactionRow.jsx` (26)
- `components/multiUsedComp/top3/topRankColumn/TopRankColumn.jsx` (80)
- `components/toltips/tooltipsForCharts/TooltipForChart.jsx` (32)

### Historia 20 — UI restante (budgets, tarjetas, gráficas, tabs, categorías): 21 archivos, 2409 líneas

Componentes hoja; casi todos dependen de `fetcher`/`gastifyNotifier` (Historia 18).

- `components/buttons/selectCategoryBtn/SelectCategoryBtn.jsx` (13)
- `components/categories/categoriesModalList/CategoriesModalList.jsx` (69)
- `components/categories/categoryCircle/CategoryCircle.jsx` (45)
- `components/categories/categoryCircleWithChilds/CategoryCircleWithChilds.jsx` (53)
- `components/categories/categorySearchedItem/CategorySearchedItem.jsx` (18)
- `components/categories/renderCateoriesSelect/RenderCategoriesSearch.jsx` (33)
- `components/inputs/search/SearchInput.jsx` (25)
- `components/multiUsedComp/AmountEquivalentPreview.jsx` (25)
- `components/multiUsedComp/BudgetCont.jsx` (266)
- `components/multiUsedComp/Budgets/UnbudgetedSpending.jsx` (373)
- `components/multiUsedComp/CategorySuggestionsModal.jsx` (29)
- `components/multiUsedComp/ChargedElsewhereSection.jsx` (64)
- `components/multiUsedComp/CreditCard.jsx` (362)
- `components/multiUsedComp/DedupPreviewModal.jsx` (220)
- `components/multiUsedComp/ResumeTabsTrans.jsx` (145)
- `components/multiUsedComp/TabsTrans.jsx` (235)
- `components/multiUsedComp/ToolsFab.jsx` (30)
- `components/multiUsedComp/ToolsModal.jsx` (78)
- `components/multiUsedComp/chartsComponents/columnChartAntComparative/ColumnChartAntComparative.jsx` (120)
- `components/multiUsedComp/chartsComponents/responsiveBarsChartComponent/ResponsiveBarsChartComponent.jsx` (159)
- `hooks/money/useTransactionAmountEquivalent.js` (47)

### Historia 21 — Entradas de Next y providers (cierre): 4 archivos, 274 líneas

`layout.js`, `page.js`, `AllDataProvider`, `ReduxProvider`: envuelven todo, mejor al final.

- `app/layout.js` (48)
- `app/page.js` (186)
- `components/Providers/AllDataProvider.jsx` (29)
- `lib/ReduxProvider.js` (11)

### Código muerto: 26 archivos, 2102 líneas (DECISIÓN DEL USUARIO, 2026-09-30: por ahora se ignoran; ni se borran ni se migran)

**Decisión:** el usuario decidió ignorarlos por ahora - no entran en ninguna historia, no se borran y no se migran; se quedan como `.js`/`.jsx` en el repo. Se puede reabrir la decisión más adelante. Cualquier conteo de "archivos pendientes" debe excluirlos.

No los importa ningún archivo alcanzable (verificado también con grep en todo el repo, scripts y CSS). `apiSlice.js` está 100% comentado. Ojo: `EditTransModal.jsx` y `VoiceRecognicionComponent.jsx` son funcionalidad grande (401 y 303 líneas) que quedó sin uso; `defCategoriesCreator.js.js` tiene doble extensión.

- `app/StoreProvider.js` (0)
- `app/api/defCategoriesCreator.js.js` (195)
- `components/DatePiker.jsx` (16)
- `components/HOCs/modalHocRenderTrans/modalWithRenderTrans.js` (9)
- `components/HOCs/withIncomes.js` (4)
- `components/buttons/btnWithModal/BtnWithModal.jsx` (17)
- `components/multiUsedComp/Category.jsx` (32)
- `components/multiUsedComp/EditTransModal.jsx` (401)
- `components/multiUsedComp/GastifyModal.jsx` (0)
- `components/multiUsedComp/GoalGaugeRange.jsx` (159)
- `components/multiUsedComp/GoalLiquid.jsx` (32)
- `components/multiUsedComp/GoalSavingsRange.jsx` (84)
- `components/multiUsedComp/NestCircle.jsx` (88)
- `components/multiUsedComp/RangePicker.jsx` (55)
- `components/multiUsedComp/Top3.jsx` (213)
- `components/multiUsedComp/Top3ContComp.jsx` (112)
- `components/multiUsedComp/TransTable.jsx` (63)
- `components/multiUsedComp/VoiceRecognicionComponent.jsx` (303)
- `components/multiUsedComp/top3/top-container/TopContainer.jsx` (61)
- `components/multiUsedComp/top3/topMonthContainer/TopItemContainer.jsx` (93)
- `components/renderTransactionsInModal/RenderTransactionsInModal.jsx` (35)
- `hooks/Categories/useHandleCategorySelect.js` (0)
- `lib/hooks.js` (1)
- `lib/services/apiSlice.js` (41)
- `lib/services/generalDataApiRedux.js` (31)
- `resources/Time/timeSelectorsHistory.js` (57)

### Fuera de `src/`

`scripts/` (10 archivos, ~1,290 líneas: migraciones y utilidades de una sola corrida ya ejecutadas) y configs raíz (`next.config.js`, `tailwind.config.js`, `postcss.config.js`, `vitest.config.mjs`). Recomendación: dejarlos en `.js`; se corren directo con node y migrarlos no valida nada del app.

