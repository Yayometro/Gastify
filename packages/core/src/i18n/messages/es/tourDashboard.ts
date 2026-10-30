// Texts of the "tourDashboard" namespace (the wallet's page tour and its component tutorials). Spanish is the source text.
const tourDashboard = {
  // The page tour: from the top down.
  "tour.dashboard.welcome.title": "Tu cartera",
  "tour.dashboard.welcome.body": "Aquí ves tu mes de un vistazo: cuánto tienes, en qué se va y cómo vas con tus presupuestos. Te llevo de arriba hacia abajo, tarjeta por tarjeta; junto al título de cada una hay una brújula con su tutorial a fondo.",
  "tour.dashboard.header.title": "Tu resumen",
  "tour.dashboard.header.body": "Arriba están tus cuentas, el resumen del periodo (ingresos, gastos y balance) y la comparación con el periodo anterior.",
  "tour.dashboard.filters.title": "Cambia el periodo",
  "tour.dashboard.filters.body": "Elige un periodo predefinido o un rango propio, y todo lo que ves abajo se recalcula.",
  "tour.dashboard.analyzer.title": "Lo más destacado del mes",
  "tour.dashboard.analyzer.body": "Gastos que se pasaron, cambios contra tu promedio, rachas y novedades que Gastify detecta solo. Toca una para ver los movimientos detrás; «Ver análisis completo» te lleva al Analizador.",
  "tour.dashboard.accounts.title": "Resumen de cuentas",
  "tour.dashboard.accounts.body": "Una tarjeta por cuenta, con su saldo y su moneda. En tu cuenta puedes arrastrarlas para reordenarlas.",
  "tour.dashboard.breakdown.title": "En qué se va tu dinero",
  "tour.dashboard.breakdown.body": "El resumen de transacciones agrupa tus gastos (o ingresos) por categoría, en mapa, burbujas o anillo. Toca una categoría para bajar a sus subcategorías y a sus movimientos; las flechas te regresan.",
  "tour.dashboard.top.title": "Lo que más pesa",
  "tour.dashboard.top.body": "Tus categorías y movimientos más grandes del periodo, ordenados para encontrar rápido lo que más cuesta.",
  "tour.dashboard.budgets.title": "Tus presupuestos",
  "tour.dashboard.budgets.body": "Cuánto llevas gastado frente al límite de cada categoría, y tus ahorros en la otra pestaña. Cuando te acercas, Gastify te avisa.",
  "tour.dashboard.movements.title": "Detalle de movimientos",
  "tour.dashboard.movements.body": "Tus movimientos del periodo, con filtros, buscador y totales. Abre uno para ver su detalle.",

  // Resumen de arriba.
  "tour.dashHeader.name": "Resumen de arriba",
  "tour.dashHeader.accounts.title": "Tus cuentas",
  "tour.dashHeader.accounts.body": "Cada fila es una cuenta con su saldo, de la más alta a la más baja. Si la cuenta está en otra moneda, su moneda aparece junto al monto.",
  "tour.dashHeader.summary.title": "Resumen del periodo",
  "tour.dashHeader.summary.body": "Ingresos, gastos y balance (ingresos menos gastos) del periodo que elegiste, en tu moneda principal. Abajo ves de qué fecha a qué fecha se calcula.",
  "tour.dashHeader.compare.title": "Contra el periodo anterior",
  "tour.dashHeader.compare.body": "Para ingresos, gastos y balance: cuánto fue en el periodo anterior, cuánto llevas ahora y la diferencia, con su porcentaje y una flecha que dice si subió (▲) o bajó (▼).",

  // Periodo.
  "tour.dashFilters.name": "Periodo",
  "tour.dashFilters.preset.title": "Periodos predefinidos",
  "tour.dashFilters.preset.body": "Elige este mes, el mes pasado, una quincena, los últimos meses y más. Es la forma más rápida de cambiar el periodo.",
  "tour.dashFilters.range.title": "Rango propio",
  "tour.dashFilters.range.body": "Escribe una fecha de inicio y una de fin para ver cualquier periodo. El resumen, el desglose, el top, los presupuestos y los movimientos se recalculan.",

  // Resumen del analizador.
  "tour.dashAnalyzer.name": "Resumen del analizador",
  "tour.dashAnalyzer.card.title": "Lo más destacado del mes",
  "tour.dashAnalyzer.card.body": "Señales calculadas con tus movimientos del mes: límites superados, categorías fuera de lo habitual (contra el promedio de los 6 meses anteriores, sin contar el actual, y con al menos 3 meses de historial), suscripciones detectadas, rachas y ritmo de gasto. Toca una para ver los meses y el cálculo detrás. No son movimientos adicionales. Gastify revisa tu historial y destaca lo más importante de tu mes, sin llamar a ninguna IA. Es un adelanto del Analizador de cartera.",
  "tour.dashAnalyzer.cards.title": "Hallazgos",
  "tour.dashAnalyzer.cards.body": "Cada tarjeta es un hallazgo: un presupuesto que se pasó, un gasto que se disparó contra tu promedio, una racha, una categoría o una suscripción nueva. Tócala para ver los movimientos que la explican.",
  "tour.dashAnalyzer.link.title": "Ver análisis completo",
  "tour.dashAnalyzer.link.body": "Abre el Analizador de cartera, con el análisis completo: comparativo contra el mes anterior, tendencias, patrones por día, tops y más.",

  // Resumen de cuentas.
  "tour.topModal.name": "Detalle del grupo",
  "tour.topModal.header.title": "Qué estás viendo",
  "tour.topModal.header.body": "El nombre de la categoría, de la transacción o de la subcategoría de la que abriste el detalle. El «?» de al lado explica cómo se calcula este listado.",
  "tour.topModal.total.title": "Cuánto suma",
  "tour.topModal.total.body": "El total de estos movimientos en tu moneda principal. Es la suma de la lista de abajo, así que cambia si editas o borras alguno.",
  "tour.topModal.select.title": "Seleccionar varios",
  "tour.topModal.select.body": "Marca movimientos para cambiarles de golpe la categoría, la cuenta o la fecha, o para borrarlos. Con «Buscar duplicados» Gastify te muestra los que se parecen.",
  "tour.topModal.sort.title": "Ordenar",
  "tour.topModal.sort.body": "Elige el orden de la lista: por monto, por fecha o por nombre, de mayor a menor o al revés.",
  "tour.topModal.list.title": "Los movimientos",
  "tour.topModal.list.body": "Cada fila es un movimiento. Tócalo para ver y editar sus datos. Cambios como borrarlo se reflejan al instante en el total y en el resumen de la pantalla de atrás.",
  "tour.dashAccounts.name": "Resumen de cuentas",
  "tour.dashAccounts.title.title": "Resumen de cuentas",
  "tour.dashAccounts.title.body": "Una tarjeta por cuenta, con su saldo actual en su propia moneda y, si es de otra moneda, su equivalente aproximado en la principal. Lo que entró y lo que salió son los del periodo elegido arriba. Toca el nombre de una cuenta para abrir su detalle en Cuentas, con sus movimientos y su resumen. Arrastra una tarjeta para cambiar el orden; el orden se guarda en tu cuenta.",
  "tour.dashAccounts.cards.title": "Tus tarjetas",
  "tour.dashAccounts.cards.body": "Cada tarjeta muestra el nombre de la cuenta, su banco y su tipo (débito, crédito, ahorro…), su moneda y su saldo; si es de otra moneda, también su equivalente en tu moneda principal. En tu cuenta puedes arrastrar las tarjetas para cambiar su orden, y se guarda.",

  // Resumen de transacciones.
  "tour.dashBreakdown.name": "Resumen de transacciones",
  "tour.dashBreakdown.title.title": "Resumen de transacciones",
  "tour.dashBreakdown.title.body": "Muestra cómo se reparten tus gastos (o ingresos) entre categorías: cada porción es la suma de la categoría ÷ el total del periodo. Anillo, burbujas y mapa son tres formas de ver la misma distribución, y la tabla lista las categorías con su porcentaje y su monto (hasta 15 aquí; si hay más, «Ver las N categorías» abre una ventana grande con todas). Toca una categoría para ver sus subcategorías y usa la flecha para regresar. Filtros: tiene su propio periodo, que puede ser distinto al de Inicio; abre Más filtros para cambiarlo.",
  "tour.dashBreakdown.kind.title": "Gastos o ingresos",
  "tour.dashBreakdown.kind.body": "Cambia entre ver en qué gastaste y de dónde te llegó el dinero. Al cambiar, vuelves al primer nivel.",
  "tour.dashBreakdown.chartType.title": "Tipo de gráfica",
  "tour.dashBreakdown.chartType.body": "Mapa, Burbujas o Anillo: tres formas de ver lo mismo. Elige la que te resulte más clara.",
  "tour.dashBreakdown.nav.title": "Total y flechas",
  "tour.dashBreakdown.nav.body": "En grande ves el total del nivel en el que estás. Atrás vuelve al nivel anterior (de movimientos a subcategorías, de subcategorías a categorías); Adelante, desde una categoría, abre todos sus movimientos.",
  "tour.dashBreakdown.chart.title": "La gráfica",
  "tour.dashBreakdown.chart.body": "El tamaño de cada figura es lo que pesa esa categoría en el total. Toca una para bajar a sus subcategorías y luego a sus movimientos; al tocar un movimiento se abre para verlo, editarlo o eliminarlo.",
  "tour.dashBreakdown.list.title": "La lista",
  "tour.dashBreakdown.list.body": "Lo mismo en filas, de mayor a menor, con su monto, el número de transacciones y su porcentaje del total. «Ver subcategorías ›» baja un nivel; arriba aparece el botón para volver y «Ver todas las transacciones de…».",

  // Top de elementos.
  "tour.dashTop.name": "Top de elementos",
  "tour.dashTop.title.title": "Top de elementos por mes",
  "tour.dashTop.title.body": "Para qué sirve: ver en qué se fue la mayor parte de tu dinero. Cómo se calcula: se toman los gastos (o ingresos) del periodo, se agrupan por categoría y se ordenan de mayor a menor suma; en «Movimientos» se ordenan uno por uno por monto. Filtro: el periodo y el tipo (gastos o ingresos) que elijas en esta tarjeta; las transferencias entre tus cuentas no cuentan.",
  "tour.dashTop.period.title": "Su propio periodo",
  "tour.dashTop.period.body": "Este top tiene su propio selector de periodo (predefinido o rango). Mientras no lo cambies, sigue el periodo del resumen de arriba.",
  "tour.dashTop.count.title": "Cuántos elementos",
  "tour.dashTop.count.body": "Elige si ves el Top 3, 6, 12 o 24.",
  "tour.dashTop.tabs.title": "Gastos o ingresos",
  "tour.dashTop.tabs.body": "Con las pestañas cambias entre gastos e ingresos. En cada una ves dos columnas: tus transacciones más grandes y tus categorías más grandes, con su total.",

  // Presupuestos de la cartera.
  "tour.dashBudgets.name": "Presupuestos de la cartera",
  "tour.dashBudgets.title.title": "Presupuestos de tu cartera",
  "tour.dashBudgets.title.body": "Tu avance contra los límites que fijaste, sin salir del Cartera.",
  "tour.dashBudgets.period.title": "Periodo y restablecer",
  "tour.dashBudgets.period.body": "Filtra por periodo para ver tu avance en uno específico; «Restablecer» regresa al mes actual.",
  "tour.dashBudgets.tabs.title": "Presupuestos o ahorros",
  "tour.dashBudgets.tabs.body": "La pestaña Presupuestos muestra tus límites de gasto; Ahorros, tus metas de ahorro. El «?» explica cómo cambiar de una a otra.",
  "tour.dashBudgets.list.title": "Cada presupuesto",
  "tour.dashBudgets.list.body": "Una barra por presupuesto: cuánto llevas, cuánto te queda o cuánto te pasaste, con su porcentaje y una carita. Tócala para ver su detalle.",
} as const;

export default tourDashboard;
