# Publicación de la app móvil: lista de verificación

Estado al 2026-10-20. Nada de esto se ha publicado: la publicación necesita tus cuentas de pago y tu visto bueno en cada paso.

## Ya preparado (en la rama `mobile-phase-8-publicacion`)
- `apps/mobile/eas.json` con los perfiles `development` (build de desarrollo, sirve para Google y passkey), `preview` (distribución interna) y `production` (con `autoIncrement`).
- El envío a tiendas queda sin configurar a propósito (`submit.production` vacío).

## Lo que necesito de ti
1. **Apple Developer Program** (99 USD al año). Con el Team ID hay que poner `APPLE_TEAM_ID` en Vercel: sin eso `/.well-known/apple-app-site-association` responde 404 y los passkeys no funcionan en iPhone.
2. **Google Play Console** (25 USD, pago único). Con la huella SHA-256 de la llave de firma hay que poner `ANDROID_CERT_SHA256` en Vercel (sirve `assetlinks.json`).
3. **Identificador de la app**: hoy es `com.yayometro.gastify` (valor por defecto). Cámbialo antes del primer build de producción; no se puede cambiar después en las tiendas.
4. **Cuenta de Expo** (`yayometro`): para `eas build` y `eas submit` hace falta sesión iniciada en tu Mac (`npx eas-cli login`). No lo hice por ti.

## Requisitos de las tiendas que faltan en la app
- **Borrar la cuenta desde la app** (Apple lo exige a las apps con cuentas). El web ya lo tiene en Perfil; en el móvil la sección Perfil sigue como "Próximamente".
- **Sign in with Apple**: al ofrecer "Continuar con Google" en iOS, Apple pide también "Iniciar sesión con Apple".
- **Íconos y splash**: siguen siendo los de la plantilla de Expo (`apps/mobile/assets/images`). Hay que diseñarlos con la identidad de Gastify.
- **Aviso de privacidad**: hace falta una política publicada en una URL. Yo puedo redactar el borrador; la versión final la tienes que revisar tú (y, si aplica, un abogado).
- **Etiquetas de privacidad (App Store) y "Data safety" (Google Play)**: qué datos se recogen (correo, nombre, movimientos financieros, identificadores de sesión) y para qué.
- **Proyecciones** (fase 6): todavía no existe en la app.
- **Passkeys nativos y Face ID**: el código está, pero no se ha probado en un dispositivo real (requiere build de desarrollo y los dos puntos de arriba).

## Orden sugerido
1. Diseñar ícono y splash; redactar y publicar el aviso de privacidad.
2. Borrar cuenta desde la app y Sign in with Apple.
3. `npx eas-cli build --profile development` y probar Google y passkey en el iPhone.
4. `npx eas-cli build --profile preview` para TestFlight / prueba interna.
5. Solo cuando lo apruebes: `production` y el envío a las tiendas.
