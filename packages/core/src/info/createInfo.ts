// The explanations of the "+" button and of each thing it creates: what it is, what goes in its form, and an example.
// Shared by the app and the web, so both say the same. The "text" is the short sentence; the "sections" add tables,
// equations, definitions, bullets and examples, formatted the same way in both places.

export type InfoBlock =
  | { kind: "p"; text: string }
  | { kind: "bullets"; items: string[] }
  | { kind: "equation"; left: string; right: string }
  | { kind: "definition"; term: string; text: string }
  | { kind: "table"; head?: string[]; rows: string[][] }
  | { kind: "legend"; items: { color: string; label: string; text: string }[] }
  | { kind: "example"; text: string };

export type InfoSection = { label?: string; blocks: InfoBlock[] };

export type InfoText = { title: string; text: string; sections?: InfoSection[] };


// What each thing the "+" can create is, what goes in its form and how it shows up later. Written for someone who
// has never used the app: each entry says what it is, what to fill in, and an example that reads like a real case.

export type CreateKind = 'expense' | 'income' | 'transfer' | 'account' | 'category' | 'budget' | 'saving' | 'project';

export const CREATE_SCREEN_INFO: InfoText = {
  title: 'Crear',
  text: 'Desde aquí creas casi todo lo que usa Gastify, sin buscar la pantalla de cada cosa. Elige arriba qué quieres crear y debajo aparece su formulario. Cada tipo tiene un papel distinto: los gastos e ingresos son movimientos (lo que entra y sale de tus cuentas), las transferencias mueven dinero entre tus cuentas, y las cuentas y categorías organizan esos movimientos. Los presupuestos, ahorros y proyectos son metas de dinero que se llenan solas con tus movimientos. Toca el ⓘ de cada tipo para ver cómo se llena.',
  sections: [
    {
      label: 'Movimientos',
      blocks: [
        { kind: 'definition', term: 'Gasto', text: 'Dinero que sale de una cuenta: una compra, un recibo, una comida. Es lo que alimenta las gráficas de gastos.' },
        { kind: 'definition', term: 'Ingreso', text: 'Dinero que entra a una cuenta: sueldo, venta, reembolso. Suma a tus ingresos del periodo y a tu balance.' },
        { kind: 'definition', term: 'Transferir', text: 'Mover dinero de una de tus cuentas a otra. No es ingreso ni gasto, así que no cambia lo que gastaste.' },
      ],
    },
    {
      label: 'Para organizar',
      blocks: [
        { kind: 'definition', term: 'Cuenta', text: 'Un lugar donde tienes dinero: banco, tarjeta, efectivo o ahorro. Todos los movimientos se guardan en una cuenta.' },
        { kind: 'definition', term: 'Categoría', text: 'Un tema de tus gastos o ingresos: Comida, Transporte, Sueldo. Las gráficas del Resumen y del Analizador las agrupan así.' },
      ],
    },
    {
      label: 'Metas',
      blocks: [
        { kind: 'definition', term: 'Presupuesto', text: 'Un límite de gasto por periodo (mensual, trimestral, semestral o anual) para ciertas categorías. Te avisa al 70, 80, 90 y 100 %.' },
        { kind: 'definition', term: 'Ahorro', text: 'Una cantidad que quieres juntar. Su avance sale de las cuentas que le ligues, o de lo que escribas como ahorrado.' },
        { kind: 'definition', term: 'Proyecto', text: 'Un gasto planeado con inicio y fin, como un viaje o una boda. Suma todo lo que gastes ligado a él, sin importar el mes.' },
      ],
    },
    {
      label: 'Orden sugerido',
      blocks: [
        { kind: 'bullets', items: [
          'Primero crea tus cuentas con su saldo actual.',
          'Después tus categorías (puedes usar las que ya trae la app).',
          'Luego registra gastos, ingresos y transferencias conforme pasen.',
          'Por último, crea presupuestos, ahorros o proyectos si quieres llevar una meta.',
        ] },
      ],
    },
  ] satisfies InfoSection[],
};

export const CREATE_KIND_INFO: Record<CreateKind, InfoText> = {
  expense: {
    title: 'Gasto',
    text: 'Un gasto es dinero que sale de una de tus cuentas. Se registra al momento en que pagas.',
    sections: [
      {
        label: 'Qué llenar',
        blocks: [
          { kind: 'table', head: ['Campo', 'Qué poner'], rows: [
            ['Monto', 'Lo que pagaste, en la moneda de la cuenta. Si el comercio cobró en otra moneda, aparece el campo para poner cuánto cobró.'],
            ['Cuenta', 'De cuál cuenta sale el dinero. Si todavía no tienes ninguna, primero crea una cuenta.'],
            ['Categoría', 'En qué se gastó (Comida, Transporte…). Con subcategoría si quieres más detalle. Define las gráficas.'],
            ['Presupuesto', 'Opcional. Liga el gasto a un presupuesto o proyecto para ver cuánto llevas de su límite.'],
            ['Fecha', 'Cuándo ocurrió. Por defecto es hoy.'],
            ['Nombre', 'Opcional. Si lo dejas vacío, se usa la categoría.'],
            ['Etiquetas', 'Opcionales, separadas por comas. Sirven para filtrar después.'],
          ] },
        ],
      },
      {
        label: 'Ejemplo',
        blocks: [{ kind: 'example', text: 'Pagaste un café de $65 con tu tarjeta: Monto 65, Cuenta Tarjeta, Categoría Comida › Cafés, Presupuesto Comida, fecha hoy.' }],
      },
    ],
  },
  income: {
    title: 'Ingreso',
    text: 'Un ingreso es dinero que entra a una de tus cuentas. Se llena igual que un gasto, pero suma en vez de restar.',
    sections: [
      {
        label: 'Qué llenar',
        blocks: [
          { kind: 'bullets', items: [
            'Monto y cuenta donde llegó el dinero.',
            'Categoría (por ejemplo, Sueldo o Ventas), para que las gráficas de ingresos lo agrupen.',
            'Fecha, y un nombre opcional.',
          ] },
          { kind: 'p', text: 'Este formulario registra lo que ya llegó. Para proyectar un ingreso que se repite cada mes (tu sueldo fijo, por ejemplo), créalo como fuente de ingreso en Más › Proyecciones.' },
        ],
      },
      {
        label: 'Ejemplo',
        blocks: [{ kind: 'example', text: 'Te depositaron tu quincena: Monto 12,000, Cuenta Nómina, Categoría Sueldo, fecha de hoy.' }],
      },
    ],
  },
  transfer: {
    title: 'Transferir',
    text: 'Mueve dinero de una cuenta tuya a otra. No es ingreso ni gasto: solo cambia de lugar.',
    sections: [
      {
        label: 'Qué llenar',
        blocks: [
          { kind: 'table', head: ['Campo', 'Qué poner'], rows: [
            ['Desde', 'La cuenta de la que sale el dinero.'],
            ['Hacia', 'La cuenta que lo recibe. Debe ser otra cuenta, no la misma.'],
            ['Monto que sale', 'Cuánto se descuenta de la cuenta de origen.'],
            ['Monto que llega', 'Solo aparece si las dos cuentas tienen monedas distintas: cuánto llega en la moneda de destino.'],
            ['Fecha y nombre', 'La fecha del movimiento y un nombre opcional, como «Pago de tarjeta».'],
          ] },
        ],
      },
      {
        label: 'Ejemplo',
        blocks: [{ kind: 'example', text: 'Pagaste la tarjeta desde tu nómina: Desde Nómina, Hacia Tarjeta, Monto 5,000. No cuenta como gasto ni como ingreso.' }],
      },
    ],
  },
  account: {
    title: 'Cuenta',
    text: 'Una cuenta es un lugar donde tienes dinero: tu banco, tu tarjeta de crédito, tu efectivo o tu cuenta de ahorro.',
    sections: [
      {
        label: 'Qué llenar',
        blocks: [
          { kind: 'table', head: ['Campo', 'Qué poner'], rows: [
            ['Nombre', 'Cómo la reconoces, por ejemplo «Nómina» o «Tarjeta Nu».'],
            ['Tipo', 'Débito, Crédito, Efectivo o Ahorro. Te ayuda a reconocerla y a agruparla.'],
            ['Moneda', 'En qué moneda manejas esa cuenta.'],
            ['Saldo', 'Cuánto tienes hoy. A partir de aquí, cada movimiento lo va cambiando.'],
            ['Banco', 'Opcional. Muestra su logo en la tarjeta de la cuenta.'],
            ['Número', 'Opcional, solo para tenerlo a la mano. Se oculta con el ojo. Nunca pedimos el CVV.'],
          ] },
        ],
      },
      {
        label: 'Ejemplo',
        blocks: [{ kind: 'example', text: 'Tu cuenta de nómina: Nombre Nómina, Tipo Débito, Moneda MXN, Saldo 8,400, Banco BBVA.' }],
      },
    ],
  },
  category: {
    title: 'Categoría',
    text: 'Una categoría es un tema en el que gastas o ganas. Todo movimiento cae en una categoría.',
    sections: [
      {
        label: 'Qué llenar',
        blocks: [
          { kind: 'bullets', items: [
            'Nombre, por ejemplo «Mascotas».',
            'Ícono y color: solo para reconocerla de un vistazo.',
            'Subcategorías (opcionales): un nivel más de detalle. Comida puede tener Restaurantes y Súper.',
          ] },
          { kind: 'p', text: 'Las categorías alimentan las gráficas del Resumen y del Analizador, y un presupuesto cubre una o varias categorías.' },
        ],
      },
      {
        label: 'Ejemplo',
        blocks: [{ kind: 'example', text: 'Mascotas, con subcategorías Croquetas y Veterinario. Desde ahora, ese gasto aparece como Mascotas en la gráfica.' }],
      },
    ],
  },
  budget: {
    title: 'Presupuesto',
    text: 'Un presupuesto es un límite de gasto para un periodo, en ciertas categorías: «no gastar más de 4,000 en Comida al mes».',
    sections: [
      {
        label: 'Qué llenar',
        blocks: [
          { kind: 'table', head: ['Campo', 'Qué poner'], rows: [
            ['Nombre', 'Por ejemplo «Comida».'],
            ['Moneda y meta', 'La moneda del límite y cuánto no quieres pasar.'],
            ['Periodo', 'Mensual, Trimestral, Semestral o Anual. Cada periodo empieza a contar desde cero.'],
            ['Categorías que cubre', 'Todos los gastos de esas categorías suman contra el límite.'],
          ] },
          { kind: 'equation', left: 'Avance', right: 'Gastado ÷ Meta' },
          { kind: 'p', text: 'Te avisa al 70, 80, 90 y 100 %. Si a mitad del periodo llevas menos del 50 %, la app te felicita.' },
        ],
      },
      {
        label: 'Ejemplo',
        blocks: [{ kind: 'example', text: 'Comida: Meta 4,000 MXN al mes, categorías Comida y Súper. Si llevas 3,200, vas al 80 %.' }],
      },
    ],
  },
  saving: {
    title: 'Ahorro',
    text: 'Un ahorro es una cantidad que quieres juntar, como un fondo de emergencia o unas vacaciones.',
    sections: [
      {
        label: 'Qué llenar',
        blocks: [
          { kind: 'table', head: ['Campo', 'Qué poner'], rows: [
            ['Nombre y moneda', 'Por ejemplo «Fondo de emergencia», en la moneda en que lo juntas.'],
            ['Meta', 'Cuánto quieres juntar en total.'],
            ['Cuentas que lo alimentan', 'Opcional. Su avance es el saldo sumado de esas cuentas.'],
            ['Ahorrado hasta ahora', 'Solo si no ligas cuentas: cuánto llevas. La app usa el mayor entre esto y lo que hayas registrado bajo ese ahorro.'],
          ] },
          { kind: 'equation', left: 'Avance', right: 'Ahorrado ÷ Meta' },
        ],
      },
      {
        label: 'Ejemplo',
        blocks: [{ kind: 'example', text: 'Fondo de emergencia: Meta 30,000 MXN, ligado a la cuenta Ahorro. Si la cuenta tiene 12,000, vas al 40 %.' }],
      },
    ],
  },
  project: {
    title: 'Proyecto',
    text: 'Un proyecto es un gasto planeado con fecha de inicio y fin, como un viaje, una boda o una remodelación.',
    sections: [
      {
        label: 'Qué llenar',
        blocks: [
          { kind: 'table', head: ['Campo', 'Qué poner'], rows: [
            ['Nombre y moneda', 'Por ejemplo «Viaje a Oaxaca».'],
            ['Meta', 'Cuánto piensas gastar en total.'],
            ['Empieza y termina', 'Las fechas del proyecto.'],
          ] },
          { kind: 'p', text: 'Su avance suma todo lo que gastes con ese proyecto, sin importar el mes. Para ligar un gasto, elige el proyecto en el campo Presupuesto del gasto.' },
        ],
      },
      {
        label: 'Ejemplo',
        blocks: [{ kind: 'example', text: 'Viaje a Oaxaca: Meta 12,000 MXN, del 1 al 10 de diciembre. Cada cena o boleto que ligues suma a su avance.' }],
      },
    ],
  },
};

// One line under the choice, so the form is never a mystery even before the "ⓘ" is opened.
export const CREATE_KIND_SUMMARY: Record<CreateKind, string> = {
  expense: 'Dinero que sale de una de tus cuentas.',
  income: 'Dinero que entra a una de tus cuentas.',
  transfer: 'Mueve dinero de una cuenta tuya a otra. No es ingreso ni gasto.',
  account: 'Un banco, una tarjeta, efectivo o una cuenta de ahorro.',
  category: 'Un tema para agrupar tus gastos e ingresos.',
  budget: 'Un límite de gasto por periodo para ciertas categorías.',
  saving: 'Una cantidad que quieres juntar, con su avance.',
  project: 'Un gasto planeado con fecha de inicio y fin.',
};
