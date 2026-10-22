import type { InfoSection } from '@/components/info-content';
import type { InfoText } from '@/components/info-tip';

// Hand-made layouts (tables, equations, legends) for the tooltips that explain the most.

export const ACCURACY_SECTIONS: InfoSection[] = [
  {
    label: 'Proyectado contra real',
    blocks: [
      { kind: 'table', head: ['Columna', 'Qué es'], rows: [
        ['Proyectado', 'Lo que esperabas para ese mes con lo que tenías configurado entonces (tope o referencia histórica). No se recalcula después: editar hoy un mes cerrado no cambia lo que ese mes «proyectaba».'],
        ['Real', 'Lo que tus movimientos dicen que pasó de verdad.'],
        ['Desajuste', 'Real − proyectado, uno por renglón: el de ingreso compara solo ingresos y el de gasto solo gastos.'],
      ] },
      { kind: 'equation', left: 'Desajuste', right: 'Real − Proyectado' },
    ],
  },
  {
    label: 'Cómo leer los colores',
    blocks: [
      { kind: 'p', text: 'El color siempre significa lo mismo (verde: te fue mejor de lo esperado; rojo: te fue peor), pero «mejor» es distinto en cada renglón:' },
      { kind: 'table', head: ['Renglón', 'Número positivo', 'Número negativo'], rows: [
        ['Ingreso', 'verde ▲ ganaste más de lo proyectado', 'rojo ▼ ganaste menos'],
        ['Gasto', 'rojo ▲ gastaste más de lo proyectado', 'verde ▼ gastaste menos'],
      ] },
      { kind: 'p', text: 'Por eso un mismo mes puede mostrar un renglón en rojo y otro en verde: son dos comparaciones independientes, no un total combinado.' },
    ],
  },
  {
    label: 'Ejemplo',
    blocks: [
      { kind: 'example', text: 'Proyectabas $50,000 de gasto y gastaste $47,000: desajuste de −$3,000, verde (gastaste menos). Proyectabas $80,000 de ingreso y ganaste $60,000: desajuste de −$20,000, rojo (ganaste menos).' },
      { kind: 'p', text: 'Solo se muestran meses cerrados con un historial de proyección registrado. Toca un mes para ver su detalle.' },
    ],
  },
];

export const VS_SECTIONS: InfoSection[] = [
  {
    label: 'Qué muestra',
    blocks: [{ kind: 'p', text: 'El mes elegido contra el mes inmediato anterior, renglón por renglón.' }],
  },
  {
    label: 'Cómo se calcula',
    blocks: [
      { kind: 'equation', left: 'Cambio', right: '(Actual − Anterior) ÷ Anterior' },
      { kind: 'equation', left: 'Ahorro', right: '(Ingresos − Gastos) ÷ Ingresos' },
      { kind: 'p', text: 'En «Ahorro» el cambio se da en puntos porcentuales (pts), no en %.' },
    ],
  },
  {
    label: 'Cómo leerlo',
    blocks: [
      { kind: 'table', head: ['Señal', 'Significa'], rows: [
        ['▲', 'Subió (más de 0.5%)'],
        ['▼', 'Bajó (más de 0.5%)'],
        ['▬', 'Casi no cambió (menos de 0.5%)'],
      ] },
      { kind: 'legend', items: [
        { color: '#34d399', label: 'Verde', text: 'Buena noticia: más ingresos, balance o ahorro, o menos gastos.' },
        { color: '#fb7185', label: 'Rojo', text: 'Mala noticia: menos ingresos, balance o ahorro, o más gastos.' },
        { color: '#f59e0b', label: 'Naranja', text: 'Sin cambio.' },
      ] },
    ],
  },
];

export const INSIGHTS_SECTIONS: InfoSection[] = [
  {
    label: 'Cómo se calcula cada cuadrito',
    blocks: [
      { kind: 'table', head: ['Cuadrito', 'Cálculo'], rows: [
        ['Gasto por día', 'Gasto del periodo ÷ días transcurridos'],
        ['Al ritmo actual', 'Gasto por día × días del periodo (solo mientras sigue en curso)'],
        ['Lo que conservas', '(Ingresos − Gastos) ÷ Ingresos'],
        ['Gastos vs anterior', '(Gastos − Gastos del periodo anterior) ÷ Gastos del periodo anterior'],
        ['Ingresos vs anterior', 'Lo mismo con los ingresos'],
        ['Lo que más pesa', 'La categoría con más gasto y su parte del gasto total'],
        ['Gasto más grande', 'El movimiento de gasto más alto del periodo'],
        ['Gasto promedio', 'Gasto total ÷ número de gastos'],
        ['Balance', 'Ingresos − Gastos, y cuántos movimientos tuvo el periodo'],
      ] },
      { kind: 'p', text: 'Los cambios comparan contra el periodo inmediato anterior de la misma duración.' },
    ],
  },
  {
    label: 'Cómo usarlo',
    blocks: [{ kind: 'bullets', items: ['Toca cualquier parte de la tarjeta para abrir el Analizador de cartera completo.'] }],
  },
];

export const BUDGET_FACES_SECTIONS: InfoSection[] = [
  {
    label: 'Qué muestra',
    blocks: [{ kind: 'p', text: 'Tus presupuestos del periodo, del que está más cerca de su límite al más lejano. Cada barra es lo gastado ÷ el límite, y el círculo marca el porcentaje.' }],
  },
  {
    label: 'La carita',
    blocks: [
      { kind: 'table', head: ['Carita', 'Gastado ÷ límite', 'Significa'], rows: [
        ['🤩', 'menos de 30%', 'Vas muy holgado'],
        ['🙂', '30% a 60%', 'Todo en orden'],
        ['😐', '60% a 85%', 'Ojo, ya llevas buena parte'],
        ['😰', '85% a 100%', 'Muy cerca del límite'],
        ['🔥', 'más de 100%', 'Excediste el límite'],
      ] },
      { kind: 'p', text: 'En los presupuestos de ahorro la lectura se invierte: 🤩 a partir de 85% de la meta, 🙂 de 35% a 85% y 😟 por debajo de 35%.' },
    ],
  },
  { label: 'Cómo usarlo', blocks: [{ kind: 'bullets', items: ['Toca un presupuesto para ver sus movimientos.'] }] },
];

export const PROJECTION_MONTHS_SECTIONS: InfoSection[] = [
  {
    label: 'Qué muestra',
    blocks: [
      { kind: 'p', text: 'Cada mes del año en una tarjeta, en tu moneda principal.' },
      { kind: 'table', head: ['Etiqueta', 'De dónde salen las cifras'], rows: [
        ['Real', 'Un mes que ya ocurrió: tus movimientos.'],
        ['Estimado', 'Un mes futuro: tus fuentes de ingreso, tus presupuestos y tus referencias históricas.'],
        ['Este mes', 'Arranca como estimado y se llena con lo real conforme pasa el mes.'],
      ] },
    ],
  },
  {
    label: 'Cómo se calcula',
    blocks: [
      { kind: 'equation', left: 'Neto', right: 'Ingresos − Gastos' },
      { kind: 'p', text: 'Saldo = el dinero que tendrías al cierre del mes. Con ≈ es una estimación hecha hacia atrás, porque no guardaste el saldo real de ese mes.' },
    ],
  },
  {
    label: 'Cómo usarlo',
    blocks: [{ kind: 'bullets', items: ['Toca un mes para ver sus movimientos, comparar lo real contra lo presupuestado, guardar el saldo real y ajustar los topes inesperados.'] }],
  },
];

export const PACE_SECTIONS: InfoSection[] = [
  {
    label: 'Qué muestra',
    blocks: [{ kind: 'p', text: 'Si este mes vas gastando más rápido o más lento de lo habitual, comparando el mismo día del mes.' }],
  },
  {
    label: 'Cómo se calcula',
    blocks: [
      { kind: 'equation', left: 'Lo normal', right: 'Promedio de lo gastado al mismo día en los 6 meses anteriores' },
      { kind: 'equation', left: '%', right: '(Este mes − Lo normal) ÷ Lo normal' },
    ],
  },
  {
    label: 'Cómo leerlo',
    blocks: [{ kind: 'legend', items: [
      { color: '#fb7185', label: 'Rojo', text: 'Vas gastando más rápido de lo normal.' },
      { color: '#34d399', label: 'Verde', text: 'Vas gastando más lento de lo normal.' },
    ] }],
  },
  { label: 'Cómo usarlo', blocks: [{ kind: 'bullets', items: ['Abre «Ver más» para revisar cada mes.'] }] },
];

// The three panels at the top of the dashboard (the phone's carousel and the tablet's hero): what each one says.
export const HERO_INFO = {
  versus: {
    title: 'Contra el periodo anterior',
    text: 'Compara tus ingresos, gastos y balance del periodo elegido con el periodo inmediato anterior de la misma duración.',
    sections: [
      {
        label: 'Qué muestra',
        blocks: [{ kind: 'p', text: 'Cada renglón (Ingresos, Gastos, Balance) trae lo que cambió en dinero, el porcentaje, lo que valía el periodo anterior y lo que vale ahora.' }],
      },
      {
        label: 'Cómo se calcula',
        blocks: [
          { kind: 'equation', left: 'Cambio', right: 'Actual − Anterior' },
          { kind: 'equation', left: '%', right: '(Actual − Anterior) ÷ Anterior' },
          { kind: 'p', text: 'El periodo anterior es el tramo justo antes del elegido y con la misma duración: si miras octubre, es septiembre; si miras 7 días, son los 7 días de antes.' },
        ],
      },
      {
        label: 'Cómo leerlo',
        blocks: [
          { kind: 'table', head: ['Señal', 'Significa'], rows: [['▲', 'Subió contra el periodo anterior'], ['▼', 'Bajó contra el periodo anterior']] },
          { kind: 'legend', items: [
            { color: '#6EE7A8', label: 'Ingresos', text: 'Verde: lo que entró.' },
            { color: '#FF8A8A', label: 'Gastos', text: 'Rojo: lo que salió.' },
            { color: '#7EC8FF', label: 'Balance', text: 'Azul: ingresos − gastos.' },
          ] },
        ],
      },
    ],
  } satisfies InfoText,
  summary: {
    title: 'Resumen del periodo',
    text: 'Lo que entró, lo que salió y lo que quedó en el periodo elegido.',
    sections: [
      {
        label: 'Cómo se calcula',
        blocks: [
          { kind: 'equation', left: 'Balance', right: 'Ingresos − Gastos' },
          { kind: 'p', text: 'Ingresos y gastos suman los movimientos del periodo en tu moneda principal. Las transferencias entre tus cuentas no cuentan, porque ni entran ni salen de tu dinero.' },
        ],
      },
      { label: 'Cómo usarlo', blocks: [{ kind: 'bullets', items: ['Cambia el periodo con los filtros de arriba; el resumen se actualiza.'] }] },
    ],
  } satisfies InfoText,
  accounts: {
    title: 'Tus cuentas',
    text: 'Tus cuentas, de la de mayor saldo a la de menor.',
    sections: [
      {
        label: 'Qué muestra',
        blocks: [
          { kind: 'p', text: 'El saldo actual de cada cuenta en su propia moneda (las que no son de tu moneda principal llevan su código al lado).' },
          { kind: 'p', text: 'El total convierte cada saldo a tu moneda principal con el tipo de cambio más reciente. Las tarjetas de crédito no se suman a tu dinero disponible.' },
        ],
      },
      { label: 'Cómo usarlo', blocks: [{ kind: 'bullets', items: ['Abre «Cuentas» desde el menú para crear, editar o reordenar tus cuentas.'] }] },
    ],
  } satisfies InfoText,
};

// What the History screen is for and how each of its modules reads.
export const HISTORY_INFO = {
  title: 'Historial',
  text: 'El Historial sirve para comparar tu dinero a lo largo del tiempo: meses, trimestres, semestres y años.',
  sections: [
    {
      label: 'Para qué sirve',
      blocks: [
        { kind: 'p', text: 'Es la pantalla para mirar hacia atrás y comparar: ¿gasté más que el año pasado?, ¿este trimestre fue mejor que el anterior?, ¿qué meses pesan más? Se hizo pensando en periodos largos, no en el día a día (para eso están Inicio y Movimientos).' },
      ],
    },
    {
      label: 'Cómo usarla',
      blocks: [
        {
          kind: 'bullets',
          items: [
            'Elige arriba el periodo (por defecto, los últimos 3 meses) y muévelo con las flechas.',
            'Activa «Comparar con otro periodo» para ver cada cifra contra el mismo tramo del año pasado, contra el periodo anterior o contra uno que elijas.',
            'Cada módulo de abajo puede tener su propio periodo («Igual que arriba» lo sigue).',
          ],
        },
      ],
    },
    {
      label: 'Qué hace cada módulo',
      blocks: [
        {
          kind: 'table',
          head: ['Módulo', 'Para qué'],
          rows: [
            ['Periodo', 'Elige el tramo a analizar y, si quieres, con qué compararlo.'],
            ['Resumen', 'Ingresos, gastos y balance del periodo (y del comparado).'],
            ['Datos del periodo', 'Movimientos, lo que conservaste, gasto promedio por mes, lo que más pesa y el gasto más grande.'],
            ['Mes a mes', 'Barras de ingresos y gastos de cada mes; toca un mes para ver su detalle.'],
            ['Gastos e ingresos por categoría', 'En qué se fue y de dónde vino tu dinero; toca una categoría para ver sus subcategorías y movimientos.'],
            ['Grandes gastos', 'La transacción, categoría y subcategoría más grandes de los últimos 12 meses y quién lideró cada mes.'],
            ['Suscripciones recurrentes', 'Cargos que se repiten cada mes.'],
            ['Presupuestos del periodo', 'Cuántos meses cumpliste cada presupuesto y cuánto gastaste contra su meta.'],
            ['Proyecciones', 'El neto de cada mes del año, real o estimado.'],
            ['Top', 'Las categorías o movimientos más grandes, mes por mes para compararlos.'],
          ],
        },
      ],
    },
  ] as import('@/components/info-content').InfoSection[],
};
