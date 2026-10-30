# PLAN F2 — Sección «Personas»: gastos asociados a personas («psicología financiera»)

Autor: Sonnet 5.5. Implementa: Haiku 5.5. ESTADO (2026-10-30): IMPLEMENTADO por Sonnet (v1) y verificado en web y emulador — núcleo `peopleAnalysis.ts` (+10 tests), modelo `Person`, rutas `people/{new,get,update,remove}` (creación compuesta con rollback, borrado conservando o borrando categoría), página `/dashboard/people` con ítem en la barra, asistente de 6 preguntas, tarjetas con límite, comparativo y detalle (totales, patrón real vs declarado, «¿cambia tu gasto del día?», límite, subcategorías, movimientos, archivar/eliminar), móvil `more/people.tsx` y tutoriales `peopleList` / `m-people`. Probado con la persona «QA Pareja» (9 salidas, total 8,370 = cálculo manual). PENDIENTE: editar a una persona desde la UI (la ruta update existe), selector «¿Con quién?» en el formulario de movimiento, cuenta como criterio en el asistente móvil, y las decisiones abiertas del §8. Idea del dueño (2026-10-30), resumida fielmente: una sección propia **«Personas»**. Con un cuestionario (preguntas) la persona va creando personas (p. ej. «Novia»), y cada una **es una categoría** (se crea por defecto al crearla) con **subcategorías** propias (citas, comida con novia —que cuenta distinto a «restaurante» a solas—…). A cada persona se asocian **tags, gastos/transacciones, un presupuesto o incluso una cuenta**, y **cuándo la ves** (entre semana, fines de semana, aleatorio —a veces dos días entre semana, a veces una semana no la ves y a la siguiente casi todos los días—) y la **frecuencia y su tipo**. Objetivo: que el sistema ayude a detectar cuánto gastas en promedio con esa persona, si esa persona **dispara que gastes más o menos**, cómo es tu psicología financiera con ella, y **hasta cuánto quieres gastar (tu límite)**.

## 1. Modelo de datos (`src/model/Person.ts`)
```
Person {
  user, wallet                         // de la sesión
  name: String (1..40)                 // «Novia», «Mamá», «Equipo de fútbol»
  relationship: 'partner'|'family'|'friend'|'coworker'|'group'|'other'
  icon, color                          // reutilizar selectores de ícono/color de categorías
  categoryId: ObjectId                 // categoría creada automáticamente (nombre = name); opcionalmente más categorías
  subCategoryIds: ObjectId[]           // subcategorías de esa categoría (citas, comida con ella…)
  tagIds: ObjectId[]                   // tags que identifican gastos con esta persona
  budgetId?: ObjectId                  // presupuesto de gasto asociado (límite mensual)
  accountId?: ObjectId                 // cuenta usada para esa persona (p. ej. «tarjeta de citas»)
  contact: {                           // «cuándo la veo»
    pattern: 'weekdays'|'weekends'|'daily'|'random'|'custom'
    days: number[] (0-6)               // para custom/weekdays/weekends
    frequency: 'daily'|'few_per_week'|'weekly'|'biweekly'|'monthly'|'sporadic'
    typicalMeetingsPerMonth?: number   // opcional, estimado por la persona
  }
  limit?: { amount: Number, period: 'monthly'|'per_meeting', currency }   // «hasta cuánto quiero gastar»
  note?: String (≤ 200)
  archived: Boolean, createdAt, updatedAt
}
```
Privacidad: son datos sensibles. Solo viven en la cartera de la persona, nunca se comparten ni salen en exportaciones públicas/demo; al borrar la cuenta se borran. Al borrar una Persona preguntar qué hacer con su categoría (conservar con sus movimientos / borrar categoría y dejar movimientos sin categoría) — nunca borrar movimientos.
Los movimientos NO llevan campo nuevo: se asocian a una persona **por su categoría/subcategorías o por sus tags** (regla: un movimiento «es de» la persona si su categoría ∈ {categoryId} o su subcategoría ∈ subCategoryIds o tiene alguno de tagIds). Esto respeta la idea «la persona es una categoría» y no duplica datos. Un movimiento puede pertenecer a varias personas (p. ej. cena de pareja con amigos): se cuenta completo en cada una pero se marca «compartido» y el resumen general no suma dos veces.

## 2. Cuestionario de creación (wizard de 6 preguntas, ES/EN, web y móvil)
1. ¿Quién es? (nombre + relación + ícono/color). 2. ¿Cada cuánto la ves? (opciones: casi todos los días / varias veces por semana / una vez por semana / cada dos semanas / una vez al mes / de forma irregular). 3. ¿Qué días? (entre semana / fines de semana / ambos / aleatorio / elegir días). 4. ¿En qué sueles gastar con ella? (chips: comida, salidas, regalos, transporte, viajes, otro → crea subcategorías sugeridas editables). 5. ¿Cómo identificarás sus gastos? (usar categoría nueva [por defecto], tags existentes/nuevos, cuenta, presupuesto) con explicación. 6. ¿Cuánto quieres gastar con ella? (límite mensual o por salida; opcional, con sugerencia basada en el promedio histórico si ya hay datos tras asociar movimientos). Resumen final y «Crear».
Reglas: crear la persona = crear categoría + subcategorías (+ opcional presupuesto) en una sola operación (ruta compuesta, atómica o con rollback).

## 3. Núcleo de análisis (`packages/core/src/transformers/peopleAnalysis.ts`, puro, tests)
Por persona y periodo:
- `totals`: total, # de movimientos, # de días con gasto, gasto promedio por «salida» (día con ≥1 movimiento de la persona), promedio por mes, % del gasto total del periodo, tendencia (últimos 3 meses vs 3 anteriores).
- `contactActual`: patrón REAL de los días con gasto (distribución lun-dom, % en fin de semana, frecuencia efectiva por semana) vs el patrón DECLARADO por la persona → «dices que la ves en fines de semana; el 70 % de tus gastos son en fin de semana ✔» o discrepancia.
- `trigger` («¿te hace gastar más?»): promedio del gasto TOTAL del día (todas las categorías) en días con gasto de la persona vs días sin él, ajustado por día de la semana (comparar mismo tipo de día para no confundir fines de semana) → `liftPct`, con intervalo/mínimo de datos (≥ 8 días con y ≥ 8 sin; si no, «aún no hay datos suficientes»). Texto neutral y respetuoso, nunca juzgar a la persona: «Los días que sales con X gastas en total 38 % más que tus días normales».
- `limitStatus`: gastado vs límite (mensual o por salida), proyección a fin de mes, nº de salidas posibles restantes con el promedio actual.
- `topCategoriesOfPerson`: desglose por subcategoría (citas vs comida…).
- Comparativo entre personas (ranking por gasto, por promedio por salida, por «lift»).
Tests: sin datos, pocos datos, persona con una sola subcategoría, movimiento compartido entre dos personas (no duplicar el total global), semana irregular, límite por salida, ajuste por día de la semana.

## 4. API (`src/app/api/general-data/people/`: `new` [compuesta con categoría/subs/presupuesto], `get`, `update`, `archive`, `remove` con opción de categoría) — sesión verificada, user/wallet de la sesión.

## 5. UI
- Web: nueva sección **«Personas»** (ruta `/dashboard/people`, ítem en la barra lateral y en «Más» móvil): lista de tarjetas (ícono, nombre, total del mes, frecuencia, barra de límite con la animación de F3 si ya existe), botón «Agregar persona» → wizard; detalle de persona (modal o página): resumen (totales, promedio por salida, tendencia), gráfico de patrón real vs declarado (lun-dom), «¿Te hace gastar más?» (lift con explicación y nivel de confianza), límite, desglose por subcategoría (Resumen de transacciones del Wallet filtrado por la persona), movimientos (lista estándar), tags relacionados; acciones: editar, archivar, eliminar.
- Vista comparativa «Tus personas» (ranking + barras). Integración: en el formulario de movimiento, un selector opcional «¿Con quién?» (chips de personas) que en realidad asigna su categoría/tag por defecto (atajo, no un campo nuevo).
- Móvil: misma estructura (wizard por pasos con teclado cómodo, detalle en hoja), tablet en dos columnas.
- Patrón de oro en títulos, tour completo (web `people.ts`, móvil `m-people-*`), `appInfo.ts` ES/EN, tema claro/oscuro, i18n namespace `people`.

## 6. Criterios de aceptación
1. Crear «Novia» con el wizard crea categoría + 2 subcategorías sugeridas (y presupuesto si se pidió) sin duplicados; aparece en Categorías y en Personas.
2. Con ≥ 30 movimientos de prueba (crear por UI/API normal en la cuenta compartida: unos con la categoría/tags de la persona en fines de semana, otros no) los totales, promedio por salida y % coinciden con cálculo manual (tabla en el reporte); `trigger.liftPct` coincide con el cálculo manual de 2 promedios; con pocos datos muestra «sin datos suficientes».
3. Un movimiento compartido entre 2 personas no duplica el total general.
4. Borrar persona con «conservar categoría» no borra movimientos; con «borrar categoría» los deja sin categoría.
5. Textos neutrales (revisión de copy: nada que juzgue a la persona). Datos no aparecen en demo/export público.
6. tsc raíz/móvil, eslint, vitest (núcleo y rutas), web en navegador oscuro/claro, móvil en emulador Android.

## 7. Hitos
H1 núcleo + tests · H2 modelo + rutas (compuesta) + tests · H3 lista + wizard web · H4 detalle + análisis + comparativo · H5 selector «¿Con quién?» + tours/«?»/i18n · H6 móvil/tablet.

## 8. Decisiones abiertas para el dueño
- ¿Una persona puede tener VARIAS categorías, o siempre una (con subcategorías)? (plan: una + subcategorías; tags para cruzar categorías).
- Nivel de lenguaje del «¿te hace gastar más?» (hoy neutral, con porcentaje y confianza).
- Cómo llamar a grupos (equipo, familia) ¿mismo modelo con `relationship:'group'`? (plan: sí).
