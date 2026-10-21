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
| S04 | Renombrar "Analizador" a "Analizador de cartera" en español ("Wallet Analyzer" en inglés). Tocar cualquier parte del widget "Análisis del periodo" abre el análisis completo. | PENDIENTE | |
| S05 | "Análisis del periodo" del dashboard: más insights (lo más destacado del mes y más información relevante). | PENDIENTE | |
| S06 | Orden del dashboard: Cuentas, Análisis del periodo, Resumen de transacciones, Top 6, Presupuestos, Últimos movimientos. | PENDIENTE | |
| S07 | Movimientos: deben verse el Importar desde Excel y el Transaction Categorizer (el usuario no los ve): botones visibles en la pantalla. | PENDIENTE | |
| S08 | Movimientos: el riel de fechas debe empezar donde empiezan las transacciones (el contenedor), no cubrir el encabezado y los filtros. | PENDIENTE | |
| S09 | Presupuestos de ahorro y proyectos: mostrar su ícono (avión en Viajar a Japón, alcancía en ahorros) como la web; si no existe, permitir elegir ícono al editar. | CÓDIGO LISTO | |
| S10 | Barra de pestañas, "Más": animación de la pantalla (de derecha a izquierda) consistente y más vistosa; hoy no siempre se ve. | PENDIENTE | |
| S11 | Analizador, "Lo más destacado del mes": cada elemento es interactivo y abre un modal (ej. Health -95% contra tu promedio: promedio de los últimos 6 meses sin contar el actual, monto, aviso de que se necesitan 3 meses de historial, lista de meses). | PENDIENTE | |
| S12 | Analizador: "Contra el mes anterior" → "VS el mes anterior", organizado como tabla (septiembre, octubre, cambio con flechas arriba/abajo/plano) y con explicación abajo. | PENDIENTE | |
| S13 | Analizador, tendencia de 6 meses: el modal de un mes con texto más grande, en tabla, texto blanco, y a la derecha un indicador verde/rojo/naranja con flecha (arriba, abajo, plano) para ingresos, gastos y balance, y explicación abajo. | PENDIENTE | |
| S14 | Analizador, promedio mensual: confirmar que es el mismo cálculo de la web (en la web va dentro de la tendencia de 6 meses) y que el "?" explique de cuántos meses y cómo se calcula. | PENDIENTE | |
| S15 | Analizador, presupuestos (cumplimiento y racha): tocar uno abre un modal con los últimos 12 meses (noviembre 2025: 12,391 / 3,000 ✗ …) con su propio "?" en un modal encima; opcional un botón a Presupuestos. No debe navegar a Presupuestos; y la navegación de regreso debe funcionar. | PENDIENTE | |
| S16 | Analizador, grandes gastos: "Ver mes por mes" abre un modal (no se despliega); tocar la transacción más grande muestra la mayor de cada mes del último año; la categoría y la subcategoría con más gasto hacen lo mismo con su líder por mes; agregar más glass a las baldosas; y un botón "Ver análisis" con todos los insights. | HECHO | |
| S17 | Analizador, pagos recurrentes: el "toca para ver todos" más visible (negritas, subrayado o botón) y tocar un pago lleva a su movimiento. | PENDIENTE | |
| S18 | TODOS los "?" (tooltips) deben explicar de verdad: cómo se calcula cada cosa, cómo funciona, los filtros, el propósito, qué indica. | PENDIENTE | |
| S19 | Analizador, patrón por día de la semana: "Ver detalle" abre un modal como la web (semana con más gasto, número de transacciones, qué día destaca, detalle día por día, cómo se calcula), no se despliega. | PENDIENTE | |
| S20 | Historial, mes a mes: debe tener los mismos filtros de tiempo que gastos por categoría (basados por defecto en el periodo del encabezado). | PENDIENTE | |
| S21 | En todo modal que muestre transacciones: una línea separadora entre una transacción y otra. | CÓDIGO LISTO | |
| S22 | Historial, grandes gastos: tocar "mayor transacción" abre un modal con la mayor de cada mes de los últimos 12 meses (con el mes); "categoría líder" y "subcategoría líder" abren un modal con el líder de cada mes; "ver líderes mes por mes" como modal; botón para ver el análisis con insights. | PENDIENTE | |
| S23 | Proyecciones (Historial y pantalla): quitar el "?" de Neto que se repite en cada línea; en el "Mes a mes" un solo "?" que explique ingresos, gastos, neto, balance, real, moneda, cómo funcionan las proyecciones y cómo leer la tabla. | PENDIENTE | |
| S24 | Historial, Top de movimientos: numeración y separadores (S02) y opción de comparar (en "Más filtros", como switch). | PENDIENTE | |
| S25 | Proyecciones: tocar un mes abre un modal como la web (título con "?", ver transacciones del mes, ingreso real contra esperado, gasto real contra presupuestado, gráfica presupuestado contra real, fijar saldo real del mes, y buffers esperados de gasto e ingreso con su "?" y guardar). | PENDIENTE | |
| S26 | Proyecciones, "Precisión de tus proyecciones": usar el texto completo de la web en su "?" (proyectado contra real, desajuste, por qué los colores cambian de signo entre ingreso y gasto) y rediseñar la tabla para que se entienda mejor. | PENDIENTE | |
| S27 | Perfil: no aparece la opción de editar la contraseña; agregarla visible. | PENDIENTE | |
| S28 | Proceso: apuntar cada punto y no olvidar los anteriores; el usuario ya repitió cosas pedidas. | PENDIENTE | |
| S29 | Dashboard: el "Más filtros" del Resumen y de cualquier widget con la misma altura y estilo que el selector de mes (duplica S01; se cierra junto). | CÓDIGO LISTO | |

## Notas

- **Nota iPad (G04):** el usuario pregunta si conviene hacerlo ahora o después. Recomendación: hacerlo pronto, en una fase corta de diseño adaptable (menú lateral en pantallas anchas), porque si no cada pantalla nueva se rehace dos veces.
- **Aclaraciones:** Top = 3, 6, 12 y 24 (resuelto con la web). Readable = Todos / Readable / Not readable (resuelto). Falta: "periodo anterior" en años completos (H05), revisar en la web.
- **Verificación en iOS:** el emulador es Android. Lo de iPad y iPhone (T02, G04) lo confirma el usuario.
