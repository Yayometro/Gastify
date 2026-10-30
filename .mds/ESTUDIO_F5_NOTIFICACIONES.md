# ESTUDIO F5 — Notificaciones push y por correo: qué hay que hacer y cuánto cuesta

Autor: Sonnet 5.5. Fecha de consulta de precios: 2026-10-30 (fuentes al final; los precios de terceros cambian, **verificar en la página oficial antes de contratar**). Es un estudio: no implementa nada.

## 1. Qué tenemos hoy (importante para no empezar de cero)
- La campana (web `NotificationsBell.tsx`, móvil `notifications.tsx`) muestra **avisos que se calculan en el cliente** al abrir la app (`useBudgetAlertList`, `packages/core/src/budgets/budgetAlerts`): presupuestos cerca del límite, excedidos, celebraciones. No hay avisos del servidor, ni tokens de dispositivo, ni envío de correo.
- Sí existe autenticación con Better Auth (correo+contraseña, Google/GitHub, 2FA TOTP, passkeys) y `emailVerified` en el usuario (hoy en `false` para cuentas nuevas: **no hay verificación de correo ni envío de correos transaccionales**).
- Hosting: el proyecto parece desplegarse en Vercel (hay integración con Vercel en el entorno y el dominio `mygastify.com`); **confirmar el plan real** (Hobby/Pro) porque condiciona los trabajos programados.
- La app móvil es Expo SDK 58 con dev-client; ya tiene `expo-notifications`? (verificar `apps/mobile/package.json`).

## 2. Qué notificaciones tendrían sentido (casos de uso)
1. **Operativas por correo (transaccionales):** verificar correo, restablecer contraseña, aviso de inicio de sesión nuevo/cambio de 2FA, borrado de cuenta. Hoy faltan y son las que más se esperan de una app de finanzas.
2. **Alertas de dinero (push móvil + correo opcional):** presupuesto al 80 %/100 %, gasto inusualmente grande, gasto recurrente variable por confirmar (F1), meta de ahorro alcanzada.
3. **Resúmenes periódicos (correo):** resumen semanal/mensual (existe un plan: `.mds/AI_MONTHLY_SUMMARY_PLAN.md`).
4. **Recordatorios:** «llevas 3 días sin registrar gastos», fecha de corte/pago de tarjeta (si se registra).

## 3. Tres canales y su costo
### 3.1 Push en la app móvil (Expo)
- **Servicio de Expo Push**: sin costo por mensaje según la FAQ oficial; se envían a `https://exp.host/--/api/v2/push/send` con el `ExpoPushToken` del dispositivo; Expo reenvía a FCM (Android) y APNs (iOS).
- **FCM (Google)**: gratis en todos los planes. **APNs (Apple)**: sin costo por mensaje; requiere **Apple Developer Program, 99 USD/año**, que de todos modos hace falta para publicar en la App Store. Android: cuenta de Google Play, pago único de 25 USD.
- Trabajo técnico: pedir permiso en la app (`expo-notifications`), guardar `ExpoPushToken` por dispositivo en el servidor (modelo `PushDevice {user, token, platform, lastSeen}`), rutas para registrar/borrar token (al cerrar sesión), canal Android, preferencias por tipo en Perfil, recibos de envío (tickets/receipts de Expo) para limpiar tokens inválidos, manejo de «tap» (deep link a la pantalla: presupuestos, confirmar recurrente). En desarrollo: Expo Go no soporta push remoto en Android desde SDK 53 → hay que usar el dev-client ya existente.
- **Costo: 0 USD por mensaje**; 99 USD/año Apple (ya necesario para publicar).

### 3.2 Push en la web (navegador)
- Web Push con **VAPID** (gratis; sin proveedor externo; librería `web-push`) + Service Worker. Chrome/Firefox/Edge: funciona con la pestaña cerrada. **iOS Safari: solo si la persona instala la web en la pantalla de inicio (PWA)** y acepta el permiso (iOS ≥ 16.4); no es práctico para todos. Requiere HTTPS (ok en producción).
- Trabajo: manifest PWA + service worker, suscripción por navegador (`PushSubscription` por dispositivo), rutas de alta/baja, envío con `web-push` desde el servidor, preferencias.
- **Costo: 0 USD** (solo desarrollo). Prioridad menor que móvil.

### 3.3 Correo electrónico
Proveedores (precios consultados; verificar):
| Proveedor | Plan gratis | Primer plan de pago | Notas |
|---|---|---|---|
| **Resend** | 3,000 correos/mes, tope 100/día, 1 dominio, logs 30 días | ~20 USD/mes (50 k correos; ~35 USD 100 k) quita el tope diario | API moderna, plantillas React Email, muy simple con Next.js |
| **Amazon SES** | (sin plan gratis permanente fuera de AWS) | ~0.10 USD por 1,000 correos | Más barato a escala; más configuración (salida del sandbox, DKIM, bounces) |
| **Postmark / Mailgun / Brevo** | Brevo 300/día gratis; Mailgun/Postmark trials | desde ~15 USD/mes | Alternativas con buena entregabilidad |
| SendGrid | **quitó su plan gratis** | — | no recomendado hoy |
- Requisitos comunes: un **dominio propio** con registros **SPF, DKIM y DMARC** (si no, a spam); dirección remitente (`no-reply@mygastify.com`); baja/preferencias en correos no transaccionales (obligatorio por buenas prácticas y leyes: CAN-SPAM/LFPDPPP México); manejo de rebotes y quejas.
- Trabajo técnico: módulo `sendEmail()` en el servidor con plantillas ES/EN (React Email), cola simple con reintentos, rutas de Better Auth (`sendVerificationEmail`, `sendResetPassword` — la librería ya lo soporta con un callback), tabla de preferencias de notificación por usuario y de «suppression».
- **Costo realista:** 0 USD mientras sean < 100 correos/día (Resend free); 20 USD/mes a partir de miles de usuarios activos. Un dominio ya se paga.

## 4. El punto de fondo: quién dispara los avisos (programación)
Los avisos que dependen del tiempo (resumen semanal, recordatorios, gasto recurrente que toca hoy aunque la persona no abra la app) necesitan un **trabajo programado** en el servidor:
- **Vercel Cron**: en plan **Hobby solo 1 vez al día** (con ventana de hasta 1 h de imprecisión); en **Pro** hasta cada minuto (Pro cuesta 20 USD/mes por miembro). Un cron diario es suficiente para: resumen semanal/mensual, recurrentes del día, recordatorios.
- Alternativas gratuitas/baratas si se queda en Hobby: Upstash QStash (plan gratis ~500 mensajes/día), GitHub Actions programado (gratis, mín. 5 min), cron-job.org. 
- Las alertas por evento (presupuesto al 100 %) **no necesitan cron**: se disparan en la ruta que crea el movimiento (`new-transaction`) al detectar el cruce de umbral, enviando el push/correo en ese momento (y deduplicando para no enviar el mismo aviso dos veces).
- **Sin cron**, las notificaciones son «cuando abras la app» (como hoy, y como el catch-up de F1).

## 5. Modelo de datos y arquitectura recomendada (mínima)
```
NotificationPreference { user, channel: 'push'|'email', type: 'budget_alert'|'recurring_due'|'weekly_summary'|'security', enabled, quietHours? }
PushDevice { user, platform:'ios'|'android'|'web', token|subscription, lastSeen, enabled }
NotificationLog { user, type, dedupeKey, channel, sentAt, status }     // idempotencia y auditoría
```
Una función de dominio `notify(user, event)` decide canales según preferencias, deduplica por `dedupeKey` (p. ej. `budget:{id}:{period}:{80}`), y llama a `sendPush`/`sendEmail`. Las rutas existentes la invocan; el cron diario llama a `runDailyDigest()`.
Privacidad/seguridad: no incluir montos exactos en el texto del push si el teléfono está bloqueado (opción «mostrar detalles» desactivada por defecto); nunca incluir datos sensibles (números de cuenta) en correos; enlaces firmados de un solo uso para restablecer; límites de envío por usuario (anti-abuso).

## 6. Plan por fases y costos
| Fase | Qué | Esfuerzo | Costo |
|---|---|---|---|
| 1 | Correos transaccionales: verificación de correo, restablecer contraseña, aviso de login nuevo (Resend + dominio con SPF/DKIM/DMARC) | 2-3 días | 0 USD (free) |
| 2 | Push móvil (Expo) para alertas por evento: presupuesto, recurrentes variables | 3-5 días | 0 USD (+ 99 USD/año Apple ya necesario) |
| 3 | Cron diario (Vercel Cron o QStash) + resumen semanal por correo + recordatorios | 2-4 días | 0 USD en Hobby (1/día) o 20 USD/mes si se pasa a Pro |
| 4 | Preferencias en Perfil (web+móvil) y registro de bajas | 2 días | 0 |
| 5 | Web Push (PWA) | 3-5 días | 0 |
Total orientativo para fases 1-4: 9-14 días de implementación; **costo de operación inicial ≈ 0 USD/mes**; subiría a ~20-40 USD/mes al escalar (correo Pro + Vercel Pro).

## 7. Riesgos y decisiones para el dueño
1. ¿Plan de Vercel actual (Hobby/Pro)? Define la frecuencia del cron.
2. Dominio de envío y buzón (`no-reply@mygastify.com`): requiere acceso al DNS.
3. Cuenta de Apple Developer (99 USD/año): necesaria para push en iOS (y para publicar).
4. Qué avisos son «opt-in» y cuáles obligatorios (seguridad: siempre; el resto: preferencia).
5. Idioma/zona horaria del usuario para programar (el perfil tiene país/idioma).
6. Cumplimiento: aviso de privacidad y baja en correos no transaccionales.

## Fuentes (consultadas 2026-10-30)
- Resend: resumen de precios de terceros ([Resend Free Plan 2026](https://costbench.com/software/email-api/resend/free-plan/), [Resend pricing](https://automationatlas.io/answers/resend-pricing-explained-2026/)); verificar en resend.com/pricing.
- Expo push: [FAQ oficial de notificaciones push](https://docs.expo.dev/push-notifications/faq/); costos de APNs/FCM: comparativas ([Courier Expo vs APNs](https://www.courier.com/integrations/compare/apple-push-notification-vs-expo), [Expo vs FCM](https://www.courier.com/integrations/compare/expo-vs-firebase-fcm)).
- Vercel Cron: [uso y precios oficiales](https://vercel.com/docs/cron-jobs/usage-and-pricing) (Hobby: 1/día; Pro: por minuto).
- SendGrid sin plan gratis: [alternativas 2026](https://dreamlit.ai/blog/best-sendgrid-alternatives).
