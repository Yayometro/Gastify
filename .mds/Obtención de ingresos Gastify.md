# Obtención de ingresos Gastify

> Documento vivo de investigación y planeación sobre **cómo generar ingresos con Gastify** (suscripciones, privacidad/datos, facturación, préstamos, inversiones) y **a quién copiarle o estudiarle**. Cualquier IA o persona que lo continúe debe respetar las reglas de la sección 0.

---

## 0. Reglas de investigación (obligatorias para quien edite este archivo)

1. **Cada entrada nueva lleva encabezado con**: fecha (`AAAA-MM-DD`), **modelo o persona que investigó** (ej. `Claude Sonnet 5.5`, `ChatGPT`, `Luis`), y el tema.
2. **Toda afirmación con dato lleva su fuente** (URL completa en markdown). Si no hay fuente, se marca `[sin fuente]` o `[opinión]`.
3. **Clasifica la fiabilidad de la fuente**: `[oficial]` (10-K, 10-Q, ley, página de la empresa), `[prensa]`, `[tercero/estimación]` (Sacra, Dealroom, comparadores, blogs), `[autoreportado]` (dato que la empresa dice de sí misma, sin auditar). Las cifras de Sacra, Dealroom, Growjo y comparadores **no son auditadas**.
4. **Lo que no se encontró también se anota** (sección "No encontrado"), para no repetir búsquedas inútiles.
5. **No se borra nada**: si un dato se corrige, se deja el anterior tachado (`~~dato~~`) con la fecha y la corrección.
6. **Precios en moneda original** y con la fecha en que se vieron; los precios cambian. Verificar en la página oficial antes de decidir.
7. **Lo legal (LFPDPPP, SAT, CNBV, CONDUSEF, GDPR, CCPA) es orientación, no asesoría**: antes de lanzar algo que toque datos, facturación o préstamos, lo revisa un abogado/contador.
8. **No se publican ni se venden datos individuales de usuarios.** Cualquier idea de datos agregados se evalúa primero en la sección de privacidad.
9. **Separar siempre**: dato (lo que dice la fuente), inferencia (lo que se deduce) y recomendación.
10. **No hay cambios a la base de datos ni a producción** como parte de esta investigación.

---

## 1. Objetivo y contexto

- **Gastify**: app para saber en qué gastas, categorizar, controlar y ahorrar. Hay web (Next.js 16) y móvil (Expo), con captura manual y extracción de estados de cuenta con IA. **No** se conecta a bancos por API.
- **Pregunta de negocio**: ¿cómo generar ingresos sostenibles siendo un proyecto pequeño ("un pececito en un mar de tiburones")? Conclusión provisional: **empezar por suscripción**, por ser lo más barato de operar y lo más fácil de escalar; luego, por fases, funciones de mayor retorno (facturación para RESICO/freelancers, costo de oportunidad/inversión, intermediación de préstamos). **No** ser prestamista por ahora y **no** vender datos individuales.

### Lo que ya existe en el repo (revisado 2026-10-28, Claude Sonnet 5.5)
- Login con Google, passkeys y 2FA (Better Auth): `src/lib/auth/betterAuth.ts`.
- Perfil con sección **Privacidad** solo como texto provisional (`profile.section.privacy`, `profile.privacy.soon`: "Aquí van tus opciones de privacidad") en `packages/core/src/i18n/messages/es/profile.ts`.
- **No hay** código de cobro, planes ni consentimientos.
- Documentos de planeación existentes en `.mds/` (AI agent connector, resumen mensual con IA, presupuestos, proyecciones, multimoneda, móvil, i18n, etc.).
- Benchmark de extracción con IA de estados de cuenta: `.mds/LOCAL_MODEL_BENCHMARK.md` (Claude vs Gemini vs modelos locales Ollama).
- No verifiqué el esquema de usuario (campos como fecha de nacimiento o género) ni la infraestructura de hosting.

---

## 2. Bitácora de entradas

| # | Fecha | Quién | Tema |
|---|---|---|---|
| 1 | 2026-10-28 | Claude Sonnet 5.5 | Revisión del repo + ronda 1: modelos de negocio, privacidad/venta de datos, legal, login con Google, open banking México |
| 2 | 2026-10-28 | Claude Sonnet 5.5 | Ronda 2: quién factura más (cifras), modelos (suscripción, score/préstamos, SMB, facturación), 5 empresas a replicar |
| 3 | 2026-10-28 | Claude Sonnet 5.5 | Ronda 3: plan por fases, ENIF/efectivo, RESICO, APIs de inversión, Zaim Trend, aprendizajes de suscripción |
| 4 | 2026-10-28 | Claude Sonnet 5.5 | Ronda 4: tres casos de suscripción (YNAB, Monarch, Money Forward ME), historial de precios, pruebas gratis, LatAm |
| 5 | 2026-10-28 | Claude Sonnet 5.5 | Ronda 5: Canadá, China (Qianji), LatAm adicional; consolidación en este archivo; lista de 10 productos para fase 1 |

> Los *prompts* del usuario van completos en el **Apéndice A**.

---

## 3. Preguntas del usuario y respuestas (resumen por ronda)

### Ronda 1 — Privacidad, venta de datos y modelo
**Pregunta (resumen):** ver enrutamiento y opciones de privacidad de Gastify; modelo de suscripción con cuentas Pro; ¿las cuentas gratuitas deben "venderse datos"?; datos de segmentación (género, rango de edad) sin nombres; obtenerlos con login de Google (Facebook cuesta); cómo verificar que las transacciones sean reales sin API de banco; score del usuario; publicidad dirigida; poner todo en términos y condiciones; investigar modelos de apps similares en EE.UU., Japón, China, Europa y Latinoamérica.

**Respuesta (resumen):** se entregó un análisis con estos puntos:
- Estado del repo (sección 1).
- Tabla de modelos de apps similares (sección 5.1).
- **Riesgo de vender datos**: valor bajo (datos manuales sin verificar), riesgo legal (LFPDPPP 2025, GDPR, CCPA), precedente Plaid ($58M), y costo reputacional (Monarch usa "no vendemos tus datos" como argumento de venta). **Recomendación: no esconder la venta en T&C.**
- **Segmentación**: el login básico de Google da nombre, correo y foto; cumpleaños y género requieren permisos aparte (`user.birthday.read`, `user.gender.read`) y revisión de Google. Lo de que Facebook cobra el OAuth **no se pudo verificar**. Mejor opción: preguntar edad en rangos, género y país en el registro, opcional y explicado.
- **Verificar transacciones**: el open banking en México sigue detenido (Art. 76 Ley Fintech sin regulación secundaria), agregadores (Belvo, Finerio, Fintoc) con precios no encontrados.
- **Propuesta**: ingreso principal por suscripción Pro; tres niveles de privacidad en el perfil (Privado / Insights anónimos agregados / Ofertas al estilo Cardlytics); score solo como "salud financiera" interno (no vendible); no vender datos individuales.

### Ronda 2 — ¿Cuál factura más y cómo ganan?
**Pregunta (resumen):** ¿cómo está hoy el mercado?, ¿qué apps parecidas facturan mejor?, ¿suscripciones, score→préstamos, buró de crédito?, ¿cómo ganan Monarch, YNAB, Simplifi, Rocket Money, Mint, Fintonic, Money Forward ME, Zaim, Wallet by BudgetBakers?, ¿cuál tiene mejor retorno?; ¿modelo de facturación/SMB, scores para bancos, ser prestamista?; investigar **5 empresas específicas** en otras partes del mundo para replicar en LatAm, Europa o EE.UU.

**Respuesta (resumen):** tabla de facturación (sección 5.3). Hallazgos clave:
- Mayor utilidad/margen: **Credit Karma** (leads), pero requiere escala enorme.
- Mayor ingreso por suscripción: **Rocket Money**; más rápido: **Monarch**.
- **Money Forward**: la app personal es chica; el dinero grande es su SaaS para empresas.
- En México el score ya lo regalan (BBVA, Buró de Crédito) → gancho débil.
- Prestar exige capital y licencia (Konfío, OkCredit).
- Mejor oportunidad percibida: **facturación para pequeños negocios (CFDI)**; se asumió que "reciclos" = **RESICO**.
- 5 empresas a replicar: Money Forward (JP), Monarch (US), Wave (CA/US), Alegra (LatAm, como competidor/benchmark), OkCredit/Khatabook (India).

### Ronda 3 — Plan por fases y lluvia de ideas
**Pregunta (resumen):** empezar por lo más barato y escalable (suscripción); estudiar casos de suscripción; en paralelo desarrollar la función de mejor retorno; sección de **inversiones** ligada a México (APIs con GBM, Mercado Pago, Nu, Sofipos), mostrar rendimientos, y el ejemplo de "gastaste 140 mil en cigarros; si lo hubieras invertido…"; no ser prestamista ahora; sí ser **intermediario de préstamos** y **llevar facturación** (como Alegra), enfocado en RESICO/freelancers; copiar el embudo de Money Forward (la personal atrae gente, luego servicios), tipo Wave (contabilidad/facturación gratis para entes pequeños), libreta de cuentas tipo OkCredit/Khatabook, **planner de viajes**, Zaim a futuro (datos anonimizados); investigar apps tipo Gastify en México que **fracasaron**.

**Respuesta (resumen):** ENIF 2024 (efectivo), RESICO (reglas), Zaim Trend, APIs de inversión (no encontradas), regulación CNBV; plan por fases (sección 9).

### Ronda 4 — Tres casos de suscripción (de lo general a lo específico)
**Pregunta (resumen):** estudiar las **3 empresas** que mejor llevaron suscripción y que empezaron como apps de solo gastos/categorías: historial, cómo cambiaron precios, si empezaron gratis, **cuántos meses gratis**, cómo funcionó en Japón/Europa/EE.UU./LatAm; ¿hay algo parecido personal en LatAm?; idea: **plan Pro barato con todo Gastify + facturación sencilla para RESICO** como "gran punch".

**Respuesta (resumen):** YNAB, Monarch, Money Forward ME (sección 5.9), RevenueCat (pruebas), Emma, Mobills (Brasil), Qianji. No se encontró app personal de solo gastos con suscripción exitosa en México (no concluyente).

### Ronda 5 — Este archivo
**Pregunta (resumen):** consolidar todo en `.mds` con reglas de investigación, y definir **10 empresas** para fase 1 (prioridad: Mobills; Finerio; Inglaterra, EE.UU., Canadá, Japón, China y otra de LatAm); primer paso: investigación súper específica creando cuentas.

---

## 4. Recomendaciones (consolidado)

1. **Modelo principal: suscripción** (Pro) con plan gratis permanente con límites (como Money Forward/Spendee/Wallet) + prueba de Pro de ~30 días sin tarjeta (como YNAB/Copilot). Probar 14 vs 30 días. *[hipótesis, no dato]*
2. **Plan anual con descuento**; precios en pesos, bajos; subidas de precio solo con aviso y razón explícita; **no prometer tarifas congeladas** (YNAB recibió críticas).
3. **Escalera de planes** a probar: Gratis → Pro personal → Pro con facturación (RESICO/freelancers), con tope de facturas por el costo de timbrado.
4. **Facturación RESICO**: valor = facturar + llevar ingresos + calcular ISR mensual (RESICO no deduce gastos, paga 1%–2.5% mensual, sin declaración anual). Requiere **PAC** como socio.
5. **Sección de costo de oportunidad** ("lo que gastaste en X, invertido sería…") como diferenciador en México; es **cálculo educativo** (no requiere APIs). Recomendar productos es otra cosa (CNBV) → consultar abogado.
6. **Importar estados de cuenta de inversión** (ya se hace con los bancarios) en lugar de depender de APIs que no existen públicamente.
7. **Privacidad**: sección en el perfil con 3 niveles opt-in (Privado por defecto / Insights anónimos agregados con mínimo de usuarios por grupo / Ofertas sin que el anunciante vea datos). **No vender datos individuales.**
8. **Datos agregados estilo Zaim Trend** solo con muchos usuarios y fase tardía.
9. **No ser prestamista** ahora; sí explorar **intermediación de préstamos** con consentimiento, tras revisar regulación (CNBV/CONDUSEF).
10. **Estudiar la migración**: Copilot y Monarch crecieron con la ola tras el cierre de Mint → ofrecer importación fácil (estados de cuenta, Excel/CSV) para captar usuarios de otras apps.

---

## 5. Investigación (datos y fuentes)

### 5.1 Modelos de negocio de apps de finanzas personales (ronda 1)

| Modelo | Quién | Dato | Fiabilidad |
|---|---|---|---|
| Suscripción sin anuncios/venta de datos | Monarch, YNAB, Copilot, Simplifi | Monarch $99.99/año o $14.99/mes; no vende datos, sin anuncios ni referidos | tercero/estimación (Sacra) |
| Suscripción + servicios | Rocket Money | Cancelar suscripciones, negociar facturas | oficial/tercero |
| Gratis con anuncios y referidos | Mint | ARPU ~$2–3; cerrado en 2024 | tercero |
| Lead-gen/marketplace | Credit Karma | ver 5.3 | oficial (10-K) |
| Marketplace con comisión | Fintonic | Gratis; comisión de instituciones por préstamos/seguros/ahorro; FinScore | prensa 2017 |
| Pivote B2B | Finerio | De app personal a API (Finerio Connect) | prensa |
| Freemium | Money Forward ME, Zaim, Wallet | ver 5.5 y 5.10 | tercero |
| Datos anonimizados | Cardlytics | Datos no salen del banco; anunciante no ve a la persona; comerciante paga al redimir; reparto con banco entre ~35% y ~55% según fuente | tercero (blogs) |

Costos de datos bancarios: cada usuario activo genera costos variables con proveedores (Plaid, Finicity, MX) → empuja a la suscripción (Sacra, tercero).

### 5.2 Mint / Credit Karma
- Mint era gratis; ganaba con publicidad y referidos; Intuit lo cerró (anuncio fines de 2023; efectivo marzo 2024, fuentes discrepan entre 1-ene y mar-2024). Credit Karma = generador de leads para tarjetas y préstamos personales. El precio de la compra de Credit Karma (US$4.7B vs 8.1B) varía según fuente.
- Fuentes: ver sección 7.

### 5.3 Quién factura y gana más (cifras)

| Empresa | Modelo | Cifras | Fiabilidad |
|---|---|---|---|
| **Credit Karma** (EE.UU.) | Leads (tarjetas, préstamos personales, seguro auto) | Ingresos US$2,263M y utilidad operativa US$835M en FY2025; +32% ingresos; ~12% de Intuit | **oficial** (10-K Intuit) |
| **NerdWallet** (EE.UU.) | Comisiones por referidos | Ingresos US$837M (+22%), utilidad operativa GAAP US$65M, non-GAAP US$96M (11%) en 2025 | **oficial** (10-K) |
| **Rocket Money** (EE.UU.) | Suscripción + servicios | Q1-2025 US$96.5M; Q2-2025 US$95.8M (+31% interanual); 9M-2025 +32% por pagantes. Sacra: US$390M en 2025 | oficial (10-Q) / Sacra |
| **Monarch** (EE.UU.) | Suscripción pura | Sacra: ~US$100M ARR (sep-2026), US$60M a fines de 2025; >500,000 pagantes y >1M usuarios (mar-2026); Serie B US$75M a ~US$850M (may-2025) | tercero/estimación |
| **YNAB** | Suscripción | Estimado Growjo ~US$49M ARR, ~450K suscriptores (dudoso) | tercero (poco fiable) |
| **Money Forward** (Japón) | App personal freemium + SaaS empresas | Ventas consolidadas FY2025 ¥50,349M (+24.7%), utilidad neta ~¥1,600M; ARR SaaS ¥39,333M; ARR de suscripción premium del segmento Home ¥3,543M | tercero (Envalith); verificar en kessan tanshin |
| **Wave** (CA/US) | Contabilidad/facturación gratis + pagos y nómina; luego plan de pago | ~US$100M ingresos (hacia 2022); adquirida por H&R Block en 2019 por US$405M cash; >400K negocios | prensa |
| **Nubank** | Crédito/tarjetas | Ingresos US$16.4B y utilidad US$2.9B (2025); Nu México ~14M clientes, ARPAC US$12.5 (Q3-2025), sin utilidad propia declarada aún | autoreportado |
| **Khatabook** (India) | Bookkeeping micro-comerciantes → préstamos | FY22 ingresos ~Rs 71 crore (77.5% por exportación de servicios a su matriz) | oficial (registro) vía prensa |
| **OkCredit** (India) | Freemium SaaS; dejó FLDG lending | FY24 ingresos ~Rs 14 crore (+72%), pérdida Rs 35.2 crore; fundador dice rentable desde nov-2025 (autoreportado); RBI negó licencia NBFC | prensa/autoreportado |
| **BukuWarung** (Indonesia) | Sin suscripción al inicio; cobra al pasar cierto número de pagos; pagos y préstamos | 6.5M comercios (2021); rentabilidad no confirmada | prensa 2021 |
| **Konfío** (México) | Préstamos PyME + tarjeta + herramientas | Unicornio US$1.3B (serie E US$110M, sep-2021); líneas Goldman Sachs/Gramercy hasta MX$4,100M; finanzas no disponibles | prensa |
| **Alegra** (LatAm) | SaaS contabilidad/facturación | Suscripción; 365K+ usuarios en 25+ países (bitscale, dudoso); sin ARR confiable | tercero |

**Conclusión (inferencia):** mayor margen = Credit Karma; mayor ingreso por suscripción = Rocket Money; más rápido = Monarch. ROI por empresa no calculable (no publican costos por producto).

### 5.4 Modelos "score → préstamos / buró" en México
- **BBVA México** muestra score de buró gratis en su app a ~10M de clientes ("Tu situación crediticia").
- **Buró de Crédito**: reporte especial gratis una vez cada 12 meses; el "Mi Score" cuesta ~MX$58 (según una guía).
- → Un score gratis no es un gancho diferenciador en México. *[inferencia]*

### 5.5 Japón, China, Europa, LatAm (modelos regionales)
- **Money Forward ME (JP)**: freemium. Premium ¥500/mes durante 12 años; en 2022 repartió cupones de 30 días gratis a usuarios gratuitos y explicó alzas de costos de datos y APIs; en **ago-2025** subió: Estándar ¥540/mes o ¥5,940/año; Avanzado (patrimonio) ¥980/mes o ¥10,700/año. Pagantes: sin cifra oficial; un blog dice ~400,000 (no oficial).
- **Zaim (JP)**: freemium; premium quita anuncios, múltiples cuentas, análisis; en 2020 lanzó **"Zaim Trend"** (beta; estadísticas agregadas de compras, gratis al inicio para empresas). Precio y pagantes: **no encontrados**.
- **Suishouji / Feidee (CN)**: 2014 Serie B (Fosun, Sequoia China); plan de abrir datos a startups financieras. Cifras actuales no encontradas.
- **Qianji 钱迹 (CN)**: sin anuncios, sin splash, sin venta de productos financieros; >6 millones de usuarios (App Store); membresía (precios de un listado de terceros, sin fecha): 1 mes ¥6, 6 meses ¥24, 1 año ¥36, **vitalicia ¥128**; ingresos no publicados.
- **Fintonic (ES/MX)**: gratis; ingresos por comisiones de marketplace (préstamos, seguros, inversión); licencia de corredor de seguros; bono MARF de €70M (≈US$79M); FinScore. Datos de 2017–2019.
- **Finerio (MX)**: nació en 2016 como primera plataforma gratuita automatizada de finanzas personales en México; ~350 mil usuarios en México y unidades en Colombia y Chile (Forbes Brasil, 2021); en 2020 lanzó **Finerio Connect** (API financiera, 65+ clientes según una listing); alianza operativa con **GuiaBolso** (Brasil) en 2021; ronda 2023 de US$6.5M para open finance. **Aclaración**: el usuario escribió "Finerio... referencia en España"; Finerio es **mexicano**; el producto español es **Fintonic**. Se incluyen ambos.
- **Emma (UK)**: tres planes (Plus, Pro, Ultimate); la propia empresa dijo que **17% de usuarios activos pagan** y que quiere llegar a 50% (post de comunidad, sin fecha); precios desde ~US$4.99/mes; semilla US$2.5M (Connect Ventures) con >200K usuarios (~2019).
- **Mobills (Brasil)**: creada en 2013; 8M usuarios registrados (2020), ">10 millones" hoy (su web); freemium; precio actual en su página R$99.90/año (otras fuentes: R$159.90 con cupón R$111.90 en 2024; R$100/año o R$20/mes en 2021 — discrepan); 20% de ingresos fuera de Brasil (2021); expansión a LatAm/EE.UU./Europa planeada en 2021; "3 mil suscriptores en una campaña de aniversario 2020" (dato débil). Suscriptores e ingresos totales: **no encontrados**. Tras búsqueda: **no se confirmó** adquisición por Zenvia ni datos de Organizze/GuiaBolso.
- **Wallet by BudgetBakers (CZ)**: gratis manual con límites (p. ej. 3 cuentas en Android); premium para automatización; fundada 2010 (Finder).
- **Spendee / Goodbudget / Toshl**: precios de comparadores no oficiales; Spendee Plus ~$2.99/mes o $14.99/año y Premium ~$3.99/mes o $22.99/año (con bank sync); Goodbudget ~US$45/año (límites de sobres); Toshl 2 cuentas gratis.
- **Canadá** (Mint cerrado también para canadienses): alternativas citadas por blogs: Monarch/YNAB (US$14.99/mes), **Wealthsimple Cash y KOHO** (gratis, neobancos), **Hardbacon** y Mogo (gratis), **Wealthica** (inversiones/cuentas registradas), Waypoint Budget, Richify. Sin precios oficiales en CAD.
- **LatAm — disposición a pagar**: un ejecutivo de América Móvil observó que en México el usuario busca la versión gratuita y compra muy poco dentro de apps (poder adquisitivo y baja penetración de tarjetas de crédito) → Xataka. Egade/Startupeable: pocos casos de éxito de suscripción en la región.

### 5.6 Privacidad y marco legal
- **México — LFPDPPP nueva**: publicada 20-mar-2025, vigente al día siguiente; abroga la de 2010; autoridad pasó del INAI a la **Secretaría Anticorrupción y Buen Gobierno**; última reforma citada DOF 14-nov-2025. Consentimiento puede ser tácito salvo cuando se exija expreso; usar datos para finalidad distinta al aviso exige nuevo consentimiento; **datos sensibles → consentimiento expreso**; en la ley de 2010 los **datos financieros/patrimoniales requerían consentimiento expreso** (**no confirmado** en la versión 2025 → verificar en el DOF).
- **GDPR**: el consentimiento es la base legal casi única para publicidad dirigida (EDPB); debe ser libre, específico, informado e inequívoco; **no puede esconderse en T&C largos**. La opinión del AG Spielmann (Canal+) apunta a que consentir a "socios" no identificados puede no ser suficiente (es opinión, no sentencia).
- **CCPA/CPRA**: compartir datos para publicidad dirigida cuenta como "venta/compartir"; exige opt-out; barrido del AG de California en apps móviles (2023).
- **Precedentes**: Plaid, acuerdo de **US$58M** por supuesta recolección/venta de datos de transacciones sin consentimiento (~98M personas; Plaid dice que nunca vendió datos); carta de senadores a la FTC sobre Envestnet/Yodlee (2020; no es acción de la FTC); FTC: cambiar la política de privacidad de forma inconsistente con promesas previas puede ser práctica desleal (IAPP).
- **Login con Google**: el básico entrega nombre, correo y foto; cumpleaños y género son scopes aparte (`user.birthday.read`, `user.gender.read`); Google revisa scopes sensibles (3–10 días hábiles según página); **no confirmado** si esos dos son "sensibles". Facebook Login "cobra": **no verificado**.
- **Open banking México**: Art. 76 Ley Fintech sin regulación secundaria (solo cajeros); Banxico emitió reglas solo para SIC y cámaras; sin marco de consentimiento ni acreditación de terceros (2026, OpenBankingTracker).

### 5.7 Facturación y pequeños negocios en México
- **RESICO**: personas físicas con ingresos < MX$3.5 millones/año; ISR de 1% a 2.5% mensual; **sin deducciones**; desde 2025 el SAT los relevó de la declaración anual (solo pagos mensuales). Número de inscritos: **no encontrado**.
- **Alegra México**: entrada ~MX$129/mes (una guía de software; verificar); CFDI 4.0, contabilidad básica, inventario, reporte RESICO "listo para el SAT" (blog de Alegra, sep-2025).
- **Facturama**: prueba gratis de API y timbrado; precio **no confiable** (Capterra da cifras contradictorias).
- **Timbrado**: ~MX$0.30–2 por factura según PAC (guía; no es precio de un proveedor).
- **Pendiente**: requisitos para ser/usar un **PAC**, competidores (Contalink, otros), costos reales.

### 5.8 Efectivo e inclusión financiera (ENIF 2024 / INEGI)
- 85.2% prefiere efectivo en compras de hasta 500 pesos; 73.5% en montos mayores; 69.1% de titulares de cuenta usan apps financieras (54.3% en 2021); CoDi 12.8% (8.3% en 2021); cuenta de ahorro formal 63% (49.1% en 2021). Un artículo de El Imparcial da otra cifra (90%→78% del efectivo) que no cuadra → **verificar en INEGI**. Porcentaje de adultos que registra gastos: **no encontrado**.

### 5.9 Historial de suscripción de los tres casos (ronda 4)

**YNAB**
- Origen: software de escritorio a **US$60** de pago único (~2012). En 2014 el fundador (Jesse Mecham) dijo que quien pagó los $60 seguiría igual.
- Suscripción web (nYNAB) tarde en **2015**: un blog competidor (Pocketclear) fecha **US$50/año (2015) → US$83.99 (2017) → US$98.99 (2021) → US$99 (2024)**; hoy **US$14.99/mes o US$109/año**. **Cifras no verificadas** (fuentes discrepan en el primer precio y si fue reemplazo total).
- **Prueba: 34 días sin tarjeta.**
- Fortune: usuarios de YNAB 4 con promesa de tarifa congelada (US$45/año) terminaron pagando más → fuente de quejas.

**Monarch**
- Solo suscripción, **sin plan gratis permanente**; **7 días de prueba** con acceso completo; US$14.99/mes o US$99.99/año.
- Una fuente (ThePricer) dice que lanzó **Monarch Plus a US$199.99/año**, solo anual, el 20-abr-2026 (sin confirmar). Año de fundación: discrepan (2018 vs 2020).
- Absorbió buena parte de los ~3.6M usuarios de Mint (según un review). Análisis Sacra: calzó con la "lista de Mint" (agregación de cuentas, importar historial, sin anuncios, colaboración en hogar) y su reto es volver hábito la migración.

**Money Forward ME**: ver 5.5 (freemium, ¥500 por 12 años, cupón 30 días en 2022, alza a ¥540 en ago-2025, plan ¥980 avanzado).

**Otros datos de suscripción**
- **Copilot**: fundada 2019 (Andrés Ugarte); **1 mes de prueba**; US$13/mes o US$95/año; >100,000 pagantes y Serie A US$6M (2024); el día del anuncio del cierre de Mint fue su mejor día; "creció más en cuatro meses que en cuatro años". Historial de precios: **no confirmado** (CostBench reporta una baja de $13 a $8/mes, conflictivo).
- **Simplifi**: ~US$3.99/mes (47.88/año) promo el primer año; ~US$6.99/mes (83.88/año) regular (comparador).
- **Rocket Money Premium**: US$6–15/mes según fuente.
- **RevenueCat (State of Subscription Apps 2026)**: pruebas de **17+ días → mediana de conversión 42.5%** vs **25.5% en ≤4 días** (no específico de finanzas, no prueba causalidad); apps de precio bajo retienen mejor (mediana 36% vs 23%, según 9to5Mac); una nota sin fuente clara: ~35% de cancelaciones ocurre en el mes 1; reactivación de anuales ≈5%.
- **YipitData**: 10.1% de suscriptores de YNAB en app store (1,907) también pagaron Monarch (vs 0.6%), ago-2024 a jul-2026; solo recibos de app stores.

### 5.10 Inversiones en México
- **APIs públicas** de GBM, Mercado Pago, Nu México, Klar, Stori, Finsus para consultar rendimientos: **no encontradas**. APILab de Banco Azteca (2020) ofrecía saldos y movimientos para terceros. Belvo (agregador) tiene presencia en México.
- **CNBV**: asesores de inversión están supervisados; en 2023 anunció mayores requisitos tras el caso Black WallStreet Capital (reforma a la LMV; texto final no confirmado); **Fintual** opera en México con dos entidades reguladas (asesoría y distribución de fondos).
- Reglas sobre publicidad de apps/simuladores y papel de CONDUSEF: **no encontradas**.

### 5.11 Lo que NO se encontró (no repetir sin cambiar el enfoque)
- Apps mexicanas personales de solo gastos que **fracasaron** (los resultados fueron listas de "mejores apps").
- Suscriptores/ingresos de **Mobills**, Organizze, GuiaBolso (estado actual), Finerio (estado actual de su consumer app).
- Precios de **Belvo, Finerio Connect, Fintoc**.
- Ingresos de Copilot; precios/pagantes de **Zaim**; precios de **Finary/Bankin'**.
- Tasas de conversión de **apps de finanzas** en pruebas gratis.
- Cuántos contribuyentes **RESICO** hay; cómo ser/usar un **PAC**; precios oficiales de Facturama.
- Cuánto estaría dispuesto a pagar un usuario mexicano; cómo cobrar suscripciones en México (Stripe/Mercado Pago/OXXO/tienda de apps).
- Costos de infraestructura de Gastify (hosting, DB, IA).
- Una app **no brasileña** de LatAm del tipo Gastify.

---

## 6. Empresas investigadas (directorio)

| Empresa | País | Tipo | Dónde se trata |
|---|---|---|---|
| Monarch Money | EE.UU. | PFM suscripción | 5.1, 5.3, 5.9 |
| YNAB | EE.UU. | Presupuesto suscripción | 5.3, 5.9 |
| Copilot Money | EE.UU. | PFM suscripción | 5.9 |
| Simplifi (Quicken) | EE.UU. | PFM suscripción | 5.9 |
| Rocket Money (Truebill) | EE.UU. | Suscripción + servicios | 5.3 |
| Mint (Intuit) | EE.UU. | Gratis, anuncios/referidos; cerrado | 5.2 |
| Credit Karma (Intuit) | EE.UU. | Leads financieros | 5.3 |
| NerdWallet | EE.UU. | Afiliados | 5.3 |
| Empower | EE.UU. | Dashboard gratis, upsell de patrimonio | 5.1 |
| Cleo, Super.com, Dave | EE.UU. | Suscripción + adelantos/crédito (solo mencionados) | 5.1 |
| Wave (H&R Block) | CA/EE.UU. | Contabilidad/facturación | 5.3 |
| Mobills | Brasil | PFM personal freemium | 5.5 |
| Organizze, GuiaBolso | Brasil | PFM (sin datos) | 5.11 |
| Fintonic | España (y MX) | PFM + marketplace | 5.5 |
| Finerio / Finerio Connect | México | PFM → API open finance | 5.5 |
| Emma | Reino Unido | PFM suscripción en niveles | 5.5 |
| Money Forward ME / Cloud | Japón | PFM freemium + SaaS | 5.3, 5.5 |
| Zaim | Japón | Freemium + Zaim Trend | 5.5 |
| Suishouji (Feidee) | China | Contabilidad personal | 5.5 |
| Qianji 钱迹 | China | Contabilidad sin anuncios, membresía | 5.5 |
| Wallet by BudgetBakers | Chequia | Freemium | 5.5 |
| Spendee, Goodbudget, Toshl | Varios | Freemium | 5.5 |
| Wealthsimple Cash, KOHO, Hardbacon, Mogo, Wealthica | Canadá | Neobancos/inversión/PFM (blogs) | 5.5 |
| Nubank / Nu México | Brasil/México | Banco digital | 5.3 |
| Konfío | México | Crédito PyME | 5.3 |
| Alegra | LatAm (CO/MX…) | SaaS facturación/contabilidad | 5.3, 5.7 |
| Facturama, Contalink (mencionada) | México | Facturación CFDI | 5.7 |
| Conta Azul | Brasil | SaaS contabilidad PyME (cifras no fiables) | 5.3 |
| Khatabook, OkCredit | India | Libreta de cuentas → préstamos | 5.3 |
| BukuWarung / Bukukas | Indonesia | Libreta de cuentas → pagos/préstamos | 5.3 |
| Cardlytics | EE.UU. | Ofertas con datos de bancos | 5.1 |
| Plaid, Envestnet/Yodlee, MX, Finicity | EE.UU. | Agregadores de datos | 5.1, 5.6 |
| Belvo, Fintoc | LatAm | Agregadores | 5.6, 5.10 |
| Fintual | Chile/México | Inversión regulada | 5.10 |
| Buró de Crédito, Círculo de Crédito, BBVA México | México | Score/buró | 5.4 |

---

## 7. Directorio de fuentes (todas las usadas o consultadas)

> Fiabilidad: **[O]** oficial · **[P]** prensa · **[T]** tercero/estimación · **[A]** autoreportado. Fecha de consulta: 2026-10-28.

### Modelos y facturación
- [T] Sacra, Monarch: https://sacra.com/c/monarch-money/ · https://sacra.com/research/monarch-money · https://sacra.com/research/monarch-money-at-100m-arr/
- [T] Sacra (chats): https://sacra.com/chat/h/145f0a92-d8ee-49f4-9d61-242c7b7e6a4e/ · https://sacra.com/chat/h/7ab06f32-1ac2-425d-b59d-30e56ce37109/ · https://sacra.com/chat/h/9b4fc67c-1811-47a8-bec4-bae92e27a562/ · https://sacra.com/chat/h/440b3c85-e332-4741-9fe4-f31ee7cad8cc/ · https://sacra.com/chat/h/e2de06af-2357-4edb-bbe5-3b4d6f0f2d5f/ · https://sacra.com/chat/h/d7bf7d98-7a5c-4f9f-81ea-1541e71feaf8/ · https://sacra.com/chat/h/ead811d2-7e8e-49f3-843f-b90ce16080f4/ · https://sacra.com/chat/h/49b76886-279d-4b9a-a9ac-6ca939c3de9d/
- [T] YipitData YNAB/Monarch: https://ask.yipitdata.com/insights/ynab-subscribers-monarch-money-overlap
- [T] Origin: https://useorigin.com/resources/blog/7-best-personal-finance-management-tools-for-2026-expert-review
- [T] Luminix: https://www.useluminix.com/reports/industry-analysis/competitive-landscape-personal-finance-and-budgeting-apps-2026/source/7 · https://www.useluminix.com/reports/industry-analysis/competitive-landscape-personal-finance-and-budgeting-apps-2026/source/1
- [O] Intuit 10-K FY2025: https://www.sec.gov/Archives/edgar/data/896878/000089687825000035/intu-20250731.htm · 10-Q: https://www.sec.gov/Archives/edgar/data/896878/000089687825000022/intu-20250430.htm · ARS: https://www.sec.gov/Archives/edgar/data/896878/000089687825000061/intu014766-ars.pdf
- [O] NerdWallet 10-K FY2025: https://www.sec.gov/Archives/edgar/data/1625278/000162527826000014/nrds-20251231.htm · ARS: https://www.sec.gov/Archives/edgar/data/1625278/000162527826000036/form10-kfy25xars.pdf · [P] https://marketchameleon.com/Blog/post/2025/11/07/nerdwallet-q3-2025-operating-margin-revenue-growth
- [O] Rocket Companies 10-Q: https://www.sec.gov/Archives/edgar/data/1805284/000180528425000065/rkt-20250331.htm · https://www.sec.gov/Archives/edgar/data/1805284/000180528425000088/rkt-20250630.htm · https://www.sec.gov/Archives/edgar/data/1805284/000180528425000136/rkt-20250930.htm
- [T] Mint/Monarch/Finary/Pocketclear: https://monarchmoney.com/mint-shutting-down · https://www.monarch.com/blog/mint-shutting-down · https://finary.com/en/blog/mint-is-shutting-down-what-you-need-to-know/ · https://pocketclear.app/blog/what-happened-to-mint-2026.html · https://www.financialsamurai.com/best-mint-alternatives/ · https://dealroom.co/companies/mint/
- [T] Money Forward: https://envalith.com/en/companies/3994/overview · https://stockanalysis.com/quote/tyo/3994/financials/income-statement/ · https://filingreader.com/news-wire/tokyo/2025-10-15/money-forward-reports-q3-2025-financials-revises-full-year-outlook · https://finder.techleap.nl/companies/money_forward · https://apps.apple.com/jp/app/id594145971
- [O/P] Money Forward ME precios: https://support.me.moneyforward.com/hc/ja/articles/48081358493209 · https://support.me.moneyforward.com/hc/ja/articles/4409828451993 · https://www.bcnretail.com/market/detail/20221107_303463.html · https://pricey.jp/web/articles/4679
- [P] Zaim Trend: https://www.bcnretail.com/topics_detail9/20200206_157610.html · [T] https://app.dealroom.co/companies/zaim
- [P] Suishouji: https://technode.com/2014/09/02/personal-bookkeeping-app-suishouji-raises-series-b-financing/ · [T] https://www.cbinsights.com/compare/shenzhen-kingdee-suishou-technology-vs-toshl
- [T/O] Qianji: https://sspai.com/item/148 · https://sspai.com/post/98549 · https://apps.apple.com/lu/app/%E9%92%B1%E8%BF%B9%E8%AE%B0%E8%B4%A6-%E6%97%A0%E5%B9%BF%E5%91%8A%E8%87%AA%E5%8A%A8%E8%AE%B0%E8%B4%A6%E8%BD%AF%E4%BB%B6-%E9%A2%84%E7%AE%97-%E8%B5%84%E4%BA%A7%E7%AE%A1%E7%90%86/id1473785373?l=de-DE
- [P] Fintonic: https://techcrunch.com/2017/06/26/fintonic-banks-28m-to-grow-its-personal-finance-management-app/ · https://www.fintonic.com/blog/fintonic-secures-19-million-euros-in-a-new-funding-round-that-sets-the-valuation-of-the-company-at-160-million-euros/ · https://finovate.com/category/fintonic · https://finovate.com/fintonics-21-4-million-funding-boosts-valuation-to-180-million/ · https://fintonic.com/en-ES/home · [T] https://app.dealroom.co/companies/fintonic
- [P] Finerio: https://techcrunch.com/2023/10/23/fintech-finerio-6-5m-open-finance-latin-america/ · https://techcrunch.com/video/finerio-at-startup-battlefield-latin-america-2018 · https://www.badcredit.org/news/finerio-provides-open-banking-experiences-to-underserved-communities/ · https://mexicobusiness.news/entrepreneurs/news/5-reasons-why-mexico-needs-better-personal-finance-tools · https://www.provenir.com/marketplace/finerio-connect/ · https://finnosummit.com/en/?p=4282 · https://forbes.com.br/forbes-money/2021/05/guiabolso-fecha-parceria-com-mexicana-finerio-para-expansao-na-america-latina/
- [P/O] Mobills: https://www.mobills.com.br/pricing/ · https://www.mobills.com.br/blog/aplicativos/cupom-de-desconto-mobills/ · https://www.mobiletime.com.br/noticias/21/01/2021/mobills-aposta-em-expansao-internacional-para-2021/ · https://www.mobiletime.com.br/?p=662413
- [T] Emma: https://community.emma-app.com/t/new-subscription-plan-emma-plus/4441?page=2 · https://apps.apple.com/app/id1270062373 · https://emma-app.com/android · [P] https://techcrunch.com/?p=1953647 · https://siliconcanals.com/london-personal-finance-management-app-emma-funding/ · https://coverager.com/emma-raises-2-5-million/
- [T] Wallet by BudgetBakers: https://www.finder.com/uk/wallet-budgetbakers-review
- [T] Spendee/Goodbudget/Toshl/etc.: https://joingerald.com/learn/financial-wellness/expense-tracking-apps-subscription-costs-compared · https://joingerald.com/learn/money-basics/expense-tracking-apps-account-limitations-ios · https://toomanyadapters.com/best-budgeting-expense-tracking-apps-travel/
- [P] Wave: https://betakit.com/after-years-of-providing-free-accounting-and-invoicing-software-wave-rolls-out-paid-model/ · https://www.hrblock.com/tax-center/newsroom/financial-confidence/wave-financial/ · https://www.infotech.com/software-reviews/vendor-technology-notes/wave-acquired-by-h-r-block-what-does-it-mean-for-small-businesses · https://www.retailbankerinternational.com/news/wave-financial-acquisition/
- [P] Khatabook/OkCredit: https://cwv.yourstory.com/2024/10/okcredit-reports-72-percent-rise-annual-revenue-rs-14-cr · https://entrackr.com/?p=161342 · https://entrackr.com/?p=160065 · https://the-ken.com/story/khatabooks-fundraising-hack/
- [P] BukuWarung: https://yourstory.com/2021/07/indian-entrepreneurs-indonesian-msme-fintech-startup-bukuwarung · https://techcrunch.com/2021/06/09/bukuwarung-a-fintech-for-indonesian-msmes-scores-60m-series-a-led-by-valar-and-goodwater · https://en.dailysocial.id/post/financial-record-application-business-opportunities-for-stalls
- [P] Konfío: https://www.gramercy.com/2023/03/mexican-fintech-konfio-upsizes-and-extends-loan-commitment-from-goldman-sachs-and-gramercy-for-up-to-mx4100mm/ · https://fintech.global/2019/12/04/konfio-closes-100m-round-to-help-smes-in-latam-access-loans/ · https://ffnews.com/news/konfio-upsizes-and-extends-loan-commitment-from-goldman-sachs-and-gramercy-to-grow-its-business
- [A/P] Nubank: https://international.nubank.com.br/company/nu-mexico-grows-customer-base-by-50-in-12-months-and-is-already-3rd-in-cards-issued-in-the-country/ · https://international.nubank.com.br/company/nu-mexicos-total-investments-expected-to-reach-us4-2-billion-by-2030-as-banking-launch-approaches/ · https://www.crowdfundinsider.com/2025/08/247768-digital-banking-nubank-subidiary-nu-mexico-reports-steady-growth-in-clients/ · https://neofeed.com.br/negocios/a-espera-da-licenca-nos-eua-nubank-cresce-em-receita-lucro-e-volume-de-clientes/en/
- [T] Alegra/Conta Azul: https://www.riverwoodcapital.com/investment/alegra/ · https://app.dealroom.co/companies/alegra · https://bitscale.ai/directory/alegra · https://developers.apideck.com/apis/accounting/alegra/resources · https://canvasbusinessmodel.com/products/contaazul-swot-analysis · https://stackshare.io/conta-azul
- [T] Cardlytics: https://theinnovationcodex.substack.com/p/cardlytics-the-largest-advertising · https://partnershipinvesting.substack.com/p/cardlytics-a-unique-ad-tech-platform · https://americanbanker.com/news/cardlytics · https://www.adexchanger.com/platforms/cardlytics · https://blindsquirrel.substack.com/p/cardlytcis-fintech-walled-garden · https://unbanx.substack.com/p/banks-are-selling-your-data-heres
- [T] Copilot: https://www.copilot.money/faq · https://www.extruct.ai/hub/copilot-money · https://recurdash.com/subscription-pricing/copilot-money · https://www.thepricer.org/how-much-does-copilot-money-cost/ · https://costbench.com/software/personal-finance/copilot-money/price-history/ · https://www.mezzi.com/blog/copilot-money-2026-pricing-change-what-annual-subscribers-should-do · https://neuronfeed.com/startups/copilot-money · [P] https://techcrunch.com/?p=2681495 · https://beancount.io/compare/copilot-alternatives · https://toolradar.com/guides/best-ai-budgeting-apps
- [T] Monarch precios: https://www.thepricer.org/how-much-does-monarch-money-cost/ · https://costbench.com/software/personal-finance/monarch-money/ · https://freenance.io/products/monarch-money-review-2026-mint-replacement-budget-app/ · https://lunchmoney.app/compare/monarch-alternative · https://clark.com/save-money/monarch-money-review/amp/ · https://dealroom.co/companies/monarch-money/
- [T/P] YNAB historial: https://pocketclear.app/blog/ynab-price-increases-history.html · https://www.thepricer.org/how-much-does-ynab-cost/ · https://fortune.com/article/ynab-pros-and-cons · https://lr.ggtyler.dev/r/ynab/comments/2fh07v/hi_im_jesse_mecham_founder_of_ynab_ama/ck94c9c · https://subger.com/en/service/ynab · https://beancount.io/forum/t/ynab-costs-180-year-at-4-withdrawal-rate-thats-4-500-of-my-fire-portfolio/1772
- [T] RevenueCat: https://www.revenuecat.com/state-of-subscription-apps · https://www.revenuecat.com/blog/growth/free-trial-length · https://www.revenuecat.com/blog/growth/free-trials-dont-make-sense-anymore/ · https://www.revenuecat.com/blog/growth/subscription-app-trends-benchmarks-2026 · [P] https://9to5mac.com/?p=1042212 · https://dataanalysis.substack.com/p/2026-benchmarks-more-apps-less-quality
- [T] Canadá: https://waypointbudget.com/blog/mint-alternative-canada-2026 · https://www.richify.ai/ca/best-budgeting-apps-canada · https://wealthnorth.ca/personal-finance/budgeting/best-budgeting-apps-canada/ · https://stockchase.com/discover/top-budgeting-apps-mint-alternatives · https://www.bccpa.ca/news-events/cpabc-newsroom/2024/january/top-ranked-budgeting-apps-for-canadians-in-2024/ · https://www.neobanc.com/en-us/articles/budgeting-app-canada
- [P/T] LatAm suscripción/monetización: https://startupeable.substack.com/p/competir-con-netflix-como-pasar-a · https://egade.tec.mx/en/blog/territorio-negocios-beyond-streaming-subscription-models-latin-america · https://www.monetizemore.com/es/blog/10-estrategias-probadas-fintech/ · https://www.xataka.com.mx/aplicaciones/paga-una-renta-mensual-y-obten-aplicaciones-premium-america-movil/amp

### Privacidad y legal
- [O/T] LFPDPPP: https://www.internet2.scjn.gob.mx/red/delitos/Word/27.%20LFPDPPP.docx · https://usercentrics.com/es/knowledge-hub/lfpdppp-mexico/ · https://www.ey.com/content/dam/ey-unified-site/ey-com/es-mx/technical/tax/documents/ey-law-flash-nueva-lfpdppp.pdf · https://www.hoganlovells.com/es/publications/mexicos-new-federal-data-protection-law-what-it-means-for-companies · https://bbvaresearch.com/wp-content/uploads/2025/04/20250410-Mexico-Regulacion-Financiera-_-Marzo-2025.pdf
- [P] Plaid: https://www.jurist.org/news/2021/08/plaid-agrees-to-pay-58-million-in-data-privacy-class-action-lawsuit/ · https://www.nixonpeabody.com/insights/articles/2021/08/09/fintech-services-provider-plaid-inc-reaches-settlement-in-class-action-data-privacy-suit · https://iapp.org/news/b/fintech-app-settles-class-action-lawsuit-for-58-million · https://www.financial-planning.com/news/plaid-settles-class-action-lawsuit-for-58-million · https://finextra.com/newsarticle/38612/plaid-settles-58-million-class-action-lawsuit
- [P] Envestnet/Yodlee: https://www.wyden.senate.gov/news/press-releases/wyden-brown-eshoo-urge-ftc-to-investigate-firm-collecting-and-selling-americans-financial-data · https://www.proskauer.com/blog/members-of-congress-request-ftc-investigation-of-financial-data-companys-collection-and-privacy-practices · https://www.nextgov.com/analytics-data/2020/01/lawmakers-urge-ftc-investigate-aggregators-collection-and-sale-americans-financial-data/162552/
- [T] FTC/IAPP: https://iapp.org/news/a/selling-user-data-make-sure-you-have-consent/ · https://www.privacysecurityacademy.com/wp-content/uploads/2026/04/FTC-Privacy-Enforcement-in-2026-and-Beyond.pdf · https://www.kutakrock.com/newspublications/publications/2026/august/ftc-personalized-pricing-disclosure
- [T] GDPR/CCPA: https://cookie-script.com/news/gdpr-compliance-update-september-2026 · https://www.financierworldwide.com/profiling-and-automated-decisions-executed-by-financial-entities-under-the-gdpr · https://www2.deloitte.com/mt/en/pages/risk/articles/mt-gdpr-fsi.html · https://hunton.com/privacy-and-information-security-law/california-ag-announces-ccpa-enforcement-sweep-aimed-at-mobile-apps-and-authorized-agent-requests · https://oag.ca.gov/node/562327
- [O] Google OAuth: https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification · https://support.google.com/cloud/answer/13463817 · https://developers.google.com/health/profile
- [T] Open banking México: https://openbankingtracker.com/blog/open-banking-in-mexico-eight-years-of-promise-still-waiting-on-the-regulations · https://banq.ai/blog/open-banking-in-mexico-eight-years-of-promise-still-waiting-on-the-regulations · https://dplnews.com/banco-de-mexico-publica-reglas-para-la-banca-abierta-de-la-ley-fintech/ · https://elceo.com/tecnologia/entidades-financieras-seran-vigiladas-por-los-reguladores-cuando-operen-con-open-financial/ · https://facephi.com/observatory/open-banking-biometria-facial-cnbv-mexico/ · https://expansion.mx/tecnologia/2020/12/02/apilab-de-banco-azteca-un-nuevo-modelo-de-negocio-digital · https://belvo.com/blog/belvo-live/

### México: facturación, RESICO, efectivo, buró, inversión
- RESICO: https://www.elimparcial.com/dinero/2025/01/22/sat-anuncia-que-contribuyentes-del-resico-no-presentaran-declaracion-anual/ · https://www.elimparcial.com/dinero/2025/11/12/sat-2025-este-es-el-regimen-fiscal-que-no-permite-deducciones-personales/ · https://www.milenio.com/negocios/resico-que-es-y-como-funciona · https://facturama.mx/blog/tabla-resico-2025/ · https://siemprealdia.co/mexico/fiscal/guia-practica-para-la-emision-de-cfdi-en-el-resico/ · https://www.contadoresmexico.org.mx/Vida-colegiada/Claves-para-preparar-la-declaracion-anual-2025-en-Resico
- Facturación: https://www.guiadesoftware.com/blog/mejor-software-facturacion-mexico · https://blog.alegra.com/mexico/alegra-vs-sat-cual-sistema-de-facturacion-cfdi-4-0/ · https://www.capterra.es/software/195254/facturama · https://facturama.mx/docs/en/api-reference/introduction
- ENIF/efectivo: https://www.xataka.com.mx/otros-1/crecen-pagos-digitales-85-compras-menores-a-500-pesos-mexico-siguen-efectivo · https://www.elimparcial.com/dinero/2025/03/23/aumentan-en-mexico-los-pagos-con-tarjeta-y-transferencias-enif-2024/ · https://www.elfinanciero.com.mx/opinion/victor-piz/2025/05/30/cash-el-peso-del-efectivo-en-mexico/ · https://elceo.com/economia/mexicanos-usan-menos-efectivo-programas-sociales-impulsan-la-bancarizacion/
- Buró/score: https://dplnews.com/bbva-brinda-score-crediticio-10m-clientes-desde-su-app-en-mexico/ · https://www.xataka.com.mx/banca-digital/bbva-integrara-su-app-uno-elementos-que-temen-mexico-tu-puntuacion-buro-credito · https://apps.apple.com/MX/app/id1368278626
- Inversión/CNBV: https://www.df.cl/df-mas/coffee-break/fintual-obtiene-luz-verde-en-mexico · https://elceo.com/mercados/cnbv-elevara-requisitos-para-asesores-en-inversiones-tras-el-caso-de-bwc/ · https://elceo.com/mercados/154-asesores-en-inversiones-como-bwc-estan-registrados-ante-la-cnbv/ · https://gbm.com/media/the-academy/organos-del-sistema-financiero-mexicano-cnbv/

---

## 8. Dudas abiertas del usuario (y estado)

| Duda | Estado |
|---|---|
| ¿Cuál app parecida factura mejor / cuál tiene mejor ROI? | Parcial: ver 5.3; ROI no calculable |
| ¿Cuántos meses gratis dar? | Sin consenso en finanzas; YNAB 34 días, Copilot 1 mes, Monarch 7 días; RevenueCat: ≥17 días convierte más (no específico de finanzas). **Probar 14 vs 30** |
| ¿Existe algo como Gastify con suscripción exitosa en LatAm? | Mobills (Brasil) es el más cercano; en México **no encontrado** (no concluyente) |
| ¿APIs con GBM, Mercado Pago, Nu, Sofipos? | **No hay APIs públicas halladas**; usar importación de estados de cuenta |
| ¿Facebook cobra el OAuth? | **No verificado** |
| ¿Se puede vender datos si se pone en T&C? | No recomendado; ver 5.6 |
| ¿Apps mexicanas tipo Gastify que fracasaron? | **No encontrado**; requiere búsqueda dirigida |
| ¿Plan Pro barato con facturación RESICO como "punch"? | Plausible; ver 4.3–4.4 y riesgos (costo de timbrado, quién paga qué); requiere validar con usuarios |
| ¿Planner de viajes? | Idea registrada, sin investigar |
| ¿Cuál es la mejor infraestructura barata? | **Sin investigar** (costo variable principal: IA de extracción) |

---

## 9. Plan por fases (propuesta)

| Fase | Qué | Notas |
|---|---|---|
| **0** | Investigación de productos (ver sección 10), definir precios de prueba, método de cobro en México | Antes de escribir código de cobro |
| **1** | **Suscripción Pro individual**: plan gratis con límites + prueba de Pro; sección de **costo de oportunidad** | Diferenciador en México; cálculo educativo |
| **2** | **Plan para freelancers/RESICO**: facturación vía PAC + ISR mensual + analítica de ingresos | Posible mayor retorno; validar |
| **3** | **Intermediación** de préstamos/inversión con consentimiento | Tras revisión regulatoria |
| **4** | **Insights agregados** (estilo Zaim Trend) | Solo con escala |
| **5** | Prestamista | Mucho más adelante |
| Paralelo | **Sección Privacidad** del perfil (3 niveles opt-in) y consentimiento | Ya existe el placeholder |

---

## 10. Fase 0 / Paso 1 — Investigación específica de 10 productos

**Meta:** estudiar a fondo 10 productos creando cuenta (gratuita o de prueba) para decidir **qué copiar, qué adaptar y qué evitar**, y completar la app para aumentar probabilidades de uso.

### 10.1 Lista propuesta (editable)

| # | Producto | País/Región | Por qué | Prioridad |
|---|---|---|---|---|
| 1 | **Mobills** | Brasil | Pedido explícito del usuario: ver qué tan parecida es a Gastify y qué aprender de su forma de hacer las cosas | **Alta** |
| 2 | **Finerio** (app de consumo + Finerio Connect) | México | Referencia importante del usuario | **Alta** |
| 3 | **Fintonic** | España (y MX) | Probablemente la "referencia en España" que quiso decir el usuario (confirmar) | Alta |
| 4 | **Emma** | Reino Unido | Niveles Plus/Pro/Ultimate; 17% paga (autoreportado) | Media-alta |
| 5 | **Monarch** | EE.UU. | Suscripción pura; trial 7 días; Plus | Alta |
| 6 | **YNAB** | EE.UU. | Historial de precios y trial 34 días | Alta |
| 7 | **Wave** | Canadá/EE.UU. | Modelo gratis+servicios para PyME; **pendiente decidir** si añadir una app personal canadiense (Hardbacon, Wealthica, KOHO, Wealthsimple) | Media |
| 8 | **Money Forward ME** | Japón | Embudo personal→SaaS; freemium; alzas de precio | Alta |
| 9 | **Qianji 钱迹** | China | Sin anuncios, membresía incl. vitalicia, >6M usuarios | Media |
| 10 | **Organizze** (tentativo) | Brasil | **Pendiente**: el usuario pidió "otra en Latinoamérica"; no se encontró una no brasileña. Alternativas a evaluar: GuiaBolso (estado), Fintual (Chile, inversión) | Media |

**Reserva / extra:** Copilot (EE.UU.), Zaim (Japón), Spendee, Wallet by BudgetBakers (CZ), Alegra (benchmark de facturación RESICO), Khatabook/OkCredit (libreta de cuentas).

### 10.2 Qué investigar de cada producto (plantilla de ficha)

Para cada producto crear una ficha con: fecha, quién la llenó, versión/plataforma, país de la cuenta.
1. **Registro**: pasos, métodos (correo, Google, Apple, teléfono), datos que piden (edad, género, país), consentimiento/privacidad mostrado.
2. **Onboarding**: ¿cuánto tarda hasta el primer valor? ¿pide conectar banco? ¿importa archivos?
3. **Plan gratis**: límites exactos (cuentas, categorías, historial, presupuestos, exportar).
4. **Muro de pago**: en qué momento aparece, qué texto/botones usa, descuentos.
5. **Prueba gratis**: duración, requiere tarjeta, qué pasa al terminar.
6. **Precios**: mensual/anual/vitalicio, moneda, impuestos, descuento anual, historial de cambios.
7. **Categorías**: lista por defecto, subcategorías, reglas automáticas, reglas por comercio, IA.
8. **Captura**: manual, voz, foto de ticket, importación (CSV/Excel/PDF), conexión bancaria, notificaciones.
9. **Insights**: pantallas de análisis, alertas, resúmenes mensuales, proyecciones, metas, presupuestos.
10. **Retención**: recordatorios, widgets, resúmenes por correo/notificación, gamificación.
11. **Facturación/PyME** (si aplica): facturar, impuestos, reportes.
12. **Privacidad**: opciones en ajustes, qué comparten, publicidad, exportar/borrar datos.
13. **Cancelación**: qué tan fácil es; ofertas de retención.
14. **Capturas de pantalla** de cada paso clave (guardar en `.mds/i18n-work` o carpeta de investigación a decidir).
15. **Qué copiar / qué adaptar / qué evitar / ideas nuevas para Gastify.**

### 10.3 Entregables del paso 1
- Una ficha por producto (esta misma carpeta o anexos).
- **Tabla comparativa** (planes, precios, límites, trial, paywall, funciones clave).
- **Lista priorizada de funciones a considerar** para Gastify.
- Actualizar la sección 5.11 (lo no encontrado) y la bitácora.

### 10.4 Notas prácticas
- El usuario crea cuentas gratuitas o de prueba; **usar correo/datos de prueba**, no datos financieros reales sensibles; **no contratar planes de pago** sin decidirlo.
- Respetar términos de uso de cada producto; las capturas son para análisis interno.
- Si algún producto exige conectar un banco real, **omitir ese paso** y registrar que se omitió.

---

## 11. Próximos pasos

1. **Confirmar la lista de 10** (sección 10.1), especialmente Canadá, la otra LatAm y si "Finerio en España" era Fintonic.
2. Hacer cuentas y llenar fichas (empezar por **Mobills**, **Finerio**, **Monarch**, **YNAB**, **Money Forward ME**).
3. Investigaciones documentales pendientes: precios y conversión en México, **cómo cobrar suscripciones en México**, costos de infraestructura, **PAC y facturación RESICO**, apps mexicanas que fracasaron, Zaim/Finary/Bankin'.
4. Diseñar la **sección Privacidad** del perfil (3 niveles) y el modelo de planes Free/Pro/Pro+facturación.
5. Revisión **legal/contable** (abogado + contador) antes de cobrar, facturar o tocar datos con fines comerciales.

---

## Apéndice A — Prompts del usuario (texto original)

### A.1 (primer prompt de investigación)
> Oye wey, ¿me puedes ayudar a ver el enrutamiento, o sea, le vamos a poner opciones de privacidad a Gatsby. Según yo ya tienes acceso a mi repositorio de Gatsby actual. Entonces esto te debería de servir lo suficiente como para que vayas al repositorio, estudies cómo está la cosa porque después, ¿cuál es el modelo que planeamos implementar acá? O sea, es un modelo de suscripción que van a ser cuentas pro que van a tener pues ya sabes accesos a crear más categorías o a tener más ciertos funcionamientos que todavía justo me gustaría ayudar a definir el de la aplicación. Pero si no fuera eso también sería ver los modelos de privacidad. ¿Por qué? Porque las cuentas gratuitas deben de venderse datos, que supongo que sería el grueso de venta, por así decirlo, para estas cuentas. Pero la idea es buscar el equilibrio. O sea yo pensaba hacer un perfilamiento de tipo, obviamente no vamos a poner el usuario Juanito Pérez que, o sea es un ejemplo, ¿no? Ponemos usuario Juanito Pérez que, no sé, gastó 545 pesos el 14 de octubre de 2026 en, yo qué sé, un huento, ¿no? O sea no vamos a hacer ese tipo de cosas. Pero tal vez sí sería bueno si no compartimos obviamente nombres, sino más bien datos de segmentación. O sea, por ejemplo, hombre de o mujer de tal edad a tal edad y, o sea datos más que sirvan para segmentación, o sea género, nombre. Y bueno, si podemos saber Y si o sea y también cómo podemos obtener esos datos de segmentación? O sea, obviamente si podemos hacer conexiones desde Facebook o desde Google, que pensaría Google porque Facebook según yo la última vez que chequeé el logout, el OAuth de Facebook creo que para conectarlo necesitas pagar. Entonces el de Google en este caso sería más interesante y tal vez obtener muchos datos de segmento desde ahí. También como para hacer los logins o mejor dicho la creación de cuenta pues menos engorrosa. Pero obviamente aquí hay varios problemas, ¿no? Uno, en cuestión de transacciones, ¿cómo te aseguras que las transacciones de los usuarios realmente estén cotejadas con banco? Pues creo que eso sería difícil de venderlo si es que no hay una integración con el API del banco, porque si no hay una integración, el usuario obviamente pone sus datos, pero no sé eso qué tan vendible sea. Entonces Chance si habría una forma de hacer un scorer para el usuario o si la aplicación, su modelo de negocio 100% pues va a ser un modelo de suscripción. Pero sería bueno tal vez, o sea es que algún uso debe tener el usuario gratuito, ¿sabes? Si no poner publicidad, pero tal vez muy dirigida basada en su gasto, su patrón y todo ese coso. Y es justo como lo que quiero checar y que me ayudes. Entonces también requiero que se haga un análisis, pues ahí completito,. Es que estoy de acuerdo en el, o sea, es que creo que sí se podrían agarrar más datos obviamente. Mientras nosotros en los términos y condiciones y de forma expresa digamos todo la serie de datos que se exponen, pues creo que no hay ningún problema. O sea, por ejemplo, Facebook vende hasta tu alma en cuanto a información, ¿no? O sea, la verdad es que vende mucho. Entonces, pensando en el uso de información que nosotros podemos hacer, pues vendría siendo lo mismo. Y la realidad es que no muchos leen los términos y condiciones en donde viene explícitamente todo. Entonces, bueno, sería poner ahí explícitamente todo y pues sí, captar la mayoría de información posible de hábitos de gasto, días de gastos mayores o meses o ubicaciones tal vez, objetivos del usuario y las categorías sí son como súper, súper, súper útiles, súper importantes. Pero antes de hacer eso, vamos a hacer primero yo creo que una investigación de mercado de aplicaciones similares, principalmente en Estados Unidos, pero vamos a buscar por ejemplo en Japón, hay aplicaciones similares en Japón para esto, en China, en Europa, en Latinoamérica, para ver cuál es más o menos su modelo de pago. Entonces sí requiero que hagas una investigación completa, te pongas a ver varias aplicaciones, veas cómo generan, cuál es su modelo de negocios. Muchas me imagino, la gran mayoría vienen de suscripciones, pero habrán otras que seguramente vienen de otro lado. Entonces nada más tenemos que ver pues cuál es, o sea, y ya. Entonces ayúdame a hacer la investigación

### A.2 (segundo)
> Ok, ¿cómo actualmente está? O sea, ¿cuáles aplicaciones parecidas a Gastify son las que mejor facturan y cuál es su modelo de negocio? Si es que suscripciones o, por ejemplo, tal vez te hacen un score para luego hacerte préstamos o checan tal vez otra cosa con tu buró de crédito. O sea, ¿cómo es que buscan ese aspecto de la facturación? ¿Cómo es que se podría obtener dinero? Actualmente, ¿cómo lo hacen otros como Monarch, YNAB o Simplify o Rocket Money, Mind? Tal vez Fintonic, Money Forward Me o Same, ZAIM en Japón, o Wallet by Budget Markers en Chequia. O sea, ¿cómo sacan su dinero? ¿Cuál es de todas las aplicaciones similares a Gastify la que mejor retorno, digo, la que mejor, pues sí, retorno de inversión, o la que mejor, como la que más dinero saca, la que es más buena siendo rentable? O sea, porque de las opciones, pues ya entendí que la venta de datos realmente no es tan buena idea. Entonces, probablemente sí sea la suscripción. O tal vez crear también un modelo de facturación, poderle ayudar a facturar, a no solamente llevar la organización bancaria y todo esto de unas, sobre todo de los reciclos, podría apuntar mucho a los reciclos, pequeños negocios, y darle insights muy interesantes, analítica y todo eso. Sino también podría hacerlo, pues tal vez un modelo super pro que sea como para pequeños negocios, o ayudar a la facturación, o hacerles scores para saber, ayudarles a que los bancos les presten dinero, o yo mismo ser una entidad que presta dinero. O no sé qué otros modelos de negocio, cómo le hacen las otras empresas para ser tan rentables. Tal vez podamos investigar 5 empresas muy específicas que sean parecidas a Gastify, que estén en otros lados del mundo, para tratar de replicar su modelo en Latinoamérica o en Europa o en Estados Unidos incluso.

### A.3 (tercero)
> O sea, incluso podría ser por fases, ¿no? Podría ser la primera fase, o sea, porque, a ver, yo estoy empezando, soy un bichito, soy un pececito en un mar de tiburones, entonces podría empezar por lo que en términos de infraestructura me podría salir más barato, pero hay que investigar en términos de infraestructura que podría salir más barato. Pero lo más fácil de escalar y mover, pues, serían planes de suscripción. Yo creo que sería el modelo a seguir. Basado en las empresas que actualmente tengan más éxito, hay muchas como Credit Karma en Estados Unidos, Nerd Wallet, Rocket Money, Monarch, otra sería YNAB, otra podría ser Money Forward en Japón, Wave en Canadá y Estados Unidos. Aunque realmente unas de estas no son realmente tan parecidas a Gastify, porque Gastify es como la aplicación para que tú sepas en qué gastas, puedas controlar, ahorrar, etcétera, ¿no? Entonces, pues, eso puede dar paso a diferentes perfilamientos. Entonces podríamos estudiar los casos de éxito primero con relación a las suscripciones, que es lo que podríamos hacer. Y tal vez en un futuro, o mientras estamos en el modelo de suscripciones, ir desarrollando la función que nos podría dar el mejor retorno de inversión. También aplicado al problema mexicano, podríamos crear una sección que enlace con inversiones, ver si podemos hacer APIs con GBM o con... ¿cómo se llama esto? Mercado Pago, Nubank, Sofipos, para que puedan mostrar los rendimientos de inversiones o decir, como tenemos los datos del usuario, decir, oye, no sé, este año te gastaste 140 mil pesos en cigarros. ¿Por qué? Porque compras tantos al día y esto con esto, pudiste haber invertido en esto y ya tendrías tanto dinero, ¿no? Que de hecho sería una sección muy interesante para agregar a Gastify. Entonces, ser prestamista cuesta mucho capital. No creo que pueda ser ahorita también. Podría ser en un futuro. Entonces, pues de momento ser un gestor de finanzas, nada más. O sea, que le digamos en qué gasta, que le ayudamos a entender sus finanzas y todo eso. Tal vez preparar productos para ser intermediario de préstamos. Eso sí podría ser. Uno, ¿no? Dos, llevarle su facturación, que también podrías tener un modelo de suscripción. Tal vez hacer cosas como lo que ya se alegra, por ejemplo. Enfocarnos tal vez en el reciclo podría ser interesante. Porque, bueno, claro, lo que más nos importa ahorita, pues, es la rentabilidad del negocio. Entonces podríamos fijarnos mucho en Money Forward de Japón. O sea, que la personal atraiga gente. Y ya dentro de eso, pues ya le podemos ofrecer los servicios de facturación para reciclo o para freelancers, facturación general, tal vez también planes de inversión. O sea, como hoy hemos identificado que gastas esto, podrías esto invertirlo en esto y te presentan los productos de inversión que podrás tener. Directamente ser gestores o ser intermediarios. Podríamos ser tal vez como Wave, que opera en Canadá y Estados Unidos, que encargan de facturación, contabilidad gratis, solamente para reciclos o para cosas que nosotros sí podemos medir, ¿no? Que sean entes pequeños. Después tal vez veríamos el tema de entes grandes. Podamos también operar como libreta de cuentas para microcomerciantes como OK Credit o Katabook de India. Pero también sería bueno hacer una investigación en México para ver qué afecta a los usuarios mexicanos y ayudarle a llevar sus cuentas de negocio. O personales. También tal vez un planner de viajes. También podremos ver el caso de same a futuro, o sea, se escribe como Z-A-I-M, que sí medio vende datos de usuario anonimizados, pero bueno, esto ya sería mucho más futuro, porque necesitamos un grueso de usuarios grande. Pero podría estar dentro de los planes a futuro. O sea, estamos haciendo ahorita como una lluvia de ideas para pues analizar, porque sí es un poco complejo entender cómo es que podemos hacer estos negocios, ¿no? Tal vez también dentro del análisis podremos investigar negocios que, aplicaciones que ya han sido como Gastify en México y que han fracasado también, pues como para aprender de sus errores, ¿no? Y sobre todo para empezar a atacar todo el tema de Latinoamérica y México.

### A.4 (cuarto)
> Yo creo que ahorita lo que más vamos a investigar son los modelos de suscripción. Podríamos seguir investigando más cosas, pero vámonos de lo general a lo específico. Por ejemplo, vamos a investigar las tres empresas que mejor hayan llevado su modelo de suscripción. Que empezaron como una aplicación explícitamente, así como Gastify, que simplemente es para que sepas de qué gastas, te categoriza tus gastos y todo eso, que entiendas en qué gastas, todo eso. Y que haya llevado un modelo de suscripción correcto. Eso para nosotros es sumamente importante. Y sobre todo estudiar su historial, cómo empezaron, cómo fueron mutando. Cuáles fueron sus claves a la hora de cambiar precios, de implementar suscripciones, si empezaron gratis, cuántos meses de plan gratuito dan porque pues supongo que es importante que el usuario se enganche, entonces darle 2 o 3 meses suena buena idea en la teoría, pero en la práctica, ¿qué tal? ¿Cómo ha funcionado modelos de suscripción en Japón, por ejemplo, en Europa, en Estados Unidos? Si es que ya hay modelos de suscripción exitosos en Latinoamérica, no como Alegra, porque Alegra sí creo que es un producto más profesional, sino como productos más como personales, porque Alegra sí es más un servicio como de facturación a reciclo o a pequeñas empresas. Sería algo más, todavía aún más bajo, como Gastify, pues simplemente que te categoriza tus gastos y te ayuda a entenderlos. A ver si es que existe algo como eso, y si no, pues justo tal vez podemos pensar implementar nuevas funciones, incluso en el plan pro, pues agregar el mismo plan de facturación y tal vez podría ser, esa sería la revolución, ¿no? Hacer que cueste poco dinero meter el plan pro que te permitas, pues digamos, todo el acceso y funciones de Gastify y además un plan de facturación sencillo para reciclo, cosas de ese tipo. Podría servir un gran punch. Pero hay que verlo. Entonces, pues ayúdame a checar a ver qué.

### A.5 (quinto, esta solicitud)
> Haz un punto MD de todo lo que hemos investigado, con todos los links que has investigado, todas las empresas que has investigado, todas las fuentes, las direcciones, etcétera, etcétera. Desde que te hice el primer prompt relacionado a esto de investigar, que fue cuando te dije, oye, güey, ¿me puedes ayudar a ver el enrutamiento? O sea, vamos a poner opciones de privacidad de Gastify, según yo ya tiene, desde ese, que empezamos a ver opciones, empezamos a analizar empresas, modelos, todo, todo, absolutamente todo, tanto las preguntas que te he hecho, las respuestas que me has dado, los todos, absolutamente todos los links de investigación, las tablas que me has presentado, los competidores, fuentes de referencia, la planeación y todo eso, déjalo en un punto MD que se llame... Obtención de ingresos Gastify.md. Primero deja reglas de investigación, que se tiene que poner la fecha, el modelo que lo está investigando, y toda la y que tiene que poner fuentes y toda la información. Deja entonces tu entrada, lo que investigaste, absolutamente todo, porque puede ser que en ese mismo este chat GPT después integre otros detalles de la investigación. Entonces, agrégalo. Agrega también lo que es tus recomendaciones, mis dudas, los planes, como hemos visto todo. Y yo creo que la primera fase ahorita sería una sección de investigación. Vamos a determinar 10 empresas. Las que más me importan ahorita es Móviles de Brasil, M-O-B-I-L-L-S, para ver qué tan parecida o no es de Gastify y si realmente podemos aprender algo de su forma de hacer las cosas. Vamos a poner Finerio, que es nuestra referencia más importante en España, y pon las opciones de Inglaterra, Estados Unidos, Canadá y Japón y China, y busca una otra en Latinoamérica, si es que existe, porque creo que también sería muy interesante. Y pues empecemos de una vez. Entonces, ya después de que hagas el punto MD y los siguientes pasos, pon que el primer paso ahorita es justo pues hacer una investigación súper, súper específica de todos estos productos. Probablemente yo tengo que hacerme una cuenta en cada uno de ellos, por lo menos en los gratuitos o en los otros, para ir viendo qué podemos nosotros, por ejemplo, pues copiar directamente o no, o ver o no, o estudiar, analizar, para que tengamos nuestra aplicación también más completa y aumenten las probabilidades de uso.

---

## Apéndice B — Glosario de interpretaciones (transcripción por voz)

- "Gatsby" = Gastify · "Same" / "Zame" = **Zaim** · "Mind" = **Mint** · "Simplify" = **Simplifi** · "Móviles" = **Mobills** · "Katabook" = **Khatabook** · "OK Credit" = **OkCredit**
- "Reciclo(s)" = asumido **RESICO** (Régimen Simplificado de Confianza); **confirmar**.
- "Finerio... referencia en España": Finerio es de México; el producto español de la lista es Fintonic (confirmar).
- "Facturación" puede significar (a) los ingresos de las empresas o (b) emitir facturas CFDI; el contexto de cada pregunta lo define.
