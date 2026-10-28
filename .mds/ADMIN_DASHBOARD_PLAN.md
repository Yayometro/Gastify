# Plan: panel de administrador de la plataforma (`/admin`)

> Creado 2026-10-28 por Claude Sonnet 5.5. Estado: **Fase 1 construida y probada con pruebas unitarias; falta activarla** (ver sección 6) y verificarla en el navegador con la cuenta admin.

## 1. Objetivo

Un subproducto de Gastify que **solo ve el administrador** (la cuenta del dueño) y responde, a nivel plataforma y cuentas:

- Cuántos usuarios hay y de qué tipo (acceso, país, idioma, seguridad).
- Qué tanto usan la app (actividad, transacciones por usuario, ritmo en el tiempo).
- Qué tienen creado (transacciones, categorías, cuentas, presupuestos, etiquetas).
- Más adelante: rendimiento (velocidad), ingresos (suscripciones) y acciones de administración.

Este panel alimenta las decisiones de `.mds/Obtención de ingresos Gastify.md`: sin saber cuántos usuarios activan y cuántos vuelven, no se puede fijar el precio ni el plan gratis.

## 2. Decisión de diseño: quién es administrador

| Opción | Cómo funciona | Pros | Contras |
|---|---|---|---|
| **A. Lista en variable de entorno (`ADMIN_EMAILS`)** — *elegida para la Fase 1* | El correo de la sesión debe estar en la lista del servidor | **No edita la base de datos**; ningún campo de perfil, ruta ni llamada a Better Auth puede ascender a alguien a admin; cambiar admins = cambiar el entorno | Hay que configurar la variable en local y en Vercel |
| B. Campo `role` en el usuario (Mongo) | `User.role = "admin"` | Se ve desde la app; cómodo si hay varios admins | **Requiere escribir en la BD** (cambio de esquema Mongoose + un update al documento) y ampliar la superficie de ataque (un bug en la ruta de perfil podría escribirlo) |

**Regla:** "el único admin es mi cuenta". Con la opción A esa regla vive en una sola línea del entorno. Si más adelante se quiere B, se hace con aprobación explícita del dueño para escribir en la BD (regla del proyecto: **toda escritura en BD se pregunta antes**).

## 3. Seguridad

1. **Triple compuerta**: (1) `proxy.ts` pide cookie de sesión a `/admin/*`; (2) `src/app/admin/layout.tsx` exige sesión real y que el correo esté en `ADMIN_EMAILS`; (3) mismo **step-up de 2FA** que la billetera (`evaluateApiStepUp`).
2. **Quien no es admin ve un 404 idéntico** al de una página que no existe (no se revela que `/admin` existe). Sin sesión → `/login`.
3. **Sin lista = nadie es admin.** Si `ADMIN_EMAILS` falta o está vacía, todos reciben 404.
4. **Solo lectura**: el módulo `platformStats` solo cuenta y agrupa. No hay rutas de API de admin en la Fase 1 (menos superficie), la página lee directo en el servidor.
5. **Privacidad de los datos del panel**: nunca lee montos, nombres de transacciones, ni correos completos (se enmascaran: `lu***@gmail.com`); **nunca selecciona los `tokenHash`** de los tokens de API (solo cuenta cuántos hay).
6. `robots: noindex` en el layout.
7. Pruebas: `src/lib/admin/adminAccess.test.ts` (lista, mayúsculas, espacios, sin coincidencia por subcadena, lista vacía) y `statsMath.test.ts`.

## 4. Qué muestra la Fase 1

| Bloque | Qué es | Cómo se calcula |
|---|---|---|
| Usuarios | Total, altas 7 y 30 días | Colección `users` (`createdAt`) |
| Con ≥1 transacción | Usuarios que ya guardaron algo | Transacciones por usuario |
| **Activación (30 días)** | De las altas de los últimos 30 días, % que guardó su primera transacción dentro de 7 días | `createdAt` del usuario vs primera transacción |
| Altas por día / transacciones guardadas por día | Serie de 30 días | `createdAt` (UTC) |
| Usuarios que añadieron datos (1/7/30 días) | Actividad **durable** | Última transacción guardada por usuario |
| Usuarios con sesión activa (1/7/30 días) | Complemento | `session.lastApiActivityAt` |
| Transacciones por usuario | Cubetas 0, 1–9, 10–49, 50–199, 200+ y mediana/p90/máx | Conteo por usuario |
| Qué tienen creado | Transacciones, categorías, subcategorías, cuentas, presupuestos, etiquetas | Conteos |
| Tipo de acceso | Google / contraseña, con passkey, con 2FA, con token de API | `account`, `passkey`, `twoFactor`, `users.apiTokens` |
| Idioma y país | Distribución | `users.language`, `users.country` |
| Cuentas recientes | 25 con más actividad: correo enmascarado, alta, última actividad, acceso, país y conteos | Combinación de lo anterior |

### Limitaciones conocidas (honestidad de los números)
- **Documentos iniciales**: cada cuenta nueva recibe una transacción, categoría, subcategoría, cuenta, etiqueta y presupuesto de arranque (`provisionNewUserData.ts`). Se excluyen por **nombre** (terminan en `first transaction`, `First Category`, `First Sub Category`, `General Account`, `First Tag`, `First Budget`). Si un usuario renombra o crea algo con ese nombre exacto, no se cuenta. Es una heurística; lo ideal es marcar los documentos de arranque con un campo (cambio de esquema → requiere aprobación).
- **Sesiones**: Better Auth borra las sesiones al vencer o cerrar sesión; "sesión activa" se queda corta hacia atrás. La actividad durable es "añadió datos".
- **"Activo" = guardó datos**, no "abrió la app". Para medir aperturas haría falta registrar eventos (ver Fase 3).
- **Zona horaria**: las series usan días **UTC**.
- **Escala**: la Fase 1 agrupa en el servidor y recorre todos los usuarios; está bien para miles de usuarios. Con decenas de miles hay que pasar a agregaciones por lotes o a un resumen diario guardado (Fase 2).
- **"Tipo de usuario"**: hoy no existe plan (Free/Pro). Cuando exista suscripción, se agrega el plan como dimensión.
- **`users.country` / `language`**: solo existen si la persona los eligió en el perfil.

## 5. Fases y modo de desarrollo

### Modo de desarrollo (reglas de trabajo)
- Una fase = una rama/commit propio, con pruebas y `npx tsc --noEmit` en verde antes de pasar a la siguiente.
- **Lectura solamente** salvo aprobación explícita; toda escritura/migración a la BD se pregunta antes (regla del proyecto).
- Lógica numérica en funciones **puras con pruebas** (`statsMath.ts`); lecturas a BD aisladas (`platformStats.ts`); UI sin lógica de negocio.
- Nada de datos personales en el panel; si una fase necesita detalle por usuario, se diseña con registro de auditoría y aprobación.
- Verificar siempre en el navegador real (Chrome del usuario) con la cuenta admin.
- Cada fase actualiza este documento.

| Fase | Contenido | Estado |
|---|---|---|
| **1 — Panel base** | Acceso por `ADMIN_EMAILS`, 404 para no admin, step-up 2FA, métricas de la sección 4, pruebas | **Construida** (falta activar `ADMIN_EMAILS` y verificar en el navegador) |
| **2 — Tendencias y retención** | Cohortes semanales de altas y retención a 1/4/8 semanas; actividad semanal (WAU/MAU); resumen diario guardado para escalar (requiere crear colección → **aprobación de BD**); filtros por rango de fechas; exportar CSV de agregados | Pendiente |
| **3 — Eventos de uso** | Registrar aperturas, pantallas más usadas, uso de importación de estados con IA, uso de MCP/API tokens (nueva colección → **aprobación de BD**, aviso de privacidad y opt-out) | Pendiente |
| **4 — Panel de rendimiento (separado)** | Velocidad: Web Vitals (LCP/INP/CLS), tiempos de rutas de API (p50/p95), errores 4xx/5xx, tiempos de las consultas a Mongo, costo/tiempo de extracción con IA; vía Vercel Analytics/Speed Insights y/o logs; panel aparte en `/admin/rendimiento` | Pendiente |
| **5 — Ingresos** | Cuando exista suscripción: plan por usuario, MRR/ARR, conversión Free→Pro, churn, uso de la prueba gratis; ligado a `Obtención de ingresos Gastify.md` | Pendiente (depende del cobro) |
| **6 — Acciones de administración** | Lo que ya no es solo lectura (suspender cuentas, ver un usuario a detalle, soporte); **registro de auditoría obligatorio** y confirmaciones | Pendiente (decisión de producto) |

## 6. Cómo activarla (lo hace el dueño)

1. Añadir a `.env` (local) y a las variables de entorno de Vercel (producción):
   ```
   ADMIN_EMAILS=tu-correo-de-la-cuenta-de-gastify@ejemplo.com
   ```
   (varios admins, si algún día: separados por coma). Debe ser **el correo de la cuenta de Gastify**, no necesariamente el de Git/Claude.
2. Reiniciar el servidor (`npm run dev`).
3. Entrar con esa cuenta, pasar el 2FA, y abrir `http://localhost:3000/admin`.
4. Comprobar que **otra cuenta** (p. ej. la QA de `.mds/QA_ACCOUNT.md`) recibe **404** en `/admin`.

## 7. Archivos de la Fase 1

- `src/lib/admin/adminAccess.ts` (+ test) — lista de admins.
- `src/lib/admin/statsMath.ts` (+ test) — funciones puras (cubetas, percentiles, series, activación, enmascarar correo, top).
- `src/lib/admin/platformStats.ts` — lecturas a BD (solo lectura).
- `src/app/admin/layout.tsx` — compuertas y marco.
- `src/app/admin/page.tsx` — panel.
- `src/proxy.ts` — el *matcher* ahora incluye `/admin/:path*`.

## 8. Preguntas abiertas para el dueño

1. ¿Cuál es el correo exacto de tu cuenta de Gastify para `ADMIN_EMAILS`?
2. ¿Quieres un enlace "Admin" visible en la barra solo para ti? (hoy se entra por URL).
3. ¿Se ve bien el correo enmascarado, o prefieres el completo (solo para ti)? Por defecto se enmascara.
4. ¿Aprobar cuando toque: marcar con un campo los documentos de arranque (más exacto), guardar resúmenes diarios (Fase 2), o registrar eventos de uso (Fase 3)? Cada uno es una escritura/cambio de esquema en la BD.
5. ¿Qué es "tipo" de usuario para ti además del acceso (Google/contraseña), país e idioma? Por ejemplo: freelancer/RESICO vs. personal, cuando exista.
6. Performance: ¿Vercel Analytics/Speed Insights (costo/plan) o mediciones propias?
