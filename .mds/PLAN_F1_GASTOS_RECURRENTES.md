# PLAN F1 — Gastos recurrentes

Autor del plan: Sonnet 5.5 (coordinador/auditor). Implementa: Haiku 5.5. Estado (2026-10-30): IMPLEMENTADO por Sonnet (web + móvil). Verificado: sync idempotente, modal de confirmación web, campana, gestión web (pausar/editar/eliminar), tutorial web, hoja de confirmación móvil, pantalla de gestión móvil + tutorial `m-recurring`, switch en el formulario móvil. Pendiente: guardado de punta a punta de un recurrente desde el móvil, tour del formulario web (paso del switch), y las decisiones abiertas del §9.
Idea del dueño (2026-10-30): en una transacción, un switch «¿es un gasto recurrente?». Si sí, aparecen dos inputs: **cada cuándo** (mensual, quincenal, trimestral…) y **si el monto varía con el tiempo** (hoy 600, el mes siguiente 800…). Los NO variables, el sistema los pone solo. Los variables: al iniciar sesión, si ya llegó o pasó la fecha, aparece una **notificación/modal** para confirmar el gasto y el nuevo precio. Solo gastos variables y continuos.

## 1. Alcance
- Web (Transacción en el modal Crear y en Editar movimiento) y móvil (formulario de movimiento).
- Gastos (no ingresos) en v1. El campo se llama `kind`/`isIncome` en el modelo actual: la plantilla guarda `isIncome:false` fijo; dejar la estructura lista para ingresos recurrentes después, sin exponerlo.
- NO es suscripciones detectadas del Analizador (esas se infieren de movimientos pasados): esto es declarado por la persona. Más adelante el Analizador puede ignorar movimientos que ya vengan de una plantilla (campo `recurringId`).

## 2. Modelo de datos (Mongoose, `src/model/RecurringExpense.ts`)
```
RecurringExpense {
  user, wallet                      // ObjectId, derivados de la sesión (nunca del body)
  name: String                      // nombre del movimiento («Renta»)
  amount: Number                    // monto de referencia (último confirmado); major units, como Transaction.amount
  currency: String                  // moneda de la cuenta/ de la transacción original
  account?, category?, subCategory?, tags[]   // ids, copiados de la transacción original
  budget?                           // si la transacción original estaba ligada a un presupuesto/proyecto
  frequency: 'weekly'|'biweekly'|'monthly'|'bimonthly'|'quarterly'|'semiannual'|'yearly'
  dayRule: { kind:'dayOfMonth', day:1..31 } | { kind:'weekday', weekday:0..6 }   // se deriva de la fecha ancla; día 29-31 → «último día del mes» si el mes es más corto
  anchorDate: Date                  // primera ocurrencia (la fecha de la transacción original)
  nextDueDate: Date                 // próxima ocurrencia aún no creada (siempre ≥ día siguiente a la última creada)
  isVariable: Boolean               // true → requiere confirmación humana del monto
  active: Boolean                   // pausar / reanudar
  endDate?: Date                    // opcional
  lastCreatedDate?: Date            // fecha (due) de la última transacción creada
  sourceTransactionId?: ObjectId    // la transacción que originó la plantilla
  createdAt, updatedAt
}
Transaction += recurringId?: ObjectId, recurringDueDate?: Date      // enlace e idempotencia
índice único parcial: { user, recurringId, recurringDueDate } (evita duplicar la misma ocurrencia)
```
Reglas de fechas: todo en la zona del usuario (usar la misma utilería de fechas de `packages/core/src/time`), almacenando mediodía local para evitar saltos por DST. Ocurrencias del día 29/30/31 caen en el último día del mes más corto. `quincenal` = cada 14 días desde la ancla (no «1 y 15»); documentar. 

## 3. Núcleo puro (`packages/core/src/recurring/`)
- `nextOccurrence(rule, from)`, `occurrencesBetween(rule, anchor, fromExclusive, toInclusive)` (máx. 24 por llamada), `describeFrequency(rule, t)` (texto humano ES/EN).
- `planCatchUp(template, today)` → `{ autoCreate: Occurrence[], needsConfirmation: Occurrence[] }`: si `isVariable` → todas las vencidas van a `needsConfirmation` (máx. 3 recientes; las más viejas se resumen como «omitidas» con opción de crearlas); si no variable → `autoCreate` (máx. 12 por corrida; si hay más, crear las 12 más recientes y marcar el resto como omitidas para no llenar el historial por una plantilla vieja).
- Tests vitest: mensual con día 31, año bisiesto, DST, quincenal, trimestral, anual 29 feb, ocurrencias cruzando año, plantilla pausada/terminada, límites 12/3, idempotencia por (recurringId, dueDate).

## 4. API (rutas bajo `src/app/api/general-data/recurring/`, todas con `getVerifiedSession`)
- `POST new` (crear plantilla; lo llama el formulario de transacción después de crear la transacción original, con `sourceTransactionId`).
- `POST get` (lista de plantillas del usuario).
- `POST update` (editar monto de referencia, frecuencia, variable sí/no, pausar/reanudar, fecha fin).
- `POST remove` (borra la plantilla; NO borra transacciones ya creadas).
- `POST sync` (llamado al iniciar sesión / al abrir la app, máx. 1 vez por sesión y por hora): ejecuta `planCatchUp` para cada plantilla activa; crea las `autoCreate` (con `recurringId`/`recurringDueDate`, idempotente) y devuelve `{ created: n, pending: [{ templateId, dueDate, lastAmount, name }] }`.
- `POST confirm` (`{ templateId, dueDate, amount, skip? }`): crea la transacción con el monto confirmado (actualiza `amount` de referencia) o la marca como omitida (avanza `nextDueDate` sin crear). Idempotente.
- Validaciones con las utilerías de errores existentes; sin escrituras si la sesión no es verificada (2FA).

## 5. UI web
- **Formulario de Transacción** (`AddTransactionModal` en modo Transacción y `EditSingleTransModal`): al final, un switch «Gasto recurrente». Si ON → `Select` de frecuencia (botones/opciones, no dropdown, patrón de la app) y un switch «El monto cambia con el tiempo». Texto de ayuda dinámico: «Se repetirá cada mes el día 15. Se creará solo» / «…te pediremos confirmar el monto cuando llegue la fecha». Solo habilitado si el tipo es Gasto. En edición de un movimiento que ya viene de una plantilla: mostrar badge «Recurrente · mensual» con enlace a gestionar.
- **Al iniciar sesión** (después del 2FA, una vez por sesión): `POST sync`. Si `pending.length > 0` → **modal «Gastos recurrentes por confirmar»** (BasicModal, z-index correcto, tema claro/oscuro): una fila por pendiente (nombre, fecha, monto sugerido editable con el último confirmado, botones «Confirmar» y «Omitir», y «Confirmar todos»). Si se cierra sin resolver, quedan en la **campana** como avisos (reutilizar el sistema de `useBudgetAlertList` / `budgetAlerts` de `packages/core/src/budgets/`, tono `warning`) hasta resolverse.
- **Gestión** (sección «Recurrentes»): lista de plantillas con frecuencia, próxima fecha, monto, variable sí/no, pausar/reanudar, editar, eliminar. Ubicación: tarjeta en Movimientos junto a Importar/Categorizador (nuevo bloque «Gastos recurrentes») + ventana «Herramientas». Títulos con el patrón de oro (título | separador | «?» + compás).
- Tours: `packages/core/src/tour/steps/movements.ts` (+ `tourMovements.ts` ES/EN): pasos para el switch en el formulario, el modal de confirmación y el bloque de gestión; textos ES+EN; `appInfo.ts` para el «?».
- i18n: namespace nuevo `recurring` (es/en) + claves de errores.

## 6. UI móvil (apps/mobile)
Mismo flujo: switch en `movement-form.tsx`, sheet «Por confirmar» al abrir la app (tras login/2FA) y avisos en `notifications.tsx`, pantalla de gestión en «Más». Tours móviles `m-…`. Se hace DESPUÉS de la web en una segunda tarea; verificar en el emulador Android (`scripts/emu.sh`).

## 7. Criterios de aceptación (los verifica Sonnet en navegador)
1. Crear una transacción recurrente mensual NO variable con fecha 2 meses atrás → al hacer `sync` se crean exactamente 2 ocurrencias (fechas correctas, sin duplicados aun si se ejecuta `sync` dos veces seguidas).
2. Una variable con fecha vencida → aparece el modal al iniciar sesión con el monto de referencia; confirmar con un monto distinto crea la transacción con ese monto y actualiza el de referencia; «Omitir» no crea nada y avanza la fecha.
3. Cerrar el modal sin resolver deja el aviso en la campana; resolverlo desde ahí funciona.
4. Pausar una plantilla detiene la creación; reanudar no «recupera» ocurrencias de la pausa (decisión: al reanudar, `nextDueDate` salta a la próxima futura).
5. Borrar la plantilla no borra transacciones creadas; borrar una transacción creada por la plantilla NO la recrea (la ocurrencia queda registrada como creada/omitida).
6. Tests vitest del núcleo y de las rutas (con mocks al estilo de las pruebas de rutas existentes) en verde; `tsc` raíz y móvil; sin regresión en el flujo de crear transacción normal.
7. Tema claro y oscuro; patrón de oro en los títulos nuevos; tours que recorren los pasos nuevos.

## 8. Orden de implementación sugerido para Haiku (un hito = una entrega auditada)
H1 núcleo + tests · H2 modelo + rutas + tests · H3 formulario web (switch) · H4 sync al login + modal + campana · H5 gestión + tours + i18n · H6 móvil.

## 9. Riesgos / decisiones abiertas para el dueño
- Quincenal = cada 14 días (no «1 y 15»); ¿prefiere «dos veces al mes»? (se puede añadir como `semimonthly` con días 1 y 15).
- Sin cron de servidor: las ocurrencias NO variables se crean cuando la persona abre la app (catch-up). Para crearlas puntualmente aunque no abra la app haría falta un job programado (ver estudio F5 y costos).
- Moneda: si la cuenta está en otra moneda que la principal, la ocurrencia usa la moneda de la plantilla y el cálculo de reporting habitual del núcleo.
