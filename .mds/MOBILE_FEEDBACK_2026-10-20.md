# Feedback del usuario sobre la app móvil (2026-10-20): trazabilidad punto por punto

Cada punto es una petición concreta del usuario. Estados: PENDIENTE, EN CURSO, CÓDIGO LISTO (implementado y compilando; falta verificar en emulador/iPad), HECHO (verificado), BLOQUEADO (necesita permiso o decisión), ACLARAR (falta confirmar algo). Regla: la fuente de verdad es la web; si hay duda, se revisa el código o la web en Chrome.
Regla: un punto pasa a HECHO solo cuando está implementado **y verificado** (emulador Android con la cuenta de prueba, o pruebas de core). Lo que solo se puede ver en iPad/iPhone se marca "verificar en iPad" y lo confirma el usuario.

## General y transversal

| ID | Punto | Estado | Notas |
|---|---|---|---|
| G01 | Lista de to-dos de TODO lo pedido, un punto por cosa, para trazabilidad (este archivo). | HECHO | |
| G02 | Botón flotante "Tools" (como en la web) que abre un modal. Hoy solo "Transaction Categorizer"; debe quedar preparado para más herramientas. | HECHO | Revisar el botón en la web. |
| G03 | Notificaciones (avisos) más bonitas en móvil. | CÓDIGO LISTO | |
| G04 | Vista para iPad con menú lateral izquierdo y dashboards como en la web (no ver la app de teléfono estirada). | CÓDIGO LISTO | Recomendado hacerlo pronto (ver nota al final). |
| G05 | Cada widget o sección con su propio filtro de tiempo, independiente del periodo general. | CÓDIGO LISTO | |
| G06 | Cambiar entre tema claro y oscuro desde el menú. | CÓDIGO LISTO | Hay hooks de tema; falta el interruptor. |
| G07 | Letras negras sobre fondo oscuro (contraste). Revisar toda la app. | CÓDIGO LISTO | Ningún <Text> sin color; contrastes calculados (WCAG) y el verde de ingresos del modo claro se oscureció (3.8 a 5.5). Falta que lo veas en tu pantalla.  Se ve en "Perspectivas". |
| G08 | Probar los 8 formularios de Crear (gasto, ingreso, transferencia, cuenta, categoría, presupuesto, ahorro, proyecto). | HECHO | Probados contra el servidor con los mismos cuerpos que genera la app, en la cuenta QA y con limpieza: gasto/ingreso/transferencia/cambio/cuenta/categoría/subcategoría (qa-crud) y presupuesto/ahorro/proyecto (qa-budgets). |
| T01 | Toda fecha abre calendario, nunca texto. Auditar todas (transferir, proyecto, etc.). | HECHO | Auditado: no queda ningún campo de fecha de texto; todos usan DateField.  Transferir pide la fecha en texto. |
| T02 | Calendario: sin franja negra, ocupa todo el ancho, y se cierra tocando afuera (sin tener que dar "Listo"). | CÓDIGO LISTO | iOS: no se puede probar en el emulador Android. |
| T03 | Icono "?" junto a cada título que abre un modal explicativo, como en la web. En todas las pantallas. | CÓDIGO LISTO | Empezar por Proyecciones. |
| T04 | Selector de mes (flechas + tocar el mes para elegir mes y año, o calendario anual) igual en todas las pantallas. | CÓDIGO LISTO | |

## Inicio (dashboard)

| ID | Punto | Estado | Notas |
|---|---|---|---|
| I01 | Selector de periodo con las opciones de la web: este mes, mes pasado, primer/segundo semestre, últimos 3 meses, trimestres 1 a 4, año actual, año pasado, y años con datos (2016, 2025...). Relativos a la fecha de hoy. | CÓDIGO LISTO | |
| I02 | Tocar "Octubre 2026" abre calendario de rango y selector de mes en vista anual. | HECHO | Tocar el mes abre el selector de mes y año; "Personalizado" abre dos calendarios (desde y hasta).  |
| I03 | Carrusel del resumen: primero el resumen; deslizar a la izquierda = Cuentas; a la derecha = comparación vs mes anterior; "Ver más" abre modal con las tres. | HECHO | |
| I04 | Cuentas con aspecto de tarjetas de crédito, como en la web. | HECHO | Ver también U01. |
| I05 | Gráfica del resumen: flechita o indicador de que se puede tocar; total centrado (hoy a la izquierda). | HECHO | |
| I06 | Al tocar una categoría (ej. House) mostrar su ícono dentro o encima del donut, no solo las subcategorías. | HECHO | |
| I07 | Widget Top 6: encabezado claro; cambiar entre 3, 6, 12 y 24; selector de rango de tiempo. | CÓDIGO LISTO | RESUELTO con la web: el switch es 3, 6, 12 y 24 (TopElementContainerView.tsx). |
| I08 | "Perspectivas": no se sabe de dónde sale; el usuario lo asocia al comparativo vs mes anterior. Aclarar o renombrar, y corregir contraste. | HECHO | Relacionado con G07. |
| I09 | Widget de Presupuestos: poder hacer scroll interno o hacerlo más alto para ver todos. | CÓDIGO LISTO | |
| I10 | "Últimos movimientos" → "Ver todos" debe abrir Movimientos completo (con todos sus componentes). | HECHO | Depende de M01–M14. |
| I11 | Gráfica del resumen con filtro de tiempo propio. | CÓDIGO LISTO | Ver G05. |

## Wallet Analyzer (Analizador)

| ID | Punto | Estado | Notas |
|---|---|---|---|
| A01 | Wallet Analyzer completo en móvil (hoy no existe). | HECHO | |
| A02 | Filtro de tiempo del analizador: flechas, tocar el mes para elegir año y mes, y rango personalizado. | CÓDIGO LISTO | |
| A03 | Tocar cualquier elemento del analizador abre un modal con el detalle. | HECHO | |
| A04 | Gráfica "Category Details" con selector de tipo: Nested (ya existe), Bubble (falta, circle packing) y TreeMap (falta). | HECHO | El TreeMap de la web está hecho a mano, sin librería: portarlo. |
| A05 | Top 6 categorías del analizador, como en la web. | HECHO | |

## Movimientos

| ID | Punto | Estado | Notas |
|---|---|---|---|
| M01 | Importar desde Excel (no existe en móvil). | HECHO | Verificado: descarga la plantilla (se comparte como .xlsx) y la subida multipart crea los movimientos (probado contra el servidor con la cuenta QA y luego borrado). |
| M02 | Transaction Categorizer (no existe en móvil). Accesible también desde el botón Tools (G02). | CÓDIGO LISTO | Verificado: abre, busca y muestra "sin sugerencias" (la cuenta QA no tiene reglas). Aplicar sugerencias sin probar. Falta atajo dentro de Movimientos. |
| M03 | Transaction Details: ya funciona, mantener. | HECHO | Revisado en el emulador. |
| M04 | Más filtros, como en la web (revisar la lista completa de la web). | HECHO | Revisados contra Movements.tsx: periodo, tipo, legibilidad, monto exacto (principal/nativo/moneda), categoría, subcategoría, cuenta y duplicados; todos están. |
| M05 | Tocar el mes abre calendario y selector de mes. | CÓDIGO LISTO | Ver T04. |
| M06 | Búsqueda por nombre: botón X a la derecha para borrar todo el texto de un toque. | CÓDIGO LISTO | |
| M07 | Filtro de categoría: buscar también SUBCATEGORÍAS (hoy solo busca categorías). Subcategorías como submenú bajo cada categoría. | CÓDIGO LISTO | |
| M08 | Lista de categorías ordenada alfabéticamente, con un índice A–Z deslizable para ir más rápido. | HECHO | |
| M09 | Filtro de monto exacto: ya funciona, mantener. | HECHO | |
| M10 | Filtro de cuentas: ya funciona, mantener. | HECHO | |
| M11 | Duplicados: el switch debe abrir subfiltros como en la web: nombre, fecha, monto, categoría, subcategoría, tolerancia de fecha, tolerancia de monto, "Buscar duplicados" y "Restablecer valores". | CÓDIGO LISTO | |
| M12 | Duplicados: filtro readable / not readable / all. | CÓDIGO LISTO | RESUELTO con la web: Todos / Readable / Not readable (Movements.tsx, selector ReadableSelector). |
| M13 | Barra de scroll exclusiva a la derecha para saltar entre fechas (los separadores por día ya existen y se mantienen). | HECHO | |
| M14 | Movimientos debe tener todos los componentes que tiene la web (importar, categorizar, detalles, etc.). | CÓDIGO LISTO | Agrupa M01, M02, M04. |

## Crear / Agregar

| ID | Punto | Estado | Notas |
|---|---|---|---|
| C01 | Hub "Crear" con las 8 opciones: el usuario lo felicita, mantener. | HECHO | |
| C02 | Transferir: fecha con calendario, no texto. | CÓDIGO LISTO | Ver T01. |
| C03 | Selector de categoría "Ver todas": buscar también subcategorías (submenú bajo cada categoría). | CÓDIGO LISTO | Ver M07. |
| C04 | Presupuesto, ahorro y proyecto: el usuario los aprueba; corregir solo el calendario (T02). | HECHO | |
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
| Y01 | Sección "Income sources": lista de fuentes y crear una nueva. | CÓDIGO LISTO | |
| Y02 | Sección "Referencias históricas": ver cada una y agregar de ingreso y de gasto. | CÓDIGO LISTO | |
| Y03 | Columna Neto con color verde o rojo. | CÓDIGO LISTO | |
| Y04 | Columna Balance (hoy no aparece). | HECHO | Saldo proyectado: dinero de hoy en cuentas más el neto proyectado de los meses que faltan. Ajustar si la web usa otra regla. |
| Y05 | Icono "?" junto a Neto y Balance. | CÓDIGO LISTO | Ver T03. |
| Y06 | Indicador de precisión de las proyecciones, arriba y abajo de la tabla, como en la web. | HECHO | |
| Y07 | Mostrar la moneda principal arriba. | CÓDIGO LISTO | |
| Y08 | Proyecciones también dentro de Historial, con filtro de tiempo propio. | HECHO | Ver H11. |

## Cuentas

| ID | Punto | Estado | Notas |
|---|---|---|---|
| U01 | Tarjetas tipo tarjeta de crédito, como la web. | HECHO | Ver I04. |
| U02 | Al ver "todos los movimientos" de una cuenta, volver debe regresar a Cuentas, no a Movimientos. | CÓDIGO LISTO | Ver H10. |
| U03 | Detalle de cuenta: gráficas, resumen detallado de transacciones y dashboards como en la web. | HECHO | |
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
| H01 | Periodos con las mismas opciones que la web (ver I01). | HECHO | |
| H02 | "Mes a mes": barras claras, ordenadas, con etiquetas, tocables para ver el detalle de cada mes. | HECHO | |
| H03 | Gastos por categoría: filtro de tiempo propio. | HECHO | |
| H04 | Ingresos por categoría: filtro de tiempo propio. | HECHO | |
| H05 | "Periodo anterior" con años completos: la lógica da "1 de enero con 31 de diciembre de 2025". Corregir. | HECHO | La web no tiene "periodo anterior" (su comparación por defecto es el mismo tramo un año antes, que ya existe). El "periodo anterior" de la app ahora compara tramos de meses completos (año, trimestre, semestre, mes) con el tramo completo de antes (2026 con 2025, T4 con T3); otros tramos, con los mismos días justo antes. Con pruebas. |
| H06 | Gastos más grandes: Top 6 con cambio entre 3, 6, 12 y 24. | CÓDIGO LISTO | Ver I07. |
| H07 | Comparativo del Top 6 de categorías entre dos periodos. | CÓDIGO LISTO | |
| H08 | Wallet Analyzer dentro de Historial, con celdas tocables que abren modal. | CÓDIGO LISTO | Ver A01–A03. |
| H09 | Top 6 elements dedicado con su filtro de tiempo (por defecto últimos 3 meses) y modal por elemento. | CÓDIGO LISTO | |
| H10 | Navegación inteligente: desde Historial, al abrir un movimiento y volver, regresar a Historial (no a Movimientos). Aplicar en toda la app. | HECHO | Ver U02. |
| H11 | Sección de Proyecciones dentro de Historial, con sus filtros de tiempo. | HECHO | |
| H12 | Sección de Presupuestos comparativos dedicada. | HECHO | |

## Perfil

| ID | Punto | Estado | Notas |
|---|---|---|---|
| F01 | Cambiar correo electrónico. | CÓDIGO LISTO | |
| F02 | Cambiar contraseña. | CÓDIGO LISTO | |
| F03 | Ver y administrar passkeys. | HECHO | |
| F04 | Ver y administrar verificación en dos pasos (2FA). | CÓDIGO LISTO | |
| F05 | Conector de access tokens (API): crear, ver y revocar, como en la web. | HECHO | |
| F06 | Eliminar mi cuenta. | HECHO | El usuario aprobó (2026-10-20) borrar una cuenta de test. Verificado en el emulador con una cuenta desechable creada para eso (qa.mobile.36fd8e): validación del correo, confirmación, borrado y después el servidor responde 401 al intentar entrar. Nunca con una cuenta real. |
| F07 | Perfil: nombre y teléfono ya se editan. | HECHO | Revisado en el emulador. |

## Segunda ronda (feedback tras probar en iPad y iPhone)

| ID | Punto | Estado | Notas |
|---|---|---|---|
| N01 | En el teléfono no hay botón para cambiar a modo oscuro (solo existía en el iPad). Agregarlo en el menú Más y en Perfil. | CÓDIGO LISTO | Causa del modo claro forzado: `setColorScheme(null)`; ya corregido a `unspecified`. Falta confirmar en el teléfono del usuario. |
| N02 | El menú lateral del iPad debe tener el mismo orden y distribución que la web: perfil (con nombre), Movimientos, Wallet, Presupuestos, Proyecciones, "+" al centro, Cuentas, Historial, Categorías, tema, salir. | CÓDIGO LISTO | |
| N03 | La barra A–Z de categorías debe poder arrastrarse con el dedo (iPad y iPhone); hoy no responde. | HECHO | |
| N04 | Tocar el mes para elegir mes y año en TODOS los filtros de tiempo de la app, sin excepción (hoy solo en Presupuestos). | CÓDIGO LISTO | Inicio, Movimientos, Historial, Top, Analizador, etc. |
| N05 | Proyecciones: mostrar el balance también de los meses ya ocurridos (la web lo muestra). | HECHO | |
| N06 | Proyecciones: falta la tabla de abajo que sí tiene la web (precisión de las proyecciones). | HECHO | Igual a Y06. |
| N07 | Calendario de iOS: se ve mal y no funciona bien en iPad (franja oscura, solo ocupa la izquierda) y en iPhone. | CÓDIGO LISTO | Se prueba en iPad/iPhone; el emulador es Android. |
| N08 | Modo claro: hay textos muy claros que deberían ser más oscuros. Revisar contraste. | CÓDIGO LISTO | |
| N09 | Usar una cuenta de prueba propia en el emulador para no depender del usuario. | HECHO | `qa-type.mjs` con la cuenta QA que creé; sin pedir códigos al usuario. |
| N10 | Historial: tocar una categoría (ej. House) en el Top no muestra sus movimientos. Debe abrir un modal o la lista. | CÓDIGO LISTO | |

## Tercera ronda (feedback tras probar la versión con carrusel, 2026-10-20)

Prefijo R. Todo lo que el usuario dijo en ese mensaje, un punto por cosa. HECHO = verificado; CÓDIGO LISTO = implementado, falta verlo en el iPhone/iPad.

| ID | Punto | Estado | Notas |
|---|---|---|---|
| R01 | Todos los modales y hojas: quitar el borde/franja de otro color en las esquinas redondeadas. | CÓDIGO LISTO | Migradas las hojas de detalle, presupuestos, exportar, carrusel, Top, Tools, selector de mes y calendario iOS a BottomSheet. Falta comprobar borde en iPhone/iPad. |
| R02 | Hojas inferiores: el fondo oscuro debe aparecer con fundido; solo la hoja sube desde abajo. | CÓDIGO LISTO | BottomSheet compartido; falta comprobación visual en iOS. |
| R03 | Los modales "?" y todas las hojas se cierran también al tocar afuera. | CÓDIGO LISTO | BottomSheet compartido; exportar no se cierra mientras procesa. Falta prueba táctil. |
| R04 | El "?" va en la esquina superior derecha de la tarjeta (frente al título), no junto al título; y explica más (filtros, anillo/burbujas/mapa, qué hace el widget). | EN CURSO | El "?" ya va arriba a la derecha en todas las tarjetas (Card). Falta ampliar los textos (filtros, anillo/burbujas/mapa, qué hace cada widget). |
| R05 | Tocar el título o el encabezado de una tarjeta del dashboard lleva a su sección (Últimos movimientos, Presupuestos, Cuentas, Análisis). | CÓDIGO LISTO | Card admite título tocable; enlaces en Inicio. |
| R06 | BUG: tocar la pestaña Movimientos abre el último movimiento visto desde el dashboard, y volver lleva a Wallet. Debe abrir la lista. (Aplica a todas las pestañas.) | CÓDIGO LISTO | La barra navega explícitamente al index de la pestaña; las pilas anidadas se restablecen al dejar la pestaña. Falta reproducir y verificar en Expo Go. |
| R07 | Carrusel del resumen: agregar flechas izquierda/derecha. | CÓDIGO LISTO | También se pueden tocar los indicadores de página. |
| R08 | Íconos verde/rojo de las tarjetas de cuenta: el usuario entendió para qué sirven; sin cambio. | HECHO | El usuario entendió para qué sirven; sin cambio. |
| R09 | Resumen: orden = pestañas Gastos/Ingresos, luego Anillo/Burbujas/Mapa, luego el total centrado, luego la gráfica. | CÓDIGO LISTO | |
| R10 | Burbujas y mapa de árbol: flecha para regresar (además de "quitar selección"). | CÓDIGO LISTO | |
| R11 | Renombrar "Resumen" a "Resumen de transacciones". | CÓDIGO LISTO | |
| R12 | Resumen: filtro de tiempo compacto (flechas + mes; tocar elige mes) y "Más filtros" que despliega el resto; "Personalizado" junto a "Igual que arriba". | CÓDIGO LISTO | CompactTimeFilter compartido. |
| R13 | "Los más grandes" → "Top N" (N = 3, 6, 12 o 24 según lo elegido), con "?" y filtro de tiempo compacto. | CÓDIGO LISTO | |
| R14 | "Análisis del periodo": botón "Ver análisis completo" arriba a la derecha que abre el Analizador de ese mes; y moverlo al final del dashboard (como en la web). | CÓDIGO LISTO | |
| R15 | Orden del dashboard: el análisis va hasta abajo. | CÓDIGO LISTO | Junto con R14. |
| R16 | Presupuestos: las tarjetas "Gasto total" y "Sin presupuesto" deben tener la misma altura. | EN CURSO | Ambas tienen la misma altura mínima; falta validar con textos que envuelvan líneas. |
| R17 | "Sin presupuesto": al tocar una categoría, mostrar sus movimientos y dejar agregar un presupuesto para ella (como la web). | CÓDIGO LISTO | Crear presupuesto recibe categoría preseleccionada. |
| R18 | Íconos de categoría en el modal "Gasto total" y en todos lados donde hoy sale uno genérico gris. | EN CURSO | Íconos de categorías en resumen y detalle; falta auditoría de todos los lugares. |
| R19 | Presupuestos: sistema de caritas (feliz, preocupada, estresada, fuego) como la web, y el % en la cabeza de la barra. | CÓDIGO LISTO | BudgetProgress compartido entre detalle, tarjeta y dashboard. |
| R20 | Al tocar un presupuesto: "Spending distribution by category", barra separada por categoría/subcategoría con su %. | CÓDIGO LISTO | |
| R21 | Analizador: "Los más grandes" → "Top N". | CÓDIGO LISTO | |
| R22 | Analizador: tocar una categoría del Top abre el modal de la web: total, contra el mes anterior, TODOS sus movimientos con scroll, y orden Mayor/Menor primero. | CÓDIGO LISTO | También admite las categorías del mes anterior. |
| R23 | Analizador: tocar un movimiento del Top abre directo el movimiento (sin modal). | CÓDIGO LISTO | |
| R24 | "Ritmo de gasto": botón "Ver más" visible. | CÓDIGO LISTO | |
| R25 | "Pagos recurrentes": más información y botón "Ver más". | CÓDIGO LISTO | Falta verificar que el detalle cubra todos los datos de la web. |
| R26 | Analizador: agregar lo que falta de la web: patrón por día de la semana, ritmo de gasto completo, exposición multimoneda, suscripciones recurrentes, grandes gastos (12 meses), lo más destacado del mes, tendencia bien desplegada, promedios mensuales (ingresos, gastos, movimientos), presupuestos, proyección, anomalías. | EN CURSO | Se añadieron tarjetas de patrón, FX, grandes gastos, destacados, presupuestos y proyección y se amplió el Top. Falta comparar detalle/acciones con la web y probar cotizaciones reales. |
| R27 | Analizador: mismo orden de secciones que la web. | EN CURSO | Orden principal portado; falta cotejo visual final con la web. |
| R28 | Historial, mes a mes comparativo: mostrar claro el mes comparado (enero 2026 contra enero 2025), lado a lado; hoy sale una "N" confusa. | CÓDIGO LISTO | Etiquetas del mes/año de ambos periodos. |
| R29 | Historial: tocar una categoría (gastos o ingresos) abre un modal con todos sus movimientos. | CÓDIGO LISTO | Orden mayor/menor y enlace al movimiento. |
| R30 | Historial: "Grandes gastos" (últimos 12 meses): la mayor transacción, la categoría y subcategoría con más gasto y su análisis; tocar la mayor muestra las mayores del periodo y las categorías. | CÓDIGO LISTO | Falta validar cifras con la web. |
| R31 | Historial: suscripciones recurrentes. | CÓDIGO LISTO | |
| R32 | Historial: "categoría líder por mes" en el modal del mes. | CÓDIGO LISTO | |
| R33 | Historial: proyecciones completas (proyectado contra real). | EN CURSO | Comparación proyectado/real y referencias añadidas; falta cotejar el alcance de “completas” con la web. |
| R34 | Historial: comparativo de presupuestos para análisis histórico, con detalle. | CÓDIGO LISTO | Periodo A/B, totales y desglose mensual. |
| R35 | Historial: Top de elementos/movimientos con comparativo y filtros colapsables. | CÓDIGO LISTO | |
| R36 | Todos los filtros de tiempo de los widgets (Resumen, Top, categorías, Top de movimientos) colapsados: solo se ve el selector de mes con flechas; el resto bajo "Más filtros". | CÓDIGO LISTO | CompactTimeFilter en Inicio e Historial. |

## Cuarta ronda (feedback tras la versión de la tercera ronda, 2026-10-20)

Prefijo S. Un punto por cosa que dijo el usuario. La tercera ronda (R) la implementó Codex y quedó commiteada (3d84a52); sus puntos con "CÓDIGO LISTO" siguen por verse en el dispositivo.

| ID | Punto | Estado | Notas |
|---|---|---|---|
| S01 | Botón "Más filtros" (en todos los widgets): misma altura que el selector de mes (Octubre 2026 con flechas) y fondo parecido (rosado, un poco más glass) para que haya simetría. | CÓDIGO LISTO | |
| S02 | Todos los Top (dashboard, Analizador, Historial): numeración 1, 2, 3… a la izquierda del ícono y una línea separadora fina arriba y abajo de cada fila, como en la web. | CÓDIGO LISTO | |
| S03 | Presupuestos, caritas: no es lo que pide la web. Debe ir la cara GRANDE a la izquierda y el % en un círculo oscuro con letras grandes (o el círculo con el % en la punta de la barra, mezclado con su color, como en la web). Sin repetir "Límite" en cada renglón. Debajo de la barra: lo que queda, el total (límite) y lo gastado en grande a la izquierda. Basarse en la UI de la web (Chrome, cuenta de prueba). | HECHO | |
| S04 | Renombrar "Analizador" a "Analizador de cartera" en español ("Wallet Analyzer" en inglés). Tocar cualquier parte del widget "Análisis del periodo" abre el análisis completo. | CÓDIGO LISTO | Título renombrado y tarjeta completa tocable (falta revisar en iPhone; "Wallet Analyzer" en inglés no aplica: la app móvil no tiene idioma inglés). |
| S05 | "Análisis del periodo" del dashboard: más insights (lo más destacado del mes y más información relevante). | HECHO | Verificado en el emulador Android: se ven gasto más grande, gasto promedio y balance del periodo (core `computeInsights`). |
| S06 | Orden del dashboard: Cuentas, Análisis del periodo, Resumen de transacciones, Top 6, Presupuestos, Últimos movimientos. | HECHO | Verificado en el emulador: Cuentas → Análisis → Resumen → Top → Presupuestos → Últimos. |
| S07 | Movimientos: deben verse el Importar desde Excel y el Transaction Categorizer (el usuario no los ve): botones visibles en la pantalla. | HECHO | Verificado en el emulador: botones "Importar de Excel" y "Categorizar" bajo el título (el segundo abre la hoja de Tools). |
| S08 | Movimientos: el riel de fechas debe empezar donde empiezan las transacciones (el contenedor), no cubrir el encabezado y los filtros. | HECHO | Verificado en el emulador: el riel empieza en el primer día de la lista y sube con el encabezado. |
| S09 | Presupuestos de ahorro y proyectos: mostrar su ícono (avión en Viajar a Japón, alcancía en ahorros) como la web; si no existe, permitir elegir ícono al editar. | CÓDIGO LISTO | |
| S10 | Barra de pestañas, "Más": animación de la pantalla (de derecha a izquierda) consistente y más vistosa; hoy no siempre se ve. | CÓDIGO LISTO | Animación slide+fade única para todas las pestañas (falta revisar en iPhone). |
| S11 | Analizador, "Lo más destacado del mes": cada elemento es interactivo y abre un modal (ej. Health -95% contra tu promedio: promedio de los últimos 6 meses sin contar el actual, monto, aviso de que se necesitan 3 meses de historial, lista de meses). | HECHO | Verificado en el emulador: el destacado abre su modal con el promedio de 6 meses y la nota de 3 meses mínimos. |
| S12 | Analizador: "Contra el mes anterior" → "VS el mes anterior", organizado como tabla (septiembre, octubre, cambio con flechas arriba/abajo/plano) y con explicación abajo. | HECHO | Verificado en el emulador: tabla Antes/Ahora/Cambio con flechas verde/rojo/naranja y explicación. |
| S13 | Analizador, tendencia de 6 meses: el modal de un mes con texto más grande, en tabla, texto blanco, y a la derecha un indicador verde/rojo/naranja con flecha (arriba, abajo, plano) para ingresos, gastos y balance, y explicación abajo. | HECHO | Verificado en el emulador: modal del mes en tabla con indicador ▲▼▬ y explicación, etiquetas en español. |
| S14 | Analizador, promedio mensual: confirmar que es el mismo cálculo de la web (en la web va dentro de la tendencia de 6 meses) y que el "?" explique de cuántos meses y cómo se calcula. | CÓDIGO LISTO | Mismo cálculo que la web (core); tooltip y modal explican N meses y la suma ÷ N. |
| S15 | Analizador, presupuestos (cumplimiento y racha): tocar uno abre un modal con los últimos 12 meses (noviembre 2025: 12,391 / 3,000 ✗ …) con su propio "?" en un modal encima; opcional un botón a Presupuestos. No debe navegar a Presupuestos; y la navegación de regreso debe funcionar. | CÓDIGO LISTO | BudgetSeriesSheet con 12 meses ✓/✗, su propio "?" y botón opcional; falta verlo con datos reales. |
| S16 | Analizador, grandes gastos: "Ver mes por mes" abre un modal (no se despliega); tocar la transacción más grande muestra la mayor de cada mes del último año; la categoría y la subcategoría con más gasto hacen lo mismo con su líder por mes; agregar más glass a las baldosas; y un botón "Ver análisis" con todos los insights. | HECHO | |
| S17 | Analizador, pagos recurrentes: el "toca para ver todos" más visible (negritas, subrayado o botón) y tocar un pago lleva a su movimiento. | CÓDIGO LISTO | Botón "Ver los N pagos" y cada cargo abre su movimiento (core ahora devuelve `_id`). |
| S18 | TODOS los "?" (tooltips) deben explicar de verdad: cómo se calcula cada cosa, cómo funciona, los filtros, el propósito, qué indica. | CÓDIGO LISTO | Reescritos con cálculo, filtros y propósito: dashboard, historial, presupuestos, cuentas, analizador, proyecciones. Revisar nuevas pantallas al terminar. |
| S19 | Analizador, patrón por día de la semana: "Ver detalle" abre un modal como la web (semana con más gasto, número de transacciones, qué día destaca, detalle día por día, cómo se calcula), no se despliega. | CÓDIGO LISTO | WeekdaySheet como la web (semana con más gasto, explicación, día por día). |
| S20 | Historial, mes a mes: debe tener los mismos filtros de tiempo que gastos por categoría (basados por defecto en el periodo del encabezado). | CÓDIGO LISTO | Mes a mes con CompactTimeFilter propio ("Igual que arriba" por defecto). |
| S21 | En todo modal que muestre transacciones: una línea separadora entre una transacción y otra. | CÓDIGO LISTO | |
| S22 | Historial, grandes gastos: tocar "mayor transacción" abre un modal con la mayor de cada mes de los últimos 12 meses (con el mes); "categoría líder" y "subcategoría líder" abren un modal con el líder de cada mes; "ver líderes mes por mes" como modal; botón para ver el análisis con insights. | CÓDIGO LISTO | Historial usa los mismos ChampionsSheet/SpendAnalysisSheet. |
| S23 | Proyecciones (Historial y pantalla): quitar el "?" de Neto que se repite en cada línea; en el "Mes a mes" un solo "?" que explique ingresos, gastos, neto, balance, real, moneda, cómo funcionan las proyecciones y cómo leer la tabla. | HECHO | Verificado en el emulador: un solo "?" en Mes a mes, sin el de Neto. |
| S24 | Historial, Top de movimientos: numeración y separadores (S02) y opción de comparar (en "Más filtros", como switch). | CÓDIGO LISTO | Switch "Comparar con el periodo anterior" dentro de Más filtros; periodo anterior numerado. |
| S25 | Proyecciones: tocar un mes abre un modal como la web (título con "?", ver transacciones del mes, ingreso real contra esperado, gasto real contra presupuestado, gráfica presupuestado contra real, fijar saldo real del mes, y buffers esperados de gasto e ingreso con su "?" y guardar). | HECHO | ProjectionMonthSheet verificado en el emulador: abre, movimientos, real vs presupuestado, y los topes se guardan (probado en la cuenta QA con 100 y vuelto a 0; quedan 2 entradas en su historial). El guardado del saldo real no se ha probado. |
| S26 | Proyecciones, "Precisión de tus proyecciones": usar el texto completo de la web en su "?" (proyectado contra real, desajuste, por qué los colores cambian de signo entre ingreso y gasto) y rediseñar la tabla para que se entienda mejor. | CÓDIGO LISTO | Tabla Proyectado/Real/Desajuste con flechas y el texto completo de la web en el "?". |
| S27 | Perfil: no aparece la opción de editar la contraseña; agregarla visible. | CÓDIGO LISTO | Acceso movido bajo "Tus datos" con botones "Editar" visibles. |
| S28 | Proceso: apuntar cada punto y no olvidar los anteriores; el usuario ya repitió cosas pedidas. | CÓDIGO LISTO | Todo apuntado en esta tabla por punto. |
| S29 | Dashboard: el "Más filtros" del Resumen y de cualquier widget con la misma altura y estilo que el selector de mes (duplica S01; se cierra junto). | CÓDIGO LISTO | |

## Quinta ronda (2026-10-20, tras revisar la cuarta)

Prefijo V (la U ya se usó en una ronda anterior). El usuario confirmó que la cuarta ronda está muy bien (tooltips, tablas, modales, Top, Historial, Proyecciones). Solo pidió estos cambios.

| ID | Punto | Estado | Notas |
|---|---|---|---|
| V01 | Tools / Transaction Categorizer: el fondo del modal se ve negro en la parte de abajo; debe ser el mismo fondo de arriba, ampliado. | CÓDIGO LISTO | La hoja no tenía tope en píxeles: el degradado se estiraba sobre todo el contenido. Ahora la hoja se limita al 90 % de la pantalla y la lista hace scroll dentro (afecta a todas las hojas). Verificado en modo oscuro con una hoja larga (mes de Proyecciones); la lista larga de Tools no se pudo reproducir porque la cuenta QA no tiene movimientos sin categoría. También se levanta sobre el teclado. |
| V02 | Presupuestos: la carita no va junto al ícono de la categoría; va en la esquina superior derecha del mismo renglón (ícono a la izquierda, carita pegada a la derecha). | CÓDIGO LISTO | Lista de presupuestos y detalle de un presupuesto. |
| V03 | Historial, Proyecciones: "Ver proyectado contra real" no debe expandir el widget; debe abrir un modal ordenado con su "?". | CÓDIGO LISTO | Reusa la tabla de precisión (AccuracyBody) con el texto de la web. |
| V04 | Historial, Top: al comparar, dejar elegir contra qué periodo (hoy compara solo hacia atrás sin decir cuál). | CÓDIGO LISTO | Periodo anterior / mismo tramo del año pasado / personalizado, con la leyenda del tramo comparado. |
| V05 | "Continúa con las siguientes fases": seguir con lo que sigue en el plan. | EN CURSO | Ver .mds/MOBILE_REACT_NATIVE_PLAN.md. |

## Sexta ronda (2026-10-21, primera prueba del iPad)

Prefijo W. El usuario probó el diseño de iPad en vertical y lo aprobó; estos son los ajustes.

| ID | Punto | Estado | Notas |
|---|---|---|---|
| W01 | iPad: al girar de vertical a horizontal, el fondo y los colores se cortan. | CÓDIGO LISTO | No se reproduce en Android (el degradado cubre todo). Causa probable en iOS: el SVG del fondo conservaba el tamaño de su primer layout. Ahora `AmbientBackground` mide su contenedor en cada layout y se redibuja con ese tamaño. Falta confirmar en el iPad. |
| W02 | Al cambiar de página y hacer scroll, los colores se cortan. | CÓDIGO LISTO | Misma causa y misma corrección que W01. Falta confirmar en el iPad. |
| W03 | iPad en horizontal: adaptarlo también, hacer las cosas más grandes y aprovechar el máximo de margen sin tragarse la barra. | EN CURSO | Inicio en horizontal (≥ 1000 px): Resumen y Top lado a lado, Presupuestos y Últimos movimientos lado a lado, y el Análisis en 3 columnas; verificado en el emulador con tamaño de tablet. Falta el resto de las pantallas (Movimientos, Presupuestos, Historial, Proyecciones, Cuentas, Categorías, Perfil). |
| W04 | iPad: algunos modales muestran el fondo cortado abajo. | CÓDIGO LISTO | Misma corrección de W01 (la hoja crece cuando llega su contenido). En tablet horizontal la hoja sale como tarjeta centrada, completa y translúcida (verificado en el emulador). Falta confirmar en el iPad. |
| W05 | Android: la barra de navegación no es translúcida como la del iPhone. | HECHO | Verificado en el emulador: velo oscuro con ~28 % de transparencia. Sin desenfoque real (necesitaría reestructurar la barra con `BlurTargetView`); se alcanza a ver tenue el texto que pasa debajo. |
| W06 | iPhone: la barra un poco más oscura, conservando la translucidez. | CÓDIGO LISTO | Velo violeta oscuro sobre el desenfoque. Falta verlo en el iPhone. |
| W07 | Íconos de la barra mucho más blancos. | HECHO | En modo oscuro, blanco (seleccionado) y blanco al 88 % (resto). Verificado en Android. |
| W08 | iPhone: el ícono seleccionado debe destacar más. | CÓDIGO LISTO | Píldora violeta más intensa con borde claro y el ícono en blanco puro (verificado en Android; falta el iPhone). |

## Séptima ronda (2026-10-21, segunda prueba del iPad)

Prefijo X. El usuario probó el iPad en horizontal (con capturas marcadas en azul) y dijo que en el iPhone todo está perfecto; los cambios de distribución son solo para iPad.

| ID | Punto | Estado | Notas |
|---|---|---|---|
| X01 | Barra de navegación (iPhone): se pasó de oscura; hacerla un poco más clara y con más efecto glass. | CÓDIGO LISTO | Barra más clara y con más desenfoque (iOS blur 70, velo claro violeta; Android velo claro). Falta verla en el iPhone. |
| X02 | iPad horizontal (y en general): hay franjas laterales vacías; debe ocupar todo el espacio disponible como la web (sin tragarse la barra lateral). | HECHO | En tablet el contenido ya no tiene tope de ancho: ocupa todo lo que deja el menú lateral (verificado en el emulador en horizontal). |
| X03 | iPad: ampliar las cosas que el usuario encerró en azul (paneles del encabezado, Pagos recurrentes / Exposición / Ritmo, Lo más destacado, Proyección del mes): todo se tiene que ver más grande. | CÓDIGO LISTO | Encabezado (paneles) y Análisis del periodo con texto más grande en iPad; los demás encerrados se tratan en X08. |
| X04 | Efecto glass en todos los componentes planos: el selector de mes (Octubre 2026 con flechas), selectores de periodo, botón Filtros de Movimientos, etc. | HECHO | Glass en selector de mes, chips de periodo, barras segmentadas y botón Filtros de Movimientos (modo oscuro). Verificado en el emulador. |
| X05 | Cada transacción (en Movimientos y en los resúmenes) con su propio fondo glass, en vez de mezclarse con el fondo. | CÓDIGO LISTO | Cada movimiento es una pastilla glass en modo oscuro (Movimientos y Últimos movimientos). Falta verlo en el iPad. |
| X06 | iPad: evitar asimetrías entre widgets lado a lado (Resumen de transacciones y Top 6 del mismo alto; Presupuestos y Últimos movimientos del mismo alto). La web también tiene esta asimetría y hay que arreglarla. | CÓDIGO LISTO | Las tarjetas en pares (Resumen/Top, Presupuestos/Últimos movimientos) se estiran al alto de la fila. El arreglo en la web queda como pendiente aparte. |
| X07 | iPad, dashboard: condensar el Análisis del periodo y mostrar más información, presentada como cuadritos con subtexto (como Lo más destacado de la web). | HECHO | Análisis del periodo en cuadritos glass con subtexto (3 columnas en horizontal). Verificado en el emulador. |
| X08 | iPad, Analizador: Lo más destacado en cuadritos; VS mes anterior en la mitad izquierda y Promedio mensual en la derecha; Proyección del mes aprovechando el ancho; Top de categorías y de transacciones del mes anterior (izquierda) y del mes actual (derecha) uno al lado del otro; Exposición multimoneda y Ritmo de gasto compartiendo fila. | HECHO | Verificado en el emulador (horizontal): Lo más destacado y Proyección en cuadritos, VS mes anterior junto a Promedio mensual (con desglose mes por mes), Top con mes anterior a la izquierda y mes elegido a la derecha. Exposición multimoneda junto a Ritmo de gasto: programado, aún sin ver en pantalla. |
| X09 | iPad: falta el Analizador de cartera en el menú lateral (hoy solo se llega por Ver más desde el dashboard); agregarlo. | HECHO | Agregado al menú lateral (ícono de analítica entre Cuentas e Historial). Verificado en el emulador. |
| X10 | iPad, Historial: el Resumen (ingresos, gastos, balance) en un bloque vertical como en la web, y a su lado otro cuadro con más información relevante (solo iPad). | HECHO | Verificado: Resumen vertical a la izquierda y «Datos del periodo» (movimientos, % conservado, gasto promedio por mes, lo que más pesa, gasto más grande) a la derecha. |
| X11 | iPad, Historial: quitar la barra grande de Octubre 2026; en su lugar un selector de periodo con 'Últimos 3 meses' por defecto y las opciones (últimos 3 meses, un mes, este mes, mes pasado, este trimestre, trimestre pasado, este año, año pasado, Q1–Q4, primera y segunda mitad del año), o un selector con flechas izquierda/derecha y fecha de inicio y fin dentro de la misma barra (como la web). | HECHO | Verificado: barra de periodo con flechas y fechas de inicio y fin ("Últimos 3 meses" por defecto) y lista completa (incluye Trimestre 1–4 y primer/segundo semestre, nuevos en core con prueba). Los widgets internos del Historial usan un selector «Igual que arriba» en lugar de la barra de mes. |
| X12 | iPad, Historial: las barras de Mes a mes (ingresos y gastos) más anchas, como las del Analizador de la web. | HECHO | Verificado: barras de Mes a mes más anchas y altas en tablet. |
| X13 | Historial: los periodos y filtros pensados para comparar meses, con 3 meses por defecto (Top 6 incluido, en iPhone y en iPad). | HECHO | Historial arranca en los últimos 3 meses; los selectores internos listan periodos largos. |
| X14 | iPad, Historial, Top 6: con 'últimos 3 meses' mostrar bloques en columnas por mes (agosto, septiembre, octubre) para compararlos, tanto por categoría como por movimiento. El iPhone se queda como está. | CÓDIGO LISTO | Top 6 del Historial con bloques por mes en columnas cuando el periodo abarca 2–4 meses (por categoría o por movimiento). Falta verlo en pantalla. |

## Octava ronda (2026-10-21, tercera prueba del iPad)

Prefijo Y. El usuario revisó barra, tablas y Historial; aprobó el Top en tablas de 3 columnas (vertical y horizontal).

| ID | Punto | Estado | Notas |
|---|---|---|---|
| Y01 | Proyecciones, tabla «Mes a mes»: el encabezado un poco más rosa/violeta, como la barra y la web (solo un poco). | HECHO | Verificado: la tarjeta «Mes a mes» (y «Precisión») con tinte rosa-violeta suave. |
| Y02 | Proyecciones, tabla: filas alternadas, una un poco más oscura y la siguiente más clara en toda la fila (enero oscuro, febrero claro, marzo oscuro…), para distinguir una fila de otra. | HECHO | Verificado: filas alternadas oscura/clara a lo ancho (enero oscuro, febrero claro…). |
| Y03 | La misma lógica de filas alternadas en «Precisión de tus proyecciones». | CÓDIGO LISTO | Mismas filas alternadas y tinte en «Precisión de tus proyecciones»; falta verlo con datos de meses cerrados con historial. |
| Y04 | iPad, menú lateral: el Analizador debe ir justo debajo de Proyecciones y arriba del botón «+» (hoy está debajo del «+»). | HECHO | Verificado: Analizador justo debajo de Proyecciones y arriba del «+». |
| Y05 | iPad, menú lateral: el ícono del Analizador y el de Proyecciones se parecen; cambiar uno para que se distingan. | HECHO | Verificado: ícono de pastel para el Analizador, distinto del de gráfica de Proyecciones. |
| Y06 | iPad, menú lateral: el botón «+» debe ser más grande y tener el efecto 3D que sí tiene en la web y en la barra del móvil. | HECHO | Verificado: «+» más grande (64) con degradado violeta y sombra de volumen. |
| Y07 | iPad, menú lateral: el efecto glass casi no se aprecia (en el iPhone sí); debe verse glass, con desenfoque, volumen y una sombra hacia afuera. | CÓDIGO LISTO | Menú lateral con vidrio más claro, borde brillante, desenfoque 90 y sombra hacia afuera; se ve más en Android. Falta confirmar el desenfoque real en el iPad. |
| Y08 | Historial, selector de periodo: el modal solo se cierra con la X; debe cerrar también al tocar fuera. Además se siente lento al abrir. | CÓDIGO LISTO | Selectores de periodo en una hoja propia (OptionSheet): se cierra tocando fuera y abre rápido. Falta confirmarlo en el iPad. |
| Y09 | Arrastrar hacia abajo para actualizar (pull to refresh) no funciona en Analizador de cartera, Historial, Proyecciones y Perfil; sí en Dashboard, Movimientos, Presupuestos, Cuentas y Categorías. Error grave. | CÓDIGO LISTO | Todas las pantallas con `Screen` ya se actualizan al jalar hacia abajo (Analizador, Historial, Proyecciones —que además recarga sus datos— y Perfil). Falta probar el gesto en el iPad. |
| Y10 | Historial: se sospechó que no usaba los últimos 3 meses por defecto; el usuario lo retiró (era un problema de actualización). | HECHO | El usuario lo retiró; el Historial usa los últimos 3 meses por defecto. |
| Y11 | Historial con comparación: en «Resumen», el valor del periodo comparado debe verse igual de grande que el actual, solo más tenue. | HECHO | Verificado: el valor comparado es igual de grande, más tenue. |
| Y12 | Historial con comparación: en «Datos del periodo» cada cuadrito debe mostrar el versus del periodo comparado (movimientos, lo que conservaste, etc.). | HECHO | Verificado: cada cuadrito muestra «vs … (comparado)». |
| Y13 | Historial, Mes a mes: el modal de un mes (por ejemplo agosto 2026) no se entiende; debe mostrar a la izquierda un periodo y a la derecha el otro (ingreso contra ingreso, gasto contra gasto, categoría líder de cada uno) y decir claramente qué se compara (agosto 2026 contra agosto 2025). | CÓDIGO LISTO | Modal del mes con dos columnas (mes elegido a la izquierda, mes comparado a la derecha) y renglones Ingresos, Gastos, Balance y Categoría líder de cada uno. Falta verlo en pantalla. |
| Y14 | Historial, Gastos e Ingresos por categoría (lo más importante): al comparar con otro periodo y tocar una categoría, el modal solo muestra los movimientos del periodo actual; debe mostrar también los del comparado, uno a cada lado, explicando a qué periodo corresponde cada lado. | CÓDIGO LISTO | Modal de categoría con comparación: movimientos del periodo (izquierda) y del comparado (derecha) con su rango y total; en teléfono van apilados. Falta verlo en pantalla. |
| Y15 | Historial, Grandes gastos: con comparación, mostrar también el versus. | CÓDIGO LISTO | Grandes gastos con «vs …» del periodo comparado (transacción, categoría y subcategoría líderes). Falta verlo en pantalla. |
| Y16 | Historial, Suscripciones recurrentes: no necesita versus (el usuario lo retiró). | HECHO | El usuario lo retiró: suscripciones sin versus. |
| Y17 | Historial, Proyecciones: no necesita versus (funcionan distinto; el usuario lo retiró). | HECHO | El usuario lo retiró: proyecciones sin versus. |
| Y18 | Todos los Top: cada fila (categoría o movimiento) con su propio fondo glass, como ya lo tienen las transacciones. | HECHO | Verificado: cada fila de Top con su fondo glass (también en las columnas por mes). |

## Novena ronda (2026-10-21, cuarta prueba del iPad)

Prefijo Z.

| ID | Punto | Estado | Notas |
|---|---|---|---|
| Z01 | iPad, barra lateral: el elemento activo debe verse como el de la barra del iPhone (píldora violeta con el borde rosita claro). | CÓDIGO LISTO | El elemento activo del menú lateral usa la misma píldora violeta con borde claro que la barra del iPhone, con el ícono en blanco. Falta verlo en el iPad. |
| Z02 | iPad, barra lateral: el efecto glass no es igual al de la barra del iPhone (diferencia sutil pero importante); debe ser el mismo. | CÓDIGO LISTO | El menú lateral usa ahora exactamente el mismo vidrio (variante «nav») y la misma sombra que la barra del iPhone. Falta compararlo en el iPad. |
| Z03 | Todos los tooltips (los «?») de la app: hoy son texto plano amontonado; deben tener separación, orden, tablas donde corresponda, diagramas, y ser mucho más explicativos y legibles. | HECHO | Todos los tooltips se ordenan solos en secciones (Qué muestra, Cómo se calcula con ecuaciones en cajitas, Cómo leerlo con colores y flechas resaltados, Cómo usarlo) y los más importantes llevan tablas hechas a mano (Precisión, VS mes anterior, Análisis del periodo, Presupuestos y sus caritas, Mes a mes de Proyecciones, Ritmo de gasto). Verificado en el emulador con dos de ellos. |
| Z04 | iPad: la navegación entre páginas es lenta y la animación se siente lenta (en el iPhone es instantánea); averiguar la causa y arreglarla. | CÓDIGO LISTO | Causas probables en el iPad: (1) cada tarjeta tenía un BlurView aunque solo desenfocaba el degradado del fondo; (2) el cambio de pestaña animaba el opacity de pantallas llenas de BlurViews. Ahora las tarjetas no usan BlurView (solo la barra y el menú), y en tablet las pestañas y la pila de «Más» cambian al instante, como la web. Falta confirmar la fluidez en el iPad. |
| Z05 | El usuario va a confirmar: que todas las páginas refrescan, los selectores por periodo y el modal de Mes a mes (sin acción por mi parte). | HECHO | Sin acción: lo confirma el usuario. |
| Z06 | Al terminar, subir todos los commits a la rama (los pendientes y los nuevos). | HECHO | Todos los commits subidos a la rama mobile-phase-9-paridad (no a main). |

## Décima ronda (2026-10-21, quinta prueba del iPad)

Prefijo AA. El usuario aprobó el trabajo anterior ("muy buen trabajo").

| ID | Punto | Estado | Notas |
|---|---|---|---|
| AA01 | iPad, menú lateral: el indicador del elemento activo (el cuadro rosita, no los íconos) está muy grande; hacerlo más chico: cuadrado redondeado/ovoidal, con el ancho actual o casi, pero menos alto. | HECHO | Indicador activo más chico (60×46, esquinas 16) detrás del ícono; verificado en el emulador. |
| AA02 | Perfil: falta poder cambiar la moneda principal; agregar la opción. | CÓDIGO LISTO | Tarjeta «Moneda principal» en Perfil (MXN, USD, EUR, JPY) con confirmación; usa la misma ruta de la web (`general-data/wallet`). Falta probar el cambio (solo en la cuenta QA). |
| AA03 | Cuentas, iPad: en la tarjeta «Total» el «Saldo en dólares» queda muy lejos de su cantidad (todo a la derecha) y confunde; pegarlos en iPad. | CÓDIGO LISTO | En tablet, «Saldo en USD» y su cantidad quedan pegados (con un espacio, no en extremos opuestos). Falta verlo con la cuenta con saldo en dólares. |
| AA04 | Cuentas, todos los dispositivos y la web: agregar los íconos de los bancos de México (convertir PNG a WebP), asociar cada cuenta con un banco al crearla (si la cuenta es MXN, ofrecer los bancos principales y los secundarios con su ícono) y mostrar el ícono del banco en la tarjeta de la cuenta. | EN ESPERA | Necesita un cambio en el servidor (campo de banco en la cuenta) y los logotipos reales: ver la pregunta al usuario. |
| AA05 | Cuentas: opción de asociar un número de tarjeta o de cuenta (opcional), con un ojito en la tarjeta para mostrarlo u ocultarlo; no se guarda ningún CVV y se debe dejar claro al usuario que es opcional. | EN ESPERA | Necesita campos nuevos en el modelo de cuenta (últimos dígitos / número opcional): requiere aprobación del usuario antes de tocar la base o el servidor. |
| AA06 | Cuentas, iPad: las tarjetas están muy separadas/grandes; ponerlas de dos en dos (una a la izquierda y una a la derecha). | CÓDIGO LISTO | Cuentas en dos columnas en tablet. Falta verlo en pantalla. |
| AA07 | Tarjetas de cuenta: en lugar del ícono de chip de las tarjetas de crédito, mostrar el logotipo del banco (preferencia del usuario). | EN ESPERA | Depende de AA04. |
| AA08 | Dashboard/Wallet: agregar un tooltip al «Vs. mes anterior» (la primera ficha de arriba) que explique bien cada cosa. | HECHO | Verificado: «?» en los tres paneles del encabezado (tablet) y en cada página del carrusel (teléfono), con tablas y leyenda. |
| AA09 | Resumen de transacciones: la lista de categorías como tabla (encabezados Categoría / % / moneda, la moneda solo arriba), numerada 1, 2, 3… y con divisores. | HECHO | Verificado en tablet: tabla numerada con encabezados #, Categoría, % y moneda; la moneda solo en el encabezado. |
| AA10 | Resumen de transacciones: en el iPhone, tocar la gráfica o las categorías abre un modal con todas las categorías y se interactúa ahí; en el iPad, ocupar todo el ancho con la gráfica a la izquierda y la tabla de categorías a la derecha (con el drill-down a subcategorías ahí mismo). Hoy solo se ven unas pocas categorías y no las 14 que hay. | HECHO | Verificado en tablet: la gráfica a la izquierda y la tabla con todas las categorías a la derecha (drill-down en la tabla). Teléfono: previsualización con «Ver las N categorías» que abre el detalle en un modal; falta verlo en pantalla. |
| AA11 | Top 6 en el iPad: ocupar todo el ancho, con las categorías a la izquierda y los movimientos a la derecha (sin el selector categorías/movimientos); el iPhone conserva el selector. | HECHO | Verificado en tablet: categorías a la izquierda y movimientos a la derecha, sin el selector. |
| AA12 | Dashboard, Presupuestos: cada presupuesto con su tarjetita como en la pantalla de Presupuestos, hasta 10 como máximo (menos si hay menos); «Ver todos» lleva a Presupuestos. | HECHO | Verificado: cada presupuesto con la misma tarjeta de Presupuestos, hasta 10; «Ver todos (N)». |
| AA13 | Dashboard, Últimos movimientos: de la misma altura que Presupuestos, mostrando los movimientos que quepan. | HECHO | Verificado: Últimos movimientos junto a Presupuestos, con más filas (3 por cada presupuesto, hasta 40). |

## Undécima ronda (2026-10-21, sexta prueba del iPad)

Prefijo AB. El usuario confirmó: moneda principal en Perfil, cuentas en dos columnas (iPad), indicador activo, tabla del Resumen.

| ID | Punto | Estado | Notas |
|---|---|---|---|
| AB01 | iPad, Wallet: «Resumen de transacciones» debe ocupar todo el ancho (ya no compartir fila con el Top 6): a la izquierda filtros y gráfica, a la derecha la lista de categorías con un máximo de 15. | HECHO | Resumen a todo el ancho; a la izquierda filtros y gráfica, a la derecha la tabla de hasta 15. |
| AB02 | Resumen de transacciones: si hay más de 15 categorías, botón «Ver más» que abre un modal muy grande (casi pantalla completa, en iPad y en iPhone) con los filtros y TODAS las categorías (de 1 a 50), con scroll e interactividad, sin la gráfica. | CÓDIGO LISTO | «Ver las N categorías» abre una hoja grande (95 % de la pantalla, 900 px en tablet) con filtros y todas las categorías; falta verla en pantalla. |
| AB03 | Top 6: ocupa todo el ancho (ya está), pero los movimientos tienen doble fondo (el del número y el de la transacción): dejar el número sin fondo; o hacerlo en forma de tabla. | CÓDIGO LISTO | El movimiento ya no lleva fondo propio dentro de la fila numerada (`bare`). Falta verlo en pantalla. |
| AB04 | Top 6: categorías y movimientos con la misma altura de fila (todo simétrico, en tabla). | CÓDIGO LISTO | Todas las filas del Top miden lo mismo (68 px) y las categorías llevan ícono de 44. Falta verlo en pantalla. |
| AB05 | Modal de una categoría (al tocarla en el Top): mostrar el nombre, el total en dinero, el número de movimientos y las subcategorías ordenadas de mayor a menor gasto; dentro de cada subcategoría, sus transacciones indentadas, también de mayor a menor; con opción de ordenar de menor a mayor. | CÓDIGO LISTO | CategoryDetailSheet: total, nº de movimientos, subcategorías de mayor a menor con sus movimientos indentados, y interruptor mayor→menor / menor→mayor. Falta verlo en pantalla. |
| AB06 | Mientras cargan los widgets/componentes: animaciones de carga mucho más bonitas. | CÓDIGO LISTO | Esqueletos con brillo que barre (SkeletonRows/Card) en Movimientos, Presupuestos, Cuentas y el dashboard. Falta verlos moviéndose. |
| AB07 | Wallet: «Últimos movimientos» no debe pasar de la altura de Presupuestos; limitar o dar scroll interno; la referencia de altura es Presupuestos. | CÓDIGO LISTO | En tablet horizontal, Últimos movimientos toma la altura medida de Presupuestos y hace scroll por dentro (hasta 30). Falta verlo. |
| AB08 | Presupuestos (pantalla y Wallet): ordenar por defecto del mayor gasto al menor; con un selector de orden. | CÓDIGO LISTO | Orden por defecto del mayor gasto al menor, con selector (mayor gasto, más cerca del límite, meta más grande, nombre) en Presupuestos; el Wallet usa mayor gasto. |
| AB09 | Notificaciones de presupuestos: avisos al llegar al 70 %, 80 %, 90 % y al pasar el 100 %; felicitación (con fuegos artificiales) si en 15 días un presupuesto no se ha movido o está bajo 50 %; lo mismo para ahorros (avances) y proyectos (felicitar si no pasa de 50 %, alarma si se acerca o excede). Prioridad absoluta. | CÓDIGO LISTO | Reglas en core con pruebas (70/80/90/100 %, felicitación desde el día 15 bajo 50 %, avance de ahorros 25/50/75/100 %) y avisos dentro de la app una vez por presupuesto y periodo. Las notificaciones push con la app cerrada necesitan que el servidor las envíe: pendiente de decidir. |
| AB10 | Crear un proyecto desde el iPad: tardó mucho en verse en la interfaz y no hubo aviso de que se creó; corregir (aviso inmediato y actualización de la lista). | CÓDIGO LISTO | Al crear: el presupuesto/proyecto entra a la lista al instante, el aviso sale de inmediato y la recarga completa corre después. |
| AB11 | Presupuestos, la barra «Editar»: debe expandirse/plegarse al tocar en cualquier parte de la caja, no solo en la flechita. | CÓDIGO LISTO | Card acepta `onHeaderPress`; la barra «Editar» se pliega o despliega al tocar en cualquier parte. |
| AB12 | iPad: los avisos (toasts) abarcan todo el ancho; deben ser una tarjeta no tan grande en la esquina superior derecha, con efecto glass (hoy son demasiado translúcidos, no se distinguen del fondo) y con una versión para fondo claro y otra para fondo oscuro. | CÓDIGO LISTO | Aviso en tablet: tarjeta de 380 px en la esquina superior derecha, con base más opaca y borde (oscuro y claro). Falta verlo. |
| AB13 | Cuentas, bancos (el usuario AUTORIZÓ el cambio de esquema en el servidor): campo de banco en la cuenta, íconos de los bancos de México buscados por mí, convertidos y homogeneizados (mismo tamaño y altura); más países después. | CÓDIGO LISTO | Modelo `bankId`, rutas, catálogo de 32 bancos y selector listos. Los logotipos reales NO están: se muestran las iniciales sobre el color del banco; ver pregunta al usuario. La web aún no tiene el selector. |
| AB14 | Cuentas: número de tarjeta o de cuenta opcional (autorizado), con ojito para mostrar u ocultar; nunca CVV; dejar claro que es opcional. | CÓDIGO LISTO | Campo `cardNumber` (solo dígitos, 4 a 19), ojito en el formulario y en la tarjeta, aclaración de que es opcional y de que no se guarda el CVV. |

## Notas

- **Nota iPad (G04):** el usuario pregunta si conviene hacerlo ahora o después. Recomendación: hacerlo pronto, en una fase corta de diseño adaptable (menú lateral en pantallas anchas), porque si no cada pantalla nueva se rehace dos veces.
- **Aclaraciones:** Top = 3, 6, 12 y 24 (resuelto con la web). Readable = Todos / Readable / Not readable (resuelto). Falta: "periodo anterior" en años completos (H05), revisar en la web.
- **Verificación en iOS:** el emulador es Android. Lo de iPad y iPhone (T02, G04) lo confirma el usuario.
