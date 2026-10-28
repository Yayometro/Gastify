# Página Home: primera versión y siguiente decisión

> Estado actualizado el 2026-10-28: el usuario aprobó publicar la demo pública `/demo` y pidió integrarla a `main`. Las notas posteriores de este archivo describen el estado actual; las instrucciones históricas de “no publicar todavía” ya no aplican.

## Base y límites de esta rama

- Rama `pagina-home`, en un worktree separado, iniciada desde `2f88942c6409512bb9b3c1b3b0c289a53e8fd698`, el commit exacto que estaba desplegado en producción cuando comenzó este trabajo. No incluye los cambios móviles en curso de otro worktree.
- Sólo se rediseña la página pública `/`. Las rutas autenticadas no se rediseñan aquí. Las visualizaciones públicas son recreaciones HTML/CSS con datos ficticios inspiradas en las pantallas reales; no muestran capturas ni datos del usuario.
- La aprobación de publicación llegó el 2026-10-28, después de probar la demo local y considerarla suficientemente madura.

## Estructura de la portada

1. **Promesa principal:** entender el dinero y planear lo que sigue; registro e inicio de sesión siempre visibles.
2. **Tres pasos, ahora en carrusel:** registrar/importar, organizar y entender. Cada paso presenta una idea, texto y una visualización específica; el historial se recrea con HTML/CSS.
3. **Funciones con prueba visual, ahora en carrusel de siete apartados:** movimientos/importación, presupuestos por categoría y gastos sin asignar, ahorro, presupuestos de proyectos, Wallet Analyzer, Historial y multimoneda. Cada apartado explica una función y presenta un render HTML/CSS inspirado en las pantallas reales de Gastify, con perspectiva y datos ficticios.
4. **Integración opcional con IA:** se describe como acceso controlado por el usuario para asistentes compatibles. Un carrusel muestra cuatro conversaciones ilustrativas: comparar meses con tabla y cifras, registrar un gasto, analizar tendencias y preparar la importación de un estado de cuenta. La lectura de archivos depende de que el asistente conectado admita adjuntos y el formato; los movimientos se revisan antes de registrarlos.
5. **Cierre:** registro y acceso para quien ya tiene cuenta.

## Iteración de presentación del 22 de octubre

- La portada, el bloque «Cómo funciona» y las herramientas son tres carruseles independientes con flechas, indicadores de posición, botones de diapositiva y gesto horizontal táctil. No avanzan automáticamente ni capturan la rueda vertical; el usuario controla el ritmo.
- El hero tiene el título y la visualización casi alineados arriba, el aviso «Descubre tus hábitos…» debajo de los CTA y después las dos ventajas con palomita. La cabecera baja a unos 64 px de alto en escritorio.
- Los bloques usan luz difusa fucsia, azul y púrpura sobre fondos oscuros, adaptando la referencia cromática del portafolio del usuario. En escritorio horizontal con altura suficiente, cada capítulo ocupa al menos el alto de la ventana y el scroll CSS ajusta obligatoriamente al inicio del capítulo; en móvil, pantallas verticales, ventanas bajas y con movimiento reducido se conserva el scroll normal. No se intercepta la rueda vertical con JavaScript.
- El contenedor se amplía dinámicamente hasta 1760 px, dejando márgenes laterales fluidos. Las recreaciones se adaptan al espacio disponible y muestran menos filas de ejemplo en ventanas de menor altura para evitar recortes.
- `src/app/HomeSections.tsx` concentra las interacciones; `src/app/HomeProductRenders.tsx` contiene las recreaciones de producto y `src/app/home-renders.css` sus estilos. `src/app/page.tsx` sigue siendo componente de servidor para metadata y estructura; `src/app/home.css` mantiene la presentación y reglas responsivas.

## Iteración de budgets, Analyzer e Historial del 22 de octubre

- **Presupuestos:** el carrusel explica topes por categoría, barras, porcentaje, expresiones visuales, un contador aparte de categorías sin presupuesto y avisos dentro de la campanita de Gastify al aproximarse/rebasar hitos (70/80/90/100 %). Los avisos son internos a la aplicación; no se anuncian como push. La app no tiene hoy un aviso por cada transacción nueva ni sugerencias de ahorro disparadas por recibir ingresos, así que la portada no promete esas dos conductas.
- **Ahorro:** se presenta como flujo separado del presupuesto de gasto, con saldo/meta, cuenta vinculada, hitos de progreso y la celebración disponible en la app.
- **Proyectos:** muestra una meta de gasto única con fechas editables y dos transacciones reales vinculadas. La demostración es genérica (“Viaje de ejemplo”) y no incorpora el itinerario ni datos reales del usuario.
- **Wallet Analyzer:** se explica la comparación mensual, tendencias, promedios/ritmo/patrones por día, Top configurable (3/6/12/24), gastos grandes, presupuestos y rachas, anomalías, suscripciones y exposición a divisas. El render enseña una selección representativa para mantener legible la interfaz.
- **Historial:** presenta comparación equivalente ene–oct 2025 vs. ene–oct 2026, totales, porcentajes, desglose trimestral y Top de categorías. La explicación cubre además meses, trimestres, semestres, años, rangos personalizados, Top de movimientos/categorías, presupuestos, proyecciones y destacados.
- Se intensificó el resplandor fucsia/azul/púrpura en Cómo funciona, Herramientas, IA y el cierre “Dale contexto”. Los cuatro bloques se vieron en el preview de Chrome de escritorio; el analizador se ajustó para que sus tres filas del Top y la leyenda del gráfico quepan sin invadirse.
- Revisado manualmente en Chrome `http://localhost:3002/`. Los renders usan cifras ficticias. No se ejecutaron pruebas, typecheck, lint ni build en esta iteración; no se hizo commit, push ni merge.

Las tres capturas generadas previamente en `public/marketing/*.jpg` (sólo datos ficticios) se retiraron después de comprobar que no tenían referencias en la página. No reutilizar capturas antiguas de `public/` que puedan mostrar datos personales.

## Cuenta ficticia para capturas

- `scripts/seed_marketing_demo.mjs --seed` crea una cuenta de prueba separada con BBVA, Santander, Revolut USD, categorías, presupuestos y 37 movimientos de agosto a octubre de 2026. La cuenta no pretende simular todas las funciones ni dos años de historia.
- `scripts/enroll_marketing_demo_totp.mjs` habilita TOTP sólo para esa cuenta, mediante las API normales de autenticación. Contraseña, secreto y códigos de respaldo quedan en `.env.marketing-demo.local` (ignorado por Git, permisos 0600). No incluir este archivo en commits ni en capturas.
- Las capturas de referencia se hicieron en Chrome sobre `127.0.0.1:3002`, un origen de cookies distinto de `localhost`; así no se cerró ni utilizó la sesión real del usuario. Las nuevas visualizaciones públicas no cargan esas capturas.

## Demo pública aprobada

- La experiencia vive en `/demo`, usa movimientos y cuentas ficticios y se puede explorar sin registrarse ni conectar información bancaria.
- El Dashboard, Movimientos, Budgets, Savings, Projections, Wallet Analyzer, Accounts, History, Categories y Profile usan componentes reales de Gastify en modo aislado y de solo lectura. Filtros, periodos, detalles, notificaciones de muestra y el hub “+” son explorables; las vistas de formulario no guardan ni envían datos.
- En la portada, `Probar demo` abre `/demo` desde la navegación; el hero y una sección dedicada explican y enlazan a la experiencia. Los enlaces usan `prefetch={false}` para no cargar el Dashboard demo al entrar a Home.
- `DemoNetworkFence` bloquea llamadas a rutas API de la app; los datos sintéticos y el estado efímero quedan limitados a la pestaña y se limpian al salir. La demo no usa la cuenta ni los movimientos reales del usuario.
- El usuario probó la implementación local y pidió publicarla en `main`. Se documentarán aquí el commit, la integración y las verificaciones de esa publicación.
