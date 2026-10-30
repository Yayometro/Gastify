# Guía de recorrido: qué se hizo y dónde verlo (R3, R4, R5, R6 y features)

Cómo usar esta guía: cada punto dice **en qué pantalla entrar**, **qué tocar** y **qué debería pasar**. Si no pasa, está mal. Al final de cada sección van los puntos pendientes o que esperan tu decisión.

Convenciones: «web» = `localhost:3000` (o mygastify.com). «Móvil» = la app en el teléfono. «Patrón de oro» = título | separador vertical | «?» | brújula (tutorial), siempre en ese orden y pegados.

---

## PARTE 1 — WEB

### Barra lateral (todas las páginas)
- **R5 W07:** entra a Movimientos, Historial o Cartera: solo la pestaña de la página en la que estás debe verse activa (antes «Wallet» se quedaba encendida siempre).
- **Nuevo (F2):** icono de corazón «Personas» entre Categorías y el interruptor de tema.
- **Pendiente:** en ventanas muy bajas (~635 px de alto) la barra ya no cabe completa (se corta el avatar). En pantallas normales debería caber; confírmalo en la tuya.

### Cartera (Dashboard `/dashboard`)
- **R4 3.1–3.7:** tarjeta de resumen del centro sin botón de tutorial; filtros de abajo sin «?»; «Resumen de transacciones», «Top 6» y «Top 6 por mes» con «?» y tutorial fusionados (solo queda uno); sin «?» de hover junto a «This Month» ni a la pestaña gastos/ingresos.
- **R4 3.3:** el «?» del Wallet Analyzer tiene el texto del modal informativo del móvil.
- **Pendiente R4 3.4 (decisión):** «Resumen de cuentas» solo tiene «?», no tutorial. ¿Quieres que tenga uno?
- **Nuevo (F1):** si tienes un gasto recurrente de monto variable que ya tocaba, al entrar sale un modal «Gastos recurrentes por confirmar» (ver Movimientos).

### Movimientos (`/dashboard/movements`)
- **R3 B/C:** título «Detalle de movimientos | ? | brújula».
- **R4 3.8–3.12:** orden título | separador | «?» | tutorial; sin «?» de hover en Seleccionar, «This Month» ni categoría; el modal de editar movimiento tiene botón de tutorial (lápiz de una fila → compás junto al título).
- **R5 W01–W06 (tutoriales):**
  - Botón «+» de la barra → ventana Crear: el compás del título explica cada tipo (Transacción, Transferencia, Cuenta, Categoría, Presupuesto…). Cambia de tipo y vuelve a tocar el compás: cambia el tutorial.
  - «Importar desde Excel»: tutorial de 8 pasos en el orden de la pantalla (Excel/XML → subir → descargar formato → quitar duplicados → qué compara → conservar/borrar). El paso de «Quitar duplicados» hace clic por ti y abre el panel.
  - «Categorizador de movimientos»: sin «?» a la derecha; solo el compás junto al título. Con sugerencias el tutorial abre el modal (en la cuenta QA solo se ve el estado vacío).
  - «Detalle de movimientos»: el tutorial (35–39 pasos) ahora cubre Seleccionar (abre, explica, cierra), Buscar duplicados, Exportar, etc.
- **R5 W18/W24:** en la ventana Crear, Transferir y Cuenta ocupan el mismo ancho que Transacción; el modal «Crear nueva categoría» tiene el título de tamaño normal.
- **R5 W30/B1:** títulos de Importar y Detalle con el patrón de oro. Abrir «Crear categoría» ya no da el error de consola «value prop null».
- **Nuevo (F1) — botón «Gastos recurrentes»** debajo del título de la página: abre una ventana con tus reglas (nombre, cada cuánto, próximo cobro, monto, fijo/variable). Botones **Pausar/Reanudar, Editar monto, Eliminar** (pide confirmar; los cobros ya creados se quedan). Su compás explica todo.
- **Nuevo (F1) — crear uno:** «+» → Transacción (gasto) → baja hasta el switch **«Gasto recurrente»**: eliges frecuencia y si el monto cambia. Al guardar se crea el gasto y la regla.
- **Nuevo (F1) — confirmación:** si hay un cobro variable vencido, al entrar a cualquier página del dashboard sale el modal con el monto sugerido; **Confirmar** (crea el gasto con ese monto), **Omitir**, **Más tarde** (queda en la campana).
- **Pendiente F1:** «quincenal» ahora = cada 14 días. ¿Prefieres días 1 y 15?

### Presupuestos (`/dashboard/budgets`)
- **R4 3.14–3.17:** sin «?» junto a «restablecer»; «Presupuesto de gasto» sin tutorial; el modal de un presupuesto/proyecto/ahorro trae separador + tutorial junto al título.
- **R5 W08:** tarjeta «Sin presupuesto» → modal con título | compás; el tutorial recorre monto, porcentaje, agregar presupuesto, otras categorías.
- **R5 W09/W10:** abre un presupuesto → edita una transacción: la ventana de edición sale **al frente** (antes quedaba detrás); borrar una transacción desde ahí muestra una confirmación **oscura** (antes blanca).
- **R5 W11/W12:** modal de un proyecto: compás junto al nombre y tour de 13 pasos; «Editar proyecto» explica Periodo, Tags y los botones Borrar/Actualizar.
- **R5 W13/W25/W28:** el buscador «Buscar gastos» de «Agregar movimiento existente» tiene el estilo de la app; en **tema claro** el modal de proyecto y el título «Crear nueva categoría» ya se leen.
- **Nuevo (F3):** las barras de presupuesto tienen un brillo de «energía» que recorre la parte llena (más rápido si te pasaste).
- **Pendiente R4 3.13 (decisión):** «Moneda principal»: el «?» de hover y el modal dicen lo mismo; ¿conservamos solo uno?
- **Pendiente R5 W27 (decisión):** «Borrar este proyecto/presupuesto/ahorro» borra **sin confirmar**. ¿Agregamos confirmación?

### Proyecciones (`/dashboard/projections`)
- **R4 3.20–3.22:** «Fuentes de ingreso» y «Referencia histórica» con «?» y tutorial fusionados; tabla «Mes a mes» con título arriba (separador, «?», tutorial).
- **R5 W15 — porcentajes de precisión:** en la tabla «Precisión de tus proyecciones» hay % de ingreso, gasto y global por mes y una fila «Rango visible» (con «?» que explica la fórmula). También en el modal de un mes cerrado.
- **R5 W22:** título «Proyecciones | ? compás» centrado; enlace «Ver todas las proyecciones →».
- **R5 B8:** modal de mes de «Precisión»: ya no tiene «?»+compás junto al texto «Precisión de las proyecciones» (solo en código; revísalo).
- **Pendiente R4 3.19:** no encontré ningún «?» junto a «2026» que quitar. Dime cuál es.
- **Pendiente R5 W29 (decisión):** «Hasta <mes>» de la Referencia histórica **excluye** ese mes; los nombres de mes del modal salen en inglés.

### Analizador de cartera (`/dashboard/analyzer`)
- **R4 3.23–3.30:** sin tutorial en el filtro de tiempo; «Lo más destacado», «Proyectado vs real», «Top categorías/transacciones», «Suscripciones» y «Patrones por día» con «?» y tutorial fusionados; el modal de una barra de «Tendencia 6 meses» tiene un «?» en vez de tutorial.
- **R5 W15:** tarjeta «Proyectado vs Real» con los % de precisión.
- **R5 B2–B7 — «Patrones por día de la semana»:** la tarjeta muestra **solo** barras lunes–domingo. Clic en la tarjeta o en una barra abre un modal con: explicación → **barras por semana** → **calendario de gasto** (cuadros por nivel de gasto) → detalle día por día. El modal **cabe en pantalla** y se desplaza por dentro; sus «?» abren al frente; el tutorial dentro del modal sí se ve (resalta la sección, atenúa el resto).
- **R5 M15/M16 (Wallet Analyzer, web y móvil):** «Nueva categoría» ya no sale por Electronics-tipo (solo si de verdad no tenía movimientos antes del periodo) y «nuevas suscripciones» ya no marca como nueva una renta o Netflix con cambio de precio. Modal con el porqué. **Solo en código: pruébalo con tus datos reales.**
- **Nuevo (F6) — bloque «Tus cuentas»** al final: 3 tarjetas (cuenta con más dinero con su % del total y aviso si >70 %; cuenta que más gasta con su categoría dominante; cuenta que más ingresa), **«Flujo por cuenta»** (clic en una cuenta abre sus movimientos de mayor a menor) y **«Saldo de cada cuenta»** (líneas por mes; toca los nombres para ocultar/mostrar; «Total»). También sale en Historial.
- **Pendiente F6:** «cuentas dormidas» (60 días sin movimientos) es solo una línea de texto, no tarjeta. No hay «límite de tarjeta» en el modelo (solo deuda total).

### Cuentas (`/dashboard/accounts`)
- **R4 3.31–3.35:** sin «?» de hover; «Resumen de cuenta», «Resumen de movimientos» y «Detalle» con «?» y tutorial fusionados.
- **R5 W06/W19 — crear/editar cuenta:** modal más ancho; **moneda como botones** (MXN/USD/EUR/JPY), **tipo como botones** (Débito/Crédito/Efectivo/Ahorro), **buscador de banco** con logos en cuadritos (principales, otros y digitales, «Ver todos») y **solo los últimos 4 dígitos** de la tarjeta.
- **R5 W20 — detalle de una cuenta:** resumen estilo Wallet filtrado a la cuenta + **Top 6** + lista de movimientos.

### Historial (`/dashboard/history`)
- **R4 3.36–3.47:** quitados los «?» de hover de pestañas y filtros; «Versus mes anterior», «Tendencias», «Presupuestos y rachas», «Suscripciones» y «Patrones por día» con un solo «?»; «Top 6 por mes» con tutorial.
- **R5 W21/W23:** el paso 5 del tutorial («Analizador de cartera para el periodo») resalta toda la sección; comparativos de categorías y presupuestos con su compás junto al título.
- **R5 W14/W17:** auditoría del patrón de oro en todo el historial; «Patrones por día» igual que el Analizador (ver arriba).
- **Pendiente R4 3.43:** el «Comparativo por categorías» que no renderizaba con «Last 3 months»: lo desacoplé de presupuestos pero **no reproduje el fallo**. Pruébalo con esos filtros.

### Categorías (`/dashboard/categories`) — cambió mucho
- **R4 3.48–3.49:** modales de categoría con título largo cortado con «...» y tutorial a la derecha; categorías por defecto sin tutorial.
- **Nuevo (F4):** arriba hay dos pestañas, **Analizador** (la principal; se recuerda la última usada) y **Lista** (todo lo de antes). En Analizador: elige una categoría (buscador + atajos de las que más usas), elige Gastos/Ingresos y 3/6/12 meses. Ves total, promedio mensual, mes más alto y cambio contra el periodo anterior; **barras por mes** (clic en una → modal con los movimientos de ese mes); etiquetas; **subcategorías** (flechas o chips, «Sin subcategoría» incluida); movimientos más grandes y lista completa.
- Los tutoriales de la Lista ahora «presionan» la pestaña Lista por ti si estás en el Analizador.
- **Pendiente F4:** presupuestos históricos de la categoría, resumen Mapa/Burbujas/Anillo, y botones «Analizar esta categoría» desde la Lista.
- **Pendiente R4 3.50:** «Crear nueva categoría» y tutorial de «Tus categorías»: dejé sin cambios; confirma si querías algo.

### Personas (`/dashboard/people`) — nuevo (F2)
- «Agregar persona» abre un asistente de **6 preguntas** (quién es, cada cuánto, qué días, en qué gastas → subcategorías, cómo identificar sus gastos [etiquetas/cuenta], límite). Al crear se crea también su **categoría con subcategorías**.
- Cada tarjeta: gasto del mes, promedio por salida y barra de límite. Clic → análisis: totales, barras por mes, **días reales vs los que declaraste**, **«¿cambia tu gasto del día?»** (con textos neutrales y mínimo de datos), límite (proyección y salidas restantes), subcategorías y movimientos (marca «Compartido» si cuentan para otra persona). Archivar o eliminar (preguntando si conservas la categoría; los movimientos **nunca** se borran).
- **Pendiente:** editar una persona (la ruta existe, falta botón), selector «¿Con quién?» en el formulario de movimiento.

### Login / 2FA — arreglado hoy
- La pantalla `/verify-2fa` ahora tiene abajo «Sesión iniciada como <correo>» y **«Cerrar sesión y usar otra cuenta»**, en todos los pasos. Cierra sesión y te manda a `/login`. Dejé tu Chrome sin la sesión de la cuenta QA.

---

## PARTE 2 — MÓVIL

### Inicio
- **R3 C1–C8:** cabecera «Hola …» con brújula | campana; «Cuentas», «Análisis del periodo», «Resumen de transacciones», «Presupuestos» (solo «?»), «Últimos movimientos», «Top» con sus tutoriales.
- **R5 M31 (verificado):** tabla de categorías de la tarjeta «Resumen de transacciones» (baja en Inicio): «25 transactions» con espacio y «See subcategories» en una línea; nombres más anchos.
- **Nuevo F1:** al abrir la app, si hay un cobro variable vencido, sale una hoja «Gastos recurrentes por confirmar» (Confirmar / Omitir). La campana cuenta ese aviso y en Notificaciones aparece una tarjeta para reabrirla.

### Movimientos / Agregar (+)
- **R5 M01/M02:** «Importar desde Excel» y el Categorizador (hoja «Herramientas») tienen compás con tutorial.
- **Nuevo F1:** «+» → Gasto: al final hay el switch «Gasto recurrente» (frecuencia + «el monto cambia»).

### Presupuestos
- **R5 W08:** hoja «Unbudgeted» con tutorial. **M26/W26 pendiente:** «6transactions» sin espacio en el detalle de categoría de esa hoja (ya puse espacio sin salto, no lo vi en esa hoja).
- **Nuevo F3:** barras con brillo de energía.

### Más (menú)
- **R5 M17:** en pantallas ≥ 428 dp ya no lista Analizador ni Proyecciones (están en la barra de abajo). En un teléfono angosto siguen. **Solo en código.**
- **Nuevo:** filas «Personas» y «Gastos recurrentes».

### Proyecciones (Más → Proyecciones o barra de abajo)
- **R5 M03 (congelamiento):** el tutorial de página llega a «Abre un mes» sin congelarse.
- **R5 M04:** dentro del modal de un mes, el compás arranca en «1 de 4» y Atrás/Siguiente funcionan (también en el modal de Precisión).
- **R5 B9 (verificado hoy):** tras «Abre un mes» ahora hay un paso «Se abrió el detalle del mes» antes de cerrarlo; lo mismo desde «Precisión» («Un mes desde Precisión» → «Detalle de ese mes»).
- **R5 M05:** chips Ingreso/Gasto/Global por mes y «Rango visible»; también en la tarjeta de proyección del Analizador y en el Historial.

### Analizador móvil (Más → Analizador / barra de abajo)
- **R5 M07:** el tutorial del **Top 6** explica el modal que abre y luego «todas las categorías/movimientos». Igual en Historial e Inicio.
- **R5 M08:** «Grandes gastos → ver mes por mes» dice bajo el título «Ordenado por monto, de mayor a menor».
- **R5 M09:** «Patrón por día de la semana»: barras lunes–domingo; el detalle trae semanas, calendario de colores y día por día.
- **R5 M15/M16:** ver Web/Analizador.
- **Nuevo F6:** tarjeta «Tus cuentas» (tres tarjetas, flujo por cuenta que abre hoja con movimientos, saldos mes a mes con chips para ocultar líneas). Con compás.

### Categorías (Más → Categorías)
- **R5 M14 (alta prioridad, verificado):** botón **«Nueva subcategoría»** junto a «Nueva categoría»; la pantalla pide primero la **categoría padre** (obligatoria; el botón guardar queda deshabilitado hasta elegirla). El interruptor «también crear subcategoría» en Nueva categoría explica dónde se guarda. Tutorial `m-subform`.
- **R5 M13:** el tutorial de crear categoría ya no se traba del paso 4 al 5.
- **Nuevo F4:** pestañas Analizador | Lista como en la web (barras por mes tocables, subcategorías, etc.).

### Cuentas (Más → Cuentas)
- **R5 M06:** formulario con banco (logos y buscador), moneda y tipo como opciones, solo 4 dígitos de tarjeta (**solo en código en el móvil**).
- **R5 M11/M12 (verificado):** detalle de una cuenta con resumen, Top 6, movimientos y tutorial `m-acc-detail`.

### Historial móvil
- **R5 M18:** orden del tutorial: periodo → comparar → resumen → mes a mes → gastos por categoría → ingresos → grandes gastos → suscripciones → presupuestos → proyecciones → Top 6; espacio entre «Big expenses» y «Recurring subscriptions».

### Personas y gastos recurrentes (Más)
- **Personas:** «Add person» → asistente por pasos en una hoja; tarjetas; detalle con el mismo análisis que la web.
- **Gastos recurrentes:** lista con Pausar/Editar monto/Eliminar y su tutorial.

### Notificaciones (campana)
- Muestra avisos de presupuestos/ahorros y ahora la tarjeta de recurrentes por confirmar.

### Pendiente móvil
- **M19 tablet/iPad:** no hay emulador de tablet; revisa en tu iPad todo lo anterior.
- Guardar un recurrente desde el móvil de punta a punta (probé el formulario, no guardarlo).
- Asistente de Personas en el móvil: probé que abre (paso 1) pero no creé a nadie desde ahí.

---

## PARTE 3 — Notificaciones push (explicado en simple)

Hoy **la campana solo muestra avisos que la propia app calcula cuando la abres** (presupuesto al 80 %/100 %, celebraciones, y ahora recurrentes por confirmar). La app **no puede avisarte con el teléfono cerrado**, ni mandarte correos. Para eso hay tres piezas:

1. **Push en el teléfono (Expo):** la app le pide permiso al usuario y guarda en nuestro servidor una «dirección» del teléfono (token). Cuando pasa algo (te pasaste de presupuesto), el servidor manda el mensaje a Expo y Expo lo entrega vía Google (Android) o Apple (iPhone). **Costo por mensaje: 0.** Lo único que se paga es la cuenta de Apple Developer (99 USD/año), que de todos modos necesitas para publicar en la App Store (Android: 25 USD una vez).
2. **Correo (Resend u otro):** sirve para verificar correo, restablecer contraseña, avisos de seguridad y resúmenes semanales. Necesita un dominio propio con registros SPF/DKIM/DMARC (acceso al DNS de mygastify.com). Gratis hasta 3,000 correos/mes (100/día); luego ~20 USD/mes.
3. **Un «reloj» en el servidor (cron):** los avisos que dependen de la fecha (resumen semanal, «hoy toca tu renta variable», recordatorios) necesitan que el servidor despierte solo. En Vercel plan **Hobby** el cron corre **una vez al día**; en **Pro** (20 USD/mes) cada minuto. Los avisos «por evento» (te pasaste del presupuesto al guardar un gasto) **no** necesitan reloj.

Cómo se armaría: una función única `notify(usuario, evento)` que revisa tus preferencias (Perfil → qué avisos y por qué canal), evita mandar el mismo aviso dos veces y llama a push o correo. En el teléfono, al tocar la notificación abre la pantalla correcta (presupuesto, confirmar recurrente).

Fases y tiempo: (1) correos transaccionales 2–3 días; (2) push móvil por eventos 3–5 días; (3) cron diario + resumen semanal 2–4 días; (4) preferencias en Perfil 2 días; (5) push web/PWA 3–5 días (en iPhone solo funciona si instalan la web en la pantalla de inicio). **Costo inicial ≈ 0 USD/mes**; ~20–40 USD/mes si crece. Privacidad: por defecto el push no mostraría montos con el teléfono bloqueado.

**Lo que necesito que decidas:** qué plan de Vercel tienes, si puedes darme acceso al DNS del dominio para el correo, si ya tienes cuenta de Apple Developer, y qué avisos serían opcionales vs obligatorios (los de seguridad siempre). El estudio completo con fuentes está en `.mds/ESTUDIO_F5_NOTIFICACIONES.md`.

---

## Resumen de lo que espera TU decisión
R4: 3.4, 3.13, 3.19, 3.50, 1.4/1.6 · R5: W27, W29 · F1: quincenal · F2: ¿una persona puede tener varias categorías? ¿tono del «¿cambia tu gasto del día?»? · F5: Vercel/DNS/Apple · Reglas de categoría (sembrado en BD: sigo sin tu autorización).
