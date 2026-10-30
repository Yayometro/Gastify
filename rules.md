# Reglas para agentes (Claude, Haiku, Gemini, Ollama…)

## Cuenta de pruebas compartida — NUNCA se borra

Todos los agentes de prueba usan **esta** cuenta. Es un usuario normal (no admin), creada el 2026-10-30 con aprobación del dueño. Con ella no necesitas pedirle al dueño que inicie sesión ni interrumpirlo.

- **Correo:** `qa.agentes.01e44d@example.com`
- **Contraseña, secreto TOTP y códigos de respaldo:** en `.env.test-account.local` (raíz del repo, **ignorado por git**), variables `SHARED_QA_EMAIL`, `SHARED_QA_PASSWORD`, `SHARED_QA_TOTP_SECRET`, `SHARED_QA_BACKUP_CODES`. Se dejan ahí y no en este archivo porque `rules.md` va a GitHub y la contraseña no debe subirse. Léelas con `grep '^SHARED_QA' .env.test-account.local`.
- **Segundo factor:** la app obliga a tener 2FA. Esta cuenta ya lo tiene (app autenticadora). El código de 6 dígitos de este momento se obtiene con:

```bash
node scripts/qa-totp.mjs
```

### Cómo entrar (web)

1. Servidor en `http://localhost:3000` (siempre `localhost`, no `127.0.0.1`: Better Auth solo confía en ese origen y responde 403 en otro).
2. `/login` → correo y contraseña. Si pide verificación, `node scripts/qa-totp.mjs` y pega el código.
3. Las cookies de `localhost` se comparten entre puertos y pestañas: iniciar sesión con esta cuenta cierra la sesión del dueño en ese navegador. Avísale si lo haces en su Chrome mientras lo está usando.
4. Por inactividad (15 min) o 12 h desde la última verificación vuelve a pedir el código: genera uno nuevo.

### Reglas de uso

1. **Nunca borrar** la cuenta ni cambiarle correo, contraseña o 2FA.
2. Se puede crear, editar y borrar **datos de prueba dentro de la cuenta** (movimientos, presupuestos, proyectos…). Deja los datos en un estado razonable al terminar.
3. No hacer escrituras en cuentas reales del dueño (`gsfrido10@gmail.com` ni ninguna otra). Esas siguen requiriendo su aprobación.
4. No pegar la contraseña, el secreto TOTP ni los códigos de respaldo en el chat, en commits, en logs del repo ni en reportes.
5. Registro de la cuenta y reglas generales de QA: `.mds/QA_ACCOUNT.md` (la cuenta `qa.movil.d6be4e@example.com` es la base del dueño, con 2FA suyo; no la uses).

## Flujo de trabajo de la ronda 5 (web)

Lista maestra: `.mds/TUTORIAL_FEEDBACK_R5.md`. Un punto a la vez: el implementador (Haiku) lo hace y reporta, el auditor (Sonnet) lo verifica en el navegador, y solo entonces se pasa al siguiente. Sin commits ni push sin permiso del dueño.
