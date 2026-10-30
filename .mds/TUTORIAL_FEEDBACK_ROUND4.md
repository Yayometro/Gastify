# Checklist de feedback, cuarta ronda (2026-10-28)

Regla general (confirmada por el dueño): **título | separador | "?" | brújula**. Si el "?" dice lo mismo que el tutorial, el texto se pasa al tutorial y el "?" se quita. Los filtros con "?" que solo aparece al hacer hover se quitan; el tutorial de cada filtro explica el filtro.

## 0. Bugs de fondo (móvil y iPad)
- [x] 0.1 El tutorial dentro de un modal no responde (mes de proyecciones, precisión, detalle de categoría en historial, detalle de categoría en analizador) y al cerrar el modal la app se congela. Causa probable: el overlay del tour es un Modal aparte que queda detrás de la hoja. Solución: el overlay vive dentro del modal superior.
- [x] 0.2 Top 6 del analizador: el paso 4 ("Cierra el detalle") no resalta nada; del paso 3 al 4 pasan 2–3 s antes de mostrarse.
- [x] 0.3 Modal "elegir mes" (teléfono y iPad): las opciones están pegadas al borde inferior; agregar padding inferior.

## 1. Móvil (teléfono)
### Movimientos
- [x] 1.1 Quitar el "?" del título; queda solo el botón de tutorial.
### Proyecciones
- [x] 1.2 Referencia histórica: si el texto del "?" no está en el tutorial, agregarlo al tutorial; quitar el "?".
- [x] 1.3 Fuentes de ingreso: igual que 1.2.
- [x] 1.4 Modal de mes: separar más el "?" del botón de tutorial. El "?" se decide después de probar el tutorial (no quitar todavía).
- [x] 1.5 Modal de mes: el botón de tutorial funciona (ver 0.1).
- [x] 1.6 Modal de precisión por mes: igual que 1.4 y 1.5.
### Más y Crear
- [x] 1.7 No aplica: "Más" no tiene "?". El botón de «más» del feedback es el «+» (Crear), que es 1.8.
- [x] 1.8 "Crear" (+): quitar el "?" del título; queda el tutorial, que ya se adapta al formulario abierto.
### Presupuestos
- [x] 1.9 Tarjeta "Sin presupuesto": quitar el botón de tutorial; queda el "?".
- [x] 1.10 Modal "Sin presupuesto" (el que abre la tarjeta): agregar botón de tutorial en su título, con pasos para monto, porcentaje, agregar presupuesto, otras categorías y listo.
### Analizador
- [x] 1.11 Título del analizador: quitar el "?"; su texto pasa al paso 1 ("1 de 10") del tutorial de la página.
- [x] 1.12 Top 6: ver 0.2.
### Notificaciones
- [x] 1.13 Quitar el "?" del título; su texto pasa al paso 1 del tutorial.
### Categorías
- [x] 1.14 "Predeterminadas": sin botón de tutorial; queda el "?".
- [x] 1.15 Detalle de una categoría y de una subcategoría: quitar el "?"; su texto pasa al paso 1 del tutorial; queda solo el tutorial.
- [x] 1.16 Detalle de categoría: si el título es largo, cortarlo con "..." (sin bajar el texto) y a la derecha separador + tutorial. Aplica a los títulos de los modales de esta pantalla (por ejemplo "Retiro efectivo").
- [x] 1.17 Salto de 2–3 s entre el paso 3 y el 4 del tutorial de detalle: revisar (ver 0.2).
### Historial
- [x] 1.18 Título del historial: el "?" se queda separado del tutorial (sin cambios).
- [x] 1.19 "Periodo" dentro del historial: quitar el "?"; queda el tutorial.
- [x] 1.20 Gastos por categoría → modal (Health): el tutorial no responde (ver 0.1).
- [x] 1.21 Top 6 del historial: quitar el "?"; su texto pasa al tutorial.
### Perfil
- [x] 1.22 Quitar el botón de tutorial del perfil.

## 2. iPad (tablet)
- [x] 2.1 Modal "elegir mes": padding inferior (0.3).
- [x] 2.2 Tutoriales de modales y congelamiento (0.1).
- [x] 2.3 "Hola Yayo" un poco más pequeño en la cabecera del inicio.
- [x] 2.4 Logo: el mismo que el de la web (Gastify en negrita con punto violeta al final).
- [x] 2.5 Cabecera derecha, en este orden: pastilla "Octubre 2026" | separador | campana | separador | tutorial | avatar.
- [x] 2.6 El avatar muestra la foto de perfil (ahora no carga).
- [x] 2.7 El resto de los cambios del teléfono (sección 1) aplica también al iPad.

## 3. Web
### Dashboard
- [x] 3.1 Tarjeta de resumen del centro: quitar el botón de tutorial.
- [x] 3.2 Filtros de abajo: quitar el "?"; queda el tutorial.
- [x] 3.3 Wallet Analyzer: actualizar el "?" con el texto del modal de información de móvil.
- [ ] 3.4 Resumen de cuentas (dashboard): sin cambio. Esa tarjeta solo tiene «?» y no tiene tutorial que dejar. Pendiente de decisión.
- [x] 3.5 Resumen de transacciones: fusionar el "?" con el tutorial (solo queda tutorial).
- [x] 3.6 Top 6: fusionar el "?" con el tutorial.
- [x] 3.7 Top 6 elementos por mes: fusionar "?" y tutorial; quitar el "?" junto al selector "This Month"; quitar el "?" de hover junto a la pestaña gastos/ingresos.
### Movimientos
- [x] 3.8 Título del detalle de movimientos: orden título | separador | "?" | tutorial.
- [x] 3.9 Quitar el "?" de hover del botón Seleccionar.
- [x] 3.10 Quitar el "?" de hover junto a "This Month".
- [x] 3.11 Quitar el "?" de hover del botón de categoría de los filtros.
- [x] 3.12 Modal de editar movimiento: agregar botón de tutorial con los pasos de sus campos.
### Presupuestos
- [ ] 3.13 "Moneda principal": pregunta sin cambio. Recomendación: el «?» hover y el modal dicen lo mismo; conservar solo el modal (o solo el hover). Pendiente de decisión.
- [x] 3.14 Filtros de presupuestos: quitar el "?" junto a "restablecer"; el tutorial de los filtros explica esos filtros.
- [x] 3.15 "Presupuesto de gasto": quitar el botón de tutorial; queda el "?".
- [x] 3.16 Modal de un presupuesto (Home, proyectos y ahorros): separador + tutorial junto al título, con lo accionable del modal.
- [x] 3.17 Proyectos y ahorros: quitar los botones de tutorial de esas secciones.
- [x] 3.18 "Presupuestos de tu cartera": sin cambios.
### Proyecciones
- [ ] 3.19 Año de proyecciones: no encontré ningún «?» junto a «2026»; la fila solo tiene el compás. Sin cambio. Pendiente de confirmar qué quieres quitar.
- [x] 3.20 Fuentes de ingreso: fusionar "?" con tutorial.
- [x] 3.21 Referencia histórica: fusionar "?" con tutorial.
- [x] 3.22 Tabla "Mes a mes": título arriba de la tabla con separador, "?" y tutorial (como "Precisión de tus proyecciones"); quitar el botón de tutorial del encabezado "Mes" y pasar su "?" al título.
### Analizador de cartera
- [x] 3.23 Filtro de tiempo: quitar el botón de tutorial.
- [x] 3.24 Lo más destacado del mes: fusionar "?" con tutorial.
- [x] 3.25 Proyectado vs real: fusionar "?" con tutorial.
- [x] 3.26 Tendencia 6 meses, modal de un mes (al tocar una barra): quitar el tutorial y poner un "?" que explique lo que se ve.
- [x] 3.27 Top categorías y top transacciones: fusionar "?" con tutorial.
- [x] 3.28 Suscripciones recurrentes: separador entre el título y el "?"; fusionar el segundo "?" (de "detectadas por nombre y frecuencia") dentro del de arriba.
- [x] 3.29 Patrones por día de la semana: separador entre el título y el "?"; un solo "?" (fusionar el de "promedio de gasto por día").
- [x] 3.30 Filtros del analizador: quitar los "?" de hover; el "?" de periodo (al hacer clic) pasa a la izquierda del tutorial, con separador.
### Cuentas
- [x] 3.31 Filtro de tiempo: quitar el "?" de hover.
- [x] 3.32 Resumen de cuenta: fusionar "?" con tutorial.
- [x] 3.33 Resumen de movimientos: fusionar "?" con tutorial.
- [x] 3.34 Resumen y detalle de movimientos de la cuenta: quitar el "?" de hover junto a "This Month".
- [x] 3.35 Detalle de movimientos de la cuenta: fusionar "?" con tutorial y quitar el "?" junto al título.
### Historial
- [x] 3.36 Pestaña comparativo, "ingresos": quitar el "?" de hover.
- [x] 3.37 Filtro "Last 3 months": quitar el "?" de hover; el "?" de periodo (al hacer clic) pasa a la izquierda del tutorial, con separador.
- [x] 3.38 Versus el mes anterior: fusionar el "?" de totales con el de arriba.
- [x] 3.39 Tendencias: fusionar el "?" de "promedios de ingresos" con el del título de tendencia.
- [x] 3.40 Presupuestos y cumplimiento de rachas: fusionar el "?" de la derecha con el de "¿qué tan cerca estuviste?"; quitar el segundo.
- [x] 3.41 Suscripciones recurrentes: separador y un solo "?" (igual que 3.28).
- [x] 3.42 Patrones por día de la semana: separador y un solo "?" (igual que 3.29).
- [~] 3.43 Comparativo por categorías (no renderiza con «Last 3 months» ni 2025): categorías y presupuestos ahora tienen periodo propio (desacoplado). El «no renderiza» NO está reproducido: el navegador de pruebas está en la pantalla de 2FA; falta probar en vivo.
- [x] 3.44 Comparativo por categorías: quitar el "?" junto al selector "First Quarter Q1".
- [x] 3.45 Comparativo de presupuestos: independiente del comparativo de categorías (ver 3.43).
- [x] 3.46 Top 6 elementos por mes (abajo del historial): separador y tutorial que explique cómo funciona, junto al título.
- [x] 3.47 Pestaña gastos/ingresos del top 6 del historial: quitar el "?" de hover.
### Categorías
- [x] 3.48 Modales de categoría: título largo con "..." y separador + tutorial a la derecha, sin bajar el texto.
- [x] 3.49 Categorías por defecto: sin tutorial (queda el "?").
- [ ] 3.50 "Crear nueva categoría" (modal con "?") y el tutorial de "Tus categorías": sin cambios.

## 4. Pendientes de decisión (para el reporte)
- 1.4 / 1.6: "?" del modal de mes y de precisión: decidir después de probar el tutorial.
- 3.13: si el modal de "Moneda principal" aporta algo.
