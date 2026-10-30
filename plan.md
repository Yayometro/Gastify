# Plan: demo pública y ligera de Gastify

**Estado:** propuesta para revisión; no autoriza implementación, despliegue ni cambios de producto todavía.  
**Fecha:** 25 de octubre de 2026.  
**Objetivo:** permitir que una persona entienda el valor de Gastify usando un dashboard casi idéntico al real, con datos ficticios y sin registrarse. La exploración no debe consultar ni modificar datos de usuario en el backend.

## 1. Contexto y decisión de producto

La portada publicada ya vende Gastify mediante recreaciones visuales, pero todavía no permite experimentar con el producto. El brief inicial propuso una ruta tipo `/test/Gastify` con cerca de dos años de movimientos, varias cuentas y divisas, presupuestos y un proyecto; se pospuso expresamente hasta analizar su impacto. Esta propuesta concreta esa decisión.

**Propuesta:** agregar en la portada «Probar con datos de ejemplo», con destino `/demo`. «Crear cuenta» e «Iniciar sesión» continúan visibles. La demo ofrece libertad para explorar un dashboard fiel y realizar unas pocas acciones reales *dentro del conjunto ficticio*. El registro aparece después de una experiencia de valor y cuando el visitante quiere empezar con sus propios datos.

No sería una cuenta pública compartida en MongoDB, una captura navegable ni un segundo producto completo. Es una experiencia de cliente separada, con el mismo lenguaje visual y las mismas reglas financieras que correspondan al dashboard real. La demo debe decir siempre «Datos de ejemplo» y nunca sugerir que sus modificaciones se conservarán en una cuenta nueva.

### Qué significa «copia casi completa»

- **Fidelidad visual:** misma jerarquía, colores, cristales, tipografía, navegación, tarjetas, espacios, iconos y disposición responsive del dashboard vigente al momento de implementar. En teléfono se conserva el carrusel superior de cuentas/resumen/comparación.
- **Fidelidad de lectura:** las cifras de todas las tarjetas salen del mismo conjunto de datos y cambian juntas al seleccionar otro periodo o añadir un movimiento ficticio. No habrá números pintados a mano que se contradigan.
- **Fidelidad de interacción:** filtros de periodo, vistas, detalles y navegación de las partes incluidas funcionan; los controles que no existan en la demo estarán claramente explicados o no aparecerán. Ningún botón llevará a una pantalla rota.
- **Límite:** no se replica el backend, la autenticación, la importación, la IA ni cada operación avanzada del producto. Una semejanza visual del 90 % es una meta de revisión visual, no una cifra de cobertura de código.

## 2. Recorrido del visitante

1. En la portada, CTA secundario visible «Probar con datos de ejemplo» cerca de «Empieza con Gastify». En móvil debe verse sin desplazar los controles del carrusel ni cubrir el primer render.
2. `/demo` abre directamente el dashboard. Una banda pequeña y persistente dice «Estás explorando datos ficticios», con «Restablecer» y «Crear mi cuenta». No hay formulario, sesión ni espera de carga de movimientos remotos.
3. El mes inicial tiene actividad suficiente para que resumen, presupuestos, categorías y Top se entiendan inmediatamente. Un microtexto opcional propone «Cambia de mes» o «Agrega un gasto de prueba», sin bloquear la interfaz con un tutorial.
4. Cambiar el mes actualiza todas las tarjetas; abrir una categoría muestra sus movimientos; agregar un gasto ficticio modifica resumen, categoría, Top, presupuesto y cuenta correspondiente. Éste es el momento de valor principal.
5. El registro se ofrece en la banda y tras una acción significativa; no se abre una ventana de registro a cada clic. El mensaje es honesto: «Crea tu cuenta para empezar con tus propios movimientos». No se promete migrar los datos ficticios.
6. Al volver a `/demo`, se recuperan las modificaciones de ejemplo del mismo navegador cuando sigan siendo compatibles con la versión de la demo. «Restablecer» devuelve el estado original.

## 3. Cobertura de la primera versión

| Bloque del dashboard | Presentación y comportamiento en la demo | Prioridad |
| --- | --- | --- |
| Barra lateral / navegación móvil y encabezado Wallet | Misma composición responsive; enlaces a áreas fuera de la demo llevan a una explicación útil de la función o al registro, nunca al dashboard autenticado sin aviso. | Obligatoria |
| Cuentas, resumen y vs. mes anterior | Tres tarjetas reales en apariencia y cálculo. Cuentas en sus monedas nativas; ingresos, gastos, balance y variaciones en moneda principal. Carrusel en móvil. | Obligatoria |
| Selector de periodo | Mes anterior/siguiente y selector de mes funcionales. Un rango personalizado sólo si se puede reproducir correctamente en todos los widgets incluidos. | Obligatoria |
| Adelanto de Wallet Analyzer | Selección representativa de tendencias e interpretación; abrir detalle puede cargar un módulo diferido. No fingir un análisis inexistente. | Obligatoria |
| Tarjetas de cuenta | Saldos coherentes con movimientos de ejemplo y moneda nativa; detalle compacto al abrir. | Obligatoria |
| Desglose por categorías | Distribución, total y acceso a los movimientos de la categoría. Las vistas visuales adicionales se cargan al elegirlas. | Obligatoria |
| Top configurable | Top de categorías o movimientos basado en el periodo; controles de cantidad sólo si el contenido se recalcula. | Obligatoria |
| Presupuestos | Varios topes, barra, porcentaje, estado visual y categoría sin presupuesto. Añadir un gasto ficticio actualiza la cobertura correspondiente. | Obligatoria |
| Movimientos | Lista, búsqueda/filtros básicos, detalle y creación/edición de movimientos *de ejemplo* en el navegador. | Obligatoria |
| Proyecto de viaje | Un proyecto ficticio con límite, fechas y gastos vinculados; puede aparecer en presupuesto/detalle. Edición completa del proyecto puede ir en fase posterior. | Deseable |
| Historial extenso y páginas de herramientas | Datos suficientes para mostrar comparativas. Pantallas completas de Historial, Budgets, Analyzer o Projections no forman parte de la primera entrega salvo que el dashboard las necesite. | Posterior |

La demo permite explorar datos ajenos ficticios. No permite conectar bancos, subir Excel/XML/PDF, activar IA, enviar notificaciones, modificar perfil real, consultar tipos de cambio en vivo, exportar datos de usuario ni abrir endpoints autenticados. Si una función ausente se anuncia, mostrar una vista de explicación y un CTA de registro en lugar de simular que hizo trabajo real.

## 4. Datos de ejemplo y consistencia financiera

### Conjunto inicial

- Historial determinista de 24 meses, suficiente para comparar meses y años. Mes de entrada: alrededor de 30–35 movimientos variados; segundo mes alrededor de 15; meses anteriores alrededor de 8–12. El volumen final se ajustará por legibilidad y peso, no para cumplir una cuota artificial.
- Tres cuentas reconocibles: una en MXN, una en USD y una en JPY; EUR puede ilustrarse con una cuenta o un movimiento si aporta claridad. Nombres, comerciantes, notas y personas serán completamente inventados; nada provendrá de la cuenta del dueño ni de la cuenta de pruebas real.
- Categorías y subcategorías con gastos cotidianos, ingresos y transferencias. Una transferencia entre cuentas no se suma como ingreso ni gasto. Algunas categorías sin presupuesto deben aparecer como tales.
- Cuatro a seis presupuestos de gasto, una meta de ahorro y un proyecto de viaje ficticio. Incluir estados fáciles de interpretar: bien, cerca del límite y excedido; no forzar cifras incoherentes sólo para enseñar un icono.
- Al menos un gasto en moneda distinta de la principal con monto nativo y monto de reporte. Usar tasas de ejemplo fechadas y etiquetadas; no presentarlas como cotizaciones actuales ni llamar a una API FX.
- Los movimientos que alimentan un presupuesto/proyecto deben usar las reglas de cobertura y vínculo explícito del producto. Verificar que un gasto no se cuente dos veces.

### Modelo local propuesto

Un módulo `demoSeed` versionado contiene cuentas, categorías, presupuestos, proyecto y movimientos. Cada movimiento tiene identificador estable, fecha, tipo, cuenta, categoría, monto y moneda nativos, monto de reporte en la moneda principal y vínculos opcionales a presupuesto/proyecto. Las fechas se generan de manera determinista respecto a un mes de referencia estable; servidor y cliente deben usar el mismo ancla para evitar errores de hidratación. El `seed` debe pasar por validación de forma y consistencia durante el desarrollo.

La fuente de verdad en ejecución será un estado en memoria. `localStorage` guardará **sólo las diferencias** creadas por el visitante, bajo una clave versionada como `gastify-demo:v1`; al cambiar la estructura del seed, se migra o descarta esa versión de forma segura. Se incluye «Restablecer demo». El almacenamiento local no es una bóveda de datos: la interfaz debe pedir expresamente no introducir información financiera real. No guardar correos, identificadores bancarios, tokens ni secretos.

Los selectores puros producirán, una sola vez por estado/periodo, el resumen mensual, saldos, comparativo, distribución, Top, presupuestos y proyecto. Reusar utilidades compartidas de moneda, fechas y cobertura de `packages/core` cuando su contrato sea válido para la demo; nunca importar thunks de Redux para obtenerlas. La edición de ejemplo se aplica al estado local y vuelve a calcular todas las vistas afectadas.

## 5. Arquitectura de ruta y límites de red

### Diagnóstico del repositorio (al redactar este plan)

- La portada publicada está en `origin/main` (`d1ee20c` en la referencia local consultada) y vive en `src/app/page.tsx`, `src/app/HomeSections.tsx`, `src/app/home.css` y `src/app/home-renders.css`.
- El dashboard real se compone en `src/components/Dashboard.tsx`; `src/app/dashboard/layout.tsx` valida sesión y 2FA, monta `AllDataProvider` y la navegación; `src/app/dashboard/page.tsx` vuelve a validar sesión. `src/middleware.ts` protege sólo `/dashboard/:path*`.
- `Dashboard.tsx` despacha fetches de usuario, wallet, cuentas, categorías, movimientos y presupuestos. Importa widgets grandes directamente, entre ellos `Movements`, `BudgetCont`, `CategoryBreakdownCard`, `TopElementsContainer` y `WalletAnalyzerTeaser`.
- `src/app/layout.tsx` monta Redux, Ant Design, tema e internacionalización para todas las rutas. Por eso crear `/demo` sin otros cambios **no garantiza** una descarga ligera, aunque el componente de demo sea pequeño.
- El checkout activo `mobile-phase-9-paridad` contiene trabajo web/móvil y archivos sin confirmar de Cloud; su portada local no representa la portada publicada. La implementación se hará en un worktree nuevo desde el `main` remoto actualizado y se reconciliará con los cambios web posteriores antes de integrar.

### Diseño propuesto

1. Ruta pública `/demo` fuera de `src/app/dashboard/`, renderizable sin cookies, `auth.api.getSession`, 2FA o base de datos. HTML inicial con estructura visible y datos de ejemplo; hidratación sólo para interacciones.
2. `DemoDashboard` usa componentes de presentación y tokens visuales compartidos con el dashboard real. Separar de los widgets productivos la vista o las piezas visuales que convenga compartir; usar adaptadores `LiveDashboard` (Redux/API) y `DemoDashboard` (seed local) donde sea rentable. Evitar importar el `Dashboard.tsx` completo como atajo.
3. Primera carga: dashboard superior y secciones visibles. Detalles, gráficos secundarios y pantallas explicativas se dividen en chunks dinámicos y se montan al aparecer o al abrirse. Ninguna librería de charting pesada entra en el bundle inicial si CSS/SVG basta para la misma lectura.
4. Revisar el layout raíz con una medición de bundles. Si Redux/Ant Design engordan la ruta pública, mover proveedores pesados a layouts de las rutas que los necesitan, manteniendo intactos login, registro, verificación y dashboard. Este refactor es una fase con regresiones propias; no asumir que mover un provider es inocuo.
5. La demo no importa módulos que ejecuten `fetch`, Axios, thunks, SDK de auth ni hooks de historial remoto. Carga normal de HTML, JS, CSS, fuentes e imágenes sí existe; el requisito verificable es **cero peticiones a APIs de Gastify o terceros durante la exploración**, salvo navegación voluntaria hacia registro/login. No usar `prefetch` hacia rutas autenticadas desde controles de demo si genera tráfico innecesario.
6. `robots`/metadata: la portada sigue siendo el punto de entrada indexable. La demo lleva título/descripción propios; valorar `noindex` si el contenido ficticio duplicado compite con la portada. Definirlo al implementar según SEO real, sin inventar indexación útil por defecto.

## 6. Archivos previstos

Esta lista es una guía de alcance; confirmar nombres y rutas contra el commit de implementación.

| Archivo o zona | Cambio previsto |
| --- | --- |
| `src/app/page.tsx`, `src/app/HomeSections.tsx`, `src/app/home.css` | CTA de demo en cabecera/hero según espacio real y responsive; conservar el CTA de registro. |
| `src/app/demo/page.tsx`, `src/app/demo/loading.tsx` y metadata de la ruta | Nueva entrada pública, estado inicial accesible y metadatos. |
| `src/components/demo/DemoDashboard.tsx`, `DemoShell.tsx`, `DemoStateProvider.tsx` | Composición, banda de demo, estado local, reset y conversiones. |
| `src/components/demo/widgets/*` y estilos de demo | Reproducción ligera de paneles, cuentas, desglose, Top, presupuesto y movimientos; reutilizar CSS/tokens existentes donde resulte seguro. |
| `src/lib/demo/seed.ts`, `schema.ts`, `storage.ts`, `selectors.ts` | Datos ficticios, validación, persistencia versionada y cálculos derivados. |
| `packages/core/src/money/*`, `packages/core/src/transformers/*`, `packages/core/src/time/*` | Reutilización preferente; tocar sólo si hay una función pura compartible y pruebas de paridad con la app real. |
| `src/app/layout.tsx` y layouts de rutas que lo requieran | Reducir proveedores globales **si la medición demuestra que afectan la demo**; preservar login/2FA y dashboard. |
| `src/app/dashboard/layout.tsx`, `src/components/Dashboard.tsx`, widgets actuales | Sólo extracción de presentación o adaptadores que mejoren la paridad sin alterar el comportamiento real. Evitar reescritura masiva. |
| `src/middleware.ts` | Normalmente sin cambio; prueba explícita de que `/demo` permanece pública y `/dashboard` protegida. |
| `src/app/demo/*.test.tsx`, `src/lib/demo/*.test.ts`, prueba E2E | Validar cálculos, reset/persistencia, navegación, ausencia de APIs y paridad principal. Crear sólo pruebas con comportamiento independiente, no snapshots triviales. |
| `.mds/AI_COORDINATION_LOG.md` | Registrar implementación y verificaciones al realizarla, resolviendo su numeración contra la rama de destino. |

## 7. Peso y rendimiento: presupuesto verificable

No se puede prometer un número absoluto con el tamaño de los archivos fuente: Next, proveedores y dependencias cambian el resultado. Antes de programar, medir la portada y el dashboard actuales con una compilación de producción en un checkout aislado. Guardar como referencia JS/CSS transferidos, datos, LCP y tiempo hasta poder pulsar controles en móvil.

**Objetivos iniciales para la demo, sujetos a la medición base:** fixture comprimido menor a 30 KB; JS *adicional específico de la demo* en la primera visita menor a 80 KB comprimidos; nada de Ant Design/Nivo/Redux en el chunk específico de demo; cero solicitudes de API de usuario; dashboard superior utilizable sin esperar a componentes bajo el pliegue. Si el layout común impide esos objetivos, resolver el layout antes de recortar contenido útil. Validar en teléfono real o perfil de gama media, conexión móvil limitada y viewport amplio; el valor no puede existir sólo en escritorio.

Optimizar con datos compactos, agrupaciones precalculadas o memoizadas, importación dinámica de detalles, iconos puntuales y gráficos SVG/CSS accesibles. Evitar imágenes de capturas pesadas y conjuntos completos de iconos. El objetivo no es sacrificar claridad para ganar unos kilobytes: medir cada recorte frente al primer momento de valor.

## 8. Conversión y medición sin contradecir la privacidad

- Hipótesis: permitir ver un presupuesto y cambiar un gasto ficticio aumentará el porcentaje de visitantes que crean una cuenta **y registran su primer movimiento real**. El número de clics en «Probar» o registros por sí solo no valida la hipótesis.
- Métricas primarias: visitantes elegibles → cuenta creada → primer movimiento real dentro de siete días. Secundarias: entrada a demo, interacción con periodo/presupuesto/movimiento, retorno y rendimiento móvil. Separar móvil/escritorio y fuente de tráfico.
- Primera publicación: atribución simple guardada en el navegador y enviada únicamente si el visitante decide registrarse. Sin telemetría durante la demo se pierde visibilidad de abandonos; documentar esa limitación. Si después se autoriza analítica anónima, serían peticiones adicionales y requerirían una decisión específica de privacidad.
- Experimento posterior: comparar portada con CTA de demo frente a portada actual, con periodo y muestra suficientes; no declarar éxito por diferencias pequeñas sin considerar la calidad de la activación. No usar cifras de estudios SaaS B2B como pronóstico de Gastify.
- Copy: «Prueba con datos de ejemplo», «Tus cambios de prueba se guardan en este navegador» y «Crea tu cuenta para usar tus propios datos». No decir que la demo guarda datos “de forma segura” ni que los importará a la cuenta.

## 9. Fases y condiciones de salida

### Fase 0 — Preparación y línea base

Crear worktree desde `origin/main` actualizado, revisar cambios web de Cloud, registrar capturas desktop/móvil del dashboard y medir bundles. Congelar inventario de paneles e interacciones. **Salida:** checklist de paridad y presupuesto de bytes acordados; nada de la rama móvil se mezcla incidentalmente.

### Fase 1 — Datos y motor local

Crear seed ficticio, validadores, selectores y persistencia versionada. Probar transferencias, fechas, monedas, presupuestos superpuestos y reset. **Salida:** los totales de todas las vistas provienen de una sola fuente y no hay import de API.

### Fase 2 — Dashboard público

Construir la estructura responsive y los paneles descritos en la sección 3. Comparar visualmente con el dashboard real en desktop y teléfonos; corregir espacios, textos y controles. **Salida:** una persona puede completar las tres acciones centrales sin registro, y todas las cifras responden de forma consistente.

### Fase 3 — Aislamiento y peso

Perfilar el bundle y mover providers globales si corresponde. Dividir partes secundarias, auditar recursos y red. **Salida:** presupuesto medido, cero endpoints de usuario/terceros durante exploración y ausencia de datos personales en los assets.

### Fase 4 — Portada y validación

Agregar CTA, textos de límites de demo, accesibilidad, prueba móvil, verificación de auth/login/2FA y medición de activación. Entregar preview aislado para aprobación. **Salida:** criterios de aceptación completos antes de cualquier merge o producción.

## 10. Criterios de aceptación

- Una visita anónima a `/demo` funciona sin cookies de sesión y no dispara redirección a login; `/dashboard` conserva su protección.
- El dashboard demo conserva la composición del dashboard real en escritorio y móvil, incluyendo navegación, carrusel superior, paneles principales y controles visibles. La comparación se hace con capturas del mismo tamaño, no sólo por inspección de código.
- Periodo, búsqueda/filtros, detalle y creación de un gasto ficticio producen cambios coherentes en resumen, cuenta, categoría, Top y presupuesto. Transferencias y monedas no se cuentan erróneamente.
- No hay llamadas a rutas `/api/` ni servicios externos durante la exploración. La pestaña Network y una prueba automatizada comprueban esto; HTML/assets iniciales quedan exceptuados.
- El dataset es 100 % inventado; no aparecen datos de la cuenta real ni de la cuenta de pruebas existente. El bundle no incluye credenciales, correos ni secretos.
- El visitante entiende que la información es de ejemplo, puede restablecerla y sabe que crear una cuenta no importará automáticamente sus cambios de demo.
- Navegación por teclado, etiquetas de botones, foco, contrastes, movimiento reducido y tamaños táctiles pasan revisión en móvil y escritorio.
- Bundle y rendimiento de producción medidos frente a la línea base; si se incumple el presupuesto, la demo permanece en preview hasta corregirlo o revisar explícitamente la meta.
- TypeScript, lint, pruebas de lógica y smoke E2E de la demo pasan; login, registro, verificación 2FA y dashboard autenticado no presentan regresiones.

## 11. Riesgos y decisiones pendientes para la revisión

1. **Paridad vs. duplicación:** copiar `Dashboard.tsx` arrastra APIs y peso; recrearlo por completo puede divergir. Se comparte presentación pequeña y lógica pura, se verifica visualmente y se evita refactorizar todo el dashboard de golpe.
2. **Providers globales:** moverlos puede afectar auth y otras páginas. Medir primero, migrar por rutas con pruebas de regresión y mantener la demo independiente.
3. **Datos de muestra:** un histórico grande puede cargar de más o parecer fabricado. Ajustar volumen tras ver la primera pantalla y comprimir la fixture; coherencia financiera por encima del número de filas.
4. **Promesas de marketing:** no mostrar funciones que la demo aparenta completar pero realmente no hace. CTA y estados explican con precisión qué es prueba y qué exige una cuenta.
5. **Persistencia local:** si alguien limpia el navegador o cambia de dispositivo perderá la demo; la interfaz no debe prometer continuidad entre dispositivos.
6. **Nombre de ruta:** `/demo` es breve y comprensible; el brief original decía `/test/Gastify`. No existe aún un enlace público que obligue a preservar ese nombre. Resolver en esta revisión si se prefiere otro antes de implementar.
7. **Alcance del proyecto:** el dashboard casi completo es obligatorio; detalle y edición completa del viaje, otras páginas y la importación simulada quedan para una segunda decisión basada en uso real.

**Próximo paso tras el visto bueno:** concretar la rama de implementación desde el `main` remoto vigente, medir la línea base y ejecutar las fases en orden. Este documento es sólo el plan solicitado.
