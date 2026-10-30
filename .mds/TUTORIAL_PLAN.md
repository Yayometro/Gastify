# Tutorial guiado de Gastify (`feat/tutorial`)

Estado: **construido (fases 1 a 5), pendiente de la prueba en vivo con una cuenta real** · 2026-10-28 · rama `feat/tutorial`, creada desde `origin/main` (incluye la landing rediseñada y la demo pública `/demo`).

## 1. Qué hace

1. **Puentes en la landing.** Un botón al final de cada capítulo lleva al siguiente: Cómo funciona → Herramientas → Tu IA → Demo → El siguiente paso es tuyo.
2. **Recorrido interactivo.** Se enfoca un elemento, se oscurece el resto y una tarjeta lo explica, paso a paso, en español e inglés. Funciona igual en `/demo` y en `/dashboard`, porque la demo reutiliza las pantallas reales.
3. **Un recorrido por página y uno general.** Cada una de las 9 secciones tiene el suyo y empieza con una tarjeta de bienvenida que dice dónde estás y cómo moverte. El **recorrido completo** encadena “Bienvenida” + las 9 secciones y navega solo entre ellas. Está siempre disponible, también para quien ya usa la app.
4. **Arranque automático solo para cuentas nuevas** (sesión 1 y 2), y un aviso único para las cuentas anteriores.

## 2. Decisiones tomadas

| # | Decisión | Resultado |
|---|---|---|
| 1 | Motor | **driver.js 1.10** (MIT, sin dependencias, ~8 KB comprimido). Se midió contra un motor propio: resuelve de fábrica lo más lento de escribir y probar (posicionamiento, hueco sobre el elemento, scroll, esperar componentes que cargan tarde, saltar anclas ausentes, foco atrapado, teclado, progreso). El catálogo de pasos es independiente del motor, así que se puede cambiar sin tocar los textos. shepherd.js queda descartado por su licencia AGPL |
| 2 | “Tu IA” → siguiente | Pasa por la **demo** (que explica la app por dentro) y de ahí al cierre |
| 3 | Sesión 2 | **Continuar donde me quedé** o **Empezar de nuevo** (más “Ahora no” y “No volver a mostrar”) |
| 4 | Cuentas anteriores | Sin arranque automático; **un aviso único** les dice que existe el tutorial y dónde está el botón |
| 5 | Estado | **En la base** (viaja entre dispositivos), con el estado del recorrido entre páginas en `sessionStorage` |
| 6 | `DemoFeatureGuide` de Codex | **Se conserva** y gana el botón “Recorrido guiado” |

Los textos de `shared.demo.guide.*` **no** se reutilizaron tal cual: hablan de “esta demo” y “datos ficticios”, y en la app real no aplica. Los textos de los pasos se escribieron nuevos, en el espacio `tour`.

## 3. Cómo está hecho

**Catálogo** — `packages/core/src/tour/tourSteps.ts` (TypeScript puro, sin React ni DOM, compartible con la app móvil): para cada tour, la lista de pasos con su `anchor` (valor de `data-tour`), un `fallback` (el teléfono oculta parte de la barra), si es `optional` y de qué lado va la tarjeta. Incluye `pageForPath` / `pathForPage` (app y demo) y el orden del recorrido completo.

**Reglas del estado** — `packages/core/src/tour/onboarding.ts` (puro): qué recuerda la cuenta y qué hace la app sola.

**Motor** — `src/components/tour/tourEngine.ts` (sin React, probado con un driver.js simulado): construye los pasos que se pueden mostrar, arranca en el paso indicado, encadena páginas, reporta progreso y fin del recorrido. `TourProvider.tsx` le da el idioma, el router y la ruta, y muestra el menú, la oferta de continuar y el aviso. `tour.css` viste la tarjeta con los tokens de Gastify (sigue claro/oscuro solo).

**Anclajes** — `data-tour="…"` en Navbar, Dashboard, Movimientos, Presupuestos, Proyecciones, Analizador, Cuentas, Historial, Categorías y Perfil (también en las variantes de la demo). Si un ancla no está en pantalla, el paso se omite; nunca se atora.

**Accesos** — botón “?” (Tutorial) en la barra, en el menú del teléfono; tarjeta “Tutorial” en el Perfil; botón “Recorrido guiado” en la tarjeta de la demo.

**Accesibilidad** — foco atrapado en la tarjeta y devuelto al cerrar, `Esc` cierra, flechas navegan, el hueco no se cierra con un clic perdido en el fondo, `prefers-reduced-motion` desactiva animación y scroll suave, la tarjeta de ayuda es un diálogo con foco.

## 4. Reglas del arranque automático

| Situación | Qué pasa |
|---|---|
| **Sesión 1** de una cuenta nueva | Se abre sola la Bienvenida (7 tarjetas); al final ofrece el recorrido completo |
| **Sesión 2**, tutorial a medias | Diálogo: **Continuar donde me quedé** · **Empezar de nuevo** · Ahora no · No volver a mostrar |
| **Sesión 2**, sin haberlo visto | Se abre la Bienvenida |
| **Sesión 3 en adelante**, o terminado, o descartado | Nada automático; solo el botón |
| Cuenta anterior al tutorial (sin registro) | Tarjeta discreta, una vez: “Nuevo: tutorial guiado” (Ver el recorrido completo / Entendido) |

Una “sesión” es un **inicio de sesión distinto**, no cada recarga ni cada pestaña (cuenta por el id de la sesión de Better Auth).

## 5. Estado en la base de datos

Campo `onboarding` en `User` (declarado en el esquema por la regla de campos estrictos de Mongoose), **sin valor por defecto**: ausente = cuenta anterior al tutorial.

```ts
onboarding?: {
  sessions: number;                       // inicios de sesión distintos vistos
  lastSessionId: string | null;           // para contar cada sesión una sola vez
  tutorial: "pending" | "done" | "dismissed";
  progress: { tour: string; step: string } | null;   // la última tarjeta mostrada
}
```

- Las cuentas **nuevas** reciben el registro al crearse (`provisionNewUserData`). Ninguna cuenta existente se toca.
- `POST /api/general-data/user/onboarding` (sesión verificada; la cuenta sale de la sesión, nunca del cuerpo; solo escribe `onboarding`): `state`, `visit` (cuenta la sesión una vez, escritura condicional), `progress` (solo tarjetas que existen), `complete`, `dismiss`, `announce`.
- Una cuenta anterior **no escribe nada** hasta que pulsa en el aviso.
- **No se ha escrito en ninguna base de datos** durante el desarrollo: todo se probó con la base simulada.

## 6. Verificado

- **Pruebas**: 909 pasan (eran 818). Nuevas: catálogo y paridad es/en, reglas del estado, almacenamiento del recorrido, ayudantes de DOM, motor (con driver.js simulado), proveedor (bienvenida, continuar, aviso, demo), llamada a la API, ruta `onboarding` (15 casos), esquema y alta de cuentas.
- **`tsc`** sin errores, **ESLint** sin errores nuevos, **`next build`** de producción (copia con `cp -cR node_modules`) terminó bien con las fases 1 a 4; ver el registro para el build final.
- **Chrome real** en `/demo`: menú, Bienvenida (7 pasos), recorrido de las 9 secciones, recorrido completo encadenando páginas, español e inglés, modo claro, vista de 390 px (barra inferior, “?” dentro del menú de la flecha), botón de la tarjeta de la demo, puentes de la landing con foco y desplazamiento, diálogo de continuar y aviso (vistos aparte).

## 7. Pendiente

1. **Prueba en vivo con una cuenta real** (necesita el código de la app autenticadora del dueño): arranque en cuenta nueva (sesión 1 → 2 → 3), aviso en cuenta anterior, tarjeta del Perfil. Las pantallas son las mismas que en la demo, y el estado está probado con pruebas, pero falta verlo con la base real. Escribir en la base **requiere tu aprobación** (usar una cuenta desechable `qa.`).
2. La app móvil (Expo) no tiene el tutorial; el catálogo y las reglas ya son compartibles.
3. Opcionales: recorrido de la propia landing; contadores del tutorial para el panel de administrador (`feat/admin-dashboard`, aún sin fusionar).

## 8. Notas y riesgos

- **Bug previo de la demo corregido** al probar: `Movements.tsx` y `TransactionItemList.tsx` formateaban `effectiveDate` de la tasa sin comprobar que existiera; los movimientos en otras monedas de la demo no la traen, y la tarjeta de movimientos del Dashboard y `/demo/history` se rompían con `Invalid time value`. Se añadió `shortDateOrEmpty` (núcleo, probado) y se usa en ambos sitios.
- **Ramas.** `feat/tutorial` sale de `origin/main`; `feat/admin-dashboard` sigue sin fusionar. Al fusionar ambas habrá que reconciliar `ProfileClient.tsx` (enlace de administrador y tarjeta de tutorial).
- Cuenta QA base: no se tocó; es una cuenta anterior al tutorial, así que verá el aviso único.

## Segunda ronda (2026-10-28): estado

- **Web: completo.** Cada página (Inicio, Movimientos, Presupuestos, Proyecciones, Analizador, Cuentas, Historial, Categorías, Perfil) tiene recorrido de página en orden visual y tutoriales a fondo por sección, con la brújula junto a cada título y el "?" primero en cada recorrido. Textos en es/en (`tour<Página>.ts`). Verificado en vivo en la Chrome del dueño (solo lectura) y en la demo (`/demo/*`); en Categorías se abrió el formulario sin guardar.
- **Motor del progreso:** mientras un panel o ventana que una tarjeta abre sigue cerrado, el contador dice «Paso N» y se vuelve exacto («N de M») cuando la ventana aparece.
- **App móvil (Expo): implementada, sin probar en simulador.** Núcleo en `packages/core/src/tour/mobileSteps.ts` (+ `geometry.ts`, `progress.ts`, `mobile/*.ts`) con textos `tourMobile` es/en. Motor en `apps/mobile/src/components/tour/` (registro de controles por id, recuadro de luz, tarjeta, menú, ofertas). Entradas: fila «Tutorial» en Más, brújula en el título de cada pantalla, ayuda «?» (`InfoTip`) marcada para la bienvenida.
- **Pendiente de decisión:** el proveedor móvil llama a `general-data/user/onboarding` (`visit`) al arrancar la app; eso escribe en la cuenta del dueño. No se ha probado en vivo; hace falta aprobación explícita antes de ejecutarlo contra cuentas reales.
- **Pendiente de verificación:** no hay runtime de iOS instalado (`xcrun simctl list runtimes` vacío), así que el tutorial móvil no se ha visto corriendo. `apps/mobile` no tiene configuración de ESLint (la raíz ignora `apps/**`), por eso `expo lint` no corre; el chequeo hecho fue `tsc --noEmit` (limpio) más `--noUnusedLocals` en los archivos tocados.
- Nada commiteado ni subido.

## Tercera ronda (2026-10-28): ajustes de compás, alineación, modales y paridad móvil

- **Compás:** sin círculo, más grande (web 24 px, móvil 26 px). El «?» (`InfoTip`) queda en la misma línea central. Se quitó el compás duplicado de Perfil.
- **Resumen de cuentas (dashboard):** explicación nueva (`resumen_de_cuentas`): tocar el nombre de una cuenta abre su detalle.
- **Analizador del dashboard:** un solo «?» (`analizador_resumen`) y «Ver análisis completo» arriba a la derecha, junto al título.
- **Modales:** el de Top 6 (`topModal`), el de cuenta y el de categoría tienen compás. Pendientes: detalle de un hallazgo, patrón semanal, líderes por mes, detalle de periodo de presupuesto y detalle histórico de presupuesto.
- **Móvil:** un recorrido por componente por sección (57 en total, un paso cada uno) con compás en las tarjetas con título. Anclas verificadas estáticamente contra el código. No probado en vivo.
- **Pendiente:** recorridos de varios pasos por componente en el móvil, para igualar al web; llamada `visit` del onboarding (requiere aprobación); prueba en simulador o Expo Go.

