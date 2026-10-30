# Objetivos y Oportunidades de crecimiento — Gastify

## 0. Estado, alcance y reglas de continuidad

- **Fecha:** 2026-10-28, America/Mexico_City.
- **Autor:** OpenAI / Codex. No se atribuye una variante de modelo no verificable en este entorno.
- **Estado:** MVP implementado localmente en esta rama; pendiente de prueba visual/funcional del usuario. Sin commit, push, merge ni despliegue.
- **Rama:** `codex/growth-opportunities-goals`.
- **Checkout aislado:** `/Users/luisjairvazqueznavarrete/.codex/worktrees/growth-goals/Gastify`.
- **Base verificada:** `origin/main`, commit `eaba906deb0943783c5766cb6722bceb4304974d`, después de `git fetch origin`.
- **Coordinación:** el checkout principal está en `feat/tutorial`, con cambios locales de Claude. No se copiaron, descartaron, commitearon ni mezclaron. Su tutorial, correcciones de demo y catálogo `tour` todavía no forman parte de esta base. Reconciliarlos explícitamente cuando lleguen a `main`.
- **Entrega de diseño original:** este plan y una rama independiente. La implementación posterior se registra en §16 y en la siguiente entrada de `AI_COORDINATION_LOG.md`.
- Antes de integrar esta rama: leer el protocolo de [AI_COORDINATION_LOG.md](AI_COORDINATION_LOG.md), revisar el estado real del repositorio y reconciliar la auditoría con `main`. No asumir que un plan antiguo describe el código vigente.
- No ejecutar build, commit, push, merge o despliegue sin la autorización aplicable. No usar `git add .` ni incluir archivos `.env`.
- Cada fase debe anotar fecha, autor, decisiones, archivos, pruebas y pendientes. No marcar una función como lista por tener únicamente una maqueta.

## 1. Qué pidió el usuario

1. Identificar gastos por transacción, categoría, comercio u otras agrupaciones y explicar su posible uso alternativo.
2. Mostrar tres ejemplos por defecto: inversión ilustrativa, viaje y enganche/otra meta; personalizarlos con los objetivos existentes.
3. Permitir objetivos financieros de cualquier propósito: coche, casa, negocio, cirugía, viaje, etc.; nombre, icono, color y relaciones con categorías, etiquetas, planes y budgets.
4. Ofrecer plantillas más específicas: por ejemplo coche con precio total, enganche y plan de ahorro.
5. Calcular cuánto apartar y cuándo; recordatorios acordes a ingresos mensuales, quincenales o catorcenales.
6. Aprovechar Projects y Savings existentes sin duplicar conceptos ni dinero.
7. Documentar el proyecto y prepararlo en una rama distinta al trabajo en curso.

La finalidad es **entender → explorar → elegir → ahorrar → alcanzar**, no señalar culpables ni convertir una simulación en dinero real. “53 mil en cigarros/OXXO” es el ejemplo del usuario, no una consulta a su cuenta ni un hallazgo verificado.

## 2. Decisión principal: evolucionar Savings, no renombrar Projects

| Concepto | Pregunta que responde | Cómo se mide | Propuesta |
| --- | --- | --- | --- |
| Presupuesto de gasto | ¿Cuánto puedo gastar en esto durante el periodo? | Gasto real contra límite | Mantener `Budget`, tipo `spending`. |
| Ahorro / Objetivo | ¿Qué quiero conseguir y cuánto me falta reunir? | Ahorro declarado o saldo vinculado contra meta | Enriquecer `Budget`, tipo `saving`, con datos del objetivo. |
| Proyecto | ¿Cuánto he gastado en este evento o iniciativa? | Transacciones vinculadas contra presupuesto del proyecto | Mantener `Budget`, tipo `project`; enlazarlo opcionalmente al objetivo. |
| Oportunidad | ¿Qué cambiaría si destinara una parte de este gasto a otra cosa? | Simulación explicable, basada en gastos observados | Cálculo separado; nunca modifica los tres anteriores por sí solo. |

**No crear una colección `Goal` en la primera versión.** Los Savings actuales ya tienen meta, ahorro, moneda y cuentas vinculadas. Un Goal será un ahorro enriquecido: mismo documento, mismo `_id`, importes únicos. Un ahorro anterior seguirá funcionando como “ahorro simple”; “Convertir en objetivo” agrega contexto al mismo registro, no crea una copia.

**No agregar `budgetType: "goal"`.** Rompería consumidores que distinguen `spending/saving/project` y podría hacer que una meta se contara como gasto. El predicado nuevo será `isSavingBudget(budget) && budget.goalDetails != null`.

### Ejemplo: Japón

- Objetivo: reunir MXN 260,000 para el viaje.
- Ahorro: MXN 80,000 declarados o una cuenta dedicada; es la financiación disponible.
- Proyecto: vuelos/hotel/comidas efectivamente pagados, con su propio límite.
- Enlace objetivo–proyecto: navegación y contexto. **No se suman automáticamente los gastos del proyecto al ahorro.**
- Si el vuelo ya se pagó, mostrar por separado “disponible para la meta” y “gastado en el proyecto”. El objetivo “reunir antes de viajar” no es la misma métrica que “financiar el coste total, incluido lo ya pagado”. Esta segunda modalidad requiere atribuir pagos explícitamente y se pospone; no inventar el origen del dinero.
- Fecha objetivo para ahorrar y fechas del proyecto son independientes. Cambiar el viaje de enero a febrero ofrece revisar el plazo de ahorro, pero no lo cambia silenciosamente.

### Alternativas descartadas

- Renombrar Projects a Goals: confunde gastar con acumular y no sirve para fondo de emergencia/enganche.
- Crear `Goal.target` y `Goal.saved` independientes de Savings: duplica saldos y obliga a sincronizar dos fuentes de verdad.
- Una tabla global de metas, inversiones, gastos y tareas: excesiva para este alcance.
- Si después se incorporan metas no monetarias o colaboración entre wallets, reconsiderar una entidad separada mediante una migración diseñada; no anticiparla ahora.

## 3. Auditoría del código actual

Archivos y comportamiento inspeccionados en la base indicada; no se accedió a datos personales para este plan.

| Área | Evidencia en el repositorio | Consecuencia |
| --- | --- | --- |
| Budgets | `src/model/Budget.ts`: tres tipos, `goalAmount`, `savingAmount`, `currency`, `goalMoney/savingMoney`, `history`, cuentas, tags, fechas de evento | Extensión aditiva, no migración destructiva. Los comentarios de fases históricas no bastan para asumir que todos los consumidores usan `money`. |
| Compatibilidad | `packages/core/src/transformers/budgetTypes.ts` reconoce `isSaving` heredado | Mantener ambos formatos y probar documentos antiguos. |
| Ahorro | `BudgetBarRow.tsx` y `BudgetDetailModal.tsx` usan saldo de cuentas si hay vínculos; en otro caso importe manual | No sumar cuentas + importe manual + aportaciones. Son modos alternativos. |
| Multimoneda de cuentas | `src/helpers/hooks/useLinkedAccountsTotal.ts` consulta equivalencias y omite cuentas cuya conversión falla | Añadir estado explícito de total parcial antes de usarlo para metas; no anunciar logro con un total incompleto. |
| Moneda de budgets | `src/hooks/money/useBudgetsInPrimaryCurrency.ts` convierte para mostrar; `conversionUnavailable` puede conservar valores originales | Filtrar/rotular falta de FX, nunca sumar como si ya estuvieran convertidos. |
| Proyectos | `ProjectBudgetDetailModal.tsx`, `transactions/link-budget/route.ts`: transacción con un `budget` explícito; tags ordenan sugerencias | Asociar categoría/tag no atribuye dinero automáticamente. No reutilizar `Transaction.budget` para guardar un Goal. |
| Transacciones | `src/model/Transaction.ts`: `kind`, `state`, moneda nativa/comercio/reporte, transferencia, categorías y tags | Hay que excluir transferencias, cambios de moneda y operaciones no completadas. No existe un merchant canónico ni vínculo explícito de refund con compra en este modelo. |
| Lectura monetaria | `src/lib/money/server/transactionReadService.ts` produce `displayMoney.primary`; si cambió moneda base, busca referencia histórica | Reutilizar el DTO, conservar fuente y fecha; no consultar tasas dentro de cada tarjeta. |
| Historial progresivo | `transacctionsSlice.ts`, `useFetchAndGetAllReduxInfo.ts`: primero meses recientes, después historial | Un análisis anual no está completo cuando termina únicamente la primera carga. |
| Ingresos | `src/model/IncomeSource.ts`: mensual, semimensual, cada 14 días, semanal y `anchorDate` | Se puede reutilizar la fuente. Falta un calendario explícito de dos días de pago para la semimensual. |
| Proyecciones | `getExpectedOccurrencesInMonth` en `projectionsChange.ts` distingue quincenal/catorcenal | Reutilizar conceptos y tests; contar pagos mensuales no equivale a saber sus próximas fechas exactas. No modificar este motor en el MVP. |
| Alertas | `packages/core/src/budgets/budgetAlerts.ts`: umbrales, celebración; `useBudgetAlertList.ts` web; hook móvil equivalente | Son avisos in-app calculados en el dispositivo, no un scheduler push. Lecturas/fechas de avisos son locales. |
| Diferencia de alertas | Web solo cuenta cuentas de ahorro en moneda primaria en `useBudgetAlertList.ts`; móvil usa `totalInPrimary` | Unificar cálculo de progreso antes de reutilizar alertas para objetivos multimoneda. No copiar esta divergencia. |
| Componentes | `BudgetEditModal`, `BasicModal`, `TimeRange`, `IconDisplayerMenu`, `CategoryColorPicker`, `UniversalCategoIcon` | Reutilizar estilos, selectores, iconos, calendario y modal reales. No otro sistema visual. |
| Core y demo | Núcleo puro `packages/core`; Redux compartido; `/demo` reutiliza vistas con fixtures y `readOnly` | Misma matemática web/móvil/demo, adaptadores de datos distintos. Demo sin API financiera. |
| Seguridad | `getVerifiedSession`, Better Auth y verificación adicional; rutas de presupuesto resuelven usuario desde sesión | No confiar en user/wallet del body. Nuevos vínculos requieren verificar pertenencia, no solo el objetivo. |

### Hallazgos que condicionan esta funcionalidad

1. No hay una entidad Goal ni un motor de oportunidades existente que debamos sustituir. Los planes históricos mencionan componentes `GoalSavingsRange` y similares que ya no aparecen en los archivos actuales: no confundir esas referencias antiguas con una entidad Goal implementada.
2. Los proyectos suman en algunos consumidores `transaction.amount`, mientras otros usan `getPrimaryAmount`. Una futura vista enlazada debe usar importes homogéneos; no copiar ciegamente todos los sumatorios existentes.
3. Los budgets de ahorro actuales pueden compartir cuentas. Sumar todos esos budgets como riqueza total puede duplicar dinero. Esta funcionalidad debe detectar y resolver el solapamiento, no perpetuarlo.
4. No se encontró un modelo general de planes de viaje prospectivos implementado en los modelos inspeccionados. Las ideas anteriores del chat no equivalen a código desplegado. El plan de ahorro nuevo se define aquí; un plan de cotizaciones es otro alcance.

## 4. Experiencia propuesta

### 4.1 Navegación y descubrimiento

- En Presupuestos mantener tres grupos: **Gastos · Objetivos y ahorro · Proyectos**. No sustituir de golpe la navegación existente.
- En el botón central “+”, “Objetivo de ahorro” abre el formulario enriquecido. “Ahorro simple” sigue disponible dentro del mismo flujo, sin dos entradas equivalentes.
- Ruta dedicada `/dashboard/goals` para ver/comparar metas y `/dashboard/goals/[id]` para enlaces de notificaciones; reutilizan los mismos componentes del grupo de Presupuestos.
- “Oportunidades de crecimiento” vive como tarjeta resumida en Wallet Analyzer y Dashboard, con detalle en `/dashboard/opportunities`.
- Historial puede enlazar al mismo análisis con rango anual/trimestral seleccionado; no añadir otro cálculo ni un widget pesado a cada pantalla al iniciar.
- Entradas al crear un objetivo: desde “+”, desde un ahorro actual, desde un proyecto y desde una oportunidad. Todos llaman al mismo servicio/formulario.

### 4.2 Creación y edición de objetivo

Formulario progresivo, no una pared de inputs:

1. **Qué quieres conseguir:** plantilla o Personalizado, nombre, icono, color. No exigir descripción ni información sensible.
2. **Cuánto y cuándo:** moneda, meta, fecha opcional, cuánto llevas o qué cuentas dedicadas usar. Calendario/inputs reales de Gastify.
3. **Tu plan:** periodicidad, fuente de ingreso opcional, cantidad fija o cálculo necesario; prioridad y recordatorios opt-in.
4. **Relaciones opcionales:** categorías/subcategorías/tags para contexto, budgets de gasto que quieres ajustar y proyectos relacionados. Explicar qué hace cada vínculo.

Todo editable: nombre, icono, color, importe, fecha, prioridad, relaciones, periodicidad y avisos. Mostrar antes/después del ahorro necesario cuando cambia el plazo o la meta. Pausar, reanudar, archivar y marcar logrado son acciones separadas. Cambiar a modo de financiación por cuenta o manual exige confirmar la nueva base; nunca sumar ambos.

Si se eleva la meta de un objetivo completado, ofrecer reactivarlo al confirmar la edición; no mantener una felicitación contradictoria ni reactivar avisos sin consentimiento. El estado de propósito completado no se infiere solo del saldo.

Para cambiar la moneda, mostrar conversión/importe resultante para confirmar. No interpretar `60000 MXN` como `60000 USD`, ni reescribir la historia. No permitir cambio de tipo `saving → spending/project` mientras tenga `goalDetails` sin un flujo explícito de desvinculación y conservación de datos.

### 4.3 Plantillas

| Plantilla | Datos particulares | Meta real |
| --- | --- | --- |
| Coche | Precio estimado; ahorrar todo o enganche; enganche en porcentaje o importe | Solo la cantidad a reunir, no necesariamente el precio total. No calcular ni prometer aprobación de crédito. |
| Casa | Mismo modo total/enganche; gastos adicionales opcionales que el usuario declara | Suma confirmada; no asumir impuestos, notaría ni condiciones hipotecarias. |
| Viaje | Nombre/destino opcional y proyecto existente o futuro | Presupuesto de ahorro indicado; ninguna cotización de vuelo/hotel inventada. |
| Negocio | Importe inicial y fecha | Capital que el usuario quiere reunir, no valoración/rentabilidad del negocio. |
| Salud | Nombre neutro, importe y fecha opcional | Meta libre, sin diagnóstico ni sugerencias de recortar gasto médico. |
| Emergencias | Importe manual; después, asistente opcional de meses de gasto esencial confirmado | No clasificar automáticamente todos los gastos como esenciales. |
| Personalizado | Nombre y meta monetaria | Cualquier finalidad financiera; hábitos no monetarios quedan fuera del MVP. |

### 4.4 Tarjeta y detalle del objetivo

Mostrar icono/color, meta, ahorro disponible, faltante, fecha y próxima aportación propuesta. Dos capas visuales claramente distintas:

- **Progreso actual:** sólido; origen “importe declarado” o “saldo de cuentas vinculadas”, con fecha de valoración.
- **Escenario:** tramo punteado/translúcido y rótulo “simulado”; solo aparece al explorar una oportunidad y no altera el porcentaje actual.

Una cuenta vinculada es una referencia contable de Gastify, **no una reserva bancaria** ni una transferencia automática. El dinero podría estar desactualizado si el usuario no registró sus movimientos. “Meta financiada” es distinto de “ya compraste el coche”; la finalización del propósito se confirma aparte.

No felicitar por alcanzar 100% si faltan tipos de cambio, existe financiación compartida sin resolver o el dato es parcial. Sobreahorro se muestra aparte; no ocultarlo detrás de una barra que se limita visualmente al 100%.

## 5. Oportunidades: del gasto registrado a una acción elegida

### 5.1 Pipeline y datos de entrada

1. Seleccionar rango: mes, trimestre, año hasta hoy, año cerrado o rango personalizado; mostrar fechas exactas y zona horaria.
2. Confirmar que el dataset solicitado terminó de cargar. Diferenciar **historial cargado** de **historial completo de la vida financiera**: solo conocemos lo registrado en Gastify.
3. Tomar transacciones completadas de gasto; desglosar comisiones aparte. Excluir ingresos, transferencias, FX, fallidas, revertidas y pendientes. Legacy sin `state` se trata según compatibilidad existente y se identifica como heredado.
4. Unificar cada importe en una moneda de análisis con `displayMoney.primary` y adaptadores compartidos; conservar fuente, fecha, estimación y valores nativos.
5. Agrupar por categoría, subcategoría, tag o concepto/comercio sugerido. Una búsqueda de OXXO se etiqueta como **conceptos que coinciden**, no como un merchant verificado.
6. Deducir agrupaciones por reglas deterministas e inspeccionables, no por LLM en el MVP. El usuario confirma/revisa la selección antes de convertirla en plan.
7. Crear un conjunto de IDs único para la selección combinada. Si una compra coincide con categoría + tag + comercio, solo suma una vez.
8. Aplicar porcentaje de redirección elegido; generar alternativas usando exactamente ese mismo principal.

Filtros, modo de coincidencia y exclusiones deben verse en “Cómo lo calculamos”. Las condiciones entre dimensiones son AND; dentro de cada lista son OR. Para combinar varias agrupaciones de oportunidad, usar unión de IDs sin duplicados. No llamar “gasto en cigarros” a todas las compras de una tienda; solo si la clasificación o selección del usuario lo respalda.

### 5.2 Reembolsos y calidad

- `Transaction` tiene `kind: refund`, pero no un identificador de compra reembolsada. No restar cualquier ingreso o refund de una compra por mera similitud de nombre.
- MVP: mostrar gasto bruto y reembolsos clasificados en el mismo conjunto/rango por separado. El neto solo se calcula con una asignación confirmada; esa selección puede ser temporal de la simulación.
- Si hay refunds relevantes no conciliados, señalar el máximo bruto y bloquear el mensaje categórico “pudiste ahorrar X netos”. No ocultar el problema dentro de un tooltip.
- Reembolso posterior al periodo se informa como ajuste conocido a la fecha de análisis; no simular que estuvo disponible antes. Una reconstrucción histórica exacta exige fechas y atribución.
- No incluir movimientos sin fecha válida en un rendimiento por fechas. No adivinar FX; mostrar cantidad excluida por moneda y análisis parcial. Duplicados con distinto ID requieren revisión del usuario/importador, no eliminación silenciosa por igual monto/fecha.

### 5.3 Tres alternativas por defecto

1. **Inversión ilustrativa:** simulador configurable de plazo/tasa; sin banco específico ni “mejor inversión” en el MVP.
2. **Viaje:** objetivo de ejemplo con un importe explícitamente ficticio y editable, no “ese viaje hoy cuesta X”. Se puede convertir en objetivo personal.
3. **Enganche u otra meta:** ejemplo editable de precio y porcentaje, o fondo de emergencia si el usuario elige esa alternativa.

Si tiene objetivos, priorizar hasta tres activos por prioridad explícita, plazo y selección del usuario. Con uno o dos, completar con ejemplos genéricos rotulados. No usar objetivos archivados/pausados/logrados salvo petición. Cada tarjeta es **una alternativa al mismo dinero**, no tres usos simultáneos. No inventar el coste de vacaciones, coches o casas por país/IP.

El sistema puede ofrecer 25/50/100% y un control personalizado. Arrancar con 25% como ejemplo de interfaz, **no recomendación de ahorro universal**. “Explorar el 100%” requiere elección; el usuario puede bajar a 0%. Ningún gasto se denomina desperdicio.

### 5.4 Ejemplo completo reproducible

Datos ficticios: gasto seleccionado MXN 53,000, objetivo coche de MXN 300,000, enganche elegido 20% = MXN 60,000; ahorro actual MXN 10,000.

| Escenario | Principal hipotético | Ahorro actual + escenario | Faltante simulado |
| --- | ---: | ---: | ---: |
| Sin cambio | 0 | 10,000 | 50,000 |
| Redirigir 25% | 13,250 | 23,250 | 36,750 |
| Redirigir 100% | 53,000 | 63,000 | 0, con excedente 3,000 |

Texto recomendado: “En tus registros del periodo, esta selección suma $53,000. Una cantidad equivalente al 25% sería $13,250: cubriría el 22.1% de tu meta de enganche. Explora qué parte te resultaría posible cambiar.”

No decir que hoy tiene esos $13,250 adicionales. Para el 100%: “Una cantidad equivalente habría cubierto los $50,000 que te faltan hoy; es una comparación con tu situación actual, no una reconstrucción del saldo pasado.”

CTA: **Ver movimientos → Ajustar escenario → Usar para mi plan**. Este último abre una propuesta revisable; no mueve dinero, no crea ingresos, no recategoriza gastos ni reduce budgets sin confirmar.

## 6. Reglas matemáticas

### 6.1 Objetivo y plan de ahorro

En moneda del objetivo, usando enteros en unidades menores y `decimal.js` ya instalado:

```text
faltante = max(meta - ahorroDisponible, 0)
aportacionNecesaria = ceil(faltante / numeroDePagosPendientes)  // unidades menores
```

Repartir redondeo en la última aportación para no exigir más por artefacto aritmético. Si faltan MXN 50,000 y hay diez pagos, son MXN 5,000 por pago **sin suponer rendimientos**.

- Sin fecha: el usuario elige aportación y se estima fecha, o mantiene una meta sin plan. No fabricar un plazo.
- Plazo vencido / cero pagos: mostrar “revisar fecha o aportación”; no dividir por cero.
- Cambiar la fecha solo recalcula pagos futuros, no edita historia.
- Meta cero/negativa: inválida. Ahorro negativo heredado: mostrar advertencia y saldo disponible mínimo cero; no ocultar la deuda original.
- Progreso de varias metas: no sumar dinero compartido ni llamar al resultado patrimonio.
- No estimar que “puedes ahorrar” X solo porque ingresos menos gastos de los registros den X. Mostrar saldo observado, cobertura e ingresos declarados; puede haber obligaciones no registradas.
- Si los planes suman más que la cantidad mensual que el usuario declara disponible, avisar y permitir revisar prioridades. No aprobar planes individualmente como si cada uno fuera el único.

### 6.2 Frecuencias y recordatorios

- `monthly`: día elegido; regla explícita para meses sin ese día (último día).
- `semimonthly`: dos días, p. ej. 15 y último día; **24 pagos/año** en calendario completo.
- `biweekly`: cada 14 días desde fecha ancla; el número exacto se enumera dentro del plazo, no siempre dos/mes.
- `weekly`: cada siete días desde ancla.
- Fechas de usuario como día civil y zona horaria IANA. No sumar bloques fijos de 24 h a través de cambios horarios.
- Fuente de ingreso enlazada ayuda a proponer la frecuencia; se confirman días. La función existente de contar ocurrencias por mes no resuelve este calendario por sí sola.
- La meta tiene su propio plan. Modificar un `IncomeSource` ofrece actualizar planes vinculados, pero no altera fechas comprometidas sin mostrar el cambio.

### 6.3 Inversión: separar retrospectiva y futuro

**A. Desde hoy:** “Si dispusieras hoy de P y lo mantuvieras T años con una tasa anual efectiva hipotética r…”. `valor = P × (1+r)^T`; `rendimiento = valor - P`.

Ejemplo puramente matemático: P = MXN 53,000, T = 1, r = 6% anual efectiva → MXN 56,180; rendimiento bruto MXN 3,180. **6% no es una tasa consultada ni una promesa de producto.** Con P = 13,250 serían MXN 14,045 y MXN 795, bajo el mismo supuesto.

**B. Contrafactual histórico:** “Si cada gasto seleccionado se hubiera apartado en su fecha”. `valor(D) = Σ principal_i × (1+r)^(diasCiviles(fecha_i,D)/365)`; resultado bruto menos suma de principal. Usar r anual efectiva, base ACT/365F declarada. No aplicar un año de intereses al dinero gastado ayer.

Un porcentaje fijo asumido no reconstruye el rendimiento histórico real de CETES, acciones o un banco. Para afirmar “en tal institución habrías obtenido…” hacen falta series fechadas, condiciones de contratación, plazos/reinversión, comisiones, impuestos y elegibilidad; fuera del MVP. Nunca usar una tasa actual como tasa histórica de todo el año.

La UI muestra principal, rendimientos, plazo, tasa y tipo de tasa, capitalización/modelo, fuente/fecha o “supuesto editable”, y “antes de impuestos/comisiones; sin ajuste por inflación”. Permitir 0% y escenarios negativos válidos (r > -1) para no presentar ganancias como inevitables. Los planes de meta se calculan a 0% por defecto; simular inversión no aumenta su saldo real.

## 7. Datos: ampliación aditiva de Budget

### 7.1 Esquema implementado en la rama

```ts
type GoalDetails = {
  schemaVersion: 1;
  template: "custom" | "car" | "home" | "travel" | "business" | "health" | "emergency";
  status: "active" | "paused" | "completed";
  targetDate: string | null;               // YYYY-MM-DD
  timeZone: string;                       // IANA, seleccionada/confirmada
  priority: number;                       // orden elegido, no inferido por IA
  purposeCompletedAt: string | null;      // confirmación del usuario
  targetMode: "full" | "down_payment";
  assetPriceMoney?: { amountMinor: number; currency: string };
  downPaymentInput?: { mode: "percent"; basisPoints: number } | { mode: "amount" };
  context: {
    categoryIds: string[];
    subCategoryIds: string[];
    tagIds: string[];
    spendingBudgetIds: string[];
    projectBudgetIds: string[];
  };
  schedule: null | {
    mode: "required_by_date" | "fixed_contribution";
    frequency: "monthly" | "semimonthly" | "biweekly" | "weekly";
    anchorDate: string;
    monthDays?: (number | "last")[];
    incomeSourceId: string | null;
    fixedContributionMoney?: { amountMinor: number; currency: string };
  };
  reminders: { enabled: boolean; daysBefore: number; localTime: string };
  manualSavedAsOf?: string;               // última confirmación, no saldo bancario verificado
};

// Campos opcionales añadidos en IBudget y budgetSchema:
// color?: string;                        // formato/paleta validada
// goalDetails?: GoalDetails;             // exclusivamente en saving
// revision?: number;                     // control optimista para edición concurrente
```

`name`, `icon`, `currency`, `goalAmount`, `savingAmount`, `goalMoney`, `savingMoney`, `linkedAccounts`, `history`, `archived`, `user` y `wallet` permanecen en Budget. **No meter otros `target` o `saved` dentro de `goalDetails`.**

El precio del coche y el enganche no son dos metas: `assetPriceMoney` describe el bien; `goalAmount/goalMoney` representan la meta confirmada. Si el porcentaje está activo, el servidor calcula la meta desde precio × porcentaje. Al editar la meta directamente, pasa a modo importe; no conservar una fórmula porcentual contradictoria.

Los importes legacy siguen disponibles para consumidores vigentes. Un servicio compartido normaliza escrituras duales: `goalMoney/savingMoney` se corresponden con los major amounts en la **moneda nativa del budget**, con redondeo validado. En lectura, preferir dinero estructurado cuando sea coherente; detectar discrepancias y no elegir valores arbitrariamente. La normalización es aditiva y acotada, no una reescritura global de la migración multimoneda.

`goalDetails.context` es el origen de las relaciones. No escribir además listas inversas en cada tag/categoría/proyecto. Vínculos con ahorro/gasto son semánticamente distintos: contexto no equivale a una aportación ni asigna transacciones. “Planes” significa aquí `schedule`; vincular planes de viaje futuros requiere otra especificación.

### 7.2 Financiación y no duplicar saldos

**Modo manual:** `savingAmount/savingMoney` es el ahorro total declarado a fecha, no una transacción ni una lista de depósitos. “Actualizar lo ahorrado” cambia ese dato con historial; no registrar automáticamente un ingreso. No ofrecer un botón ambiguo “depositar” mientras no haya un ledger real.

**Modo cuentas dedicadas:** `linkedAccounts` reemplaza el importe manual como fuente efectiva. Solo cuentas de activo compatibles, no límite disponible de tarjetas/crédito. Mostrar saldo, moneda y equivalencia; recálculo cuando hay movimientos o nueva valoración FX. No usar crecimiento de saldo como prueba de aportación: puede ser interés, FX, ingreso o corrección.

Para impedir que una misma cuenta financie dos ahorros activos, se añadió la colección auxiliar **`GoalFundingClaim`**:

```ts
{ user, wallet, account, savingBudget, createdAt }
// índice UNIQUE { wallet: 1, account: 1 }
// índice { wallet: 1, savingBudget: 1 }
```

Es una restricción de asignación interna, no un ledger ni una reserva de fondos bancaria. El índice único evita que dos peticiones simultáneas reclamen el mismo saldo; las rutas crean claims antes de guardar y hacen limpieza compensatoria si falla el guardado. No se usa una transacción Mongo multi-documento en esta entrega: ante una falla de limpieza puede quedar un claim sobrante que bloquea temporalmente un vínculo, pero no permite contar la misma cuenta en dos metas. Investigar transacciones del cluster antes de reemplazar esta estrategia.

- Un objetivo pausado conserva claims mientras muestre ese ahorro como suyo. Archivar libera claims; reactivar vuelve a validar. Completar conserva la asignación hasta retirarla/archivarla explícitamente.
- Revisar también los savings legacy que usan esa cuenta: no modificarlos automáticamente. Mostrar el solapamiento y pedir que el usuario mantenga un único vínculo o use modo manual; no presentar totales consolidados mientras haya conflictos.
- Todas las rutas de edición de savings, incluso formulario anterior/cliente móvil, deben pasar por la validación común. Los savings simples que añadan/cambien cuentas también adquirirán claims con su Budget ID en `savingBudget`; así no pueden competir en paralelo con un objetivo sin tocar la restricción única. Los solapamientos legacy se detectan antes de habilitar la exclusividad; no existe migración automática que elija un ganador. Cuenta borrada/archivada invalida fuente y señaliza dato pendiente; no sustituir por cero y celebrar/recalcular en silencio.
- Fase futura: repartir un saldo entre varios objetivos mediante asignaciones parciales con restricciones de suma. No habilitar porcentajes parciales hasta tener ese ledger y sus pruebas.

### 7.3 Historial, preferencias y avisos

- Extender las entradas de `Budget.history` de forma opcional para snapshot de moneda, meta y `goalDetails` relevantes al cambiar fecha/meta/frecuencia/estado. No guardar catálogos completos ni textos duplicados de categorías. `revision` cambia en toda edición aunque no cambie el importe.
- La falta de snapshots antiguos significa “sin historial de objetivo anterior a la activación”, no cero.
- No se persistieron preferencias de oportunidades (`enabled`, agrupaciones ocultas o porcentaje preferido) en `User`; los controles actuales son estado de la pantalla. Agregar preferencias sincronizadas es una decisión posterior, no una función del MVP.
- Recordatorios inicialmente derivados in-app, con estado leído/pospuesto local aislado por usuario+wallet+goal+fecha+versión. Si se requiere lectura sincronizada entre dispositivos, incorporar almacenamiento servidor dedicado después; no prometerlo con `localStorage`.
- No persistir oportunidades calculadas como documentos durante MVP: regenerar desde datos actuales. Para guardar un escenario futuro, almacenar filtros/supuestos/versiones, no tratar el resultado como saldo.

## 8. Arquitectura y contratos

### 8.1 Reparto de responsabilidades

```text
Transacciones / Budgets / Cuentas / IncomeSource existentes
                       ↓ adaptadores monetarios y cobertura
              @gastify/core (sin React, DOM ni red)
              ├─ objetivos: progreso, calendario y plan
              ├─ oportunidades: grupos, escenarios y explicación
              └─ avisos: regla pura y clave estable
                       ↓
          Web       Mobile       Demo con fixtures
```

- Conservar Next Route Handlers + MongoDB y el núcleo TS compartido; no agregar microservicios, colas, LLM, base analítica o proveedor de inversiones para empezar.
- Formularios y DTOs validados por esquema común. Backend autoriza y persiste; core calcula; React presenta. Ningún cálculo financiero crítico queda duplicado en componentes.
- Cargar componentes de detalle bajo demanda; cálculos memoizados por versión/dataset/rango. No añadir dependencias de gráficos; usar las existentes.
- Incorporar datos de objetivo a `budgetReducer` existente, no otro store de metas que se desincronice. `resetStore` debe seguir limpiándolo al cambiar usuario.
- Oportunidades MVP se calculan en el cliente con datos ya autorizados, solo al abrirlas/estar listo el resumen. **No necesitan otro GET para copiar todo el historial**.
- Si la cantidad real de datos requiere agregación servidor, será una fase medida: mismo core/contrato, API autenticada por rango, índices y cursor, sin prometer latencias no medidas.

### 8.2 API implementada

| Ruta existente | Cambio realizado |
| --- | --- |
| `POST /api/general-data/budget/new` | Acepta `goalDetails`/color en ahorros; valida esquema, fechas, moneda/importes estructurados, referencias y exclusividad de fuente. |
| `POST /api/general-data/budget/update` | Edición parcial, revisión optimista (`expectedRevision`), snapshots de historial, validación de moneda/montos, claims y preservación de campos omitidos. |
| `POST /api/general-data/budget/remove` | Conserva el comportamiento vigente de borrado lógico/archivo y libera claims. No borra movimientos o proyectos relacionados. |
| `POST /api/general-data/budget/get` | Sigue retornando el Budget ampliado de forma compatible; no se creó una ruta paralela de metas. |
| `POST /api/general-data/budget/get-historical` | Los snapshots nuevos de meta/moneda se guardan aditivamente en `Budget.history`; no hay un analizador de historial de cambios de objetivo en la UI. |

Los métodos/rutas de lectura se mantienen según implementación real; verificar exportaciones antes de editar. Para reactivar no inventar una ruta existente: ampliar explícitamente update con acción validada y claims. Crear “objetivo + proyecto nuevo” es un flujo opcional posterior; enlazar un proyecto existente primero. Si se implementa creación conjunta, transacción o recuperación idempotente, nunca duplicar al reintentar.

Requisitos transversales implementados o límites que deben conservarse:

- `getVerifiedSession`, usuario resuelto desde sesión y consultas por user+wallet. Validar también cuentas, tags, categorías, subcategorías, IncomeSource y budgets relacionados (incluyendo catálogo default legítimo).
- Parsear realmente con Zod; un tipo TypeScript o schema declarado sin `.parse/.safeParse` no valida entrada.
- Allowlist de campos, límites de longitud/listas, ObjectId válido, números finitos/enteros seguros, moneda permitida, fecha/horario válidos, rango de porcentajes y hex seguro. No permitir filtros Mongo ni regex arbitraria del cliente.
- Respuestas 401/403, 404, 409 de revisión/recurso compartido y 422 de validación coherentes; mensajes i18n; sin volcar nombres de objetivos sensibles ni documentos enteros a consola.
- Vínculos de cuenta usan índice único y compensación de claims (descrito en §7.2); las escrituras de Budget y Claim aún no son atómicas multi-documento. No afirmar que un proceso queda protegido por transacción Mongo.
- `Cache-Control: private, no-store` para respuestas financieras autenticadas; nunca cache global de un resultado de usuario.
- Archivar una categoría/tag/proyecto mantiene referencia visible como no disponible; no borra el objetivo. Aislar errores y permitir desvincular.

## 9. Notificaciones: promesa honesta y fases

### Primera entrega: dentro de la aplicación

- Próxima fecha de ahorro: “Tu plan propone apartar $X el día Y para [objetivo]”.
- Fecha vencida: “¿Quieres revisar lo que llevas ahorrado?”; no acusar que no aportó, porque saldo manual no demuestra aportaciones individuales.
- Hitos de progreso y fecha próxima, respetando pausa, opt-out y datos completos.
- Abrir aviso lleva al objetivo real; marcar leído/posponer no modifica dinero.
- Máximo un recordatorio pendiente por objetivo/fecha y un resumen agrupado cuando coinciden varias metas; no generar veinte avisos retroactivos al volver después de meses.
- Dedupe con `wallet:goal:tipo:fecha:versionPlan`. Para celebración de un hito, mantener historial de hito y reglas de reactivación para no repetir por cambiar tasa/idioma. Tratar revisión de FX aparte de aportación.

### Posterior, con pruebas y autorización de infraestructura

- Al detectar ingresos: primero fuentes declaradas y confirmación, después sugerencias basadas en periodicidad. Una devolución/transferencia no es nómina. No inferir empleo o calendario fiable de un solo ingreso.
- Entrega con app cerrada requiere scheduler/backend, push tokens/permisos, idempotencia, zona horaria, baja y borrado de tokens, reintentos y privacidad en pantalla bloqueada. No existe por reutilizar la campana.
- WhatsApp/Telegram, correo promocional, transferencias automáticas y conexión bancaria quedan fuera. La planificación no cambia esa decisión anterior del usuario.

## 10. Inventario de implementación

Rutas relativas al checkout de esta rama. La implementación concreta y sus límites se resumen en §16; el inventario describe las áreas involucradas, no una promesa de que cada archivo de la propuesta original se haya editado.

### Núcleo y persistencia

| Archivo | Trabajo |
| --- | --- |
| `src/model/Budget.ts` | `goalDetails`, color, revisión e historial opcional; conservar tipos actuales. |
| `src/model/GoalFundingClaim.ts` — nuevo, fase cuentas | Índices únicos y claims de cuentas dedicadas. |
| `src/model/User.ts` | Considerado para preferencias mínimas; **no modificado** en el MVP. Preservar onboarding de Claude al integrar. |
| `src/app/api/general-data/user/{get-user,update-user,remove-user}/route.ts`, `src/lib/auth/publicUser.ts` | Guardar/leer preferencias por allowlist; borrar claims al borrar al titular, sin exponer campos privados adicionales. |
| `src/lib/goals/goalService.ts` — nuevo | CRUD normalizado, ownership, historial, revisión y claims; punto único de escritura. |
| `src/lib/goals/fundingClaims.ts` — nuevo | Operaciones atómicas y validación de conflictos legacy. |
| `packages/core/src/goals/types.ts` — nuevo | DTOs, estados de calidad y goalDetails; no tipos de Mongoose en core. |
| `packages/core/src/goals/goalForm.ts` — nuevo | Validación/cálculo de plantillas y payload compartido. |
| `packages/core/src/goals/progress.ts` — nuevo | Fuente manual/cuentas exclusiva, faltante, estados parcial/compartido. |
| `packages/core/src/goals/schedule.ts` — nuevo | Calendario, cantidad necesaria, fecha estimada y redondeo. |
| `packages/core/src/goals/reminders.ts` — nuevo | Reglas in-app, dedupe y elegibilidad. |
| `packages/core/src/opportunities/eligibility.ts` — nuevo | Estados, clases de transacción y calidad. |
| `packages/core/src/opportunities/grouping.ts` — nuevo | Filtros, normalización y unión sin duplicados. |
| `packages/core/src/opportunities/scenarios.ts` — nuevo | Redirección, objetivo, alternativas y explicaciones. |
| `packages/core/src/opportunities/investment.ts` — nuevo | Principal vs rendimiento, futuro/fechas y supuestos. |
| `packages/core/src/budgets/budgetForm.ts` | Ampliar sin cambiar forma de spending/project; preservar detalles desconocidos al editar desde móvil. |
| `packages/core/src/features/budgetSlice.ts` | Tipos/DTO y acciones compatibles; no segundo goal reducer. |
| `packages/core/src/transformers/budgetCurrency.ts` | Valorar campos nuevos sin convertir dos veces ni reinterpretar moneda. |
| `src/app/api/general-data/budget/{new,update,remove,get,get-historical}/route.ts` | Integrar servicio/DTO, validación, autorización, revisiones. |

Auditar escritores adicionales de Budget y edición/eliminación de Account antes de claims. `src/lib/mcp/buildGastifyMcpServer.ts` expone contexto de budgets: ajustar serialización si procede; **no añadir comandos de escritura para Goals ni compartir etiquetas sensibles con IA automáticamente**.

### Web y datos

| Archivo | Trabajo |
| --- | --- |
| `src/components/multiUsedComp/Budgets/BudgetsClient.tsx` | Grupo Objetivos y ahorro; adaptación de legacy y enlaces. |
| `src/components/multiUsedComp/Budgets/BudgetEditModal.tsx` | Reutilizar shell/inputs; incorporar modo objetivo sin otro wizard duplicado. |
| `src/components/multiUsedComp/Budgets/BudgetBarRow.tsx` | Meta/progreso consistente; no sumar escenario a valor actual. |
| `src/components/multiUsedComp/Budgets/BudgetDetailModal.tsx` | Derivar vista de ahorro enriquecida manteniendo detalle legacy. |
| `src/components/multiUsedComp/Budgets/ProjectBudgetDetailModal.tsx` | Enlace al objetivo; gasto y financiación separados. |
| `src/components/goals/{GoalsView,GoalDetails,GoalPlanFields,GoalProgress}.tsx` — nuevos | Composición con componentes existentes, no nuevo sistema visual. |
| `src/components/opportunities/{OpportunityCard,OpportunitiesView,OpportunityDetails,ScenarioComparison}.tsx` — nuevos | Dataset y cálculos inyectados; estados vacíos/parciales; detalle trazable. |
| `src/app/dashboard/goals/page.tsx`, `goals/[id]/page.tsx`, `opportunities/page.tsx` — nuevos | Rutas protegidas, catálogos cargados según pantalla y errores recuperables. |
| `src/components/Navbar.tsx` | Entradas de navegación/creación sin modificar posición o forma del botón central. |
| `src/components/Dashboard.tsx` | Resumen liviano, lazy detalle; no bloquear primera carga por un año de datos. |
| `src/components/multiUsedComp/walletAnalyzer/WalletAnalyzerView.tsx` | Resumen del periodo y enlace al análisis. |
| `src/components/multiUsedComp/HistoricalWalletAnalyzer/HistoricalWalletAnalyzer.tsx` | Contexto histórico; reutilizar componentes, no motor paralelo. |
| `src/helpers/hooks/useLinkedAccountsTotal.ts` | Añadir calidad de conversión/total parcial, mantener callers existentes. |
| `src/hooks/money/useBudgetsInPrimaryCurrency.ts` | Adaptar nuevos campos monetarios; respetar conversionUnavailable. |
| `src/hooks/useBudgetAlertList.ts` | Usar progreso compartido y combinar recordatorios, sin dobles avisos saving/goal. |
| `src/components/multiUsedComp/NotificationsBell.tsx` | Destinos, leído/pospuesto y agrupación. |
| `src/hooks/getAllInfo/useFetchAndGetAllReduxInfo.ts` | Preferir no agregar fetching; consumir estado de cobertura existente. |
| `packages/core/src/i18n/catalogs.ts` y `messages/{es,en}/{goals,opportunities}.ts` | Catálogos nuevos, carga lazy y paridad; preservar catálogo `tour` de otra rama. |

Componentes a **reutilizar sin reescribir**: `BasicModal`, `TimeRange`, `IconDisplayerMenu`, `CategoryColorPicker`, `UniversalCategoIcon`, selectores reales de categorías/tags/cuentas y listas de movimientos. Mantener tokens `gf-*`, modo claro/oscuro, formatos de moneda, accesibilidad, búsqueda de iconos y modales móviles. Mensajes sin claves i18n sin resolver.

### Móvil y demo

- Móvil: el formulario, detalle/índice de budgets y alertas se ampliaron; se añadieron `/budgets/goals` y `/budgets/opportunities` usando el core compartido, no JSX web. Ver el inventario real en §16. Antes de integrar/retrabajar Expo, leer `apps/mobile/AGENTS.md` y la documentación de la versión instalada.
- Demo: `src/lib/demo/demoData.ts`, `demoSelectors.ts`, `src/app/demo/DemoWorkspace.tsx`, `DemoAppProviders.tsx`, `src/components/demo/{DemoCreateModal,DemoFeatureGuide,DemoNavigation}.tsx`. Fixtures de coche/Japón y gasto ficticio explicable; mismas vistas con adaptador read-only.
- Tests de `src/lib/demo/networkFence.test.ts` deben comprobar cero peticiones de escritura/FX/objetivos; el simulador es cálculo local. No conectar formularios reales a mutaciones desde la demo.
- Home sigue sin descargar el motor/gráficas de esta demo hasta entrar; preservar `prefetch={false}` y fronteras de carga.

## 11. Fases y criterios de salida

| Fase | Estado en la rama al 2026-10-28 | Verificación/pendiente |
| --- | --- | --- |
| 0 — diseño | Completada | Decisiones y auditoría quedan documentadas arriba. |
| 1 — fundamento de objetivos | Implementada localmente | Core compartido, Savings enriquecido, plantillas, edición, pausa/logro/archivo, calendario, snapshots y revisión optimista. QA visual y tests API exhaustivos pendientes. |
| 2 — cuentas y relaciones | Implementada localmente | Fuentes manuales o cuentas elegibles, solapamientos, FX parcial visible y contexto categorías/tags/budgets/proyectos; enlace no crea gastos. Claims compensatorios, no transacción multi-documento. |
| 3 — oportunidades | Implementada localmente | Filtros/rangos, reembolsos/comisiones/FX parcial visibles, tres escenarios e inversión hipotética; historial incompleto se advierte y refunds no se concilian automáticamente. |
| 4 — integración y avisos | Implementada localmente | Dashboard/Analyzer/Historial, recordatorio in-app y deep link; sin push ni aviso fiable al detectar nómina/transacción. |
| 5 — móvil y demo | Implementada localmente | Rutas nativas y pantallas demo ilustrativas sin mutaciones; falta prueba manual en iOS/Android y revisión de red por el usuario. |
| 6 — revisión y release | Pendiente de feedback | Typecheck, pruebas y lint descritos en §16; no build por reglas del repo; sin commit/push/merge/deploy hasta revisión y autorización. |

MVP publicable recomendado: fases 1–5, con alcance de recordatorios solo in-app e inversión solo ilustrativa. Se pueden revisar fases individualmente en desarrollo, pero no anunciar como existente lo pendiente. No dar fecha de entrega sin medir el trabajo.

Futuro independiente: push remoto, detección automática de nómina, ledger de aportaciones/asignaciones parciales, cotizaciones reales de viajes/inversiones, planes prospectivos y simulación integrada con Projections. No modificar proyecciones financieras actuales para que una asignación de ahorro figure como gasto: una transferencia entre cuentas propias no reduce patrimonio ni es consumo.

## 12. Pruebas y aceptación

### Núcleo y dinero

- [ ] Savings legacy sin goalDetails se interpreta igual; `isSaving` heredado conserva prioridad.
- [ ] Coche 300,000, enganche 20%, meta 60,000; cambiar porcentaje/importe no deja dos metas contradictorias.
- [ ] Meta 60,000, saldo 10,000, diez pagos → 5,000 por pago; fechas vencidas/sin fecha/sin pagos y redondeo.
- [ ] Quincenal vs cada 14 días; 29–31, febrero, año bisiesto, cambio de zona y verano.
- [ ] Cuentas y ahorro manual no se suman; claims concurrentes; cambios de fuente y archivo/reactivación.
- [ ] USD/MXN/EUR/JPY, moneda base cambiada, tasa ausente/desactualizada, JPY sin centavos y enteros fuera de rango.
- [ ] Pending/failed/reverted/transfer/exchange excluidos; fees separados; refund sin atribución no genera neto ficticio.
- [ ] Categoría+tag+comercio cuenta cada transacción una vez; agrupación no dice que OXXO sea tabaco.
- [ ] Historial parcial/no cargado/error y registros sin fecha: estado visible, no totales anuales definitivos.
- [ ] 53,000 × 25% = 13,250; faltante con 10,000 existentes = 36,750; mismo principal en tres alternativas.
- [ ] 53,000 al supuesto 6% efectivo un año → 56,180, ganancia 3,180; tasa 0/negativa válida y flujos de distinto día.
- [ ] No aplicar interés anual completo al gasto de fin de periodo; principal nunca se rotula rendimiento.

### API, estados y privacidad

- [ ] Usuario A no lee/edita/vincula cuenta/tag/budget/goal de B aunque mande IDs válidos.
- [ ] Cliente antiguo que omite goalDetails no lo borra; cambio incompatible de tipo/moneda requiere confirmación.
- [ ] Revisión obsoleta devuelve 409; altas reintentadas no duplican; fallo multiparte revierte claims/documento juntos.
- [ ] Archivo de un objetivo no elimina gastos ni proyectos; borrar fuente deja advertencia, no progreso inventado.
- [ ] No se envían conceptos, salud, importes ni objetivos a analytics/LLMs/logs. Borrado/exportación de datos contempla nuevos campos/claims; auditar flujos existentes antes de release.
- [ ] Cambiar de usuario limpia store/caché/avisos; no aparecen nombres de objetivos anteriores.
- [ ] Meta sensible tiene recordatorios neutros por defecto; opt-in/desactivación y exclusiones de oportunidades respetadas.

### UI y regresiones

- [ ] Crear/editar desde “+”, ahorro existente, proyecto y oportunidad usa el mismo formulario y guarda una vez.
- [ ] Iconos/colores/calendario son los reales; sin overflows/controles tapados; teclado/foco/aria/reduced motion.
- [ ] Progreso actual y simulación distinguibles sin depender solo de color; errores accesibles.
- [ ] ES y EN completos, modos claro/oscuro, escritorio y móvil; deeplinks de avisos válidos.
- [ ] App web y móvil arrojan la misma meta/fechas/dinero con los mismos fixtures.
- [ ] Regresión Budgets/Projects/Projections/History, demo por navegación y recarga directa; no replicar fallos conocidos de fechas del tutorial pendiente.
- [ ] Demo sin escrituras; Home no precarga nuevos chunks pesados; medir datos 1k/10k/50k movimientos en dispositivo de referencia y documentar tiempo/carga antes de fijar presupuesto de rendimiento.
- [ ] Typecheck, lint y pruebas focalizadas/completas correspondientes pasan. Build solo con autorización. Documentar resultado real, no asumirlo.

## 13. Alcance de privacidad y lenguaje

- Datos usados solo para ayudar al titular dentro de su wallet. Sin publicidad segmentada, venta de perfiles, score crediticio ni aprobación de préstamos.
- Clasificaciones sensibles no se deducen de comercios. Excluir por defecto de sugerencias automáticas categorías que el usuario haya marcado como esenciales/sensibles; ofrecer controles sin pretender conocer todas por el nombre.
- Objetivos de salud pueden nombrarse libremente sin exigir detalles médicos. Los avisos pueden decir “Tienes un recordatorio de un objetivo” y revelar detalle al abrir.
- Evitar “desperdiciaste”, “deberías haber”, “ya tendrías garantizado”. Preferir “registraste”, “una cantidad equivalente”, “si decidieras”, “bajo este supuesto”.
- La calculadora es educación/comparación, no recomendación individual de producto financiero. Antes de intermediación real, cotizaciones comercializadas o campañas externas, revisar requisitos profesionales y legales vigentes; este documento no resuelve esa revisión.

## 14. Fuentes y límites de la investigación

### Fuentes internas principales

El código de la tabla §3 prevalece sobre planes históricos. Contexto documental adicional:

- [BUDGETS_MANAGEMENT_PLAN.md](BUDGETS_MANAGEMENT_PLAN.md): semántica original de ahorro manual y meta.
- [PROJECTIONS_AND_BUDGETS_MASTER_PLAN.md](PROJECTIONS_AND_BUDGETS_MASTER_PLAN.md): historial, períodos y proyecciones; contiene referencias antiguas `.js/.jsx`, no usarlas como rutas vigentes.
- [MULTI_CURRENCY_IMPLEMENTATION_PLAN.md](MULTI_CURRENCY_IMPLEMENTATION_PLAN.md): referencia de migración; para esta auditoría se inspeccionaron modelos y adaptadores monetarios actuales, no se declara revalidado todo ese plan.
- [AI_COORDINATION_LOG.md](AI_COORDINATION_LOG.md): reglas y coordinación. En el checkout principal, entrada de Claude #72 sobre tutorial y corrección de fechas en demo aún sin commit; no pertenece al baseline.

### Fuentes externas, consultadas 2026-10-28

1. [SEC / Investor.gov — Compound Interest Calculator](https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator): se abrió la página; distingue inversión inicial, aportaciones, horizonte, tasa estimada, rango y frecuencia de capitalización. Referencia de transparencia del simulador, no recomendación de una tasa o producto.
2. [CONDUSEF — Planificador de Presupuesto Familiar y Personal](https://www.condusef.gob.mx/?idc=1328&idcat=3&p=contenido): resultado de búsqueda oficial describe simulador de meta/tiempo y ahorro periódico. Apertura directa agotó tiempo; no se afirma recorrido de la herramienta ni verificación de su UI.
3. [CONDUSEF — Haz más con tu dinero: ahorro](https://webappsos.condusef.gob.mx/EducaTuCartera/ahorro.html): resultado oficial sobre metas y aportaciones periódicas. Apertura directa devolvió 502; soporte contextual limitado al extracto, no evidencia de funcionalidad probada.
4. [Vercel — Next/backend frameworks](https://vercel.com/docs/frameworks/backend): referencia técnica de la guía de arquitectura disponible. Decisión local: conservar los Route Handlers existentes; no se verificaron precios, límites de plan ni nuevos servicios porque no se contratará/desplegará infraestructura en esta tarea.

Los esquemas, fórmulas operativas, fases y decisiones de UX son **propuestas de diseño para Gastify**, no hechos atribuidos a estas fuentes. No se consultaron rentabilidades actuales ni precios de viajes/coches.

## 15. Continuidad después de la implementación

1. Mantener esta rama aislada. Cuando el usuario confirme la prueba, sincronizar con `main` y revisar conflictos/avances concurrentes antes de integrarla.
2. Probar el formulario con datos sintéticos: meta de coche, enganche porcentual/fijo, fecha editable y cambio de frecuencia; comprobar montos y avisos.
3. Probar un ahorro existente y uno nuevo, monedas MXN/USD/EUR/JPY, cuenta de crédito, FX faltante y conflicto de cuentas sin afectar el origen del saldo.
4. Probar Oportunidades con rango incompleto/completo, reembolso no conciliado, comisiones, selección superpuesta por categoría/tag y los tres escenarios con el mismo principal.
5. Revisar iOS/Android y demo sin escritura; luego decidir el release. No hacer build, commit, push o merge sin la autorización aplicable.

**Estado de la propuesta inicial:** ejecutada como MVP local en la rama; la checklist de §12 conserva los casos de aceptación aún no probados uno por uno.

## 16. Implementación realizada y verificación (2026-10-28)

### Entrega local

- Rama aislada: `codex/growth-opportunities-goals`; worktree: `/Users/luisjairvazqueznavarrete/.codex/worktrees/growth-goals/Gastify`. El checkout principal de Cloud/Claude no se tocó.
- **Objetivos:** un Goal es un Budget de tipo `saving` enriquecido; no se añadió una segunda fuente `Goal` ni se renombraron Projects. Se añadieron plantillas (auto, casa, viaje, negocio, salud, emergencia y personalizada), importe total/enganche (porcentaje o monto fijo), moneda, icono/color, fecha editable, aportación fija/necesaria, frecuencia, fuente de ingreso opcional, contexto de categorías/subcategorías/tags/budgets/proyectos, pausa, logro, archivo y recordatorio in-app.
- **Persistencia:** `goalDetails`, `revision`, montos estructurados e historial opcional viven en el Budget existente. Los endpoints existentes de alta/edición validan fechas reales, moneda, montos y pertenencia de referencias. Cambio concurrente obsoleto devuelve 409. `GoalFundingClaim` usa índice único por wallet/cuenta y libera claims al retirar una cuenta o borrar Budget/usuario. El saldo puede declararse manualmente o derivarse de cuentas, nunca ambos; crédito no financia objetivos. Los claims usan compensación ante error, no transacción Mongo multi-documento.
- **Oportunidades:** `/dashboard/opportunities` y ruta móvil seleccionan un rango y gastos por todas las compras, categoría, subcategoría, etiqueta o texto del concepto. La lista muestra los movimientos incluidos. Transferencias/ingresos/pendientes/fallidos quedan fuera; fees y refunds se muestran separados, FX faltante/obsoleto e historial parcial se advierten. Presenta principal redirigido y simulaciones de viaje, meta de enganche/Goal personal e inversión hipotética (hoy vs. por fecha del gasto). No concilia automáticamente refunds con compra, no atribuye ahorro real y no recomienda un producto financiero.
- **Integración:** Goals accesibles desde Presupuestos, modal real de Budget, Dashboard, Wallet Analyzer y CTA de Historial; `/dashboard/goals/[id]` recibe deep link del recordatorio. Agregadas `/demo/goals` y `/demo/opportunities` con ejemplos ficticios/interactivos; la demo no persiste en Mongo. Projections no cambió.
- **Móvil:** nuevas rutas `/budgets/goals` y `/budgets/opportunities`, ampliación del formulario/detalle de Budget; reutilizan `@gastify/core` para calendario, escenarios, conversiones y filtros.
- **Idiomas:** namespaces ES/EN `goals` y `opportunities` cargados bajo demanda junto con el catálogo móvil. Algunas etiquetas fijas de la demo corresponden a datos de ejemplo.
- **Diferencias contra el diseño original:** no se agregó preferencia sincronizada para excluir agrupaciones ni un ajuste “no sugerir”; los controles son por pantalla. Los avisos son sólo in-app y se recuerdan localmente: no hay scheduler push, WhatsApp, alerta por evento nuevo ni depósito automático. No hay ledger de depósitos, asignación parcial de cuenta, vínculo explícito de refunds, creación conjunta de proyecto ni una vista de historial de modificaciones del objetivo. Budget+FundingClaim usa compensación, no transacción multi-documento. El historial de movimientos debe estar ya disponible en el store; no se fuerza una descarga masiva desde estas vistas.

### Archivos principales

- Core: `packages/core/src/goals/*`, `packages/core/src/opportunities/*`, `packages/core/src/budgets/budgetForm.ts`, `packages/core/src/budgets/budgetAlerts.ts`, `packages/core/src/features/budgetSlice.ts`, `packages/core/src/transformers/budgetCurrency.ts` y catálogos ES/EN.
- Servidor: `src/model/{Budget.ts,GoalFundingClaim.ts}`, `src/lib/goals/*`, rutas existentes de alta/edición/eliminación de Budget y eliminación de cuenta/usuario.
- Web: `src/app/dashboard/{goals,opportunities}`, `src/components/goals/*`, `src/components/opportunities/*`, componentes existentes de Budgets, Dashboard/Analyzer/History y alertas.
- Móvil: `apps/mobile/src/app/(tabs)/budgets/{goals,opportunities,index,new,[id].tsx}`, `components/forms/budget-form.tsx` y `hooks/use-budget-alerts.ts`.
- Demo/docs/tests: `src/components/demo/DemoGoalGrowth.tsx`, este plan, `AI_COORDINATION_LOG.md` y pruebas core/validación.

### Verificación hecha en este worktree

- `npm run typecheck`: pasa.
- `cd apps/mobile && npx tsc --noEmit`: pasa.
- `npx vitest run --reporter=dot`: **122 archivos, 838 pruebas pasan** (incluye calendario, progreso, selección de movimientos, simulaciones y consistencia de montos de Goal).
- `npm run lint -- --quiet`: pasa en `src/` web.
- `npx eslint --no-ignore --quiet` en los archivos móviles de esta función: pasa. `npx expo lint` no pudo ejecutarse porque la configuración ESLint global ignora `apps/**`; el barrido directo de todo Mobile localiza dos errores ajenos a esta feature en `apps/mobile/src/components/home/tablet-wallet-header.tsx` (dos imports `require`).
- `git diff --check`: pasa. **No** se ejecutó `npm run build` conforme al protocolo del repo.
- Preview activo en `http://localhost:3001` (el 3001 estaba libre; no se usó 3000). `/`, `/demo/goals` y `/demo/opportunities` respondieron HTTP 200; `/dashboard/goals` y `/dashboard/opportunities` redirigen a login sin sesión, como corresponde. El navegador quedó en `/demo/opportunities` para que el usuario pruebe ambas rutas. La verificación automatizada no sustituye validar OAuth/FX reales ni la prueba visual del usuario.
- **Incidencia de entorno resuelta para el preview actual:** el worktree aislado no contiene `.env`/`.env.local` (Git worktree no copia archivos ignorados), así que inicialmente `/login` fallaba en `mongoClient.ts` al no existir `DB_URI`. El proceso activo de `localhost:3001` ahora carga las variables con `@next/env` desde el `.env` del checkout principal y arranca con ellas heredadas en memoria; no se copió, enlazó ni mostró el secreto. Tras reiniciar ese proceso habrá que usar el mismo mecanismo de carga; `localhost:3000` no se tocó.
- No commit, push, merge ni deploy. Antes del release falta que el usuario pruebe escritorio/móvil y autorice integrar; después revisar las ramas más recientes de Cloud/Claude.

## 17. Checklist de pulido UX — solicitud 2026-10-28

- [x] En web, tocar el nombre, contenido o barra de una meta abre su **modal de detalle**; únicamente el botón explícito **Editar objetivo** abre el formulario de edición.
- [x] El modal resume saldo actual, meta, monto pendiente y porcentaje; incluye barra con indicador porcentual/cara, cuentas fuente, estado provisional si hay saldos compartidos, plan paso a paso y fecha/próximo aporte cuando se puede calcular.
- [x] El detalle muestra movimientos y gráfica de categorías solo cuando coinciden con el contexto enlazado. La UI advierte que esos gastos son contexto, no depósitos ni ahorro añadido al objetivo.
- [x] La barra de la tarjeta de Objetivos usa el patrón de Budgets: cara, porcentaje sobre el extremo de la barra, avance abajo a la izquierda y monto objetivo abajo a la derecha.
- [x] Oportunidades ya no repite el título en el pequeño kicker morado; Inversión, Viaje y Enganche/meta se muestran en una fila horizontal, con desplazamiento lateral cuando el ancho no alcanza.
- [x] React Native abre el detalle desde el nombre/cuerpo/barra y separa el botón Editar objetivo. Su detalle nativo presenta progreso tipo Budget, fuente de saldo, estado provisional, pasos del plan y movimientos de contexto.
- [x] En React Native, los tres escenarios de Oportunidades se presentan horizontalmente en una fila deslizable; los textos y nuevos estados del detalle tienen traducciones ES/EN.
- [x] Verificado con typecheck web/móvil, ESLint focalizado, revisión visual de Oportunidades en Chrome y `git diff --check`. No se probaron escrituras ni se modificó información de usuario.

### 17.1. Ajustes de color, ayuda y desplazamiento — feedback 2026-10-28

- [x] Goals y detalle de meta usan sin excepciones el color/degradado/emoji compartidos de Budgets para ahorro: coral al inicio, verde al avanzar y azul desde 85 % o al superar el objetivo. Las cuentas compartidas conservan su advertencia ámbar, sin teñir de naranja una barra que ya llegó a la meta.
- [x] Caritas de progreso algo más grandes en web y móvil.
- [x] Un único `InfoTip` al lado del nombre del objetivo en el detalle web; la pantalla nativa enlaza la misma explicación al título. La ayuda explica origen del saldo, meta, plan, contexto y cómo leer estados provisionales.
- [x] El modal web ya no mantiene fijo el encabezado: encabezado, fecha objetivo y plan de aportes se desplazan dentro de un solo contenedor; únicamente el botón Cerrar permanece sticky.
- [x] La fecha objetivo sigue siendo la referencia del cálculo del aporte sugerido y está incluida dentro del contenido desplazable junto a monto y frecuencia.
- [x] Typecheck/lint web y móvil, ESLint móvil focalizado, pruebas de lógica de colores de Budgets y `git diff --check` pasan. No se alteraron datos del usuario.

### 17.2. Vista sencilla, intenciones personales y excedentes — 2026-10-30

**Estado:** implementado localmente en `codex/growth-opportunities-polish`; sin commit, push, merge ni despliegue. La cuenta autenticada de 3001 volvió a requerir login/2FA, de modo que la vista de datos reales y los guardados no se probaron visualmente ni contra Mongo. La demo sí respondió 200; el endpoint nuevo sin sesión respondió 401; la ruta protegida redirige a login. No se tocó `localhost:3000`.

- La vista sencilla de Oportunidades arranca con el 10% de los gastos, muestra un filtro neutro de la categoría con más gasto (no la etiqueta como perjudicial), y ofrece la vista avanzada para las combinaciones originales. Tasa y plazo ilustrativos: 12% anual, 1 año; no es tasa de mercado ni recomendación. Los inputs numéricos permiten quedar temporalmente vacíos al editar.
- En Categorías se puede declarar voluntariamente un porcentaje de reducción para cualquier categoría propia o predeterminada; 0% elimina la intención. No se infiere que fumar, vacaciones, restaurantes u otra categoría sea “nociva”. Preferencias viven en `GrowthCategoryPreference` con índice único `(wallet, category)`; **no** se modifica la categoría predeterminada global, porque es compartida entre usuarios. El GET y POST/PUT requieren sesión verificada, derivan wallet de la sesión y validan pertenencia de categorías propias. La demo de Categorías sigue `readOnly` y no llama al endpoint.
- Web y React Native consumen la misma matemática de excedentes en `packages/core/src/opportunities/budgetOverage.ts`. Se incluyen solo presupuestos de gasto activos, con moneda convertida y periodos que arrancan dentro del rango elegido. Cada movimiento completado tiene un único ID y se asigna a un único presupuesto: vínculo explícito primero, después coincidencia de subcategoría/categoría más específica. Un vínculo a proyecto/ahorro no recae por categoría en otro presupuesto. Límites históricos se resuelven al inicio del periodo. Los periodos parciales al comienzo de un rango personalizado no se estiman. El desglose presenta gasto, límite y excedente por ciclo; la lista de movimientos muestra importes brutos, no la suma del excedente. Reembolsos sin vínculo no se descuentan automáticamente, por lo que el excedente es conservador/bruto.
- Ejemplos con fuente: en MXN se puede mostrar temporalmente el Hyundai Grand i10 Hatchback GL TM 2026 con precio de lista de $286,600 según [Hyundai México](https://www.hyundai.com.mx/modelos/grand-i10-hb-2026/especificaciones), consultado 2026-10-30; el ejemplo calcula 20% como simple operación, sin afirmar que exista ese plan crediticio. Se oculta automáticamente después del 2026-11-15 para no dejar un precio obsoleto. Para viajes se muestra solo una referencia en JPY de **siete noches de hotel económico** (≈ ¥42,000 a ¥6,000/noche) de la [guía oficial de JNTO](https://www.japan.travel/en/guide/japan-on-a-budget/), sin vuelos/comidas/traslados ni conversión FX inventada; no es precio de reserva vigente.
- Cambios principales: `src/components/opportunities/{OpportunitiesClient,GrowthOpportunityTeaser}.tsx`, `src/components/multiUsedComp/CategoriesClient.tsx`, `src/hooks/useGrowthCategoryPreferences.ts`, `src/model/GrowthCategoryPreference.ts`, `src/app/api/general-data/growth-category-preferences/route.ts`, `apps/mobile/src/app/(tabs)/budgets/opportunities.tsx`, `apps/mobile/src/app/(tabs)/more/categories/index.tsx`, `apps/mobile/src/hooks/use-growth-category-preferences.ts`, módulos puros y pruebas en `packages/core/src/opportunities/`, textos ES/EN y ayudas en `packages/core/src/{i18n,info}/`.
- Verificación: typecheck web y móvil, suite Vitest completa (**125 archivos, 849 pruebas**), ESLint web y focalizado móvil, `git diff --check`. `npx expo lint` general falla por configuración existente que ignora `apps/**`; ESLint directo de los archivos modificados pasa. No se ejecutó build por regla del repositorio.
- **Pendiente para cierre/release:** probar visualmente la ruta autenticada en web y RN teléfono/tableta, ejercer un guardado y lectura de preferencia con una cuenta de prueba autorizada, verificar el nuevo endpoint en un arranque frío de producción, revisar si el cálculo de excedentes debe integrar refunds conciliados y budgets archivados históricos, y definir un proceso de actualización de precios o retirar ejemplos vencidos. No prometer un catálogo vivo ni precios actuales sin un proveedor/flujo de actualización. Reconciliar con cambios de Cloud antes de integrar a `main`.
