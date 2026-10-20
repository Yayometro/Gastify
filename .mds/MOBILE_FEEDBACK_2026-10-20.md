# Feedback del usuario sobre la app móvil (2026-10-20): trazabilidad punto por punto

Cada punto es una petición concreta del usuario. Estados: PENDIENTE, EN CURSO, CÓDIGO LISTO (implementado y compilando; falta verificar en emulador/iPad), HECHO (verificado), BLOQUEADO (necesita permiso o decisión), ACLARAR (falta confirmar algo). Regla: la fuente de verdad es la web; si hay duda, se revisa el código o la web en Chrome.
Regla: un punto pasa a HECHO solo cuando está implementado **y verificado** (emulador Android con la cuenta de prueba, o pruebas de core). Lo que solo se puede ver en iPad/iPhone se marca "verificar en iPad" y lo confirma el usuario.

## General y transversal

| ID | Punto | Estado | Notas |
|---|---|---|---|
| G01 | Lista de to-dos de TODO lo pedido, un punto por cosa, para trazabilidad (este archivo). | HECHO | |
| G02 | Botón flotante "Tools" (como en la web) que abre un modal. Hoy solo "Transaction Categorizer"; debe quedar preparado para más herramientas. | PENDIENTE | Revisar el botón en la web. |
| G03 | Notificaciones (avisos) más bonitas en móvil. | CÓDIGO LISTO | |
| G04 | Vista para iPad con menú lateral izquierdo y dashboards como en la web (no ver la app de teléfono estirada). | CÓDIGO LISTO | Recomendado hacerlo pronto (ver nota al final). |
| G05 | Cada widget o sección con su propio filtro de tiempo, independiente del periodo general. | PENDIENTE | |
| G06 | Cambiar entre tema claro y oscuro desde el menú. | CÓDIGO LISTO | Hay hooks de tema; falta el interruptor. |
| G07 | Letras negras sobre fondo oscuro (contraste). Revisar toda la app. | EN CURSO | Se ve en "Perspectivas". |
| G08 | Probar los 8 formularios de Crear (gasto, ingreso, transferencia, cuenta, categoría, presupuesto, ahorro, proyecto). | PENDIENTE | El usuario no los ha probado. |
| T01 | Toda fecha abre calendario, nunca texto. Auditar todas (transferir, proyecto, etc.). | EN CURSO | Transferir pide la fecha en texto. |
| T02 | Calendario: sin franja negra, ocupa todo el ancho, y se cierra tocando afuera (sin tener que dar "Listo"). | CÓDIGO LISTO | iOS: no se puede probar en el emulador Android. |
| T03 | Icono "?" junto a cada título que abre un modal explicativo, como en la web. En todas las pantallas. | EN CURSO | Empezar por Proyecciones. |
| T04 | Selector de mes (flechas + tocar el mes para elegir mes y año, o calendario anual) igual en todas las pantallas. | PENDIENTE | |

## Inicio (dashboard)

| ID | Punto | Estado | Notas |
|---|---|---|---|
| I01 | Selector de periodo con las opciones de la web: este mes, mes pasado, primer/segundo semestre, últimos 3 meses, trimestres 1 a 4, año actual, año pasado, y años con datos (2016, 2025...). Relativos a la fecha de hoy. | PENDIENTE | |
| I02 | Tocar "Octubre 2026" abre calendario de rango y selector de mes en vista anual. | PENDIENTE | |
| I03 | Carrusel del resumen: primero el resumen; deslizar a la izquierda = Cuentas; a la derecha = comparación vs mes anterior; "Ver más" abre modal con las tres. | PENDIENTE | |
| I04 | Cuentas con aspecto de tarjetas de crédito, como en la web. | PENDIENTE | Ver también U01. |
| I05 | Gráfica del resumen: flechita o indicador de que se puede tocar; total centrado (hoy a la izquierda). | CÓDIGO LISTO | |
| I06 | Al tocar una categoría (ej. House) mostrar su ícono dentro o encima del donut, no solo las subcategorías. | PENDIENTE | |
| I07 | Widget Top 6: encabezado claro; cambiar entre 3, 6, 12 y 24; selector de rango de tiempo. | CÓDIGO LISTO | RESUELTO con la web: el switch es 3, 6, 12 y 24 (TopElementContainerView.tsx). |
| I08 | "Perspectivas": no se sabe de dónde sale; el usuario lo asocia al comparativo vs mes anterior. Aclarar o renombrar, y corregir contraste. | PENDIENTE | Relacionado con G07. |
| I09 | Widget de Presupuestos: poder hacer scroll interno o hacerlo más alto para ver todos. | PENDIENTE | |
| I10 | "Últimos movimientos" → "Ver todos" debe abrir Movimientos completo (con todos sus componentes). | PENDIENTE | Depende de M01–M14. |
| I11 | Gráfica del resumen con filtro de tiempo propio. | PENDIENTE | Ver G05. |

## Wallet Analyzer (Analizador)

| ID | Punto | Estado | Notas |
|---|---|---|---|
| A01 | Wallet Analyzer completo en móvil (hoy no existe). | PENDIENTE | |
| A02 | Filtro de tiempo del analizador: flechas, tocar el mes para elegir año y mes, y rango personalizado. | PENDIENTE | |
| A03 | Tocar cualquier elemento del analizador abre un modal con el detalle. | PENDIENTE | |
| A04 | Gráfica "Category Details" con selector de tipo: Nested (ya existe), Bubble (falta, circle packing) y TreeMap (falta). | PENDIENTE | El TreeMap de la web está hecho a mano, sin librería: portarlo. |
| A05 | Top 6 categorías del analizador, como en la web. | PENDIENTE | |

## Movimientos

| ID | Punto | Estado | Notas |
|---|---|---|---|
| M01 | Importar desde Excel (no existe en móvil). | PENDIENTE | Revisar la ruta de importación de la web. |
| M02 | Transaction Categorizer (no existe en móvil). Accesible también desde el botón Tools (G02). | PENDIENTE | |
| M03 | Transaction Details: ya funciona, mantener. | HECHO | Revisado en el emulador. |
| M04 | Más filtros, como en la web (revisar la lista completa de la web). | PENDIENTE | |
| M05 | Tocar el mes abre calendario y selector de mes. | PENDIENTE | Ver T04. |
| M06 | Búsqueda por nombre: botón X a la derecha para borrar todo el texto de un toque. | CÓDIGO LISTO | |
| M07 | Filtro de categoría: buscar también SUBCATEGORÍAS (hoy solo busca categorías). Subcategorías como submenú bajo cada categoría. | CÓDIGO LISTO | |
| M08 | Lista de categorías ordenada alfabéticamente, con un índice A–Z deslizable para ir más rápido. | CÓDIGO LISTO | |
| M09 | Filtro de monto exacto: ya funciona, mantener. | HECHO | |
| M10 | Filtro de cuentas: ya funciona, mantener. | HECHO | |
| M11 | Duplicados: el switch debe abrir subfiltros como en la web: nombre, fecha, monto, categoría, subcategoría, tolerancia de fecha, tolerancia de monto, "Buscar duplicados" y "Restablecer valores". | CÓDIGO LISTO | |
| M12 | Duplicados: filtro readable / not readable / all. | CÓDIGO LISTO | RESUELTO con la web: Todos / Readable / Not readable (Movements.tsx, selector ReadableSelector). |
| M13 | Barra de scroll exclusiva a la derecha para saltar entre fechas (los separadores por día ya existen y se mantienen). | PENDIENTE | |
| M14 | Movimientos debe tener todos los componentes que tiene la web (importar, categorizar, detalles, etc.). | PENDIENTE | Agrupa M01, M02, M04. |

## Crear / Agregar

| ID | Punto | Estado | Notas |
|---|---|---|---|
| C01 | Hub "Crear" con las 8 opciones: el usuario lo felicita, mantener. | HECHO | |
| C02 | Transferir: fecha con calendario, no texto. | CÓDIGO LISTO | Ver T01. |
| C03 | Selector de categoría "Ver todas": buscar también subcategorías (submenú bajo cada categoría). | CÓDIGO LISTO | Ver M07. |
| C04 | Presupuesto, ahorro y proyecto: el usuario los aprueba; corregir solo el calendario (T02). | PENDIENTE | |
| C05 | Ingreso: aprobado, mantener. | HECHO | |

## Presupuestos

| ID | Punto | Estado | Notas |
|---|---|---|---|
| P01 | Filtros de tiempo arriba: flechas, tocar el mes para elegir año y mes, y rango personalizado (fecha inicial y final). | CÓDIGO LISTO | |
| P02 | Dividir "Este mes" en tarjetas pequeñas (gasto total, sin presupuesto, etc.), cada una con barras y tocable para abrir modal. | CÓDIGO LISTO | |
| P03 | Modal "Total spending": igual que el Spending Summary de la web. | CÓDIGO LISTO | |
| P04 | Modal "Unbudgeted": Outside Budgets, Share of Spending, el texto "These movements are not covered by any active spending budget", lista desplegable, botón para agregar presupuesto desde ahí y "Other categories without a budget". | CÓDIGO LISTO | |
| P05 | Tarjeta de presupuesto: la edición va contraída, con un botón de flecha para desplegarla. | CÓDIGO LISTO | |
| P06 | Ahorro: mostrar pesos y dólares; indicador de meta alcanzada con ícono de celebración. | CÓDIGO LISTO | |
| P07 | Mostrar "Detailed movements" y "Linked accounts" (por ejemplo Santander débito y Revolut). | CÓDIGO LISTO | |
| P08 | Proyecto: movimientos vinculados con editar, desvincular, vincular existente, agregar existente y crear movimiento desde ahí. | CÓDIGO LISTO | |
| P09 | Mostrar Spend, Limit y Available en cada presupuesto. | CÓDIGO LISTO | |

## Proyecciones

| ID | Punto | Estado | Notas |
|---|---|---|---|
| Y01 | Sección "Income sources": lista de fuentes y crear una nueva. | PENDIENTE | |
| Y02 | Sección "Referencias históricas": ver cada una y agregar de ingreso y de gasto. | PENDIENTE | |
| Y03 | Columna Neto con color verde o rojo. | PENDIENTE | |
| Y04 | Columna Balance (hoy no aparece). | PENDIENTE | |
| Y05 | Icono "?" junto a Neto y Balance. | PENDIENTE | Ver T03. |
| Y06 | Indicador de precisión de las proyecciones, arriba y abajo de la tabla, como en la web. | PENDIENTE | |
| Y07 | Mostrar la moneda principal arriba. | PENDIENTE | |
| Y08 | Proyecciones también dentro de Historial, con filtro de tiempo propio. | PENDIENTE | Ver H11. |

## Cuentas

| ID | Punto | Estado | Notas |
|---|---|---|---|
| U01 | Tarjetas tipo tarjeta de crédito, como la web. | PENDIENTE | Ver I04. |
| U02 | Al ver "todos los movimientos" de una cuenta, volver debe regresar a Cuentas, no a Movimientos. | CÓDIGO LISTO | Ver H10. |
| U03 | Detalle de cuenta: gráficas, resumen detallado de transacciones y dashboards como en la web. | PENDIENTE | |
| U04 | Lista de cuentas y actividad del mes: aprobado, mantener. | HECHO | |

## Categorías

| ID | Punto | Estado | Notas |
|---|---|---|---|
| K01 | Búsqueda: mostrar categorías y subcategorías como resultados separados (ej. "piccho" → subcategoría Picho y categoría Family por separado). | CÓDIGO LISTO | |
| K02 | Al crear categoría: switch para crear también una subcategoría; elegir a qué categoría se liga; si no hay categoría, no se puede crear la subcategoría. | CÓDIGO LISTO | |
| K03 | Lo demás de Categorías: aprobado, mantener. | HECHO | |

## Historial

| ID | Punto | Estado | Notas |
|---|---|---|---|
| H01 | Periodos con las mismas opciones que la web (ver I01). | PENDIENTE | |
| H02 | "Mes a mes": barras claras, ordenadas, con etiquetas, tocables para ver el detalle de cada mes. | PENDIENTE | |
| H03 | Gastos por categoría: filtro de tiempo propio. | PENDIENTE | |
| H04 | Ingresos por categoría: filtro de tiempo propio. | PENDIENTE | |
| H05 | "Periodo anterior" con años completos: la lógica da "1 de enero con 31 de diciembre de 2025". Corregir. | ACLARAR | ¿Qué debe comparar "periodo anterior" cuando el periodo es un año? |
| H06 | Gastos más grandes: Top 6 con cambio entre 3, 6, 12 y 24. | CÓDIGO LISTO | Ver I07. |
| H07 | Comparativo del Top 6 de categorías entre dos periodos. | PENDIENTE | |
| H08 | Wallet Analyzer dentro de Historial, con celdas tocables que abren modal. | PENDIENTE | Ver A01–A03. |
| H09 | Top 6 elements dedicado con su filtro de tiempo (por defecto últimos 3 meses) y modal por elemento. | CÓDIGO LISTO | |
| H10 | Navegación inteligente: desde Historial, al abrir un movimiento y volver, regresar a Historial (no a Movimientos). Aplicar en toda la app. | CÓDIGO LISTO | Ver U02. |
| H11 | Sección de Proyecciones dentro de Historial, con sus filtros de tiempo. | PENDIENTE | |
| H12 | Sección de Presupuestos comparativos dedicada. | PENDIENTE | |

## Perfil

| ID | Punto | Estado | Notas |
|---|---|---|---|
| F01 | Cambiar correo electrónico. | PENDIENTE | |
| F02 | Cambiar contraseña. | PENDIENTE | |
| F03 | Ver y administrar passkeys. | PENDIENTE | |
| F04 | Ver y administrar verificación en dos pasos (2FA). | PENDIENTE | |
| F05 | Conector de access tokens (API): crear, ver y revocar, como en la web. | PENDIENTE | |
| F06 | Eliminar mi cuenta. | BLOQUEADO | Una vez el clasificador de permisos bloqueó la escritura de esta pantalla. Requiere permiso explícito. Nunca probar contra cuentas reales. |
| F07 | Perfil: nombre y teléfono ya se editan. | HECHO | Revisado en el emulador. |

## Notas

- **Nota iPad (G04):** el usuario pregunta si conviene hacerlo ahora o después. Recomendación: hacerlo pronto, en una fase corta de diseño adaptable (menú lateral en pantallas anchas), porque si no cada pantalla nueva se rehace dos veces.
- **Aclaraciones:** Top = 3, 6, 12 y 24 (resuelto con la web). Readable = Todos / Readable / Not readable (resuelto). Falta: "periodo anterior" en años completos (H05), revisar en la web.
- **Verificación en iOS:** el emulador es Android. Lo de iPad y iPhone (T02, G04) lo confirma el usuario.
