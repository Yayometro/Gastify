// Texts of the "tourAccounts" namespace (the accounts page tour and its component tutorials). Spanish is the source text.
const tourAccounts = {
  // The page tour: from the top down.
  "tour.accounts.welcome.title": "Tus cuentas",
  "tour.accounts.welcome.body": "Todas tus cuentas y tarjetas en un solo lugar: su saldo, lo que entró y salió de cada una y todos sus movimientos. Te llevo de arriba hacia abajo; junto a cada título hay una brújula con su tutorial a fondo.",
  "tour.accounts.filters.title": "Elige el periodo",
  "tour.accounts.filters.body": "Define el rango con el que se calculan lo que entró y salió que ves en cada tarjeta: uno predefinido (ayer, última semana, últimos 30 días…) o uno propio.",
  "tour.accounts.currency.title": "Moneda principal",
  "tour.accounts.currency.body": "La moneda en la que se muestran tus totales y los equivalentes de las cuentas en otras monedas. Cada cuenta conserva su saldo en su propia moneda.",
  "tour.accounts.cards.title": "Tus tarjetas",
  "tour.accounts.cards.body": "Una tarjeta por cuenta, con su saldo y su moneda; si es de otra moneda, también su equivalente en la principal. Puedes arrastrarlas para cambiar su orden.",
  "tour.accounts.detail.title": "Detalle de una cuenta",
  "tour.accounts.detail.body": "Con las flechas cambias de cuenta. Todo lo que está debajo (el resumen y los movimientos) se refiere a la cuenta que estás viendo.",
  "tour.accounts.actions.title": "Editar o crear una cuenta",
  "tour.accounts.actions.body": "«Editar cuenta» cambia los datos de la cuenta que estás viendo y «Nueva cuenta» crea otra desde cero.",
  "tour.accounts.summary.title": "Resumen de movimientos",
  "tour.accounts.summary.body": "Lo que entró y salió de esta cuenta, por categoría, igual que el resumen de tu cartera: el mapa, las burbujas o el anillo a la izquierda y las categorías a la derecha. Usa su periodo de arriba; solo cuentan los movimientos de esta cuenta.",
  "tour.accounts.top.title": "Top de la cuenta",
  "tour.accounts.top.body": "Los movimientos más grandes de esta cuenta, de gastos y de ingresos, en el periodo que elijas en su propio filtro.",
  "tour.accounts.list.title": "Movimientos de la cuenta",
  "tour.accounts.list.body": "La lista de todos los movimientos de esta cuenta. Filtra por periodo, por tipo o por texto, y toca uno para verlo o editarlo.",

  // El periodo.
  "tour.accPeriod.name": "Periodo",
  "tour.accPeriod.select.title": "Periodos predefinidos",
  "tour.accPeriod.select.body": "Elige ayer, la última semana o los últimos 15, 30, 60 o 90 días. Es la forma más rápida de cambiar lo que miden las tarjetas.",
  "tour.accPeriod.range.title": "Un rango propio",
  "tour.accPeriod.range.body": "Si necesitas fechas exactas, elige aquí el día de inicio y el de fin. El rango que pongas reemplaza al predefinido.",

  // Las tarjetas.
  "tour.accCards.name": "Tarjetas de cuentas",
  "tour.accCards.title.title": "Resumen de cuentas",
  "tour.accCards.title.body": "Una tarjeta por cuenta, con su saldo actual en su propia moneda y, si es de otra moneda, su equivalente aproximado en la principal. Lo que entró y lo que salió son los del periodo elegido arriba. Toca el nombre de una cuenta para abrir su detalle en Cuentas, con sus movimientos y su resumen. Arrastra una tarjeta para cambiar el orden; el orden se guarda en tu cuenta.",
  "tour.accCards.strip.title": "Tus tarjetas",
  "tour.accCards.strip.body": "Se ven en fila; desliza para ver las demás. En tu cuenta puedes arrastrar una tarjeta para cambiar su orden y el orden se guarda.",
  "tour.accCards.top.title": "Banco, nombre y tipo",
  "tour.accCards.top.body": "El logo del banco, el nombre de la cuenta y su tipo (débito, crédito, efectivo o ahorro). Tocar el nombre te lleva al detalle de esa cuenta, más abajo.",
  "tour.accCards.balance.title": "Saldo",
  "tour.accCards.balance.body": "El saldo actual en la moneda propia de la cuenta. Si esa moneda no es la principal, debajo aparece su equivalente aproximado en la principal.",
  "tour.accCards.number.title": "Número de tarjeta",
  "tour.accCards.number.body": "Solo aparece si lo guardaste. Está oculto de forma predeterminada; toca el ojito para verlo. Gastify nunca guarda el CVV ni el NIP.",
  "tour.accCards.flow.title": "Lo que entró y salió",
  "tour.accCards.flow.body": "La flecha hacia arriba es lo que entró a la cuenta en el periodo elegido arriba y la flecha hacia abajo es lo que salió. No es el saldo: es el movimiento del periodo.",

  // Detalle de una cuenta.
  "tour.accDetail.name": "Detalle de una cuenta",
  "tour.accDetail.carousel.title": "Cambia de cuenta",
  "tour.accDetail.carousel.body": "El nombre grande es la cuenta que estás viendo. Con las flechas pasas a la anterior o a la siguiente, y al llegar a la última vuelves a la primera. El resumen y los movimientos de abajo siguen a la cuenta elegida.",
  "tour.accDetail.edit.title": "Editar cuenta",
  "tour.accDetail.edit.body": "Abre el formulario de la cuenta que estás viendo, con sus datos para cambiarlos. Ahí también está «Quitar cuenta»: úsalo con cuidado. Una cuenta con movimientos ya no puede cambiar de moneda.",
  "tour.accDetail.new.title": "Nueva cuenta",
  "tour.accDetail.new.body": "Crea otra cuenta desde cero. El tutorial «Crear una cuenta» te enseña, campo por campo, cómo llenarla.",

  // Crear una cuenta.
  "tour.accForm.name": "Crear una cuenta",
  "tour.accForm.open.title": "Nueva cuenta",
  "tour.accForm.open.body": "Este botón abre el formulario para crear una cuenta. Con Siguiente lo abro por ti; no se guarda nada hasta que lo envíes.",
  "tour.accForm.name.title": "Nombre",
  "tour.accForm.name.body": "Cómo la reconoces, por ejemplo «Nómina BBVA» o «Efectivo cartera».",
  "tour.accForm.balance.title": "Saldo actual",
  "tour.accForm.balance.body": "Cuánto dinero tiene hoy. A partir de aquí, cada movimiento que registres lo sube o lo baja.",
  "tour.accForm.currency.title": "Moneda",
  "tour.accForm.currency.body": "Cada cuenta tiene exactamente una moneda propia, y por omisión es tu moneda principal. Elígela bien: cuando la cuenta ya tiene movimientos, la moneda no se puede cambiar; tendrías que crear otra cuenta.",
  "tour.accForm.bank.title": "Banco (opcional)",
  "tour.accForm.bank.body": "Escribe para buscar tu banco y elígelo de la lista; su logo aparecerá en la tarjeta. «Sin banco» sirve para efectivo o cuentas que no son de un banco.",
  "tour.accForm.number.title": "Número de tarjeta o cuenta (opcional)",
  "tour.accForm.number.body": "Solo si lo quieres tener a la mano. Se escribe oculto y el ojito lo deja ver. Nunca pedimos ni guardamos el CVV ni el NIP.",
  "tour.accForm.type.title": "Tipo de cuenta",
  "tour.accForm.type.body": "Débito, crédito, efectivo o ahorro. El tipo decide cómo se agrupa la cuenta: por ejemplo, el dinero total de hoy no cuenta las cuentas de crédito.",
  "tour.accForm.submit.title": "Enviar",
  "tour.accForm.submit.body": "Crea la cuenta y su tarjeta aparece de inmediato en la fila de arriba. Para cancelar, cierra la ventana con la X.",

  // El resumen de movimientos de la cuenta: el del Wallet, solo con los movimientos de esta cuenta.
  "tour.accSummary.name": "Resumen de movimientos",
  "tour.accSummary.what.title": "Para qué sirve",
  "tour.accSummary.what.body": "Muestra cómo se reparten, por categoría, los gastos o los ingresos de esta cuenta: cada porción es la suma de la categoría ÷ el total del periodo. El mapa, las burbujas y el anillo son tres formas de ver la misma distribución, y a la derecha está la lista de categorías. Toca una categoría para ver sus subcategorías y usa la flecha para regresar.",
  "tour.accSummary.filters.title": "Su periodo",
  "tour.accSummary.filters.body": "Arriba eliges el periodo del resumen. Debajo ves de qué día a qué día se calcula, y solo cuentan los movimientos de esta cuenta.",

  // La lista de movimientos de la cuenta.
  "tour.accList.name": "Movimientos de la cuenta",
  "tour.accList.what.title": "La lista",
  "tour.accList.what.body": "Todos los movimientos de esta cuenta, con su periodo, su tipo y su texto para buscar. Toca uno para verlo o editarlo. Las transferencias entre tus cuentas no cuentan como ingreso ni gasto.",
} as const;

export default tourAccounts;
