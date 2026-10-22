// Every explanation the app shows with a "?", in one place, so the web shows the same texts with the same format.
// The section lists (tables, equations, legends, examples) and the texts used by the cards and the windows.
import type { InfoBlock, InfoSection, InfoText } from './createInfo';

export type { InfoBlock, InfoSection, InfoText };

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
  ] as InfoSection[],
};

// The long explanation of the projections' accuracy: the same text as the app's card.
export const ACCURACY_HELP = [
  'PROYECTADO VS. REAL',
  '«Proyectado» es lo que esperabas para ese mes según lo que tenías configurado en ese momento (tope, o tu referencia histórica); no se recalcula después, así que editar hoy un mes ya cerrado no cambia lo que ese mes «proyectaba». «Real» es lo que tus movimientos dicen que pasó de verdad.',
  'DESAJUSTE: DOS NÚMEROS, UNO POR RENGLÓN',
  'El de ingreso es Ingreso real menos Ingreso proyectado. El de gasto es Gasto real menos Gasto proyectado. No están relacionados entre sí: cada uno compara su propia columna.',
  'POR QUÉ EL COLOR NO SIGUE EL SIGNO IGUAL EN LOS DOS',
  'El color siempre significa lo mismo (verde: te fue mejor de lo esperado; rojo: te fue peor), pero «mejor» se ve distinto en cada uno. En ingreso, más dinero del proyectado es bueno: un número positivo es verde y uno negativo es rojo. En gasto, gastar menos de lo proyectado es bueno: un número negativo es verde y uno positivo es rojo. Por eso un mismo mes puede mostrar un renglón en rojo y el otro en verde: son dos comparaciones independientes, no un total combinado.',
  'EJEMPLO',
  'Proyectabas $50,000 de gasto y gastaste $47,000: desajuste de gasto de -$3,000, verde (gastaste menos). Proyectabas $80,000 de ingreso y ganaste $60,000: desajuste de ingreso de -$20,000, rojo (ganaste menos).',
  'Solo se muestran meses cerrados con un historial de proyección registrado. Toca un mes para ver su detalle.',
].join('\n\n');

// The explanation of each "?", by an id that names the window it belongs to.
export const APP_INFO = {
  'distribuci_n_del_gasto': { title: 'Distribución del gasto', text: 'Cada tramo muestra qué parte de los movimientos que cuentan para este presupuesto corresponde a una categoría o subcategoría. El porcentaje se calcula sobre esos movimientos.' },
  'gasto_total': { title: 'Gasto total', text: 'Suma de todos tus gastos del periodo elegido, estén o no cubiertos por un presupuesto, en tu moneda principal. Sirve para saber cuánto sale en total antes de ver cuánto está controlado. Toca la tarjeta para ver el desglose por presupuesto.' },
  'sin_presupuesto': { title: 'Sin presupuesto', text: 'Gasto total del periodo menos lo que cae dentro de algún presupuesto activo (por categoría o subcategoría). El porcentaje es esa parte ÷ el gasto total. Sirve para detectar dinero que se va sin control. Toca la tarjeta para ver de qué categorías viene y crear un presupuesto.' },
  'cuentas': { title: 'Cuentas', text: 'Cada tarjeta es una cuenta con su saldo actual. «Entró» y «salió» son la suma de los ingresos y gastos de esa cuenta en el periodo elegido arriba. El total convierte cada saldo a tu moneda principal con el tipo de cambio más reciente (las tarjetas de crédito no se suman a tu dinero disponible).' },
  'ltimos_movimientos': { title: 'Últimos movimientos', text: 'Los movimientos con la fecha más reciente de toda tu cuenta (cinco en el teléfono; en la tablet los que quepan junto a tus presupuestos), sin aplicar el periodo de arriba (es la única tarjeta que lo ignora). Sirve para revisar rápido lo último que registraste. Toca uno para verlo o editarlo, o abre la lista completa con sus filtros.' },
  'ltimos_movimientos_2': { title: 'Últimos movimientos', text: 'Los cinco movimientos con la fecha más reciente de toda tu cuenta, sin aplicar el periodo de arriba (es la única tarjeta que lo ignora). Sirve para revisar rápido lo último que registraste. Toca uno para verlo o editarlo, o abre la lista completa con sus filtros.' },
  'banco_y_n_mero': { title: 'Banco y número', text: 'El banco al que pertenece la cuenta y, si lo quisiste, su número de tarjeta o de cuenta, oculto de forma predeterminada (toca el ojito para verlo). Nunca se guarda el CVV ni el NIP.' },
  'movimientos_de_la_cuenta': { title: 'Movimientos de la cuenta', text: 'Lo que entró y salió de esta cuenta en el periodo elegido, y sus movimientos más recientes. Las transferencias entre tus cuentas no cuentan como ingreso ni gasto.' },
  'total': { title: 'Total', text: 'Suma del saldo de todas tus cuentas, cada una convertida a tu moneda principal con el tipo de cambio más reciente (saldo × tasa). Si una moneda no tiene tipo de cambio, esa cuenta no suma y se avisa. Sirve para saber cuánto dinero tienes en total hoy.' },
  'vs_el_mes_anterior': { title: 'VS el mes anterior', text: 'Compara el mes elegido con el mes inmediato anterior. «Cambio» es (actual − anterior) ÷ anterior. La flecha ▲ sube, ▼ baja y ▬ indica que casi no cambió (menos de 0.5%). Verde es una buena noticia (más ingresos, menos gastos, más balance o ahorro), rojo es una mala y naranja es sin cambio. El ahorro es la parte de tus ingresos que conservas: (ingresos − gastos) ÷ ingresos.', sections: VS_SECTIONS },
  'promedio_mensual': (monthsCount: number) => ({ title: 'Promedio mensual', text: `Es el promedio de los ${monthsCount} meses de la tendencia (el mes elegido y los ${Math.max(0, monthsCount - 1)} anteriores): se suman los ingresos, los gastos y los movimientos de esos meses y se divide entre ${monthsCount}. Es el mismo cálculo de la web. Toca para ver mes por mes.`}),
  'tendencia': { title: 'Tendencia', text: 'Ingresos (verde) y gastos (rojo) de cada uno de los últimos seis meses, terminando en el mes elegido. Toca un mes para ver su tabla: ingresos, gastos y balance contra el mes anterior, con flechas que dicen si subieron o bajaron.' },
  'vs_el_mes_anterior_2': { title: 'VS el mes anterior', text: 'Compara el mes elegido con el mes inmediato anterior. «Cambio» es (actual − anterior) ÷ anterior. La flecha ▲ sube, ▼ baja y ▬ indica que casi no cambió (menos de 0.5%). Verde es una buena noticia (más ingresos, menos gastos, más balance o ahorro), rojo es una mala y naranja es sin cambio. El ahorro es la parte de tus ingresos que conservas: (ingresos − gastos) ÷ ingresos.', sections: VS_SECTIONS },
  'tendencia_2': { title: 'Tendencia', text: 'Ingresos (verde) y gastos (rojo) de cada uno de los últimos seis meses, terminando en el mes elegido. Toca un mes para ver su tabla: ingresos, gastos y balance contra el mes anterior, con flechas que dicen si subieron o bajaron.' },
  'promedio_mensual_2': (monthsCount: number) => ({ title: 'Promedio mensual', text: `Es el promedio de los ${monthsCount} meses de la tendencia (el mes elegido y los ${Math.max(0, monthsCount - 1)} anteriores): se suman los ingresos, los gastos y los movimientos de esos meses y se divide entre ${monthsCount}. Es el mismo cálculo de la web. Toca para ver mes por mes.`}),
  'analyzer': (topN: number | string) => ({ title: `Top ${topN}`, text: 'Las categorías y los movimientos con más gasto del mes elegido, con el cambio contra el mes anterior. Toca una categoría para ver todos sus movimientos, o un movimiento para abrirlo directamente.'}),
  'pagos_recurrentes': { title: 'Pagos recurrentes', text: 'Gastos con el mismo nombre que se repiten en al menos 2 de los últimos 3 meses con un monto que varía menos de 15%. Toca la tarjeta para ver todos, con su cuenta, categoría y cargos; toca un cargo para abrir el movimiento. Se marca «nuevo» si no existía antes y «posible duplicado» si hay dos cargos con menos de 48 horas de diferencia en el mes.' },
  'ritmo_de_gasto': { title: 'Ritmo de gasto', text: 'Se suma lo gastado desde el día 1 hasta hoy y se compara con el promedio de lo que llevabas gastado, al mismo día del mes, en los 6 meses anteriores. El porcentaje es (lo de este mes − lo normal) ÷ lo normal: rojo si vas gastando más rápido, verde si más lento. Sirve para corregir a tiempo, antes de que termine el mes. Abre Ver más para revisar cada mes.', sections: PACE_SECTIONS },
  'ritmo_de_gasto_2': { title: 'Ritmo de gasto', text: 'Se suma lo gastado desde el día 1 hasta hoy y se compara con el promedio de lo que llevabas gastado, al mismo día del mes, en los 6 meses anteriores. El porcentaje es (lo de este mes − lo normal) ÷ lo normal: rojo si vas gastando más rápido, verde si más lento. Sirve para corregir a tiempo, antes de que termine el mes. Abre Ver más para revisar cada mes.', sections: PACE_SECTIONS },
  'periodo': { title: 'Periodo', text: 'Elige qué tramo de tiempo analizar; todas las tarjetas de abajo que dicen «Igual que arriba» lo siguen. Al comparar con otro periodo (el mismo tramo del año anterior, el periodo inmediato anterior de la misma duración o uno que elijas) cada cifra muestra cuánto cambió. Por defecto se analizan los últimos 3 meses.' },
  'resumen': { title: 'Resumen', text: 'Ingresos = suma de lo que entró en el periodo; gastos = suma de lo que salió; balance = ingresos − gastos. Las transferencias entre tus cuentas no cuentan. Con una comparación activa, la columna derecha es el otro periodo y el porcentaje es (periodo − comparado) ÷ comparado; en gastos, que suba es malo (rojo) y que baje es bueno (verde).' },
  'datos_del_periodo': { title: 'Datos del periodo', text: 'Lecturas rápidas del mismo periodo: cuántos movimientos tuvo, qué parte de tus ingresos conservaste ((ingresos − gastos) ÷ ingresos), cuánto gastaste en promedio por mes, qué categoría pesó más y cuál fue tu gasto más grande. Se calculan con los mismos movimientos que el resumen.' },
  'resumen_2': { title: 'Resumen', text: 'Ingresos = suma de lo que entró en el periodo; gastos = suma de lo que salió; balance = ingresos − gastos. Las transferencias entre tus cuentas no cuentan. Con una comparación activa, la columna derecha es el otro periodo y el porcentaje es (periodo − comparado) ÷ comparado; en gastos, que suba es malo (rojo) y que baje es bueno (verde).' },
  'gastos_por_categor_a': { title: 'Gastos por categoría', text: 'Suma de los gastos de cada categoría en el periodo, de mayor a menor; la barra es la categoría ÷ la mayor de la lista. Filtro: tiene su propio periodo (por defecto «Igual que arriba», con su comparación si la activaste), pero puedes elegir otro sin cambiar el resto de la pantalla. Sirve para ver en qué se fue tu dinero. Toca una categoría para ver sus movimientos.' },
  'ingresos_por_categor_a': { title: 'Ingresos por categoría', text: 'Suma de los ingresos de cada categoría en el periodo, de mayor a menor; la barra es la categoría ÷ la mayor de la lista. Filtro: tiene su propio periodo, igual que los gastos. Sirve para ver de dónde viene tu dinero. Toca una categoría para ver sus movimientos.' },
  'gastos_por_categor_a_2': { title: 'Gastos por categoría', text: 'Suma de los gastos de cada categoría en el periodo, de mayor a menor; la barra es la categoría ÷ la mayor de la lista. Filtro: tiene su propio periodo (por defecto «Igual que arriba», con su comparación si la activaste), pero puedes elegir otro sin cambiar el resto de la pantalla. Sirve para ver en qué se fue tu dinero. Toca una categoría para ver sus movimientos.' },
  'ingresos_por_categor_a_2': { title: 'Ingresos por categoría', text: 'Suma de los ingresos de cada categoría en el periodo, de mayor a menor; la barra es la categoría ÷ la mayor de la lista. Filtro: tiene su propio periodo, igual que los gastos. Sirve para ver de dónde viene tu dinero. Toca una categoría para ver sus movimientos.' },
  'mes_a_mes': { title: 'Mes a mes', text: 'Cada mes del año en una tarjeta. Ingresos: lo que entra. Gastos: lo que sale. Neto: ingresos menos gastos (verde si sobra, rojo si falta). Saldo: el dinero que tendrías al cierre del mes en tu moneda principal. «Real» es un mes que ya ocurrió, con tus movimientos; «Estimado» se proyecta con tus fuentes de ingreso, presupuestos y referencias históricas; «Este mes» arranca como estimado y se llena con lo real. Con ≈, el saldo es una estimación hecha hacia atrás cuando no guardaste el saldo real. Todas las cifras están en tu moneda principal. Toca un mes para ver sus movimientos, comparar lo real contra lo presupuestado, guardar el saldo real y ajustar los topes inesperados.', sections: PROJECTION_MONTHS_SECTIONS },
  'plantilla': { title: 'Plantilla', text: 'Es el mismo formato que usa la web. Llénala con fecha, concepto, monto, moneda y tipo; las categorías, etiquetas y cuentas se enlazan con las que ya tienes.' },
  'seleccionar_movimientos': { title: 'Seleccionar movimientos', text: 'Marca los movimientos que quieras cambiar. Con los botones cambias un solo campo de todos a la vez (nombre, fecha, tipo, categoría o cuenta), o usas la edición general para llenar varios campos juntos. Lo que no llenes se queda como estaba en cada movimiento. «Borrar» quita todos los seleccionados. Mantener presionado un movimiento también lo selecciona.' },
  'notificaciones': { title: 'Notificaciones', text: 'Te avisamos cuando un presupuesto llega al 70, 80, 90 o 100 % de su límite, cuando un ahorro avanza, y cuando vas bien a mitad del periodo. Cada aviso aparece una vez por presupuesto y periodo. Desliza un aviso a la izquierda o a la derecha para quitarlo de la lista.' },
  'c_mo_leer_esto': { title: 'Cómo leer esto', text: 'Cada renglón es un mes (o una fecha) que sirvió para calcular la señal. ✓ significa que se cumplió el límite o la meta; ✗, que no. Los montos están en tu moneda principal.' },
  'cumplimiento_del_presupuesto': { title: 'Cumplimiento del presupuesto', text: 'Cada mes se compara lo gastado en la categoría con el límite del presupuesto. ✓ si no lo superaste, ✗ si sí. La racha cuenta los meses seguidos, hasta el actual, dentro del límite. Si el presupuesto es nuevo, los meses anteriores usan su meta más antigua como estimado.' },
  'l_deres_por_mes': { title: 'Líderes por mes', text: 'Para cada uno de los últimos doce meses se busca el movimiento, la categoría o la subcategoría con más gasto. La lista va de mayor a menor para que se vea cuál ganó en el año. En categorías, el % es su parte del gasto de los doce meses.' },
  'de_d_nde_sale_este_an_lisis': { title: 'De dónde sale este análisis', text: 'No usa inteligencia artificial: cada frase es la lectura directa de un cálculo sobre tus últimos doce meses (si la transacción más grande está en la categoría líder, qué parte del gasto es la categoría, qué tan aislado fue el gasto y qué etiqueta se repite).' },
  'c_mo_se_calcula': { title: 'Cómo se calcula', text: 'Se suma el gasto de cada día de la semana (todos los lunes, todos los martes…) durante el mes y se divide entre cuántas veces cayó ese día; un mes tiene 4 o 5 de cada uno, así que dividir hace justa la comparación.' },
  'lo_m_s_destacado': { title: 'Lo más destacado', text: 'Señales calculadas con tus movimientos del mes: límites superados, categorías fuera de lo habitual (contra el promedio de los 6 meses anteriores, sin contar el actual, y con al menos 3 meses de historial), suscripciones detectadas, rachas y ritmo de gasto. Toca una para ver los meses y el cálculo detrás. No son movimientos adicionales.' },
  'proyecci_n_del_mes': { title: 'Proyección del mes', text: 'Contrasta lo previsto con lo real del mes elegido. Previsto = tus fuentes de ingreso (ingresos) y tus presupuestos activos más los topes que hayas puesto (gastos); Real = la suma de tus movimientos del mes. Para un mes cerrado solo aparece la comparación si había referencias o ajustes registrados; en el mes en curso muestra el avance contra lo previsto. Sirve para ver si tu plan se está cumpliendo.' },
  'presupuestos_del_analizador': { title: 'Presupuestos del analizador', text: 'Compara el gasto de cada presupuesto con su límite en el periodo, de los más llenos o excedidos a los menos llenos, y muestra cuántos meses seguidos se cumplió (la racha). Toca uno para ver sus últimos 12 meses: lo gastado, el límite de cada mes y si se cumplió.' },
  'grandes_gastos': { title: 'Grandes gastos', text: 'Muestra la transacción, la categoría y la subcategoría con más gasto en los últimos doce meses. Toca cada una para ver quién lideró cada mes, o abre «Ver mes por mes» para el resumen completo y «Ver análisis» para una lectura en palabras.' },
  'exposici_n_multimoneda': { title: 'Exposición multimoneda', text: 'Tus saldos en monedas distintas a la principal, convertidos con el tipo de cambio actual (saldo nativo × tasa). El porcentaje compara ese valor con el que tendría el MISMO saldo nativo al cierre del mes anterior; mide cuánto te ayudó o perjudicó el tipo de cambio, no es rendimiento de la cuenta. Sirve para saber qué tan expuesto estás a variaciones de otras monedas.' },
  'patr_n_semanal': { title: 'Patrón semanal', text: 'Se suma el gasto de cada día de la semana en el mes elegido y se divide entre cuántas veces cayó ese día (un mes tiene 4 o 5 de cada uno), para que la comparación sea justa. «Ver detalle» muestra la semana con más gasto y cada día.' },
  'detalle_de_la_categor_a': { title: 'Detalle de la categoría', text: 'Total de la categoría = la suma de todos sus movimientos en el periodo. Abajo, cada subcategoría con su total, ordenadas de mayor a menor gasto, y dentro de cada una sus movimientos, también de mayor a menor. Con el interruptor puedes invertir el orden (de menor a mayor). Toca un movimiento para abrirlo.' },
  'presupuestos_del_periodo': { title: 'Presupuestos del periodo', text: 'Para cada presupuesto se cuenta, mes por mes del periodo, cuántos meses lo gastado no superó la meta (por ejemplo 4 de 6) y se compara el gasto total contra la meta total del periodo. Si activas la comparación arriba, verás también los resultados del otro periodo. Toca una fila para revisar cada mes; ≈ indica una meta estimada (el presupuesto es más nuevo que ese mes).' },
  'grandes_gastos_2': { title: 'Grandes gastos', text: 'La mayor transacción, categoría y subcategoría del año móvil que termina en el periodo elegido. Toca cada una para ver quién lideró cada mes (con su mes), «Ver líderes mes por mes» para el resumen y «Ver análisis» para una lectura en palabras.' },
  'suscripciones_recurrentes': { title: 'Suscripciones recurrentes', text: 'Se detectan gastos con el mismo nombre que aparecen en al menos 2 de los últimos 3 meses con un monto que varía menos de 15%. El monto mostrado es el cargo más reciente. Toca uno para revisar sus fechas e importes (y abrir cada movimiento); se marca «nuevo» si antes no existía y «posible duplicado» si hay dos cargos con menos de 48 horas de diferencia en el mes.' },
  'mes_a_mes_2': { title: 'Mes a mes', text: 'Ingresos (verde) y gastos (rojo) de cada mes del periodo, con la cifra sobre cada barra. Toca un mes para ver su detalle y su categoría líder. Si comparas, las barras tenues corresponden al mes y año indicados abajo.' },
  'detalle_del_mes': (previous: boolean) => ({ title: 'Detalle del mes', text: previous ? 'A la izquierda, el mes elegido del periodo; a la derecha, el mes que le corresponde en el periodo con el que comparas. Cada renglón compara lo mismo: ingresos contra ingresos, gastos contra gastos, balance contra balance y la categoría que más pesó en cada mes.' : 'Ingresos y gastos del mes, su balance (ingresos − gastos) y la categoría que más gasto tuvo ese mes.'}),
  'proyecciones': { title: 'Proyecciones', text: 'Cada barra es el neto del mes (ingresos − gastos). Los meses cerrados usan tus movimientos reales; los futuros se estiman con tus fuentes de ingreso, tus presupuestos y tus referencias históricas; el mes en curso mezcla ambos. Verde: sobra. Rojo: falta. Toca «Ver el detalle» para la tabla completa y el detalle de cada mes.' },
  'c_mo_leer_esta_tabla': { title: 'Cómo leer esta tabla', text: ACCURACY_HELP, sections: ACCURACY_SECTIONS },
  'presupuestos': { title: 'Presupuestos', text: 'Cada barra es lo gastado en el periodo del presupuesto ÷ su límite; el círculo marca el porcentaje y la carita cambia de ánimo según qué tan cerca estés del límite (verde tranquilo, naranja cerca, rojo excedido). Se ordenan igual que en Presupuestos: primero la barra más llena o pasada del límite, y así hasta la más vacía. Aquí se ven hasta 10; «Ver todos» abre todos. Toca uno para ver sus movimientos.', sections: BUDGET_FACES_SECTIONS },
  'an_lisis_del_periodo': {
        title: 'Análisis del periodo',
        text: 'Gasto por día = gasto del periodo ÷ días transcurridos. Al ritmo actual = ese promedio × los días del periodo (solo mientras sigue en curso). Lo que conservas = (ingresos − gastos) ÷ ingresos. Los cambios comparan contra el periodo inmediato anterior de la misma duración. El gasto promedio es el gasto total ÷ el número de gastos. Toca cualquier parte de la tarjeta para abrir el Analizador de cartera completo.', sections: INSIGHTS_SECTIONS },
  'resumen_de_transacciones': { title: 'Resumen de transacciones', text: 'Muestra cómo se reparten tus gastos (o ingresos) entre categorías: cada porción es la suma de la categoría ÷ el total del periodo. Anillo, burbujas y mapa son tres formas de ver la misma distribución, y la tabla lista las categorías con su porcentaje y su monto (hasta 15 aquí; si hay más, «Ver las N categorías» abre una ventana grande con todas). Toca una categoría para ver sus subcategorías y usa la flecha para regresar. Filtros: tiene su propio periodo, que puede ser distinto al de Inicio; abre Más filtros para cambiarlo.' },
  'los_m_s_grandes': { title: 'Los más grandes', text: 'Para qué sirve: ver en qué se fue la mayor parte de tu dinero. Cómo se calcula: se toman los gastos (o ingresos) del periodo, se agrupan por categoría y se ordenan de mayor a menor suma; en «Movimientos» se ordenan uno por uno por monto. Filtro: el periodo y el tipo (gastos o ingresos) que elijas en esta tarjeta; las transferencias entre tus cuentas no cuentan.' },
  'filtros': { title: 'Filtros', text: 'Acota la lista: por texto, tipo, legibilidad, categoría, cuenta o monto exacto. El buscador de duplicados encuentra movimientos repetidos para borrarlos de una vez.' },
  'acceso': { title: 'Acceso', text: 'Con qué correo y contraseña entras a Gastify. Si entras con Google y nunca definiste una contraseña, aquí puedes crear una.' },
  'tokens_de_acceso': { title: 'Tokens de acceso', text: 'Un token permite que otra herramienta (un asistente, un script) lea y escriba en tu cuenta sin tu contraseña. Se muestra una sola vez al crearlo; si lo pierdes, revócalo y crea otro.' },
  'moneda_principal': {
        title: 'Moneda principal',
        text: 'Es la moneda en la que se muestran tus totales, presupuestos, historial y proyecciones. Cada cuenta conserva su saldo en su propia moneda; solo cambia cómo se presentan los totales, convertidos con el tipo de cambio más reciente. Cambiarla no modifica ningún movimiento.',
      },
  'passkeys': { title: 'Passkeys', text: 'Un passkey te deja entrar con tu huella, tu cara o el código de tu teléfono, sin contraseña. Se agrega desde la web o desde la app instalada.' },
  'verificaci_n_en_dos_pasos': { title: 'Verificación en dos pasos', text: 'Además de tu contraseña, Gastify te pide un código de 6 dígitos de una app autenticadora. Los códigos de respaldo sirven si pierdes el teléfono: guárdalos en un lugar seguro.' },
  'c_mo_leer_esta_tabla_2': { title: 'Cómo leer esta tabla', text: ACCURACY_HELP, sections: ACCURACY_SECTIONS },
  'referencias_hist_ricas': { title: 'Referencias históricas', text: 'Montos por mes que las proyecciones usan como punto de partida: lo que de verdad ingresó o gastó, o un estimado que vale por un tiempo. Ingresos y gastos se guardan por separado.' },
  'fuentes_de_ingreso': { title: 'Fuentes de ingreso', text: 'Lo que entra cada periodo (sueldo, rentas...). Las proyecciones lo suman mes a mes, convertido a la moneda principal.' },
  'c_mo_leer_este_mes': { title: 'Cómo leer este mes', text: 'Los meses cerrados muestran tus movimientos reales. Los futuros son un estimado puro hecho con tus presupuestos activos (gastos) y tus fuentes de ingreso (ingresos). El mes en curso mezcla ambos: empieza como estimado y se llena con lo real. Con «Ver movimientos» ves los movimientos detrás de estas cifras, y los topes de abajo sirven para sumar dinero que no está ligado a ningún presupuesto ni fuente de ingreso.' },
  'saldo_real_del_mes': { title: 'Saldo real del mes', text: 'La app no puede calcular saldos pasados por sí sola. Si sabes cuánto tenías en tus cuentas al terminar este mes, regístralo aquí: se usa como punto de partida en la columna de saldo de la proyección.' },
  'tope_de_gasto_inesperado': { title: 'Tope de gasto inesperado', text: 'Un monto manual que se suma a tu estimado de gastos, para gastos que no tienen su propio presupuesto.' },
  'tope_de_ingreso_inesperado': { title: 'Tope de ingreso inesperado', text: 'Un monto manual que se suma a tu estimado de ingresos, para dinero que entra y no está ligado a una fuente de ingreso recurrente.' },
  'totales': { title: 'Totales', text: 'Ingresos = suma de todo lo que entró en el periodo. Gastos = suma de todo lo que salió. Balance = ingresos − gastos (verde si sobra, rojo si falta). Se calcula con los movimientos que ves bajo los filtros activos, en tu moneda principal; las transferencias entre tus cuentas no cuentan porque ni entran ni salen de tu dinero.' },
};
