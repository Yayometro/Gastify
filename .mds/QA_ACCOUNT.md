# Cuenta QA base de Gastify

Es la cuenta de pruebas que se conserva. Úsala para probar cualquier sección de la app con datos reales. **No se borra.**

- **Correo:** `qa.movil.d6be4e@example.com`
- **Contraseña y código de 2FA:** no están en este documento ni en ningún archivo versionado. Los tiene el dueño del proyecto. Nunca se pegan en el chat.
- **Segundo factor:** app autenticadora (código TOTP). Sin passkeys.
- **Qué tiene (conteo del 2026-10-27):** 3 cuentas, 130 movimientos, 9 presupuestos y la categoría predeterminada. Idioma y país aún sin guardar.

## Cuenta compartida de los agentes

Para pruebas automatizadas existe otra cuenta, normal y sin permisos de admin: `qa.agentes.01e44d@example.com`, con 2FA ya activado y códigos generables con `node scripts/qa-totp.mjs`. Detalles y credenciales (en `.env.test-account.local`, no versionado): `rules.md` en la raíz.

## Reglas

1. No borrar esta cuenta ni sus datos. Si una prueba necesita borrar algo, se hace en una cuenta desechable (regla 3).
2. Se permiten escrituras en esta cuenta (crear, editar, cambiar idioma, país o moneda) cuando el usuario las pide para una prueba. Cada escritura se anota en el registro de cambios de abajo.
3. Para pruebas desechables se crea una cuenta nueva con prefijo `qa.` (por ejemplo `qa.prueba.xxxxx@example.com`) y se borra al terminar, con aprobación del usuario.
4. Cualquier escritura en la base real fuera de esta cuenta requiere aprobación explícita del usuario.
5. Las credenciales nunca se copian a archivos versionados.

## Cómo entrar a probar

- **Web:** `http://localhost:3000/login` con `npm run dev` encendido.
- **Móvil:** Expo Go apuntando al servidor local (`apps/mobile/.env.local`, `EXPO_PUBLIC_API_URL`).
- Pide al dueño el código de la app autenticadora cuando haga falta. Las reglas de verificación aplican igual: 15 minutos sin actividad y 12 horas desde la última verificación.

## Cuentas de prueba antiguas

`.env.test-account.local` (ignorado por git) conserva variables `TEST_ACCOUNT_*` y `MANUAL_TEST_*`. Esos correos ya no existen en la base. No se usan para pruebas nuevas; el dueño decide cuándo limpiarlas.

## Registro de cambios

| Fecha | Quién | Qué cambió | Por qué |
|---|---|---|---|
| 2026-10-27 | Claude Code | Designada como cuenta QA base. Sin cambios de datos. | Pedido del usuario: una cuenta fija para pruebas generales. |
| 2026-10-27 | Claude Code, con permiso del usuario | Idioma `en` y país `AR`, escritos directamente en la base y leídos de vuelta. | Prueba de la escritura. No pasó por la interfaz porque no hay forma de iniciar sesión sin el código de la app autenticadora. |
| 2026-10-30 | Claude Code, con permiso del usuario | Creada `qa.agentes.01e44d@example.com` (usuario normal) y activado su 2FA (TOTP) vía API de Better Auth. | Pedido del usuario: una cuenta fija para todos los agentes de prueba, sin depender de él para iniciar sesión. |
