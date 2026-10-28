# Plan: panel de administrador de la plataforma (`/admin`)

> Creado 2026-10-28 por Claude Sonnet 5.5. Actualizado 2026-10-28 (fases 1 a 6 construidas). Rama: `feat/admin-dashboard`.
> Aprobaciones del dueño: fase 2 (nuevas colecciones) y "todo el proyecto", con su correo como administrador.

## 1. Objetivo

Subproducto de Gastify que solo ve el administrador (la cuenta del dueño). Responde, a nivel plataforma y de cuentas:

- Cuántos usuarios hay y de qué tipo (acceso, seguridad, país, idioma).
- Qué tanto usan la app (actividad, transacciones por usuario, ritmo, retención, cohortes).
- Qué tienen creado (transacciones, categorías, cuentas, presupuestos, etiquetas).
- Rendimiento de la app (rutas de API y Web Vitals), en su propio panel.
- Ingresos (planes y su precio cuando exista cobro).
- Acciones sobre una cuenta, con auditoría.

Alimenta `.mds/Obtención de ingresos Gastify.md`: sin activación, retención y uso real no se puede fijar precio ni plan gratis.

## 2. Quién es administrador

Lista en la variable de entorno **`ADMIN_EMAILS`** (correos separados por coma). Nada se guarda en la base de datos, así que ninguna ruta de perfil ni llamada de Better Auth puede ascender a alguien a admin. Sin lista, nadie es admin.

- Local: `.env` (no va a git) → `ADMIN_EMAILS=gsfrido10@gmail.com`.
- Producción (Vercel): **falta agregarla** en las variables de entorno del proyecto. Sin eso, `/admin` da 404 en producción a todos.

## 3. Seguridad y privacidad

1. **Compuertas**: `proxy.ts` pide cookie de sesión a `/admin/*`; el layout exige sesión real, correo en la lista y 2FA reciente; cada ruta de API y acción de servidor repite la misma comprobación (`src/lib/admin/guard.ts`).
2. **404 idéntico** para quien no es admin; sin sesión, a `/login`. `noindex`.
3. **Solo agregados y fechas.** El panel no lee montos, nombres de transacciones, correos completos ni hashes de tokens de API. El correo se muestra enmascarado (`gs***@gmail.com`).
4. **Métricas sin personas.** `admin_metrics_daily` guarda contadores e histogramas por (evento o ruta, día). **No guarda ningún id de usuario**. Las visitas al dashboard se cuentan por día, sin saber quién.
5. **Vitals**: solo se envían de una muestra (25%) de visitas de usuarios con sesión; el endpoint rechaza anónimos (401) y valida nombre y valor.
6. **Auditoría** (`admin_audit`): cada acción queda con el correo del admin, el id de la cuenta afectada y el detalle. No se edita ni se borra desde el panel.
7. **Autoprotección**: el panel no deja cerrar las sesiones de la propia cuenta del admin (evita quedarse fuera).
8. **Exportación CSV** solo de agregados.

## 4. Lo construido (fases)

| Fase | Contenido | Estado |
|---|---|---|
| **1 — Panel base** | Acceso por `ADMIN_EMAILS`, 404, 2FA, métricas base (usuarios, activación, actividad, transacciones por usuario, creado, tipo de acceso, idioma/país, cuentas recientes) | **Hecha** |
| **2 — Tendencias y retención** | Rango 7/30/90 días; cohortes semanales (12 semanas) con retención en semana 1, 2 y 4 (solo cuando la ventana ya terminó); actividad semanal (WAU, MAU, relación WAU/MAU); **snapshot diario** en `admin_snapshots` (se guarda al abrir el panel); exportación CSV (diario, cohortes, rutas) | **Hecha** |
| **3 — Eventos de uso** | Contadores diarios: `dashboard.visit` (visitas a la billetera), `template.upload` (carga de plantilla de Excel), `mcp.call` (llamadas de agentes MCP / tokens de API) | **Hecha** (sin embudo ni "usuarios únicos" por diseño de privacidad) |
| **4 — Rendimiento (panel aparte)** | `/admin/rendimiento`: por ruta, peticiones, errores, promedio, p50 y p95 aproximados, máximo; Web Vitals (LCP, INP, CLS) con reparto bueno/mejorable/malo y p75 aproximado. Rutas instrumentadas: `session-status`, `transactions.list`, `wallet.get`, `files.upload` | **Hecha** |
| **5 — Ingresos** | `/admin/ingresos`: cuentas por plan (gratis / pro), precio y MRR cuando se definan; lista de lo que medirá cuando haya cobro. Precios en `src/lib/admin/plans.ts` (`null` = sin precio definido) | **Hecha como base**. Sin cobro, MRR/ARR/conversión/churn aún no existen |
| **6 — Acciones de administración** | `/admin/usuarios/[id]`: detalle de cuenta (conteos, acceso, perfil, auditoría de la cuenta); acción **cerrar todas las sesiones** con confirmación y auditoría; `/admin/auditoría` | **Hecha**. La acción aún no se ha probado en vivo (ver sección 6) |

### Navegación
`/admin` (resumen) · `/admin/rendimiento` · `/admin/ingresos` · `/admin/auditoria` · `/admin/usuarios/[id]`.
Identidad visual: fondo `walllet-bg` + `DashboardBackdrop`, tarjetas `gf-glass-card`, pestañas `gf-glass-inset` / `gf-glass-button`, logotipo según tema.

### Archivos principales
- `src/lib/admin/adminAccess.ts` — lista de admins (+ test).
- `src/lib/admin/guard.ts` — comprobación para rutas y acciones.
- `src/lib/admin/statsMath.ts` — funciones puras: cubetas, percentiles, series, activación, cohortes, WAU, histogramas (+ test).
- `src/lib/admin/metricsMath.ts` — lectura de métricas: rutas, vitals, uso (+ test).
- `src/lib/admin/metrics.ts` — escritura best-effort de contadores (`countUsage`, `recordRouteTiming`, `recordVital`) y lectura.
- `src/lib/admin/timing.ts` — `withRouteTiming` (mide después de responder, con `after`).
- `src/lib/admin/platformStats.ts` — lecturas de la plataforma: resumen, rendimiento, detalle de cuenta.
- `src/lib/admin/audit.ts`, `snapshots.ts`, `plans.ts`, `csv.ts` (+ test), `adminDb.ts`.
- `src/app/admin/*` — layout, páginas, acción `usuarios/[id]/actions.ts`.
- `src/app/api/admin/export/route.ts`, `src/app/api/admin/vitals/route.ts`.
- `src/components/admin/*` — `AdminUi`, `AdminChrome`, `ConfirmSubmitButton`, `WebVitalsReporter`.
- Instrumentación: `dashboard/layout.tsx` (visita), `files/upload/[id]/route.ts`, `mcp/route.ts`, `mcp/[token]/route.ts`, `session-status`, `get-transactions`, `get-wallet`.

## 5. Colecciones nuevas en la base (escrituras)

| Colección | Qué guarda | Quién escribe |
|---|---|---|
| `admin_metrics_daily` | Contadores e histogramas por (evento o ruta o métrica, día). Sin ids de usuario | Visitas, cargas, MCP, tiempos de rutas, vitals |
| `admin_snapshots` | Un registro por día: usuarios, transacciones, WAU, MAU | Al abrir `/admin` (último del día gana) |
| `admin_audit` | Acciones de administración | Acción de cerrar sesiones |

Además la acción de cerrar sesiones **borra documentos** de la colección `session` de Better Auth para la cuenta elegida.

> **Ojo**: el `.env` local apunta al clúster `GastifyDB` de Atlas, que es la misma base que usa la app. Estas escrituras llegan a esa base.

## 6. Pendientes y verificación

- **Probar la acción de cerrar sesiones** en la cuenta QA (`qa.movil.d6be4e@example.com`, que aparece como `qa***@example.com`): el botón pide confirmación nativa del navegador y no se pudo probar desde la herramienta. Esperar el resultado: "Sesiones cerradas: N" y un registro en `/admin/auditoria`.
- **Variable en Vercel**: agregar `ADMIN_EMAILS` en producción.
- **Precios**: definir `LIST_PRICE_MXN.pro` en `plans.ts` cuando se decida (ver `.mds/Obtención de ingresos Gastify.md`).
- **Vitals**: se llenan con las visitas reales (25%). Verificar tras algunos días de uso.
- **Limitaciones conocidas**:
  - Los documentos de arranque de cada cuenta se excluyen por nombre (heurística). Mejor: marcarlos con un campo (cambio de esquema, requiere aprobación).
  - Las sesiones se borran al vencer; "sesión activa" se queda corta hacia atrás.
  - "Activo" = guardó datos, no abrió la app.
  - Días en UTC.
  - Cohortes y actividad recorren todas las transacciones en memoria: bien para miles de usuarios; con más, hace falta un resumen diario o agregación en base de datos.
  - Percentiles por histograma: aproximados (límite superior del bucket).
  - Las sesiones de sesión-estado (`session-status`) se llaman en cada sondeo; cada una cuenta. Si el volumen crece, muestrear.
- **Pendiente de decisión de producto**: lo que se permite a un admin más allá de cerrar sesiones (suspender, reembolsar, ver montos), y registrar un aviso de privacidad sobre los contadores.

## 7. Modo de desarrollo y verificación
- Lógica numérica en funciones puras con pruebas (`statsMath`, `metricsMath`, `csv`, `adminAccess`). 39+ pruebas del panel; toda la suite pasa.
- `tsc --noEmit` sin errores; eslint sin errores en el código nuevo.
- Build de Next en copia limpia (regla del proyecto para cambios de rutas).
- Verificado en Chrome con la cuenta admin: resumen, rendimiento, ingresos, auditoría, detalle (con el aviso de autoprotección). Sin sesión: redirige. Exportación sin sesión: 404. Vitals sin sesión: 401.
