# PLAN F4 — Analizador de una sola categoría (Categorías con tabs)

Autor: Sonnet 5.5. Implementa: Haiku 5.5. ESTADO (2026-10-30): IMPLEMENTADO por Sonnet y verificado en web y emulador — núcleo `categoryAnalysis.ts` (+7 tests), tabs Analizador|Lista (web `CategoryAnalyzer.tsx`; móvil `components/categories/category-analyzer.tsx`), barras por mes con modal de mes, etiquetas, subcategorías (chips/flechas), top y lista, tutoriales web `catAnalyzer` y móvil `m-cat-analyzer`, y los tutoriales de la Lista presionan la pestaña. Pendiente (no hecho): presupuestos históricos asociados, tarjeta resumen Mapa/Burbujas/Anillo, botones «Analizar esta categoría» desde la Lista/modal mensual, y recordar la pestaña entre sesiones en el móvil (solo mientras la app está abierta). Pedido del dueño (2026-10-30): un analizador de **una sola categoría** para ver su fluctuación con el tiempo, sus subcategorías y el desglose de sus transacciones. Va dentro de **Categorías** y será el menú principal: **dos tabs**: **Analizador** (principal) y **Lista** (lo que hoy es Categorías: lista, buscador, etc.). En el Analizador hay un **seleccionador/buscador de categoría** y abajo un desglose con los filtros de tiempo generales.

## 1. Estructura de la pantalla (web `/dashboard/categories`; móvil: tab «Categorías» dentro de «Más» o su pantalla actual)
Tabs (componente de tabs existente de la app, no antd crudo): **Analizador | Lista**. La pestaña por defecto: Analizador; recordar la última usada por persona (localStorage con try/catch; móvil AsyncStorage). La tab Lista = el contenido actual sin cambios (incluye crear/editar, tutorial actual, sugerencias).
Analizador, en este orden de arriba a abajo (cada bloque con título | separador | «?» + compás):
1. **Selector de categoría**: buscador con lista (icono, color, nombre, #movimientos), recientes arriba; y filtros de tiempo generales (los mismos `PeriodFiltersWithCompare` / presets: este mes, 3 m, 6 m, 12 m, rango). Sin categoría seleccionada → estado vacío invitador + las 3 categorías con más gasto como atajos.
2. **Barras por mes**: total de la categoría en cada mes del rango (últimos 3 o 12 o lo filtrado), con la barra del mes actual resaltada y línea de promedio. Clic/tap en una barra → **modal clásico de detalle del mes** (el que ya existe: mayor→menor con desglose y totales; reutilizar `ModalContentTopMonthItem` / `MonthlyChampionsModal` y sus equivalentes móviles, filtrando a la categoría). Resumen sobre las barras: total del rango, promedio mensual, mes máximo/mínimo, variación vs periodo anterior.
3. **Tags relacionados** (si los hay): chips con tags usados en movimientos de la categoría, con total y # (clic → filtra el resto del analizador o abre el detalle).
4. **Subcategorías**: gráficos por subcategoría con **carrusel** (flechas ←/→ o selección directa por chips): para cada una, barras por mes, total, % de la categoría, y su top movimientos. Incluir «Sin subcategoría» como una más (cuidado con ids únicos: ver W16).
5. **Top de transacciones históricas** de la categoría (los 6/10 movimientos más grandes de todos los tiempos o del rango; alternar «histórico/rango»).
6. **Presupuestos históricos asociados** (si la categoría está en algún presupuesto): por presupuesto, cumplimiento mes a mes (reutilizar el comparativo de presupuestos de Historial filtrado).
7. **Resumen de transacciones** (el del Wallet: Mapa/Burbujas/Anillo con tabs Gastos/Ingresos) restringido a la categoría. Reutilizar `CategoryBreakdownCard` con `transactions` filtradas (ya admite la prop `transactions` desde W20); si la categoría es hoja solo hay un nivel → ocultar tabs que no aporten.
8. **Transacciones** de la categoría (lista estándar `Movements` con prop de filtro por categoría, similar a `accountId` de W20).
Nota del dueño: «Mejor dicho este es el último gráfico, el primero va a ser el de barras» → orden final: selector → barras → tags → subcategorías → top histórico → presupuestos → resumen → transacciones.

## 2. Núcleo (`packages/core/src/transformers/categoryAnalysis.ts`, puro, tests)
`analyzeCategory({ categoryId, transactions, subCategories, budgets, tags, range, compare })` →
`{ monthly[{month,total,count,bySub}], stats{total,avgMonthly,max,min,delta}, subs[{id,name,total,share,monthly}], tags[{id,name,total,count}], topTransactions[], budgets[{budgetId,name,monthly[{month,spent,limit}]}] }`.
Reglas: una categoría incluye sus subcategorías; movimientos de ingreso y gasto separados (toggle Gastos/Ingresos, default gasto); transferencias fuera; multi-moneda convertida a la moneda de reporte con las utilerías de `packages/core/src/money`; meses sin datos = 0 (la serie es continua); ids únicos por nodo (`catId::subId|none`).
Tests: sin movimientos, un mes, 12 meses con huecos, subcategoría «sin subcategoría», tags repetidos, presupuesto que cubre solo una subcategoría, cambio de moneda, rango parcial en el mes actual.

## 3. Navegación y tutorial
- Tab Analizador con su propio tour (`categories.ts` + `tourCategories.ts` ES/EN; móvil `tourMobile.ts` `m-catanalyzer-*`): pasos por bloque, con clic automático que selecciona una categoría de ejemplo, abre el modal de una barra y lo cierra; patrón de oro.
- Actualizar `packages/core/src/info/appInfo.ts` ES/EN con los «?» nuevos.
- Redirecciones: botones «Analizar esta categoría» en la tarjeta/detalle de categoría de la Lista y desde el modal clásico de detalle mensual (preseleccionan la categoría).

## 4. Criterios de aceptación
1. Seleccionar «QA Test Category» (cuenta compartida, con ≥ 20 movimientos de prueba en distintos meses: crear por UI lo que falte, incl. una subcategoría y tags) muestra barras mensuales cuyos totales coinciden con la suma manual por mes (tabla «mes → total mostrado → suma manual»).
2. Clic en una barra abre el modal de detalle del mes con los mismos movimientos del mes.
3. Carrusel de subcategorías: cambia con flechas y con chips; «Sin subcategoría» no duplica claves (consola limpia).
4. Cambiar filtro de tiempo recalcula todos los bloques coherentemente; comparar con periodo anterior opcional.
5. La tab Lista se comporta como antes (regresión cero); el tour actual de categorías sigue funcionando.
6. Estados vacíos: sin categoría seleccionada, categoría sin movimientos, sin tags, sin presupuestos.
7. Web (oscuro/claro) en navegador y móvil/tablet en emulador Android (`scripts/emu.sh`); tsc raíz y móvil, eslint, vitest.

## 5. Hitos
H1 núcleo + tests · H2 tabs + selector + barras + modal · H3 tags + subcategorías (carrusel) · H4 top histórico + presupuestos + resumen + transacciones · H5 tours/«?»/i18n/atajos · H6 móvil/tablet.
