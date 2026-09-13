# Incidente de saturación de conexiones a MongoDB Atlas (2026-09-11/12)

## Qué pasó

Después de mergear la migración a Better Auth (PR #19) a `main`, producción quedó
bloqueada en cascada por cuatro causas distintas, encontradas y arregladas en orden:

1. **Build roto en Vercel** — conflicto de peer dependencies (`zod@^3` del proyecto vs.
   `zod@^4` que pide `better-call`, dependencia transitiva de `@better-auth/core`).
   Fix: `.npmrc` con `legacy-peer-deps=true`. Commit `06bdf0e`.
2. **Secretos faltantes en Vercel** — `BETTER_AUTH_SECRET`/`BETTER_AUTH_URL` son
   variables nuevas de esta migración, nunca configuradas en el dashboard de Vercel
   (solo existían en `.env` local). Better Auth se niega a correr con el secreto por
   default. Se le pidió al usuario configurarlas manualmente en Vercel (secretos de
   producción, no se tocan por código).
3. **Timeouts de 10s en `/api/auth/[...all]`** — `dnsFix.js` forzaba DNS a
   `8.8.8.8`/`1.1.1.1` incondicionalmente (workaround de un bug local del ISP, nunca
   probado en el sandbox de red de Vercel) y el `MongoClient` nativo de Better Auth no
   tenía `serverSelectionTimeoutMS`, así que colgaba hasta el límite default de 30s.
   Fix: `dnsFix.js` ahora solo corre si `!process.env.VERCEL`; se agregó
   `serverSelectionTimeoutMS: 8000` y `export const maxDuration = 30` en la ruta de
   auth. Commit `98ddcb5`.
4. **Saturación del límite de conexiones de Atlas (M0 = 500 conexiones simultáneas)**
   — ver detalle abajo. Fix parcial: `maxPoolSize: 5` en ambos clientes de Mongo.
   Commit `5539019`.

## Por qué se saturaron las conexiones (causa raíz #4)

- Una "conexión" es un socket TCP+TLS que un `MongoClient` mantiene abierto y listo
  para reusar entre queries — no se abre/cierra una por cada consulta.
- Gastify usa **dos clientes de Mongo independientes**: el nativo de Better Auth
  ([betterAuth.js](../src/lib/auth/betterAuth.js)) y el de Mongoose
  ([dbConnection.js](../src/app/api/dbConnection.js)). Cada uno, sin `maxPoolSize`
  explícito, podía abrir hasta 100 conexiones él solo.
- Cada *cold start* de una función serverless en Vercel crea instancias nuevas de
  ambos clientes, cada una con su propio pool nuevo. Con varias instancias
  concurrentes vivas a la vez (típico durante pruebas intensas: redeploys, varias
  pestañas, reintentos), el conteo se dispara muy por encima del límite del tier
  gratis.
- El bug de timeouts (causa #3) empeoró esto: conexiones colgadas hasta 10-30s se
  quedaban "ocupando línea" más tiempo, y muchas nunca se cerraron limpiamente del
  lado de Mongo (quedaron contando contra el límite aunque ya nadie las usara).
- Confirmado en vivo en el dashboard de Atlas: gráfica de conexiones subiendo y
  quedándose plana en 500/500 durante horas, sin drenar sola.

## Plan de prevención para cuando haya usuarios reales

1. **✅ HECHO (2026-09-12): Un solo cliente de Mongo, no dos.** Nuevo módulo
   [src/lib/db/mongoClient.js](../src/lib/db/mongoClient.js): expone
   `ensureMongooseConnection()`/`getSharedMongoClient()`. `dbConnection.js` ahora
   delega ahí, y `betterAuth.js` obtiene su `MongoClient` vía
   `getSharedMongoClient()` (que internamente es `mongoose.connection.getClient()`)
   en vez de crear su propio `new MongoClient(...)`. Verificado que
   `NativeConnection.prototype.openUri` (mongoose) asigna `this.client` de forma
   síncrona antes de terminar de conectar, así que esto sigue siendo "lazy connect"
   sin async en el export top-level de `auth`. Probado en vivo: Mongoose y Better
   Auth (incluyendo `passkey/generate-authenticate-options`) respondieron 200 usando
   el mismo cliente/pool. Reduce el techo teórico por instancia de hasta 10
   conexiones (5+5) a hasta 5.
2. **Pendiente — `maxPoolSize` aún más bajo por instancia** (ya está en 5, evaluar
   bajar a 2-3) — cada instancia serverless normalmente atiende una petición a la
   vez.
3. **Pendiente — dejar el tier M0 (free) antes de abrir al público.** 500 conexiones
   es un techo real y bajo para cualquier tráfico de producción con usuarios
   concurrentes, no solo un artefacto de las pruebas de hoy. Subir a un tier dedicado
   (M10+, ~1500 de límite y mejor rendimiento en general) antes del lanzamiento real.
4. **Pendiente — `maxIdleTimeMS`** en la configuración del cliente compartido — para
   que las conexiones que sí quedan inactivas se cierren solas más rápido en vez de
   quedarse colgadas esperando a que el servidor las expire.

## TODO vital pendiente: investigación profunda de escalabilidad de conexiones

Pedido explícito del usuario (2026-09-12): antes de lanzar Gastify a usuarios reales,
investigar a fondo qué tanto este patrón (Mongoose + serverless en Vercel) escala con
cientos/miles de usuarios concurrentes, más allá del fix rápido de unificar clientes.
Preguntas a resolver en esa investigación:

- ¿Cuántas instancias serverless concurrentes puede tener Vercel realmente en el plan
  actual, y se puede acotar ese número (concurrency limits, Fluid Compute)?
- ¿Conviene un proxy de pooling de conexiones (equivalente a PgBouncer pero para
  Mongo) delante del cluster, en vez de que cada instancia abra su propio pool?
- ¿En qué punto (cuántos usuarios concurrentes reales) el M0/M10 se saturaría de
  nuevo incluso con el fix ya aplicado, y qué tier hace falta para el lanzamiento?
- ¿Vale la pena separar cluster de desarrollo/pruebas del de producción, para que
  las pruebas nunca puedan saturar el cluster que sí usan usuarios reales?

## Mitigación de emergencia usada

`db.runCommand({ killAllSessions: [] })` contra el cluster para forzar el cierre de
todas las sesiones/conexiones atoradas de un jalón (seguro porque en ese momento solo
el propio usuario usaba la app). Alternativa si eso no funciona en el tier M0: subir
temporalmente a M10, lo cual normalmente reinicia el cluster y limpia las conexiones
de paso.
