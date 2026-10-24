# Inventario de textos para la i18n

Generado el 2026-10-24 con `node scripts/i18n-scan.mjs`. Es la Fase 0 de [I18N_PLAN.md](I18N_PLAN.md).

Es un conteo de **piso**, no exacto: encuentra el texto JSX, los atributos que lee la persona, los mensajes de la API, los botones de `Alert.alert`, los avisos (`runNotify`, `toast`...) y los textos del core. No ve texto armado en piezas, texto que solo llega a la pantalla por una variable ni plantillas largas. Cada conteo es una cadena candidata; algunas son nombres de ejemplo o datos, no texto de interfaz.

## Totales

| Área | Archivos con texto | Textos |
|---|---:|---:|
| web | 3 | 5 |
| mobile | 6 | 6 |
| core | 1 | 1 |
| **Total** | **10** | **12** |

Textos distintos: 7 (un mismo texto aparece en varias pantallas; el trabajo de traducción cuenta una vez cada texto distinto).

Por tipo: texto JSX 0 · atributo visible 11 · mensaje de API 0 · Alert.alert 0 · aviso al usuario 0 · texto del core 1

## Inicio y pantallas públicas

Las páginas que se ven antes de entrar: `/` (inicio), `/login`, `/register` y `/verify-2fa`. Son las primeras que debe ver el usuario en su idioma.

_No se encontraron textos en la página de inicio._

Pantallas de autenticación (login, registro, 2FA, passkeys): 0 textos en 0 archivos.

## Por zona

| Zona | Archivos | Texto JSX | Atributos | API | Alertas | Avisos | Core | Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| wallet-analyzer | 2 | 0 | 4 | 0 | 0 | 0 | 0 | **4** |
| mobile/components/charts | 3 | 0 | 3 | 0 | 0 | 0 | 0 | **3** |
| budgets | 1 | 0 | 1 | 0 | 0 | 0 | 0 | **1** |
| mobile/app/raíz | 1 | 0 | 1 | 0 | 0 | 0 | 0 | **1** |
| mobile/components/home | 1 | 0 | 1 | 0 | 0 | 0 | 0 | **1** |
| mobile/components/movements | 1 | 0 | 1 | 0 | 0 | 0 | 0 | **1** |
| core/transformers | 1 | 0 | 0 | 0 | 0 | 0 | 1 | **1** |

## Checklist por zona

Cada archivo con sus textos. Marca la casilla cuando esté migrado y sin texto fijo.

<details><summary><strong>wallet-analyzer</strong> — 4 textos en 2 archivos</summary>

- [ ] `src/components/multiUsedComp/HistoricalWalletAnalyzer/HistoricalWalletAnalyzer.tsx` — 2 (atributo visible 2)
- [ ] `src/components/multiUsedComp/walletAnalyzer/WalletAnalyzerView.tsx` — 2 (atributo visible 2)

</details>

<details><summary><strong>mobile/components/charts</strong> — 3 textos en 3 archivos</summary>

- [ ] `apps/mobile/src/components/charts/category-bubbles.tsx` — 1 (atributo visible 1)
- [ ] `apps/mobile/src/components/charts/category-donut.tsx` — 1 (atributo visible 1)
- [ ] `apps/mobile/src/components/charts/category-treemap.tsx` — 1 (atributo visible 1)

</details>

<details><summary><strong>budgets</strong> — 1 textos en 1 archivos</summary>

- [ ] `src/components/multiUsedComp/Budgets/BudgetDetailModal.tsx` — 1 (atributo visible 1)

</details>

<details><summary><strong>mobile/app/raíz</strong> — 1 textos en 1 archivos</summary>

- [ ] `apps/mobile/src/app/notifications.tsx` — 1 (atributo visible 1)

</details>

<details><summary><strong>mobile/components/home</strong> — 1 textos en 1 archivos</summary>

- [ ] `apps/mobile/src/components/home/category-table.tsx` — 1 (atributo visible 1)

</details>

<details><summary><strong>mobile/components/movements</strong> — 1 textos en 1 archivos</summary>

- [ ] `apps/mobile/src/components/movements/movement-row.tsx` — 1 (atributo visible 1)

</details>

<details><summary><strong>core/transformers</strong> — 1 textos en 1 archivos</summary>

- [ ] `packages/core/src/transformers/walletAnalyzer.ts` — 1 (texto del core 1)

</details>

## Muestras de la página de inicio

Lo que se encontró en `/`, `/login`, `/register` y `/verify-2fa`, para revisar a mano:

## Límites del conteo

- **Qué sí cuenta:** texto JSX, atributos visibles, mensajes de la API (`message`, `error`, `new Error(...)`), botones y textos de `Alert.alert`, avisos al usuario, y en el core las claves `title`, `label`, `message`, `text`, `description`, `placeholder`, `tooltip`, `subtitle`, `emMessage`, `hint` y las validaciones `errors.campo = "..."`.
- **Qué no cuenta:** texto que se arma con concatenación o variables antes de mostrarse; textos dentro de `className`, claves y valores de datos; los nombres de categorías y bancos que vienen de la base de datos; los textos de `.js`/`.jsx` (ya no quedan en `src/`).
- **Falsos positivos posibles:** ejemplos en comentarios de código de prueba, nombres de iconos o de monedas que pasan la heurística. Se revisan al migrar la zona.
- **Zonas:** se asignan por el nombre del archivo y la carpeta. Un archivo compartido por dos pantallas cae en la primera zona que coincide; el listado completo está en el checklist.

