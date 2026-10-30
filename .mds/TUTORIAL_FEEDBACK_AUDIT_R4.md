# Auditoría del feedback de la cuarta ronda (en el orden del mensaje)

Estados: **[OK]** verificado en código y en la app/web · **[COD]** hecho en código, falta verificar en dispositivo o navegador · **[MAL]** hecho mal o incompleto · **[NO]** no hecho · **[?]** falta una decisión tuya.

Última actualización: 2026-10-29. Verificado en la demo pública de Chrome (`/demo`, `/demo/accounts`, `/demo/analyzer`, `/demo/budgets`, `/demo/history`, `/demo/categories`, `/demo/projections`). La demo es de solo lectura: los modales de edición no abren y no tiene las secciones con datos reales (fuentes de ingreso, referencia histórica). Móvil: sin verificar, falta sesión (ver al final).

## Móvil (teléfono)

- [COD] A1 Modal «Elegir mes»: opciones con más aire por abajo (teléfono). `month-grid-modal.tsx`: `pb-8`.
- [COD] B1 Movimientos: sin «?» en el título; queda solo el tutorial.
- [COD] C1 Proyecciones, referencias históricas: el texto del «?» pasó al tutorial y el «?» se quitó.
- [COD] C2 Proyecciones, fuentes de ingreso: igual que C1.
- [MAL] D1 Modal de mes: separar más el «?» del tutorial. Se hizo con `gap-3` en `DetailSheet`, pero hay que confirmar en pantalla.
- [MAL] E1 Modal de mes: el botón de tutorial no respondía y al cerrar el modal la app se congelaba. Cambié el overlay a la hoja superior, pero no lo he visto en el emulador.
- [MAL] F1 Modal de precisión: mismo caso que E1.
- [COD] G1 «Crear» (+): sin «?»; queda el tutorial.
- [COD] H1 «Sin presupuesto» (tarjeta): sin botón de tutorial; queda el «?».
- [COD] I1 «Sin presupuesto» (modal): botón de tutorial en el título; pasos de monto, agregar, otras categorías y listo.
- [COD] J1 Analizador (título): sin «?»; su texto pasó al primer paso del tutorial. Hay que confirmar que es el «1 de 10».
- [MAL] K1 Top 6 del analizador: el paso 4 no resaltaba nada, y el paso 3 no abría el modal. Corregí el desplazamiento y la medición, pero no lo he visto.
- [COD] L1 Notificaciones: sin «?»; su texto pasó al paso 1 del tutorial.
- [COD] M1 Cuentas: tutorial de la cuenta específica (edición, periodo, resumen propio). Hay que confirmar.
- [OK] N1 Categorías: «?» arriba y tutorial al lado; el tutorial de «Tus categorías» se queda.
- [COD] O1 Detalle de categoría y de subcategoría: quitar el «?» y pasar su texto al primer paso. Hecho en código: `categories/[id].tsx` ya no tiene `titleInfo`; el texto de `formulario_categoria` va delante del paso «Nombre» (`tour.m-catform.name.body`, ES y EN), sin la frase «Toca la brújula…». `tsc` pasa en web y en móvil. Falta verlo en el emulador.
- [?] P1 Pausa de 2–3 s entre los pasos 3 y 4 del tutorial de detalle: no sé cuál tutorial es. Hay que verlo en el emulador.
- [COD] Q1 Historial, título: «?» y tutorial separados (sin cambios).
- [COD] Q2 Historial, «Periodo»: sin «?»; queda el tutorial.
- [MAL] R1 Historial, gastos por categoría → modal (Health): el tutorial del modal no respondía (caso E1).
- [COD] S1 Top 6 del historial: sin «?»; su texto pasó al tutorial.
- [COD] T1 Perfil: sin botón de tutorial.

## iPad

- [COD] U1 Modales de tutorial y congelamiento: mismo arreglo que E1.
- [COD] V1 «Hola Yayo» más chico: `text-4xl` (puede ser demasiado; hay que comparar).
- [COD] W1 Logo: vector generado desde el SVG de la web. Hay que compararlo en pantalla.
- [MAL] X1 Cabecera: pastilla «Octubre 2026», separador, campana, separador, tutorial, avatar con foto. El avatar usa `session.user.image`; hay que confirmar que es la misma foto que el perfil.
- [?] Y1 El resto de los cambios del teléfono aplican al iPad: se hizo con componentes compartidos; hay que confirmarlo en la tablet.

## Web

- [OK] Z1 Dashboard, resumen (carta del centro): sin botón de tutorial. Demo: la tarjeta «Resumen» solo tiene «?».
- [OK] AA1 Dashboard, filtros de abajo: sin «?» de hover; queda el tutorial. Demo: solo brújula en «Periodo».
- [OK] AB1 Wallet Analyzer: el texto del «?» debe ser el del modal de información de móvil (`lo_m_s_destacado`). Demo: la brújula del dashboard y la del analizador muestran ese texto. La clave `analizador_resumen` ya no se usa.
- [OK] AC1 «Resumen de cuenta» del dashboard: es la tarjeta «Resumen de cuentas». Demo: solo brújula; su «?» se fusionó.
- [OK] AD1 Resumen de transacciones (dashboard): «?» fusionado con el tutorial. Demo: solo brújula.
- [OK] AE1 Top 6 (dashboard): «?» fusionado con el tutorial. Demo: solo brújula.
- [OK] AF1 Detalle de movimientos (título): título | separador | «?» | tutorial. Demo: verificado con zoom.
- [OK] AG1 «Presupuesto de tu cartera»: sin cambios.
- [OK] AH1 Top 6 elementos por mes (dashboard): «?» fusionado; «?» de hover de «This Month» y de la pestaña, quitados. Demo: solo brújula.
- [COD] AI1 Movimientos: «?» de hover de «Seleccionar», de «This Month» y de categoría, quitados. Falta revisar el hover en la demo.
- [COD] AJ1 Editar movimiento: botón de tutorial en el modal (`movEdit`). No se puede ver en la demo: el modo demo es de solo lectura y el modal no se abre (`readOnly`). Falta sesión.
- [?] AK1 «Moneda principal»: pregunta sin cambio. Respuesta: `PrimaryCurrencySelector.tsx` tiene dos explicaciones: un tooltip de hover en todo el selector (`shared.currency.help`) y un «?» con modal (`moneda_principal`). Recomiendo dejar solo el «?» con modal y quitar el hover: es el criterio que ya aplicamos a los filtros, y el hover no existe en pantallas táctiles. No lo he cambiado.
- [OK] AL1 Filtros de presupuestos: «?» junto a «Restablecer» quitado; el tutorial de periodo explica los filtros. Demo: verificado.
- [OK] AM1 «Presupuesto de gasto»: sin tutorial; queda el «?». Demo: verificado.
- [OK] AN1 Modal de un presupuesto (casa, proyecto, ahorro): separador y tutorial junto al título (`budDetail`). Demo: verificado con «Casa».
- [OK] AO1 Proyectos y ahorros: sin botones de tutorial en esas secciones. Demo: no hay brújulas en esas secciones.
- [?] AP1 Proyecciones, año «2026»: no encontré «?» junto al año; solo está el tutorial. Demo: confirmado, solo brújula («Año y dinero de hoy»). Falta que me digas dónde lo ves; si es otro icono, lo quito.
- [COD] AQ1 Proyecciones, fuentes de ingreso: «?» fusionado con el tutorial. La demo no tiene esa sección; falta sesión.
- [COD] AR1 Proyecciones, referencia histórica: «?» fusionado con el tutorial. La demo no tiene esa sección; falta sesión.
- [COD] AS1 Proyecciones, tabla «Mes a mes»: título con separador, «?» y tutorial; el encabezado «Mes» queda limpio. Demo: título verificado; encabezado de la tabla pendiente.
- [OK] AT1 Wallet Analyzer, filtro de tiempo: sin tutorial. Demo: verificado.
- [OK] AU1 Lo más destacado del mes: «?» fusionado con el tutorial, con el texto corregido (ver AB1). Demo: la brújula muestra `lo_m_s_destacado`.
- [OK] AV1 Proyectado vs real: «?» fusionado con el tutorial. Demo: solo brújula.
- [OK] AW1 Tendencia, modal de un mes: sin tutorial; «?» que explica lo que se ve. Demo: el modal de «Septiembre 2026» tiene solo «?».
- [OK] AX1 Top categorías y top transacciones: «?» fusionado con el tutorial. Demo: solo brújula.
- [OK] AY1 Suscripciones recurrentes: un solo «?» con separador. Demo: «?» y brújula, sin segundo «?».
- [OK] AZ1 Patrones por día de la semana: un solo «?» con separador. Demo: «?» y brújula, sin segundo «?».
- [OK] BA1 Cuentas, filtro de tiempo: sin «?» de hover. Demo: solo brújula en «Periodo».
- [OK] BB1 Cuentas, resumen de cuenta: «?» fusionado con el tutorial. Demo: solo brújula en «Resumen de cuentas».
- [OK] BC1 Cuentas, resumen de movimientos: «?» fusionado con el tutorial. Demo: solo brújula.
- [COD] BD1 Cuentas, «This Month» del resumen y del detalle: «?» de hover quitado. Falta revisar el hover en la demo.
- [OK] BE1 Cuentas, detalle de movimientos: «?» fusionado con el tutorial. Demo: solo brújula.
- [COD] BF1 Regla general para filtros: hover quitado; el «?» de periodo va a la izquierda del tutorial. Orden verificado en historial y proyecciones; el hover falta revisarlo.
- [COD] BG1 Historial, pestaña «ingresos» del comparativo: «?» de hover quitado. Falta revisar el hover en la demo.
- [COD] BH1 Historial, «Last 3 months»: «?» de hover quitado; el de periodo, a la izquierda del tutorial. Orden verificado; hover por revisar.
- [OK] BI1 Historial, versus el mes anterior: «?» de totales fusionado con el de arriba. Demo: un solo «?».
- [OK] BJ1 Historial, tendencias: «?» de promedios fusionado con el de tendencia. Demo: un solo «?».
- [OK] BL1 Historial, presupuestos y rachas: «?» fusionado con el de «¿qué tan cerca…?». Demo: un solo «?» con los dos textos.
- [OK] BN1 Historial, suscripciones recurrentes: separador y un solo «?». Demo: verificado.
- [OK] BO1 Historial, patrones por día: separador y «?». Demo: verificado.
- [OK] BP1 Historial, proyecciones: filtros con la regla general. Demo: «?» de periodo y brújula.
- [OK] BQ1 Comparativo por categorías: NO renderizaba con «Last 3 months» ni con 2025. Causa: las pestañas usaban claves que no coincidían con el idioma (`web.bills`, etc.); ahora usan `t(...)`. Demo: renderiza con «Last 3 months» (MXN $126,777) y con 2025 (MXN $336,886, 23 barras). Falta confirmar con datos reales.
- [OK] BR1 Comparativo de presupuestos: periodo propio; ya no lo mueve el de categorías. Demo: al cambiar categorías a 2025, presupuestos se quedó en 2026-08-01 → 2026-10-29.
- [OK] BS1 Comparativo por categorías: «?» junto a «First Quarter Q1» quitado (vía filtro compartido).
- [OK] BT1 Top 6 elementos por mes (abajo del historial): separador y tutorial junto al título. Demo: brújula en el título.
- [COD] BU1 Top 6 del historial: «?» de hover de «ingresos» quitado. Falta revisar el hover en la demo.
- [OK] BV1 Categorías, «Crear nueva categoría»: sin cambios.
- [OK] BW1 Categorías, tutorial de «Tus categorías»: sin cambios.
- [COD] BX1 Títulos largos de modales de categorías: cortados con «…», separador y tutorial a la derecha. Código verificado (`EditCategoryModal.tsx`). La demo no abre ese modal: falta sesión.
- [OK] BY1 Categorías por defecto: sin tutorial; queda el «?». Demo: verificado.
- [OK] BZ1 Cuentas y categorías (tutorial general): sin cambios.
- [OK] AA2 (nuevo) Analizador, «Presupuestos · cumplimiento y rachas»: un solo «?» con los dos textos (el de presupuestos y el de cumplimiento), igual que el historial (BL1). La línea de ayuda ya no lleva «?». Demo: verificado.
- [COD] O2 (nuevo) Pantalla «Nueva categoría» (`categories/new.tsx`): también quitó su «?»; su texto va al mismo primer paso del tutorial, para no duplicarlo. Decisión mía: confirma si la quieres así.

## Pendiente de sesión (no se puede verificar sin login)

- Móvil completo (teléfono y tablet): el emulador está en la pantalla de inicio con un aviso del sistema («Process system isn't responding»); no hay sesión de Gastify.
- AJ1 y BX1: modales de edición, que no abren en la demo.
- AQ1, AR1 y el encabezado de AS1: secciones que la demo no tiene.
- Hover de AI1, BD1, BF1, BG1, BH1 y BU1.

## Preguntas para ti

- AK1: ¿quito el hover de «Moneda principal» y dejo solo el «?» con modal? (recomiendo que sí)
- AP1: ¿dónde ves el «?» del año 2026? En la demo no hay ninguno junto al año.
- O2: ¿la pantalla «Nueva categoría» también la quieres sin «?»?
- P1 y Y1: hace falta sesión en el emulador para verlos.
