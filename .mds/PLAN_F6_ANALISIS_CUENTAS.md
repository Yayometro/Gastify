# PLAN F6 — Análisis de cuentas en el Wallet Analyzer

Autor: Sonnet 5.5. Implementa: Haiku 5.5. ESTADO (2026-10-30): IMPLEMENTADO por Sonnet y verificado — núcleo `accountAnalysis.ts` (+6 tests), web `AccountsAnalysisSection` (Analizador e Historial, con modal por cuenta, «?» y tutorial `anaAccounts`), móvil `analyzer/accounts-analysis.tsx` (hoja por cuenta + tutorial `m-ana-accounts`) verificado en emulador Android. Pendiente: tarjeta «cuentas dormidas» solo como texto (sin tarjeta propia); límite de crédito no existe en el modelo (solo deuda total). Pedido del dueño (2026-10-30): «el Wallet Analyzer debería incluir análisis de cuentas, tanto en la web como en la móvil. Una de las tarjetas debería ser, por ejemplo, cuenta con más dinero, cuenta que gasta más, histórico de las cuentas versus entre las cuentas, cosas de ese tipo».

## 1. Qué se muestra (bloque «Tus cuentas» en el Analizador y en el Analizador histórico)
Tarjetas (cada una con título | separador | «?» + compás, número grande, frase corta calculada, «Ver detalle →» donde aplique):
1. **Cuenta con más dinero**: la de mayor saldo (convertido a la moneda principal). Muestra nombre/banco, saldo y **% del dinero total** («Tienes el 62 % de tu dinero en BBVA Débito»). Aviso de concentración si > 70 %.
2. **Cuenta donde más gastas**: mayor gasto del periodo, con % del gasto total y su categoría dominante.
3. **Cuenta que más ingresa**: mayor ingreso del periodo y % del ingreso total.
4. **Flujo neto por cuenta**: barras horizontales por cuenta (ingresos, gastos y neto del periodo), ordenadas por gasto. Clic en una barra → modal con sus movimientos (el modal clásico de detalle, mayor→menor, totales).
5. **Histórico de saldos (cuentas vs cuentas)**: líneas del saldo de cada cuenta mes a mes (últimos 6/12 meses según el filtro de tiempo), con leyenda seleccionable y un «total». El saldo histórico se reconstruye hacia atrás: `saldo(t) = saldo actual − Σ(movimientos posteriores a t)`; mostrar nota «aproximado: parte de tus saldos actuales» (misma redacción que la tabla de proyecciones: «El balance se ancla a los totales actuales de tus cuentas…»). Transferencias entre cuentas cuentan en ambas patas.
6. **Cuentas dormidas / tarjetas** (opcional, si cabe): cuentas sin movimientos en 60+ días; en cuentas de crédito, deuda total y % usado si hay límite (si no existe el campo límite, solo deuda).
Cada tarjeta es un `insight` más del mecanismo existente (ver `WalletAnalyzerInsightsStrip.tsx` / `InsightDetailModal.tsx` y `walletAnalyzer.ts` en `packages/core/src/transformers`), o un bloque propio si es gráfico (4 y 5).

## 2. Núcleo (`packages/core/src/transformers/accountAnalysis.ts`, puro, con tests)
Entradas: cuentas (`amount|balanceMinor`, `currency`, `accountType`, `name`, `bankId`), movimientos (con `account`, `isIncome`, `isBill`, `kind`, transferencias), rango de fechas, moneda principal y tasas (usar las utilerías de `packages/core/src/money`; mismo criterio que el resto del analizador para multi-moneda: convertir a moneda de reporte con la tasa del movimiento si existe).
Salidas: `{ richest, topSpender, topEarner, perAccount[{id,name,income,expense,net,share}], balanceSeries[{month, byAccount, total}], dormant[] }`.
Reglas: ignorar movimientos `reverted/failed`; las transferencias NO cuentan como gasto ni ingreso (solo mueven saldo); si hay 1 sola cuenta, el bloque muestra una tarjeta sencilla («Solo tienes una cuenta») y oculta comparativos; sin movimientos → estados vacíos con texto útil.
Tests vitest: una cuenta, varias, multi-moneda, transferencias, rango vacío, saldos negativos (crédito), reconstrucción de saldo con movimientos posteriores, empate en máximos.

## 3. UI
- Web: componentes en `src/components/multiUsedComp/walletAnalyzer/` (`AccountsAnalysisSection.tsx`, tarjetas, gráfico de líneas con la librería de gráficos ya usada por `WalletAnalyzerTrendChart.tsx`, barras con el estilo de `SpendingWeeklyBars.tsx`). Se monta en `WalletAnalyzerView.tsx` después de «Patrones por día» y en `HistoricalWalletAnalyzer.tsx` con su periodo. Patrón de oro en títulos, tema claro/oscuro, tours (`analyzer.ts` + `tourAnalyzer.ts` ES/EN) y «?» (`appInfo.ts` ES/EN).
- Móvil: `apps/mobile/src/components/analyzer/` (hojas `sheets.tsx`) con las mismas tarjetas; gráfico con la librería ya usada en móvil. Tours `m-…`. Tablet: dos columnas.

## 4. Criterios de aceptación
1. Con la cuenta compartida (crear por UI una 2ª y 3ª cuenta con saldos y movimientos distintos, incl. una de crédito y una en USD) las tarjetas muestran valores que coinciden con un cálculo manual (tabla «tarjeta → valor → cálculo» en el reporte).
2. El histórico de saldos termina exactamente en los saldos actuales; cambiar el filtro de periodo cambia el rango y los % coherentemente; el total de la serie = suma de las cuentas.
3. Clic en una barra abre el modal de movimientos de esa cuenta con totales correctos.
4. Estados: 1 cuenta, 0 movimientos, multi-moneda con tasa faltante (mostrar aviso, no romper).
5. tsc raíz y móvil, eslint, vitest verdes; web verificada en navegador (oscuro/claro) y móvil en emulador Android.

## 5. Entrega por hitos
H1 núcleo + tests · H2 tarjetas web · H3 histórico de saldos (gráfico) + modal · H4 analizador histórico · H5 tours/«?»/i18n · H6 móvil/tablet.
