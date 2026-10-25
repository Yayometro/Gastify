# Plan: plataforma multilenguaje (español / inglés)

Estado: **borrador para tu revisión (2026-10-23)**. No se ha tocado código. Los números marcados "estimado" son de orden de magnitud y se afinan con el inventario de la Fase 0.

## 1. Recomendación en una página

- **Una sola capa de traducción propia, pequeña, en `packages/core/src/i18n/`.** La usan la web, el móvil y el servidor. Hoy ya compartes textos por el core (`APP_INFO`), así que tiene el mismo sentido: una sola fuente, que web y móvil digan lo mismo.
- **Todos los textos viven en catálogos por tema** (`common`, `movements`, `budgets`, `errors`, `info`…), uno por idioma. El español es la fuente; el inglés se tipa contra él, así que **una clave que falte en inglés es un error de compilación**.
- **Rendimiento:** al navegador solo llega el idioma activo y solo los temas de la pantalla que se ve. Los textos de ayuda (`info`, ~51 KB hoy dentro del bundle) pasan a cargarse bajo demanda, con lo que el bundle inicial **debería bajar**, no subir.
- **El idioma se guarda en el usuario** (`User.language`) y en una cookie. Sin prefijo de URL (`/es/...`): la app vive detrás del login y solo hay 5 rutas públicas.
- **La migración va por zonas**, con un inventario automático primero y una regla de lint que impide volver a escribir texto a mano en lo ya migrado.

## 2. Punto de partida (lo que encontré)

| Tema | Hoy |
|---|---|
| Librerías de i18n | Ninguna (ni web, ni móvil, ni core). |
| Idioma de la página | `<html lang="en">` fijo en `src/app/layout.tsx`. |
| Idioma del usuario | No se guarda: el modelo `User` no tiene campo de idioma. |
| Textos web | Mezcla: etiquetas viejas en inglés ("Transactions details", "Filters"), componentes nuevos en español ("Resumen de transacciones"). |
| Textos móvil | Español. |
| Textos compartidos (core) | Español: `appInfo.ts` (68 entradas, 38 KB), `createInfo.ts` (12.7 KB), `budgetAlerts`, validaciones de formularios, etiquetas de filtros, etc. |
| Tamaño del trabajo | **Inventario real (Fase 0, 2026-10-24, [I18N_INVENTORY.md](I18N_INVENTORY.md)):** 2,788 apariciones de texto en 284 archivos, de las que **1,994 son textos distintos** (el trabajo de traducción cuenta cada distinto una vez). Web 1,545 · móvil 824 · core 419. Es un conteo de piso: no ve texto armado en piezas ni variables. |
| Mensajes del servidor | Las rutas devuelven texto y la UI lo muestra tal cual (`runNotify("error", error.message ...)`). |
| Formato de fechas/números | 6 llamadas con idioma fijo (`"es-MX"`, `"en-US"`), 5 sin idioma. `antd` y `dayjs` se ponen en español a mano en 2 componentes. |
| Textos ya compartidos | `info/appInfo` lo importan **38 archivos de la web y 35 del móvil**. |

## 3. Dónde viven los textos

```
packages/core/src/i18n/
  index.ts          t(), createTranslator(locale), plurales, tipos
  locales.ts        type Locale = "es" | "en"; DEFAULT_LOCALE; resolveLocale()
  format.ts         formateadores Intl con caché (fecha, número, relativo)
  messages/
    es/             common.ts  auth.ts  dashboard.ts  movements.ts  budgets.ts
                    accounts.ts  categories.ts  profile.ts  history.ts  analyzer.ts
                    projections.ts  notifications.ts  errors.ts  icons.ts  info.ts
    en/             (los mismos archivos)
  i18n.test.ts      paridad es/en, placeholders, plurales
```

- **Claves planas con punto:** `"movements.filters.clear": "Limpiar filtros"`. Planas porque se buscan con grep, se tipan fácil (`keyof`), se cargan por tema y se revisan bien en un diff.
- **El español define la forma** (`as const`); cada archivo en `en/` se tipa como `Record<keyof typeof es, string>`.
- **Variables:** `{name}`. **Plurales:** claves `_one` / `_other` resueltas con `Intl.PluralRules` (por ejemplo `movements.count_one` / `movements.count_other`). Sin ICU ni dependencias.
- **`info.ts`** es el actual `appInfo.ts` + `createInfo.ts`, pasados a catálogo y con su traducción al inglés.

## 4. Cómo se usa

| Dónde | Uso |
|---|---|
| Componente de servidor (web) | `const t = await getT("movements")` — sin costo en el navegador. |
| Componente de cliente (web) | `const t = useT()`; `t("movements.filters.clear")`; `t("movements.count", { count })`. |
| Móvil | La misma API `useT()`; el proveedor va en la raíz de la app. |
| Funciones puras del core | **No devuelven texto**, devuelven `{ key, params }` (por ejemplo `BudgetAlert.titleKey`) y la pantalla llama `t`. El core sigue puro y probable; los avisos guardados no dependen del idioma (ya tienen clave estable). |
| API | Responde `{ ok: false, code: "BUDGET_NAME_TAKEN", message: "<inglés de respaldo>" }`. El cliente muestra `t("errors.BUDGET_NAME_TAKEN")` y, si no existe la clave, el `message`. **Compatible hacia atrás:** ninguna ruta se rompe; se migran de una en una. |

## 5. Rendimiento

**Presupuesto (a medir antes/después):** runtime de traducción ≤ 2 KB gz; tema `common` ≤ 5 KB gz; el bundle inicial de `/dashboard` **no crece**.

1. **Solo el idioma activo viaja al navegador.** El otro nunca se descarga.
2. **Catálogos por tema.** El layout de cada zona (`/dashboard`, `/dashboard/movements`…) importa los suyos en el servidor y los pasa al proveedor; `common` va siempre.
3. **`info` se carga bajo demanda.** Hoy `APP_INFO` entra completo en el bundle porque 38 archivos lo importan. `InfoTip` pasará a recibir la clave (`<InfoTip id="filtros" />`) y descargará el tema `info` la primera vez que alguien abre un "?". En móvil: `require` diferido por idioma.
4. **`t()` es una búsqueda en un objeto.** La interpolación solo corre si hay variables; el plural se memoiza.
5. **Formateadores `Intl` con caché** por (idioma, opciones). Crear un `Intl.DateTimeFormat` es lo caro, y hoy se crean sueltos en cada llamada.
6. **Contexto estable.** `t` cambia de identidad solo al cambiar de idioma (un re-render, raro).
7. **Sin petición extra en el primer pintado:** los catálogos de la ruta van en la respuesta del servidor.
8. **Cookie en vez de prefijo de URL:** sin redirecciones ni trabajo extra en el middleware. **Costo conocido:** leer la cookie en el layout raíz vuelve dinámicas las páginas públicas (login, registro). Son pequeñas, pero se medirá.
9. **Cómo se mide:** tabla de tamaños de `next build` por ruta, antes y después, y `@next/bundle-analyzer`.

## 6. Idioma del usuario

- **Campo nuevo `User.language: "es" | "en"`** (opcional; vacío = detectar). Sale por `update-user` y `toPublicUser`.
- **Web:** cookie `gf-locale` (1 año). El layout raíz la lee y fija `<html lang>`, el proveedor, `antd` `ConfigProvider locale` y `dayjs.locale` (hoy hay 2 sitios con español fijo: `HistoricalBaselinePanel` y `WalletAnalyzerView`; pasan al proveedor central).
- **Sin cookie:** `Accept-Language` (empieza con `en` → inglés; si no, español).
- **Cambiar:** selector en Perfil (web y móvil) y un interruptor chico en login/registro. Al cambiar se guarda cookie + servidor (si hay sesión) y se refresca la pantalla.
- **Móvil:** `SecureStore` + sincronía con `User.language`; primer arranque con `expo-localization`.

## 7. Qué NO se traduce

- **Datos del usuario:** nombres de movimientos, cuentas, presupuestos y categorías creadas por él.
- **Categorías por defecto:** se crean al registrarse **en el idioma elegido** (`provisionNewUserData`). Las ya creadas no se tocan (hoy están en inglés: Electronics, House, Food…).
- Bancos y códigos de moneda.
- Herramientas MCP (para asistentes de IA) y logs: se quedan en inglés.
- **Formato de moneda:** sigue el `locale` de cada moneda (`MXN` → `es-MX`, `USD` → `en-US`). Los separadores son iguales en español e inglés, así que no se nota; se revisa si se agregan otras monedas.
- **Búsqueda de iconos:** `spanishKeywords.ts` pasa al tema `icons` con una lista por idioma, y la búsqueda mira **ambos** idiomas siempre.

## 8. Fases

| Fase | Qué se hace | Termina cuando | Estimado |
|---|---|---|---|
| 0. Inventario | Script `scripts/i18n-scan.mjs` (AST: texto en JSX, `placeholder/title/aria-label/alt`, `message:`/`error:` en API, `Alert.alert`, plantillas con texto). Salida: tabla por zona (las 21 historias de la migración TS) en `.mds/I18N_INVENTORY.md`. | Hay un conteo real y un checklist por zona. | 0.5–1 día |
| 1. Infraestructura + una rebanada completa | Módulo i18n en core; proveedores web y móvil; `User.language`; cookie; selector en Perfil; **una pantalla de punta a punta** (Movements en web y su equivalente móvil) + `common`. | Cambia de idioma sin recargar a mano, `lang` correcto, sin parpadeo, dentro del presupuesto de bytes. | 1–2 días |
| 2. Core compartido | `info` a catálogo con carga diferida; `budgetAlerts`; validaciones (`profileForm`, `accountForm`, `budgetForm`, `movementForm`); etiquetas (`movementFilters`, `monthSummary`, `projectionsChange`, `walletAnalyzer`, `budgetHistoricalComparative`, `monthlySeries`); iconos. | Las pruebas del core pasan y ningún módulo del core devuelve texto fijo. | 2–3 días |
| 3. Pantallas web | Por zona: dashboard, movements, budgets, accounts, categories, profile, history, analyzer, projections, login/auth, navbar/quick-add. Al terminar cada carpeta se activa la regla de lint. | Cero texto fijo en las carpetas migradas. | 3–5 días |
| 4. Pantallas móvil | Por zona, **en paralelo a la 3**: comparten catálogo. | Igual. | 2–4 días |
| 5. API | Códigos de error por ruta + tema `errors`. Revisar si hay correos o notificaciones push (no encontré envío de correos; el push de Expo falta revisarlo). | La UI muestra errores en el idioma del usuario. | 1–2 días |
| 6. Cierre | Seudo-idioma, claves sin uso, medición final, guía de 10 líneas "cómo agregar un texto". | Medición dentro del presupuesto y guía escrita. | 1 día |

Total estimado: **10–18 días de trabajo** con IA ayudando y tu revisión del inglés. Se afina con el inventario.

## 9. Calidad: cómo evitamos que se rompa

- **Pruebas (vitest):** mismas claves en `es` y `en`; mismos `{placeholders}`; `_one` y `_other` completos; sin cadenas vacías ni claves repetidas.
- **TypeScript:** una clave inexistente en `t("...")` no compila.
- **ESLint:** `no-literal-string` (`eslint-plugin-i18next` o una regla propia chica), activado **por carpeta** al migrarla.
- **Seudo-idioma `xx`** (acentos y 40 % más largo, tipo `[!! Ĺímpíár fíltróś !!]`): en una pasada se ve qué texto quedó sin traducir y qué layout desborda.
- **Script de claves sin uso** al cierre.

## 10. Glosario y flujo de traducción

- **El español es la fuente.** El inglés lo redacta la IA por tema, con un glosario fijo, y tú lo revisas. (Si quieres seguir comparando modelos, este es un buen caso: se puede medir calidad por tema.)
- **Glosario a decidir antes de traducir** (hoy la web y el móvil no coinciden):
  - movimiento → ¿"transaction" o "movement"? (web: "Transactions"; móvil: "Movimientos")
  - gasto → ¿"expense" o "bill"? (web: "Bills")
  - presupuesto → budget; ahorro → saving; cuenta → account; categoría → category; ingreso → income.

## 11. Decisiones abiertas (con mi recomendación)

1. **Capa propia o `next-intl` / `i18next`.** Recomiendo **propia**. Comparación (pesos de orden de magnitud, sin medir aquí):

   | Opción | Peso en el navegador | Web (servidor y cliente) | Móvil | Core y servidor | Plurales |
   |---|---|---|---|---|---|
   | Propia (recomendada) | ~1 KB | Sí | Sí | Sí (el mismo módulo) | `Intl.PluralRules` |
   | `next-intl` | ~6–10 KB | Muy buena (RSC) | No | Parcial | ICU |
   | `i18next` + `react-i18next` | ~15–25 KB | Sí | Sí | Sí | Sí |

   Los catálogos planos se pueden exportar a JSON si algún día quieres cambiar de librería o usar un servicio de traducción.
2. **Idioma por defecto:** español, detectando inglés por `Accept-Language`.
3. **Sin prefijo de URL** (`/es`, `/en`). Si algún día hace falta SEO en la página pública, se agrega `?lang=` o prefijo solo ahí.
4. **Categorías por defecto** en el idioma elegido al registrarse; las existentes no cambian.
5. **Glosario del inglés** (sección 10).
6. **Contrato de errores con `code`** en las rutas (sección 4).
7. **Formato de moneda por moneda**, sin cambios.
8. **Quién revisa el inglés** y en qué momento (por tema, al cerrar cada fase).

## 12. Lo que no verifiqué

- Cuánto texto hay en la página de inicio (`/`) y en las páginas de login/registro.
- Si el móvil manda notificaciones push con texto armado en el servidor.
- Cuántas pantallas de la web reciben texto directo del servidor además de `error.message`.
