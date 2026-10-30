# Auditoría de la cuarta ronda (2026-10-28)

Estados:
- HECHO: cambio en código y revisado en el código.
- SIN PRUEBA: cambio en código; falta verlo en el emulador/Chrome (requiere sesión).
- NO HECHO: no se hizo o no se pudo ubicar el elemento.
- DECISIÓN: depende de una respuesta tuya.

## Móvil (teléfono)
| # | Punto | Estado | Evidencia / qué falta |
|---|---|---|---|
| 1 | Modal «elegir mes»: padding inferior | SIN PRUEBA | `month-grid-modal.tsx` (`pb-8`) |
| 2 | Tutorial dentro de modales no responde y la app se congela al cerrar | SIN PRUEBA | Overlay ahora vive dentro de la hoja superior (`tour-layer.ts`, `bottom-sheet.tsx`, `tour-provider.tsx`) |
| 3 | Top 6 del analizador: paso 4 sin resaltado y pausa de 2–3 s | SIN PRUEBA | `tour-provider.tsx` (no desplaza la página de atrás, mide tras asentarse la hoja); `category-detail-sheet.tsx` (lista diferida) |
| 4 | Modal de mes/precisión: separar «?» y tutorial | SIN PRUEBA | `DetailSheet` con `gap-3` |
| 5 | Decidir si se quita el «?» del modal de mes/precisión | DECISIÓN | Hasta probar el tutorial |
| 6 | Movimientos: quitar «?» del título (título | división | tutorial) | HECHO | `movements/index.tsx` (sin `InfoTip`) |
| 7 | Referencias históricas: pasar el texto del «?» al tutorial y quitar el «?» | HECHO | `historical-references-card.tsx`; texto en `tour.m-proj-baseline.what.body` |
| 8 | Fuentes de ingreso: igual que 7 | HECHO | `income-sources-card.tsx`; `tour.m-proj-sources.what.body` |
| 9 | «Más»: quitar «?» | NO APLICA | «Más» no tiene «?». El «botón de más» del feedback es el «+» (Crear) |
| 10 | Crear (+): quitar «?», dejar tutorial | HECHO | `add.tsx` sin `titleInfo` |
| 11 | Presupuestos, tarjeta «Sin presupuesto»: quitar tutorial, dejar «?» | HECHO | `budgets/index.tsx` (`tour="m-bud-unbudgeted-card"`) |
| 12 | Modal «Sin presupuesto»: botón de tutorial con monto, %, agregar, otras categorías y listo | SIN PRUEBA | `budget-summary-sheet.tsx` (compás en el título) y `budgets.ts` (`m-bud-unbudgeted`) |
| 13 | Analizador: quitar «?» del título; su texto al paso 1 («1 de 10») | HECHO | `analyzer.tsx` sin `titleInfo`; `tour.mAnalyzer.welcome.body` |
| 14 | Top 6 del analizador | Ver 3 | — |
| 15 | Notificaciones: quitar «?»; su texto al paso 1 | HECHO | `notifications.tsx`; `m-notif.what` |
| 16 | Cuentas: tutorial y cuenta específica (OK según tu feedback) | HECHO | Sin cambios en esta ronda |
| 17 | Tus categorías: conservar «?» y tutorial | HECHO | Sin cambios |
| 18 | Categorías predeterminadas: sin tutorial, solo «?» | HECHO | Tarjeta con `info={APP_INFO.categor_as_predeterminadas}`; sin componente en `categories.ts` |
| 19 | Detalle de categoría/subcategoría: quitar «?», texto al paso 1, solo tutorial | SIN PRUEBA | `category-detail-sheet.tsx` sin `info`; `tour.m-catdetail.total.body`. Falta confirmar que la subcategoría usa esa misma hoja |
| 20 | Títulos largos en modales de categoría: «…» y separador + tutorial a la derecha | SIN PRUEBA | `analyzer/detail-sheet.tsx` (`numberOfLines`, `flexShrink: 0`) |
| 21 | Historial: el «?» del título se queda separado del tutorial | HECHO | Sin cambios |
| 22 | Historial, «Periodo»: quitar «?», dejar tutorial | HECHO | `history.tsx` (`Card` sin `info`) |
| 23 | Historial, modal de categoría (Health): tutorial no responde y congela | SIN PRUEBA | Mismo fix que 2 (el modal es `CategoryDetailSheet`) |
| 24 | Historial, Top 6: quitar «?», texto al tutorial | HECHO | `top-ranking.tsx` (`withInfo`), `history.tsx`; `tour.m-home-top.what.body` |
| 25 | Perfil: quitar botón de tutorial | HECHO | `profile.tsx` (sin `m-prof-tutorial`) |

## iPad
| # | Punto | Estado | Evidencia / qué falta |
|---|---|---|---|
| 26 | Modal «elegir mes» en iPad | SIN PRUEBA | Mismo componente que 1 |
| 27 | Tutoriales de modales en iPad | SIN PRUEBA | Mismo fix que 2 |
| 28 | «Hola Yayo» más pequeño | HECHO | `tablet-wallet-header.tsx` (`text-4xl`) |
| 29 | Logo igual que la web (negrita + punto violeta) | SIN PRUEBA | `components/brand/gastify-wordmark.tsx`, generado de `public/brand/*.svg` |
| 30 | Cabecera: pastilla «Octubre 2026» | campana | tutorial | avatar con foto | SIN PRUEBA | `tablet-wallet-header.tsx`; la foto ahora sale de `state.userReducer.data.image` (igual que el perfil) |
| 31 | Resto de cambios del teléfono también en iPad | SIN PRUEBA | Comparten componentes; falta revisar la vista de tablet |

## Web
| # | Punto | Estado | Evidencia / qué falta |
|---|---|---|---|
| 32 | Dashboard, tarjeta del centro: quitar botón de tutorial | HECHO | `Dashboard.tsx` |
| 33 | Dashboard, filtros de abajo: quitar tooltip, dejar tutorial | HECHO | `Dashboard.tsx` (`Tooltip dashboard.dateTip` quitado) |
| 34 | Wallet Analyzer: actualizar el tooltip con el texto de móvil | DECISIÓN | Lo hice como «Lo más destacado» (texto `analizador_resumen`) y lo fusioné al tutorial; quedó sin «?». Confirma si era otro tooltip |
| 35 | Resumen de cuenta (dashboard): quitar «?», dejar tutorial | NO HECHO | Esa tarjeta solo tiene «?»; no hay tutorial que dejar |
| 36 | Resumen de transacciones: fusionar «?» con tutorial | HECHO | `CategoryBreakdownCard.tsx`; `tour.dashBreakdown.title.body` |
| 37 | Top 6: fusionar «?» con tutorial | HECHO | `TopElementContainerView.tsx`; `tour.dashTop.title.body` |
| 38 | Top 6: quitar «?» junto a «This Month» y el hover de la pestaña gastos/ingresos | HECHO | `TopElementContainerView.tsx`, `TabsToggler.tsx` |
| 39 | Movimientos, detalle: orden título | separador | «?» | tutorial | HECHO | `Movements.tsx` |
| 40 | Movimientos: quitar «?» de hover de Seleccionar | HECHO | `Movements.tsx` |
| 41 | Movimientos: quitar «?» de hover junto a «This Month» | HECHO | `Movements.tsx` |
| 42 | Movimientos: quitar «?» de hover del botón de categoría | HECHO | `Movements.tsx` |
| 43 | Editar movimiento: añadir botón de tutorial | SIN PRUEBA | `EditSingleTransModal.tsx` (`movEdit`) |
| 44 | Moneda principal: ¿sirve el modal? | DECISIÓN | Pregunta; ver el reporte |
| 45 | Filtros de presupuestos: quitar «?» junto a restablecer | HECHO | `BudgetsClient.tsx` |
| 46 | Presupuesto de gasto: quitar tutorial, dejar «?» | HECHO | `BudgetsClient.tsx` |
| 47 | Modal de presupuesto (Home, proyectos, ahorros): separador + tutorial junto al título | SIN PRUEBA | `BudgetDetailModal.tsx` (`budDetail`) |
| 48 | Proyectos y ahorros: quitar botones de tutorial | HECHO | `BudgetsClient.tsx` |
| 49 | Presupuestos de tu cartera: sin cambio | HECHO | Sin cambios |
| 50 | Proyecciones, año: quitar «?» junto a 2026 | NO HECHO | No hay «?» junto al año en el código; solo el compás. Confirma qué quieres quitar |
| 51 | Fuentes de ingreso: fusionar | HECHO | `IncomeSourcesPanel.tsx` |
| 52 | Referencia histórica: fusionar | HECHO | `HistoricalBaselinePanel.tsx` |
| 53 | Tabla «Mes a mes»: título con separador, «?» y tutorial; quitar tutorial del encabezado «Mes» | SIN PRUEBA | `ProjectionsView.tsx` (`proj-table-title`) |
| 54 | Analizador: quitar tutorial del filtro de tiempo | HECHO | `WalletAnalyzerView.tsx` |
| 55 | Lo más destacado: fusionar «?» con tutorial | HECHO | `WalletAnalyzerInsightsStrip.tsx` |
| 56 | Proyectado vs real: fusionar | HECHO | `WalletAnalyzerProjectionCard.tsx` |
| 57 | Tendencia, modal de un mes: quitar tutorial, poner «?» | SIN PRUEBA | `InsightDetailModal.tsx` (`trend_month`) |
| 58 | Top categorías y transacciones: fusionar | HECHO | `WalletAnalyzerView.tsx` (`anaTop`) |
| 59 | Suscripciones: separador y un solo «?» | HECHO | `WalletAnalyzerView.tsx` (`analizador_suscripciones`) |
| 60 | Patrones por día: separador y un solo «?» | HECHO | `WalletAnalyzerView.tsx` (`analizador_patron_por_dia`) |
| 61 | Filtros del analizador: quitar hover; «?» de periodo a la izquierda del tutorial | SIN PRUEBA | `PeriodFiltersWithCompare.tsx` |
| 62 | Cuentas, filtro de tiempo: quitar hover | HECHO | `AccountClient.tsx` |
| 63 | Cuentas, resumen: fusionar «?» con tutorial | HECHO | `ResumeTabsTrans.tsx` (es el «resumen de movimientos» de la cuenta) |
| 64 | Cuentas, resumen de movimientos: fusionar | HECHO | Mismo componente que 63 |
| 65 | Cuentas, «This Month» de resumen y detalle: quitar hover | HECHO | `AccountClient.tsx`, `ResumeTabsTrans.tsx` |
| 66 | Cuentas, detalle de movimientos: fusionar «?» con tutorial | HECHO | `AccountClient.tsx` (`accMovements`) |
| 67 | Filtros en general: aplicar la misma regla | SIN PRUEBA | `PeriodFiltersWithCompare.tsx` |
| 68 | Historial, pestaña «ingresos»: quitar hover | HECHO | `TabsToggler.tsx` |
| 69 | Historial, «Last 3 months»: quitar hover; «?» de periodo a la izquierda del tutorial | SIN PRUEBA | `PeriodFiltersWithCompare.tsx` |
| 70 | Versus el mes anterior: fusionar «?» de totales | HECHO | `HistoricalWalletAnalyzer.tsx` |
| 71 | Tendencias: fusionar «?» de promedios | HECHO | `HistoricalWalletAnalyzer.tsx` |
| 72 | Top 6 categorías del historial: sin cambios | HECHO | Sin cambios |
| 73 | Presupuestos y cumplimiento de rachas: fusionar | HECHO | `HistoricalWalletAnalyzer.tsx` |
| 74 | Categoría líder por mes: sin cambios | HECHO | Sin cambios |
| 75 | Suscripciones recurrentes (historial): separador y un solo «?» | HECHO | `HistoricalWalletAnalyzer.tsx` |
| 76 | Patrones por día (historial): separador y un solo «?» | HECHO | `HistoricalWalletAnalyzer.tsx` |
| 77 | Filtros de proyecciones y comparativo de categorías: actualizar | SIN PRUEBA | `PeriodFiltersWithCompare.tsx` (compartido) |
| 78 | Comparativo de categorías: quitar «?» junto a «First Quarter Q1» | HECHO | Quitado en el filtro compartido |
| 79 | BUG: el comparativo de categorías no renderiza con «Last 3 months» ni con 2025 | NO HECHO | No reproducido. Las pruebas en Chrome están bloqueadas por la sesión |
| 80 | BUG: cambiar un filtro de categorías mueve el comparativo de presupuestos | SIN PRUEBA | `HistoryClient.tsx`: categorías y presupuestos tienen periodo propio |
| 81 | Comparativo de presupuestos: independiente del de categorías | SIN PRUEBA | Mismo cambio que 80 |
| 82 | Top 6 elementos por mes (abajo del historial): separador y tutorial | SIN PRUEBA | `HistoricalMovementsView.tsx` (tutorial `hisMovements`) |
| 83 | Pestaña gastos/ingresos del Top 6 del historial: quitar hover | HECHO | `TabsToggler.tsx` |
| 84 | Categorías, modales con título largo: «…», separador y tutorial a la derecha | SIN PRUEBA | `EditCategoryModal.tsx` |
| 85 | Categorías por defecto: sin tutorial, solo «?» | HECHO | `CategoriesClient.tsx` |
| 86 | «Crear nueva categoría» y tutorial de «Tus categorías»: sin cambios | HECHO | Sin cambios |

## Pruebas
| Prueba | Estado |
|---|---|
| Móvil en el emulador Android (teléfono) | NO HECHO: la app pide inicio de sesión |
| iPad (adaptado en el emulador) | NO HECHO: mismo bloqueo |
| Web en Chrome | NO HECHO: la sesión local está en la pantalla de 2FA |
| `tsc` web y móvil | HECHO (sin errores) |
| Pruebas de núcleo y tour | HECHO (584/584; tour 47/47) |
