# Checklist de feedback del tutorial (2026-10-28)

Regla general: [título] | [?] [brújula]  ·  en acciones a la derecha: [?] [brújula] | [acción]  ·  el tutorial recorre de arriba hacia abajo.
Los iconos "?" y brújula deben ser del mismo color (blanco/violeta claro como el "?") y estar pegados.

## A. Global (web y móvil)
- [x] A1 Separador vertical entre el título y el grupo de ayuda (?, brújula) en todos los lugares con brújula
- [x] A2 Brújula del mismo color que el "?" (web: text-purple-200 hover:text-white · móvil: textSecondary)
- [x] A3 "?" y brújula más pegados (web ml-0.5, móvil gap 0.5)
- [x] A4 Brújula del tamaño del "?" (web 20 px, móvil 22 px) salvo las excepciones de cabecera

## B. Web
- [x] B1 Dashboard: brújula de altura ~ pastilla "Octubre 2026", a la izquierda de octubre, separador entre brújula y octubre
- [x] B2 Separador + "?"/brújula en cada título con brújula (resumen de cuentas, wallet analyzer resumen del mes, etc.)
- [x] B3 Modales web con brújula en el modal de proyecciones: un solo "?" (sin duplicados)
- [x] B4 Buffers: un título "Buffers" + un "?"; campos "Gastos no esperados" / "Ingresos no esperados"

- [x] B5 Modales web sin brújula (hallazgo, patrón por día, líderes por mes, periodo de presupuesto, histórico de presupuesto): brújula en el título y secciones con data-tour. La capa del tour sube a z-index 1000000000 (tour.css) para quedar sobre los modales de 20000

## C. Móvil: cabeceras y tarjetas
- [x] C1 Inicio: "Hola Yayo" ... [brújula] | [campana]
- [x] C2 Inicio iPad/tablet: logo Gastify | separador | Hola Yayo ... [avatar] · [mes] | [brújula] (igual que web)
- [x] C3 Cuentas (inicio): ... [brújula] | [Ver todas]
- [x] C4 Análisis del periodo (inicio): ... [brújula ?] | [Ver análisis completo]; tutorial: link → "?" → cuadritos
- [x] C5 Resumen de transacciones (inicio): título | [?][brújula]; tutorial de arriba a abajo: filtros de tiempo, gastos/ingresos, anillo/burbujas/mapa, tabla (área un poco más ancha), ver todas
- [x] C6 Presupuestos (inicio): ... [?] | [Ver todos]; SIN brújula (solo "?")
- [x] C7 Últimos movimientos (inicio): tutorial sobre "ver todos" y tocar un movimiento/transferencia (utilidad)
- [x] C8 Top del periodo (inicio): tutorial top 3/6/12/24, categorías, transacciones; tocar categoría → modal con su tutorial  (falta el modal de categoría con su tutorial)
- [x] C9 Movimientos: título | [?][brújula]; recorrido: tutorial → "?" → exportar → importar → categorizar → periodo → filtros (expandidos) → seleccionar → totales → lista → scroll de fechas (rail)

## D. Móvil: Movimientos
- [x] D1 Recorrido principal incluye pasos de filtros avanzados y el rail de fechas (scroll a la derecha)
- [x] D2 Modal de movimiento/filtros con tutorial propio si aplica

## E. Móvil: Proyecciones
- [x] E1 Página: año (izq/der) → tabla → celda de un mes (abre modal) → precisión → celda de un mes (modal) → fuentes de ingreso → referencia histórica
- [x] E2 Fuentes de ingreso y referencia histórica: título | [?][brújula]; el tutorial expande "Nueva fuente" / "Agregar referencia" y explica cada input
- [x] E3 Modal de mes: el tutorial se ve enfrente del modal (no detrás)
- [x] E4 Modal de precisión por mes: tutorial visible enfrente
- [x] E5 Buffers en el modal de mes: un título + un "?"

## F. Móvil: Analizador de cartera
- [x] F1 Título del analizador y de cada tarjeta: separador + ? + brújula (según lista)
- [x] F2 Proyecciones del mes: "Ver proyecciones" a la derecha | separador | [?] (sin brújula)
- [x] F3 Versus el mes anterior: SIN brújula (solo "?")
- [x] F4 Tendencia 6 meses: ? + brújula; tutorial: tendencia → columnas verde/roja → tocar mes abre modal (con info)
- [x] F5 Promedio mensual: SIN brújula (solo "?")
- [x] F6 Top 3/6/12/24: ? + brújula; tutorial: botones, categorías, transacciones, modal de categoría con su tutorial
- [x] F7 Presupuestos (rachas), grandes gastos, pagos recurrentes: sin brújula
- [x] F8 Exposición multimoneda: sin cambios
- [x] F9 Ritmo de gasto: SIN brújula (solo "?") ; Patrón por día: SIN brújula
- [x] F10 Ver más (ritmo): a la derecha, separador a su izquierda, "?" a la izquierda

## G. Móvil: Presupuestos
- [x] G1 Título con ? + brújula; "Ver todos" a la derecha
- [x] G2 Tarjeta "Sin presupuesto": separador + ? + brújula; tutorial: abrir, categorías sin presupuesto, agregar, listo
- [x] G3 Detalle de un presupuesto: separador + brújula junto al título; tutorial del gasto del mes (distribución, movimientos → detalle, editar con inputs)
- [x] G4 Ahorros y proyectos: mismo patrón que G3 en sus modales

## H. Móvil: Cuentas
- [x] H1 Pantalla Cuentas: título | [?][brújula] (ya está bien)
- [x] H2 Total: SIN brújula (solo "?")
- [x] H3 Detalle de cuenta (ej. Revolut): separador + brújula; tutorial: editar (se expande y explica cada input), filtros de tiempo, resumen de transacciones de ESA cuenta (no el dashboard)
- [x] H4 Bug: el tutorial de resumen de transacciones dentro de una cuenta manda al dashboard

## I. Móvil: Categorías
- [x] I1 Título: separador + ? + brújula
- [x] I2 Nueva categoría: separador + ? + brújula; tutorial: nombre, color (hex), ícono (buscar, mostrar más), subcategoría (switch → nombre, categoría padre), crear
- [x] I3 Tutorial general incluye el paso de nueva categoría

## J. Móvil: Crear (+)
- [x] J1 Gasto, ingreso, transferir, cuenta, categoría, presupuesto, ahorro, proyecto: separador + ? + brújula en el título; tutorial input por input

## K. Móvil: Notificaciones
- [x] K1 Título: separador + ? + brújula; tutorial: tocar notificación, limpiar todas

## L. Modales y capas
- [x] L1 El tutorial aparece ENFRENTE de cualquier modal (móvil: overlay dentro de su propio Modal que se vuelve a presentar sobre la hoja, ver tour-layer.ts; web: z-index)
- [x] L2 Modales con brújula: top categoría, detalle de presupuesto, detalle de movimiento, formularios (cuenta, categoría, presupuesto), mes de proyección, precisión

## N. Barra inferior
- [x] N1 Quitar la brújula que lista las secciones (tarjeta "Más", m-more-menu: ya no es un componente; queda su ancla). La fila «Tutorial» de Más y la brújula del «+» se conservan

## M. iPad / tablet
- [x] M1 Cabecera de inicio igual que la web (logo, separador, Hola, avatar, mes, separador, brújula)
- [x] M2 Todos los títulos con brújula/? también en tablet (hero)
