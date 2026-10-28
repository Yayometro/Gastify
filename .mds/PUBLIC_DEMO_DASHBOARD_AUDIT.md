# Auditoría de diseño: demo pública fiel al Dashboard de Gastify

Fecha de revisión: 25 de octubre de 2026
Rama: `codex/public-dashboard-demo`
Alcance: documentar la dirección visual que gustó del demo y la interfaz real que debe gobernar la demo pública. Este documento precede a la reimplementación; no autoriza publicar ni mezclar cambios.

## 1. Dirección visual del demo actual que sí gustó

La demo actual tiene una identidad atractiva por mérito propio. Se conserva como referencia para posibles iteraciones futuras de Gastify, pero **no debe dictar la composición del producto que se anuncia**. La única excepción que el usuario aprobó para esta demo es mantener su fondo atmosférico; componentes, navegación, jerarquía y modales deben corresponder al Dashboard real.

### Paleta observada en el demo

Los valores provienen de `src/app/demo/demo.css` y `src/app/home.css`:

| Uso | Valor actual |
| --- | --- |
| Fondo profundo | `#140e25` |
| Panel translúcido | `rgba(40, 29, 64, .76)` |
| Panel elevado | `rgba(48, 35, 76, .86)` |
| Borde suave | `rgba(220, 204, 255, .12)` |
| Texto principal | `#f5f1fc` |
| Texto secundario | `#b5a9ca` |
| Acento lavanda | `#b792ff` |
| Bruma violeta | `rgba(117, 76, 202, .24)` |
| Bruma azul | `rgba(54, 109, 186, .17)` |
| Bruma fucsia | `rgba(180, 49, 151, .13)` |

Decisiones de estilo que el usuario dijo que le gustan: fondo oscuro con brumas multicolor discretas, paneles de vidrio ahumado, bordes finos, contraste lavanda sobre berenjena, resplandor violeta/fucsia/azul y sensación cuidada de producto premium. Se pueden proponer en futuras versiones del producto, pero aquí solo se preservará el fondo del demo.

### Tipografía y lenguaje visual del demo

- La aplicación carga Inter mediante `next/font/google` en `src/app/layout.tsx`; el demo también la hereda.
- La portada usa títulos grandes de peso 700, tracking negativo y acento lavanda; no trasladar esa escala editorial al dashboard.
- El demo tiene una escala propia de texto y widgets compactos, una sidebar de 238 px y controles hechos a medida. Aunque agradables, esos elementos son una interpretación y no son equivalentes a la navegación ni a la escala de Gastify.
- El demo usa iconos outline de Feather (`react-icons/fi`), una marca “G” inventada y navegación “Panorama / Movimientos / Presupuestos / Proyectos”. Deben sustituirse por los iconos, marca, nombres y distribución que emplea la aplicación.
- El formulario propio del demo usa inputs nativos y un modal independiente. No presentarlo como si fuera el modal real de Gastify.

### Captura solicitada del demo

**Pendiente por una restricción efectiva de Chrome.** La pestaña existente `http://localhost:3004/demo` está abierta, pero la política guardada del navegador denegó al agente observar el origen. El usuario después autorizó abrir otras pestañas, pero el control de navegador prohíbe obtener la misma captura mediante una superficie alterna o una ruta indirecta. No se fabricó una captura ni se guardó una imagen sustituta. Para cumplir esta parte hace falta que el permiso de lectura de Chrome para `localhost:3004` cambie realmente; una respuesta verbal no lo modificó.

## 2. Auditoría visual del Dashboard real

Se inspeccionó la sesión local abierta en Chrome en `http://localhost:3000/dashboard` (25-oct-2026). La observación visual fue transitoria y no se guardó como archivo porque la captura expone saldos y movimientos privados. El árbol de accesibilidad y la captura en pantalla confirmaron las siguientes secciones. Los datos del usuario no se trasladan a este documento ni a la demo.

### Composición y orden observados

1. **Shell:** lienzo de gradiente continuo; rail lateral angosto de iconos, perfil arriba, acción circular “+”, estado activo luminoso, notificaciones y controles inferiores. En móvil el mismo patrón cambia a la barra inferior flotante de Gastify. La demo mantiene esa disposición visual, pero usa destinos internos seguros y omite las acciones reales de perfil, notificaciones y alta.
2. **Wallet:** nombre del titular y “Wallet” centrados, de gran tamaño y peso ligero.
3. **Cabecera del periodo:** tres paneles de ancho coordinado: cuentas, resumen de ingresos/gastos/balance y comparativo con el periodo anterior. En pantallas pequeñas los paneles se recorren como un carrusel por página con puntos y flechas.
4. **Filtros:** selector de periodo más controles `Start` / `End` con flechas de periodo y calendario, alineados en una hilera compacta.
5. **Wallet Analyzer — resumen del mes:** tarjeta horizontal de hallazgos basada en el historial local, con avisos/variaciones/rachas/novedades y acceso a análisis completo.
6. **Accounts summary:** tarjetas horizontales reales por cuenta, con banco, tipo, moneda, saldo y flujos del periodo; no mini tarjetas inventadas con otra jerarquía.
7. **Transactions summary:** modos de visualización de Gastify (Bills/Income, Map/Bubbles/Ring, categorías/subcategorías), total y tarjetas de categoría clicables.
8. **Top 6 elements by month:** rango, botones 3/6/12/24, Bills/Incomes y listas Top de movimientos y categorías; tocar un elemento abre el detalle real.
9. **Wallet Budgets:** controles de periodo y pestañas `Budgets` / `Savings`, filas reales con icono, porcentaje, barra y carita/estado; tarjeta `Unbudgeted spending`; proyectos en su bloque separado.
10. **Transactions details / Movements:** filtros, categorías, búsqueda, selección, movimientos compactos y herramientas. El Dashboard incluye arriba el resumen del Wallet Analyzer; el analizador detallado es una ruta separada, no parte del Dashboard actual.

La página no es una “app de muestra” construida como un panel comercial aparte: es el propio Dashboard, con sus módulos y filtros reales alimentados por fixtures aislados.

### Sistema visual real observado en código

Fuentes canónicas: `src/app/globals.css`, `src/app/layout.tsx`, `src/app/ThemeProvider.tsx`, `src/components/styles/NavbarStyle.css` y `src/components/multiUsedComp/css/muliUsed.css`.

| Token / patrón | Valor o comportamiento |
| --- | --- |
| Fuente | Inter (`next/font/google`) |
| Fondo oscuro del Dashboard | base `#140b26`; mesh radial violeta, fucsia y púrpura, fijo al viewport |
| Fondo alternativo aprobado para la demo | `#140e25` + sus brumas azul/violeta/fucsia actuales |
| Fondo de contenido | transparente sobre el mismo mesh (sin una banda plana distinta) |
| Tokens de fondo/superficie | `--gf-bg: #180f2e`; `--gf-surface: #251a45`; `--gf-surface-2: #302354` |
| Texto | `--gf-text: #f3f0fb`; `--gf-text-muted: #ada0c9` |
| Borde/acento suave | `rgba(255,255,255,.1)`; acento suave violeta (`rgba(147,51,234,.18)`) |
| Primario de Ant Design | `#9700FF`; controles de análisis usan violeta `#9333ea` |
| Tarjeta de vidrio | degradado blanco translúcido, blur/saturación, brillo interior y sombra; no opaca |
| Filas | tinte de vidrio más leve, separación fina; hover añade luz en vez de bloque oscuro |
| Rail | vidrio esmerilado `rgba(255,255,255,.07)`, blur 20 px, borde de 10 %; desktop compacto y móvil inferior |
| Jerarquía | títulos del módulo centrados; contenidos densos en filas/tarjetas horizontales; números y estados usan color, icono y texto |
| Esquinas/espacio | tarjetas grandes `rounded-[32px]`; subpaneles y filas con radios menores; no hay una sidebar ancha de dashboard marketing |

No sustituir la identidad real por el gradiente propio del demo; conservar el fondo demo únicamente en la ruta pública `/demo`, de acuerdo con la excepción explícita del usuario. No cambiar los estilos de las páginas autenticadas.

### Widgets y modales reales que debe heredar la demo

El Dashboard renderiza y conecta estos componentes en `src/components/Dashboard.tsx`:

- `Navbar.tsx`: patrón del rail desktop / barra inferior móvil; en demo `DemoNavigation` conserva el orden y aspecto, sin destinos privados. El botón “+” abre una vista previa segura, no el formulario real conectado a mutaciones.
- `WalletAnalyzerTeaser`, `MultiCreditCard`, `ResumeTabsTrans`, `TopElementsContainer`, `TransDetailsGrandContainer`, `Movements` y `BudgetCont`.
- Modales de budgets: `BudgetDetailModal`, `ProjectBudgetDetailModal`, `BudgetEditModal`, `SpendingSummaryDetailModal`.
- Modales asociados a los resúmenes del Wallet Analyzer: detalles de insights disponibles desde `WalletAnalyzerInsightsStrip`. El analizador completo vive en `/dashboard/analyzer` y no lo agrega esta demo del Dashboard.
- Modales/herramientas de Movements: edición de movimiento, edición múltiple, quick edit, selector de categoría, duplicados/comparación, exportación y confirmaciones de borrado.

La demo no debe habilitar ninguna escritura a la API real. Las partes de lectura/análisis pueden usar los mismos componentes con un store efímero de datos ficticios; las acciones con mutaciones deben tener callback local de demo o quedar explícitamente deshabilitadas. No pasar correo/sesión real a esos componentes.

## 3. Diferencias que motivaron la implementación

- La versión inicial de la demo era una página editorial larga con aviso propio, sidebar inventada, resumen/analyzer compactos, paneles y formulario propios. Se conserva en código como referencia histórica, pero ya no se monta en `/demo`.
- La página `/demo` ahora monta el Dashboard real, sus módulos y modales de lectura; la navegación replica el rail/barra inferior en vez de llevar a rutas privadas.
- Los fixtures son datos sintéticos en esquema Redux de la app: dos años de movimientos, MXN/USD/JPY, cuentas, budgets, ahorro y proyecto; no se copiaron datos de la sesión real.

## 4. Arquitectura implementada para fidelidad y aislamiento

1. Home enlaza a `/demo` con `prefetch={false}`. `RouteProviders` usa imports dinámicos y deja `/` fuera de Redux, Ant Design y los proveedores de la aplicación autenticada; Dashboard/Redux se descargan al entrar a `/demo`, no en la portada.
2. `DemoAppProviders` crea un store Redux efímero por visita y carga exclusivamente `DEMO_SEED` (24 meses ficticios, 4 cuentas, MXN/USD/JPY, categorías, presupuestos, ahorro, proyecto y movimientos). El mes de muestra actual tiene 35 movimientos; los dos anteriores tienen 15 y 10, y el resto promedia 10. No pasa sesión ni correo; los slices empiezan en `succeeded` para saltarse las cargas automáticas.
3. Se reutiliza `src/components/Dashboard.tsx` y sus módulos/modales auténticos. Las rutas `/demo/profile`, `/demo/movements`, `/demo/budgets`, `/demo/analyzer`, `/demo/accounts`, `/demo/categories`, `/demo/history` y `/demo/projections` cargan los clientes reales en modos de solo lectura. Los detalles, filtros y periodos siguen interactivos; edición, alta y eliminación quedan ocultas/bloqueadas. Los tipos de cambio del ejemplo son constantes ficticias y se entregan como props para evitar consulta real de FX donde hay soporte local.
4. `DemoNetworkFence` intercepta `fetch` a rutas `/api/` y `/general-data/` antes de que salga de la pestaña. La demo no pasa correo/sesión real y los slices Redux ficticios evitan los `fetch*` automáticos. Cada ruta enlaza a destinos internos de `/demo`; el CTA de registro es la única navegación intencional fuera.
5. La muestra usa un store de datos ficticios y una copia versionada, por pestaña, en `localStorage`; el ID efímero vive en `sessionStorage`. No se leen ni escriben datos reales. `pagehide`, `beforeunload` y la limpieza del proveedor eliminan únicamente la clave de esa pestaña; filtros, formularios demo y modales nunca escriben a la API. Si storage está bloqueado o agotado, la demo sigue en memoria.
6. El fondo atmosférico de la demo anterior se conserva como excepción aprobada; el resto usa la navegación, jerarquía, módulos y modalería reales. El aviso fijo comunica que son datos de ejemplo.

### Verificación realizada y pendiente

- `npm run build` compila correctamente. En el build actual Next reporta `/` en **125 kB First Load JS** y `/demo` en **616 kB**; la portada mantiene su tamaño previo y no carga el Dashboard demo en su bundle inicial.
- `npm run typecheck`, `npm run lint`, `npm test -- --reporter=dot` (**108 archivos / 775 pruebas**) y `git diff --check` pasan. Lint/build muestran advertencias de hooks, sin errores bloqueantes.
- El servidor de preview en puerto 3004 devolvió `/demo` con HTTP 200 durante el desarrollo. Pendiente: comprobar visualmente la paridad en escritorio/móvil y abrir los detalles en Chrome.
- No se guardó una captura del dashboard real porque exponía datos financieros privados. La captura de `/demo` solicitada tampoco pudo capturarse: el permiso persistente de Chrome para leer `localhost:3004` sigue denegado aunque el usuario autorizó continuar. No se inventó una captura ni se recurrió a una vía alterna para eludir ese permiso.
- No hubo escritura a cuentas/datos de Gastify, commit, push, merge ni despliegue. La demo queda en una rama/worktree separados para que no se mezcle con el trabajo móvil.

## 5. Estado de implementación

- La implementación se inició en el worktree aislado `/Users/luisjairvazqueznavarrete/.codex/worktrees/pagina-home/Gastify`, rama `codex/public-dashboard-demo`; el checkout móvil principal quedó intacto.
- El Dashboard real se observó en `localhost:3000` sin persistir su screenshot por privacidad. La muestra nueva usa fixtures sintéticos, no capturas del usuario.
- Las rutas adicionales reutilizan `ProfileClient`, `MovementsClient`, `BudgetsClient`, `WalletAnalyzer`, `AccountClient`, `CategoriesClient`, `HistoryClient` y `ProjectionsClient`; perfiles/cuentas/categorías/movimientos/presupuestos/proyecciones usan los guardas de solo lectura y propósitos de demo.
- El único pendiente del ciclo es la inspección visual en el navegador. El usuario puede abrir el preview en `http://localhost:3004/demo`; el navegador del agente no puede leer ese origen bajo su permiso actual.
- Esta entrega aún no está aprobada para commit/push/merge/deploy.

## 6. Ajuste de traducciones e interfaz de navegación (25-oct-2026)

- `/demo` carga en su propio proveedor los catálogos que usan los componentes reales del Dashboard, para que sus textos no aparezcan como claves de traducción.
- El idioma inicial prioriza una selección guardada; en Vercel usa el país detectado por IP (`x-vercel-ip-country`) para elegir español en países hispanohablantes e inglés en otros países. Si el header no está disponible, usa el idioma preferido del navegador. La persona puede cambiar con el selector Español / English.
- En escritorio el menú es un rail compacto con el orden del Navbar real. El botón “+” queda después de Análisis y antes de Cuentas; en el dock móvil queda centrado como en la app. La flecha móvil despliega módulos del Dashboard demo. El “+” abre una vista previa de las ocho opciones del hub real.
- Verificado: cabeceras simuladas `US` y `MX`, preferencia cookie prioritaria, TypeScript/lint y 775 pruebas. El selector y el rail no habilitan endpoints ni acciones de escritura.

## 7. Hub “+” seguro y corrección de íconos (25-oct-2026)

- Los budgets ficticios pasan el objeto de categoría completo a `BudgetBarRow`, por lo que la vista comparte `name`, `color` e `icon` como en el store autenticado.
- El botón central abre `DemoCreateModal`, con las opciones que ofrece `AddTransactionModal` real. El modal es una vista previa demo y reutiliza iconos, traducciones, glass UI y el patrón de navegación; no monta formularios que mutan datos.
- En la opción de Excel, el contador permite ensayar de 1 a 50 movimientos. No importa archivos ni crea registros. CTA para guardarlos lleva a `/register`.
- La modal usa bloqueo de scroll, Escape, cierre al hacer clic fuera, foco y `aria-modal`; ninguno de los caminos ejecuta `fetch`, Redux dispatch, localStorage ni endpoints. Se conserva `DemoNetworkFence` como defensa adicional.
- El tab navigation mantiene la activación por `pathname`, no por scroll; la barra desktop ocupa el rail del Dashboard real y la barra inferior mantiene el “+” al centro. La hoja móvil abre la lista de destinos del Navbar de Gastify.

## 8. Revisión de navegación y secciones adicionales (25-oct-2026)

- La demo monta el `Navbar` real con `demoMode`: traduce destinos `/dashboard/*` a `/demo/*`, evita el formulario conectado del botón “+” y sustituye notificaciones reales por una muestra fija. Los estilos del rail se aplican al propio `nav` de Navbar; el panel móvil muestra/cierra opciones y usa `aria-expanded`.
- Se amplía el área de demo mediante imports dinámicos por sección. `/demo` sigue cargando primero solo Dashboard; las secciones se descargan al navegar a cada página demo, no desde Home.
- La ruta de perfil usa datos sintéticos (Alex Rivera, email `.test`, teléfono de ejemplo) y es de lectura. Movimientos, budgets, cuentas y categorías montan componentes existentes con `readOnly`; analyzer y projections reutilizan vistas existentes con tasas de ejemplo y controles de mutación ocultos. History no recibe email real.
- El proveedor separa un snapshot de `localStorage` con versión y clave única de pestaña. Lo retira al abandonar/cerrar la pestaña; no usa claves de la cuenta real. `DemoNetworkFence` niega llamadas API/general-data a nivel de `window.fetch`.
- La revisión de la versión deployada no pudo completarse: Chrome aún deniega la observación tanto de `mygastify.com` como de `localhost:3004` bajo permisos persistentes. El usuario puede habilitar esos orígenes en la configuración de permisos del navegador/Codex y volver a solicitar la comparación. No se usó otro canal para leer el contenido.

## 9. Guías de funciones y notificaciones de muestra (26-oct-2026)

- El hub “+” ahora muestra un botón de ayuda contextual por cada opción seleccionada: movimiento, transferencia, cuenta, categoría, presupuesto, ahorro, proyecto e importación. Cada texto explica para qué sirve, qué datos requiere o qué organiza; la vista previa y la advertencia dejan claro que la demo no crea ni guarda los registros.
- El aviso de demo y el límite de solo lectura usan un tono coral/rosa claro sobre la interfaz oscura. La explicación distingue entre explorar filtros o vistas (estado efímero aislado por pestaña) y crear información real (no está habilitado aquí).
- Cada ruta, salvo el Dashboard principal que ya presenta su propio resumen, antepone un recorrido interactivo de tres pasos. Budgets explica límites por categoría, gasto sin presupuesto y metas de ahorro/proyectos; Projections, meses/desglose y estimaciones; Wallet Analyzer, categorías, patrones y moneda. También se guía Perfil, Movimientos, Accounts, History y Categories. Los textos están en español e inglés y la persona puede avanzar, retroceder, saltar entre pasos o plegar la guía.
- El botón de notificaciones del Navbar reutilizado muestra tres avisos ficticios (límite de presupuesto al 80%, presupuesto excedido y avance de ahorro), contador local, estados leído/no leído y “marcar todas como leídas”. Tocar un aviso lo marca localmente y lleva a Budgets. No se registra una suscripción, push ni envío real.
- Las rutas usan las pantallas/componentes existentes de Gastify en modo de solo lectura; el trabajo no agregó persistencia de datos a la demo ni llamadas de escritura. Se mantiene el bloqueo de API y los fixtures de ejemplo.
- Validación: `npm run typecheck`; ESLint focalizado; prueba i18n (`42` tests); Vitest completo (`108` archivos, `775` tests); `git diff --check`; `GET /demo`, `/demo/budgets`, `/demo/projections`, `/demo/analyzer`, `/demo/accounts`, `/demo/history`, `/demo/categories` y `/demo/movements` en `localhost:3004` responden `200`. Next compiló las páginas en modo dev; no se rehizo un build de producción durante esta iteración.
- El preview dependía de `node_modules` enlazado al checkout principal y originalmente falló al resolver `postcss` desde `next/font`. Se reinició el servidor del worktree en el mismo puerto usando `NODE_OPTIONS=--preserve-symlinks`; las rutas respondieron `200`. No se cambiaron dependencias ni archivos del checkout principal.
- Sin commit, push, merge ni despliegue; revisión visual final queda para la prueba del usuario en la URL local.

## 10. Categorías, comparativos y ajustes de Perfil (26-oct-2026)

- El catálogo de demo contiene categorías/subcategorías propias y predeterminadas con iconos ya registrados por Gastify. Tocar cualquier botón abre un modal solo de lectura con su actividad asociada, gasto, budget relacionado, subcategorías y navegación a Movimientos/Budgets.
- Dashboard y Wallet Analyzer presentan el gasto por budget frente al periodo anterior. History ya monta los comparativos reales por periodo y presupuesto; recibe presupuestos ficticios con histórico de cambios 2024–2026. Projections monta las dos tablas reales (proyección mensual y precisión estimado/real), no una maqueta duplicada.
- Movimientos muestra dos widgets aislados en su columna izquierda: vista previa de importación XLSX/XML y sugerencias del Categorizer. No hay selector de archivo, upload, mutación del store, llamada a API ni aplicación de sugerencias.
- Perfil muestra selectores locales de país/moneda, passkeys ficticias (iPhone/MacBook) y conectores ChatGPT/Claude con tokens deliberadamente enmascarados y no funcionales. El texto explica el alcance de acceso, la autorización y la revocación.
- El error de compilación que afectaba `/demo/budgets` se originaba en el `node_modules` enlazado al checkout principal: resolvía Next 16.4.x pese a que el worktree declara Next 15.5.27, y el log registraba módulos de Next/Nivo incompatibles. El worktree ahora tiene dependencias locales; no se alteraron package manifests ni el checkout principal. `npm ci` no estaba disponible por una entrada faltante (`expo-document-picker`) en el lock; la instalación local se hizo sin escribir el lockfile.
- Verificación final de código: `npm run typecheck`, ESLint focalizado, Vitest (108 archivos / 775 tests) y `git diff --check` pasan. `npm run build` pasó antes de corregir los valores de icono; tests y typecheck pasaron después. No se usó Chrome para inspección visual/HTTP porque sus permisos persistentes siguen bloqueando la lectura del origen; el usuario debe validar la vista en `http://localhost:3004/demo`.
- El provider, fixtures y el fence de demo siguen manteniendo la separación por pestaña y el bloqueo de endpoints `/api/` y `/general-data/`. No se cambió el esquema de base de datos ni se agregaron escrituras.

## 11. Publicación y acceso desde la landing (2026-10-28)

- El usuario probó la demo local, la considera suficientemente madura y autorizó publicarla en la rama remota y fusionarla en `main`.
- La portada incorpora un enlace “Probar demo” en la navegación, un CTA destacado en el hero y una sección que explica qué módulos y controles puede explorar.
- La sección aclara que los datos son ficticios, que no se requiere registro ni conexión bancaria, y que los formularios del hub “+” son vistas previas que no guardan cambios.
- Los enlaces a `/demo` usan `prefetch={false}`; `page.tsx` sigue siendo Server Component y no importa Dashboard/providers de cliente. La demo se descarga al navegar a su ruta.
- Verificación de integración/publicación pendiente de registrar al finalizar esta solicitud.
