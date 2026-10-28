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


---

## 12. Entrada Codex — 2026-10-28 — Consolidación íntegra, contraste y nueva fase de investigación

- **Investigador:** OpenAI / Codex / **gpt-6.1-sol**, según los metadatos locales de ejecución consultados. No se deduce el modelo a partir del nombre comercial de la aplicación.
- **Fecha de investigación y consolidación:** 2026-10-28, zona **America/Mexico_City**.
- **Naturaleza:** investigación documental y planeación; **no es aprobación de precios, asesoría jurídica/fiscal ni autorización para implementar suscripciones**.
- **Ubicación:** este mismo archivo. Las secciones 0–11 y los apéndices A–B de Claude se preservan, sin sustituir su selección por la de Codex.
- **Procedencia:** historial de este chat, desde la pregunta de privacidad hasta la presente solicitud; tres respuestas finales originales recuperadas completas. Los identificadores de turno se conservan para trazabilidad.
- **Alcance de los registros:** el apéndice C conserva preguntas y respuestas finales, **incluidas todas sus tablas y enlaces**. El apéndice D conserva el inventario de fuentes y las consultas recuperadas. No se incluyen razonamientos internos, secretos, credenciales ni contenidos de otros chats.
- **Estado operativo:** solo documentación. No se iniciaron pruebas con tarjeta, compras, conexiones bancarias ni cuentas en competidores. No se modificaron funciones de Gastify, datos de usuarios, producción ni la rama de trabajo.

### 12.1 Reglas complementarias para futuras investigaciones

Estas reglas amplían la sección 0; no reemplazan su historial.

1. Abrir cada entrada con **fecha de investigación, fecha de captura, proveedor/modelo exacto si es verificable, autor y tema**. Si el identificador no está disponible, escribir “modelo exacto no verificado”; no inventarlo.
2. Registrar por fuente **URL completa, título, tipo, fecha de consulta y, cuando esté disponible, fecha de publicación/actualización y periodo cubierto**. La fecha de rastreo del buscador no prueba la fecha de publicación.
3. Separar los estados: **dato verificado en fuente primaria**, **declaración empresarial no auditada**, **prensa**, **estimación de terceros**, **resultado de búsqueda**, **acceso fallido**, **hipótesis** y **pendiente de prueba**.
4. Una página en el registro de búsquedas **no equivale** a una fuente leída o avalada. El archivo de fuentes incluye resultados incidentales para no perder el rastro; las conclusiones deben remitirse a evidencia pertinente.
5. Para precios anotar país, moneda, plataforma, impuestos, precio de renovación, promoción, elegibilidad y fecha. **Cuotas de un anual, mensual cancelable, prueba gratuita y descuento son cosas distintas**.
6. No confundir usuarios acumulados, descargas, usuarios activos, personas de un hogar, compradores y suscriptores. No calcular conversión con denominadores incompatibles.
7. No confundir ingresos, ARR, utilidad operativa, utilidad neta, flujo de caja, inversión levantada, valoración, volumen procesado y ROI. Diferenciar **grupo / segmento / aplicación / país / periodo**.
8. Preservar las respuestas históricas aunque contengan datos hoy superados. Añadir la corrección con fecha y fuente; no hacer que una recomendación anterior parezca una decisión actual aprobada.
9. Diferenciar **función observada en la app**, **anunciada en documentación/marketing** y **suposición**. No marcar una ficha práctica como terminada sin haber realizado sus escenarios.
10. Ninguna estadística general de apps demuestra causalidad para Gastify. Las decisiones de precio, prueba y paywall son hipótesis hasta tener cohortes propias.
11. Crear cuentas de prueba con datos ficticios y registrar producto, país, plataforma, versión, requisitos y fecha de expiración. **No iniciar cobros automáticos ni vincular bancos reales sin aprobación específica**. No guardar contraseñas, tarjetas, cookies o tokens en este MD.
12. Si se toman capturas, guardarlas en una carpeta propia de investigación, no en i18n ni entre imágenes de producción. Anotar contexto, fecha y pantalla; eliminar o difuminar información personal. No inventar capturas ni rutas de archivos inexistentes.
13. “Qué copiar” significa **aprender/adaptar una función o patrón**, no reutilizar código, marcas, textos, activos o bases de datos ajenos sin derechos.
14. Toda revisión legal o fiscal debe precisar jurisdicción, año, actividad y supuestos. No generalizar “RESICO no deduce” a todos los impuestos, ni “no encontré API pública” a “no existe integración”.
15. Al cerrar una entrada registrar entregables, pendientes, limitaciones y decisiones del usuario. Actualizar también la bitácora de coordinación del repositorio.
16. **Foco actual autorizado: investigación de producto y suscripciones.** Publicidad, datos agregados, crédito, inversiones y CFDI quedan documentados como opciones, no como implementaciones aprobadas.

### 12.2 Bitácora de Codex y mapa de lectura

| Entrada | Inicio local | Pregunta y alcance | Registro |
|---|---|---|---|
| C1 | 2026-10-28, 03:50 | Privacidad, datos, OAuth, procedencia de movimientos, modelos regionales y rutas propuestas | Apéndice C.1: pregunta original y respuesta íntegra |
| C2 | 2026-10-28, 04:28 | Ingresos/rentabilidad, cinco casos, México, infraestructura, independientes y fases | Apéndice C.2: pregunta original y respuesta íntegra |
| C3 | 2026-10-28, 04:59 | Suscripciones: historia, precios, pruebas, Estados Unidos/Japón/Brasil/Europa/México | Apéndice C.3: pregunta original y respuesta íntegra |
| C4 | 2026-10-28 | Consolidación solicitada, top 10 propio e inicio de investigación específica de Mobills | Secciones 12–19 y pregunta original en apéndice C.4 |

Los tiempos son de inicio de turno, no fechas de publicación de las fuentes. El agrupamiento C1–C4 sigue los turnos reales de este chat; el apéndice A de Claude divide algunas intervenciones de otra forma.

**Orden recomendado para continuar:** reglas 0 y 12.1 → correcciones 13 → top 10 en 15 → protocolo 16 → ficha inicial de Mobills 17 → decisiones/pendientes 18–19. Consultar los apéndices C–E para el detalle y los enlaces históricos.

## 13. Aclaraciones y diferencias respecto del informe anterior

**Esta sección no borra el informe de Claude ni reescribe las respuestas originales de Codex.** Registra qué no debe reutilizarse sin matices.

| Tema o dato anterior archivado | Aclaración vigente al consolidar | Evidencia / acción |
|---|---|---|
| “Finerio… referencia en España” | **Finerio es la referencia mexicana; Fintonic es la española.** Son productos distintos y ambos siguen dentro del estudio. | [Finerio Connect](https://www.finerioconnect.com/), [Fintonic](https://www.fintonic.com/es-ES/descarga-la-app/). |
| “No se encontró una app mexicana personal con suscripción” | Se hallaron ofertas de **Nextik Finance y Vittio**. Esto prueba oferta/precios, no éxito financiero ni retención. | [Nextik](https://finance.nextik.mx/), [Vittio](https://vitt.io/pricing). |
| ~~Organizze: R$35 / R$45 / R$69 mensuales~~ | Esos valores quedaron en C1 y en resultados antiguos. **C3 ya conserva la revisión posterior**; usar la ayuda oficial actualizada en octubre, no snippets previos. | [Ayuda de precios](https://ajuda.organizze.com.br/hc/pt-br/articles/5661263190035-Conhe%C3%A7a-nossos-pre%C3%A7os-e-assinaturas). |
| Monarch: cifra de ARR atribuida solo a Sacra | Hay **anuncio de la propia empresa**; sigue siendo ARR autorreportado, no utilidad ni facturación de un ejercicio completo. | [Anuncio del 1-oct-2026](https://www.monarch.com/blog/welcoming-MBI); detalle en C2. |
| Rocket Money: ingresos anuales atribuidos a una estimación | C2 aporta el **10-K de Rocket** con la línea del producto. No trasladar las utilidades/pérdidas del grupo hipotecario a la app. | [SEC, ejercicio 2025](https://www.sec.gov/Archives/edgar/data/1805284/000162828026013283/rkt-20251231.htm). |
| “Credit Karma tiene el mayor margen” / “X tiene el mejor ROI” | No existe un ranking homogéneo de utilidades de todas estas apps. Una utilidad de segmento no es comparable sin ajustes con una utilidad neta de empresa. **ROI no determinado**. | Conservar periodos y alcances de los reportes citados en C2; no convertir la inferencia antigua en conclusión probada. |
| Money Forward grupo = rendimiento de ME | Son alcances distintos. C2 documenta grupo; C3 aporta un KPI específico de pagantes de ME. No confundirlos. | [Resultados del emisor](https://financialfilings.com/filings/money-forward-inc/interim-quarterly-report/2026/72554346/), [presentación con KPI de ME](https://fs2.magicalir.net/tdnet/2025/3994/20250714513794.pdf). |
| “No hay cifra oficial de pagantes de ME” | Se encontró una presentación del propio emisor que sí informa pagantes. El registro de C3 indica fecha y cifra; no presentarla como dato actual sin actualizar el periodo. | Misma presentación, página 35. |
| Wave: referencia de ingresos de años anteriores | C2 identifica la línea Wave en resultados de H&R Block para FY2026. No confundir ingresos de Wave con utilidad del grupo. | [Reporte de H&R Block](https://investors.hrblock.com/news-releases/news-release-details/hr-block-reports-fiscal-2026-results-and-enters-fiscal-2027). |
| “Money Forward incluye la personal con la empresarial” | Su ayuda indica que **ME y Cloud son servicios y cobros separados**; no valida un todo-incluido barato. | [Ayuda de ME sobre Cloud](https://support.me.moneyforward.com/hc/ja/articles/55460846509209). |
| “Mobills = suscripción pura” | No: se documentan **publicidad**, gestor Premium y PRO. Falta conocer la mezcla real de ingresos y rentabilidad. | Ficha inicial 17; [caso Google/Mobills](https://www.google.com/ads/publisher/intl/pt/stories/mobills/). |
| Mobills: año de origen uniforme | Dos fuentes oficiales dicen 2013 y 2014 respectivamente. Se conserva la discrepancia, no se elige arbitrariamente una fecha. | [Ayuda histórica](https://mobills.zendesk.com/hc/pt-br/articles/360051966674-Como-o-Mobills-come%C3%A7ou), [Sobre Mobills](https://www.mobills.com.br/sobre/). |
| ~~YNAB seguía en USD99 en 2024~~ / historia basada solo en competidores | C3 recupera anuncios originales archivados de 2015, 2017 y 2021, y el precio actual. No fechar un cambio con la fecha editorial de una página que se actualiza continuamente. | Enlaces originales dentro de C3 y catálogo D. |
| “17+ días convierten mejor” como receta | Es asociación en un conjunto de apps, **no prueba causal ni evidencia a favor de 60–90 días** en Gastify. Se conserva también el estudio aleatorio con un resultado distinto en otro SaaS. | [RevenueCat](https://www.revenuecat.com/state-of-subscription-apps), [estudio](https://arxiv.org/abs/2006.13420). |
| Quitar nombres = anonimizar | Quitar identificadores directos puede dejar datos seudónimos/reidentificables. C1 contiene el análisis y sus fuentes. No aprobar ventas de datos por este MD. | [ICO](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-sharing/anonymisation/introduction-to-anonymisation/). |
| “Ponerlo en T&C permite todo” | C1 explica consentimiento, finalidades, plataformas y restricciones de datos obtenidos por OAuth. Es una cuestión pendiente de revisión profesional antes de lanzar. | [Ley mexicana](https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf), [Google Play](https://support.google.com/googleplay/android-developer/answer/10144311?hl=en). |
| Open banking “detenido” = no existen integraciones | No usar esa equivalencia. Separar reglas aplicables, acceso contractual de agregadores, cobertura real y restricciones. **No se hizo una auditoría legal de todo Open Finance**. | Finerio/Belvo/Fintoc quedan como proveedores a revisar, sin cobertura o precio garantizados. |
| “Las APIs no existen públicamente” | La conclusión válida fue **no encontradas/verificadas**; no demuestra inexistencia. Una API de cobros no equivale a una API de inversiones o saldos. | Reabrir por proveedor y caso de uso antes de prometer integraciones. |
| “RESICO sin deducciones / sin anual” sin alcance | No reutilizar como especificación fiscal universal. Precisar persona física/moral, ISR/IVA, ejercicio, excepciones y reglas vigentes con SAT/contador. | Cualquier módulo fiscal requiere investigación propia. No se implementó cálculo ni declaración. |
| “Otra app latinoamericana” | Nextik y Vittio cubren México, además de los casos brasileños. Si se exige un tercer país latinoamericano, **sigue pendiente un PFM puro comparable con evidencia suficiente**, sin llenar el hueco con un bróker como si fuera lo mismo. | Fintual Chile/México se conserva como referencia adyacente de inversión, no como sustituto de un gestor personal. |

### 13.1 Qué permanece abierto

- No hay datos homogéneos de ROI ni utilidades individuales de las apps privadas.
- No hay conversión/retención publicada por cada cambio de precio o prueba en las empresas centrales.
- Los precios locales observados no prueban disposición a pagar por Gastify.
- No hay precio ni cobertura bancaria contratados para Gastify.
- No se conoce aún el coste real por usuario activo gratuito/pagante de Gastify.
- No están aprobados límites, precios, monedas de cobro ni un proveedor de suscripciones.
- No está probada la conversión personal → facturación, ni la proporción de usuarios de Gastify que la necesitarían.
- Una reseña o queja aislada sirve para descubrir hipótesis, no para calcular tasas de abandono.
- El pivote de Finerio y el cierre de Mint no prueban por sí mismos fracaso del PFM gratuito ni una causa financiera concreta.
- Los datos de población/efectivo deben leerse en su tabla original; no reutilizar porcentajes de noticias con umbrales o denominadores diferentes.

## 14. Registro de todas las empresas y líneas consideradas por Codex

El directorio de Claude (sección 6) se mantiene. Esta tabla lo complementa y distingue profundidad real del estudio.

| Familia | Empresas/productos | Estado y uso de referencia |
|---|---|---|
| PFM y presupuesto por suscripción, Estados Unidos | YNAB, Monarch, Rocket Money, Quicken Simplifi | Investigación documental de modelos; mayor detalle histórico en YNAB/Monarch. No hay cuentas de competidores probadas en esta entrada. |
| Otras referencias personales estadounidenses | Copilot Money, Empower | Comparables mencionados/documentados; no fichas prácticas completas. Empower incluye gestión patrimonial, no solo PFM. |
| Distribución financiera y leads | Credit Karma, NerdWallet | Reportes y monetización; no equivalentes a suscripción pura. |
| Producto gratuito cerrado | Mint | Migración y continuidad del producto; no confundir con quiebra de Intuit. |
| Japón | Money Forward ME / Money Forward Cloud, Zaim / Zaim Trend, Moneytree / Moneytree LINK | PFM, suscripción, B2B y estadísticas como modelos distintos. |
| China | Suishouji / Feidee, Shark Accounting / 鲨鱼记账, Qianji / 钱迹 | Fichas de desarrollador, documentación y membresías; no ingresos públicos comparables hallados. |
| Brasil | Mobills, Organizze | Casos prioritarios personales. Mobills incorpora otras monetizaciones; Organizze afirma financiarse con suscriptores. |
| Brasil, contexto histórico | GuiaBolso, Toro, Monetus, Nubank | Contexto/entidades relacionadas; no atribuir ingresos del grupo a una app ni dar por confirmadas adquisiciones no verificadas. |
| México | Nextik Finance, Vittio | Oferta pública local de suscripción; éxito financiero sin demostrar. |
| México, pivote B2B | Finerio / Finerio Connect | Referencia histórica y proveedores; revisión de la app de consumo puede no ser posible hoy. |
| España | Fintonic | Referencia del usuario para marketplace/FinScore, no PFM de suscripción pura probado. |
| Reino Unido | Emma | Comparación por niveles, límites y salida a Basic; nuevos enlaces oficiales en 17.2. |
| Europa continental | Toshl, Wallet by BudgetBakers, Spendee | Registro manual vs conexión bancaria, planes limitados y licencias; no ranking de utilidades. |
| Canadá/Estados Unidos, pequeño negocio | Wave | Benchmark adyacente de facturación/cobros/nómina; no tratarlo como clon de Gastify personal. |
| Canadá, referencias de alcance distinto | Wealthsimple, KOHO, Mogo, Wealthica, Hardbacon | Permanecen del informe de Claude; investigar estado y tipo antes de compararlos con PFM. |
| Facturación/contabilidad | Alegra, Facturama, FiscalAPI, Contalink, Conta Azul | Fase futura; no son el foco personal actual. Precios por RFC/documento/servicio pueden cambiar la economía. |
| India | Khatabook, OkCredit | Libreta de cuentas y posible intermediación; no se demostró que sean referentes de rentabilidad comparable. |
| Indonesia | BukuWarung / BukuKas | Contexto legado del documento de Claude; no profundizado por Codex en la selección actual. |
| Inversión y potenciales socios | GBM, Mercado Pago, Nu, Klar, Stori, Finsus/Sofipos, Fintual | Ideas o proveedores a verificar, no integraciones contratadas. |
| Datos/agregación/ofertas | Plaid, Finicity, MX, Envestnet/Yodlee, Belvo, Fintoc, Cardlytics | Proveedores/modelos adyacentes; no suponer venta de datos ni relación comercial de Gastify. |
| Cobro de suscripciones | Stripe Payments / Stripe Billing, Mercado Pago, Pagar.me, Apple / Google Play | Costes y condiciones deben validarse por país y canal; haberlos mencionado no implica selección. |
| Scoring y supervisión | Buró de Crédito, Círculo de Crédito, BBVA, CNBV, SAT, INEGI, CONDUSEF | Fuentes/actores de contexto, no competidores PFM. |
| Comparadores y estudios | RevenueCat, Quartr, Sacra, Growjo, Dealroom, Adapty y estudios académicos | Diferenciar evidencia empírica, resumen generado, estimación y datos de un emisor. |

**Referencias a marcas de asistentes (ChatGPT, Claude, Manus, Gemini y modelos locales):** sirven para estudiar conectores y coste de IA, no se incluyen como competidores de gestión personal.

## 15. Top 10 de Codex — separado de la lista de Claude

### 15.1 Criterio de selección

**Es una prioridad de investigación para Gastify, no un ranking mundial de ingresos o rentabilidad.** Priorizo similitud personal, relevancia México/Brasil, claridad de planes y diversidad geográfica.

Conservo intacta la lista de Claude de la sección 10.1. Mi lista incorpora expresamente **Nextik Finance y Vittio**, normalizando “Nextic” y “Bitio” de la transcripción por voz.

| Orden | Producto / sitio | País o mercado de referencia | Qué queremos aprender | Estado inicial |
|---|---|---|---|---|
| 1 | **[Mobills](https://www.mobills.com.br/)** | Brasil | Parecido real con Gastify; Free/Premium/PRO; tarjetas, objetivos, análisis, adquisición y costes de conveniencia. Prioridad expresa del usuario. | Documental iniciada en 17.1; UX pendiente. |
| 2 | **[Nextik Finance](https://finance.nextik.mx/)** | México | Competencia local manual/IA, plan gratuito, tarjetas, libro compartido y propuesta de precio. | Oferta pública revisada; UX pendiente. |
| 3 | **[Vittio](https://vitt.io/pricing)** | México | Diferenciación entre captura gratuita e importación/automatización/IA de pago. | Oferta pública revisada; UX pendiente. |
| 4 | **[Organizze](https://www.organizze.com.br/planos/)** | Brasil | Suscripción incluso manual, planes bancarios separados, anualidad, complementos de IA y transición desde gratuito. | Historial documental en C3; UX pendiente. |
| 5 | **[YNAB](https://www.ynab.com/)** | Estados Unidos | Método, educación, activación, prueba de un mes y comunicación de cambios de precio. | Historia original y fuentes archivadas en C3; UX pendiente. |
| 6 | **[Monarch](https://www.monarch.com/)** | Estados Unidos | Migración/importación, valor personal/familiar, prueba corta y expansión Core → Plus. | Historia/oferta documentadas; UX pendiente y elegibilidad regional por verificar. |
| 7 | **[Money Forward ME](https://moneyforward.com/)** | Japón | Free → Standard → avanzado, informes/historial, límites y calidad de conexiones. | Documental; UX y disponibilidad para cuenta extranjera pendientes. |
| 8 | **[Emma](https://emma-app.com/plans/compare-emma-plans)** | Reino Unido | Basic/Plus/Pro/Ultimate, escalera de prestaciones y cancelación. | Comparación oficial revisada en 17.2; UX pendiente. |
| 9 | **[Qianji / 钱迹](https://www.qianjiapp.com/)** | China | Registro rápido, membresía no basada solo en bancos, libros compartidos, datos y diseño multiplataforma. | Documentación oficial localizada en 17.3; UX pendiente. |
| 10 | **[Wave](https://www.waveapps.com/)** | Canadá/Estados Unidos | Referencia **adyacente**, no PFM puro: paso a facturas/cobros y cómo cobrar por una tarea empresarial. | Documental; práctica condicionada a elegibilidad. |

### 15.2 Referencias obligatorias adicionales: no se descartan

- **Finerio / Finerio Connect (México):** mantener revisión prioritaria de su historia, app de consumo disponible o archivos públicos y pivote B2B. No sustituir por una cuenta empresarial de API y afirmar que se probó la app histórica. [Sitio](https://www.finerioconnect.com/), [entrevista del fundador](https://thebusinessyear.com/interview/nick-grassi-mexico-2026/).
- **Fintonic (España):** estudiar por separado su producto, país elegible, ofertas y monetización. [Sitio](https://www.fintonic.com/es-ES/descarga-la-app/), [explicación de negocio](https://www.fintonic.com/blog/es-fintonic-estafa-analizamos-la-verdad-detras-de-esta-app-financiera/).

**Resultado:** las dos listas reúnen **12 productos únicos**. Los dos pedidos mexicanos no reemplazan ni borran Finerio/Fintonic de la investigación. La lista de Claude cubre los 10 iniciales; Codex cambia dos puestos para aumentar la comparación personal mexicana.

### 15.3 Reserva y ampliaciones

- **Toshl / Wallet by BudgetBakers:** reserva europea continental y posibles sustitutos prácticos si no podemos acceder a otro PFM. [Toshl](https://toshl.com/pricing/), [Wallet](https://budgetbakers.com/en/products/wallet/).
- **Rocket Money:** ampliar si el objetivo pasa a comparar servicios y suscripciones, conservando la diferencia con un gestor manual.
- **Zaim / Moneytree:** ampliar Japón si necesitamos comparar anuncios, Premium, datos agregados o B2B.
- **Copilot / Spendee / Goodbudget:** referencias secundarias de onboarding, sobres y precio; no atribuir éxito financiero a descargas.
- **LatAm fuera de México/Brasil:** pendiente identificar un gestor personal comparable y verificar origen/mercado. No inferir nacionalidad por tener traducción al español ni confundir una app de inversión con PFM.
- **Wave** permanece por petición geográfica/visión futura, con advertencia de producto distinto. No añadir automáticamente contabilidad a Gastify por cubrir Canadá.

## 16. Primera fase vigente: investigación específica antes de diseñar o cobrar

### 16.1 Paso 1 — Fichas y pruebas de producto

**Primer paso actual:** investigar a fondo los productos seleccionados, comenzando por Mobills. El trabajo de esta entrada inicia la parte documental; **no afirma que se hayan creado cuentas o completado recorridos**.

Orden operativo sugerido:

1. Mobills, Nextik y Vittio: similitud y competencia cercana.
2. Organizze: sostenibilidad manual y límites por coste.
3. YNAB y Monarch: activación, educación y expansión.
4. Money Forward ME, Emma y Qianji: diferencias de uso, planes y contexto regional.
5. Finerio y Fintonic: casos históricos/modelos distintos que el usuario considera obligatorios.
6. Wave: expansión empresarial; no adelantarla al estudio personal.

El usuario puede crear cuentas gratuitas o pruebas cuando convenga. Registrar si una prueba exige tarjeta y su vencimiento **antes de activarla**. Si el país, número telefónico o banco impiden acceso, documentar la limitación y usar material oficial; no simular residencia o identidad.

### 16.2 Plantilla uniforme por producto

Copiar esta ficha al añadir una investigación, sin borrar la entrada previa:

> **Producto / URL / país / fecha / investigador-modelo / plataforma-versión / plan / moneda-impuestos / región de la cuenta / estado documental / estado práctico / fuentes / capturas / limitaciones / decisiones.**

Escenarios de prueba:

| ID | Escenario | Qué registrar |
|---|---|---|
| E01 | Abrir landing y entrar al registro | Promesa, CTA, campos, métodos de login, tiempo y fricción. |
| E02 | Crear perfil con datos ficticios | Datos obligatorios/opcionales, consentimiento, país, moneda y posibilidades de omitir banco. |
| E03 | Registrar ingreso y gasto | Pasos/toques, categoría, iconos, colores, notas y corrección de errores. |
| E04 | Crear categoría y subcategoría | Valores por defecto, búsqueda, límites y muro de pago real. |
| E05 | Transferir entre cuentas y pagar tarjeta | Que no duplique ingresos/gastos; tratamiento de fecha de corte y pago. |
| E06 | Crear presupuesto y objetivo | Periodo, progreso, alertas, límites Free y venta contextual de Premium. |
| E07 | Crear o simular un proyecto de viaje | Gastos reales/planeados, tags, divisas, colaboración y fechas, cuando exista. |
| E08 | Importar archivo ficticio | Formato, errores, vista previa, categoría automática, duplicados y reversión. No subir estados reales. |
| E09 | Ver dashboard, historial y comparativos | Valor inmediato, filtros, periodos, explicación de insights y acciones posibles. |
| E10 | Usar IA o conector, si se permite | Qué ejecuta realmente, aprobación, límites/créditos, coste y datos que salen. |
| E11 | Provocar un límite o abrir Premium | Momento exacto del paywall, razón, precio total y alternativa para seguir gratis. |
| E12 | Revisar trial y renovación | Días, tarjeta, recordatorios, canal, fecha, anual vs cuotas y requisitos de elegibilidad. |
| E13 | Cancelar y volver al gratuito | Pasos, estado final, datos accesibles, exportación, devolución y reactivación. No comprar para completar la prueba. |
| E14 | Privacidad, descarga y borrado | Controles separados, anuncios, socios, exportación, eliminación y comunicación clara. |
| E15 | Probar móvil y web, cuando sea viable | Paridad de funciones/precio, accesibilidad y adaptación de navegación. |
| E16 | Retención longitudinal | Qué ocurre a la semana y al mes; no inferirlo de una captura o una sesión. |

Estados permitidos: **pendiente**, **documentado**, **observado en interfaz**, **probado con datos ficticios**, **bloqueado por región/plan** y **no aplica**. No dar por hecho que una función de pago está ausente solo porque no aparece en Free.

### 16.3 Dataset de prueba común

Propuesta sintética, no importada aún en ningún competidor:

- Una cuenta de efectivo, una de débito y una tarjeta; moneda principal local.
- Dos meses de historial ficticio: ingresos, supermercado, transporte, renta y ocio.
- Un pago de tarjeta y una transferencia para comprobar doble contabilización.
- Un reembolso y un gasto compartido.
- Un presupuesto cercano al límite, otro rebasado y una meta de ahorro.
- Un proyecto de viaje con un gasto real y un concepto planeado, si la app lo admite.
- Una operación en moneda distinta, con fecha y tasa explícitas.
- Un archivo con un duplicado y un error intencionado para revisar mensajes.
- Mismos casos económicos en cada producto; adaptar moneda/formato sin fingir que los importes equivalen por poder adquisitivo.

### 16.4 Evidencias y entregables

1. Ficha documental y ficha práctica de cada producto; restricciones y campos sin respuesta visibles.
2. Capturas de landing, registro, primera acción, dashboard, presupuesto, paywall, gestión de prueba, cancelación y privacidad, cuando se hayan observado.
3. Tabla homogénea de planes, precios, impuestos, prueba, límites y renovación.
4. Cronología de cambios con fecha y fuente, separando promociones.
5. Matriz contra Gastify: **ya existe / mejorar / investigar / no incorporar**. Verificar el código y la interfaz vigente antes de afirmar un hueco.
6. Backlog priorizado por problema del usuario, valor esperado, esfuerzo y coste variable; no por cantidad de pantallas.
7. Propuesta de experimento de suscripción y economía unitaria.
8. Lista de incógnitas para entrevistas y cuentas del usuario.
9. Aprobación explícita antes de convertir la investigación en desarrollo.

**Capturas futuras:** propuesta de carpeta dedicada dentro de `.mds/research/monetization/` con producto y fecha. No se creó esa carpeta ni se fabricaron evidencias en esta entrada.

### 16.5 Criterio de priorización, no ranking financiero

Para cada oportunidad usar una puntuación **propuesta**, aún sin completar: parecido con Gastify, necesidad mexicana/brasileña, valor demostrado en la prueba, coste/soporte, fricción y confianza. No publicar un total como si midiera rentabilidad real.

Los indicadores comerciales posteriores deben incluir activación, conversión de registrados y de usuarios de prueba, renovaciones, devoluciones, fallos de cobro, margen de contribución, CAC y tiempo de recuperación. No usar un “LTV” mecánico sin cohortes ni observar el sesgo de supervivencia de los ejemplos exitosos.

## 17. Investigación documental iniciada en esta entrada

### 17.1 Mobills — ficha M01, prioridad máxima del usuario

- **Fecha/autor:** 2026-10-28; OpenAI / Codex / gpt-6.1-sol.
- **Estado:** documentación pública revisada; **sin cuenta ni prueba de UX**.
- **Pregunta principal:** ¿hasta qué punto es el mismo problema que Gastify y qué parte de su suscripción paga por claridad, automatización o conveniencia?
- **Límite:** no hay estados financieros individuales ni reparto de ingresos recuperados; no se puede atribuir toda su escala a Premium.

**Origen y grupo.** La ayuda de Mobills fecha el origen en 2013; su página “Sobre” dice 2014 y que se incorporó a Toro en 2022. Las discrepancias se conservan: no confundir idea inicial, lanzamiento, anuncio de compra e integración. Fuentes: [historia en la ayuda](https://mobills.zendesk.com/hc/pt-br/articles/360051966674-Como-o-Mobills-come%C3%A7ou), [página corporativa](https://www.mobills.com.br/sobre/). **No se confirmó Zenvia como comprador** y no se repite esa atribución.

**Modelo gratuito y Premium.** La ayuda describe Free limitado y funciones adicionales de pago. Otra guía distingue mensual móvil y anual web, además de una prueba iOS de siete días. Es documentación de fechas distintas, no una verificación del flujo de hoy. Fuentes: [Free/Premium](https://mobills.zendesk.com/hc/pt-br/articles/360051144493-O-Mobills-%C3%A9-gratuito-ou-pago), [cómo suscribirse](https://mobills.zendesk.com/hc/pt-br/articles/360024891434-Como-posso-assinar-o-Mobills).

**PRO, distinto de Premium.** La ayuda actualizada en mayo de 2026 presenta PRO como Premium más IA por WhatsApp: registro por texto/audio, categorías/tags, consulta de saldos y recordatorios. Excluye fotos/vídeos en esa descripción; editar requiere volver a la app y enlazar bancos también se hace allí. La IA no está incluida automáticamente en Premium, planes vitalicios o Gympass. Describe una prueba PRO de siete días solicitada al soporte y no vende allí la IA por separado. Falta probar estas restricciones. [Ayuda oficial de PRO](https://mobills.zendesk.com/hc/pt-br/articles/39727734628251-Tudo-sobre-o-Mobills-PRO).

**Publicidad documentada.** Google publicó en 2024 un caso de Mobills y AdMob. Prueba que la publicidad formó parte de su monetización, no su margen ni su peso actual. Su portal también contiene comparadores y ofertas; faltan contratos y reparto económico. [Caso de Google for Publishers](https://www.google.com/ads/publisher/intl/pt/stories/mobills/), [portal de Mobills](https://www.mobills.com.br/pricing/).

**Precios: no cerrar una cifra con el buscador.** En búsquedas anteriores apareció una oferta anual en doce cuotas; la consulta directa del [checkout](https://checkout.mobills.com.br/subscription) devolvió una aplicación que requiere JavaScript, sin precio legible en el texto recuperado. **No confirmado precio base, promoción, renovación ni precio de PRO**. No usar como vigente el R$99.90 anual del informe histórico sin ver el checkout real.

**Parecido preliminar con Gastify — hipótesis de comparación, no inventario de huecos probado:**

| Eje | Lo que vamos a contrastar | Resultado esperado del estudio |
|---|---|---|
| Problema central | Saber adónde fue el dinero y planear el siguiente periodo | Determinar si vendemos la misma necesidad y a qué segmento. |
| Categorías / tarjetas | Facilidad de registro y comprensión de las facturas | Medir fricción y errores, no solo cantidad de opciones. |
| Presupuestos / objetivos | Qué hace volver al usuario y en qué momento vende Premium | Extraer patrones útiles sin copiar activos ni promesas. |
| Importación / Open Finance | Ahorro de tiempo y coste de conexión | No asumir que la infraestructura de Brasil se replica en México. |
| IA / conveniencia | Entrada por WhatsApp vs los conectores/captura de Gastify | Separar coste de canal, proveedor de modelo y valor real. |
| Gratis / cobro | Límites, prueba por canal, anualidad y renovación | Distinguir elección comercial de restricciones impuestas por coste. |
| Adquisición | Blog, calculadoras, herramientas y app | Investigar si podemos captar usuarios sin pagar publicidad masiva. |

**No copiar automáticamente:** anuncios dentro de datos financieros, intermediación, un paquete de IA ilimitado o segmentaciones por gasto. No se aprobó ninguna de estas acciones.

**Siguientes pruebas concretas M01:** E01–E06 para semejanza personal; E08–E09 para utilidad; E11–E13 para suscripción; después E10 si hay prueba autorizada. Recoger límites exactos, precios por plataforma, explicación del descuento y qué queda accesible al vencer. Registrar cada función como anunciada u observada.

### 17.2 Emma — ficha E01 documental preliminar

La comparación oficial presenta Basic gratuito y Plus/Pro/Ultimate. En GBP muestra **£4.99/£9.99/£14.99 mensuales** o **£41.99/£83.99/£124.99 anuales**, y anuncia siete días de prueba. Son tarifas publicadas, no un checkout verificado para un residente mexicano. [Comparación oficial](https://emma-app.com/plans/compare-emma-plans).

Su ayuda indica que cancelar conserva las prestaciones hasta finalizar el periodo y después pasa a Basic; el canal de contratación determina dónde cancelar. [Ayuda de cancelación](https://help.emma-app.com/en/article/cancel-emma-plus-emma-pro-or-emma-ultimate-h97m7x/).

**Pendiente:** residencia/bancos admitidos, registro sin banco, límites observados, motivos de cada nivel, coste de adquisición y resultados. El “17% paga” del documento de Claude sigue como declaración histórica/contextual, no benchmark general ni tasa de nuevas altas.

### 17.3 Qianji — ficha Q01 documental preliminar

Se localizó **sitio y documentación oficiales**, evitando depender solo de tiendas/comparadores. Su FAQ describe funciones básicas gratuitas, membresía para extras y libros compartidos donde basta que pague su creador. Documenta gastos, ingresos, transferencias, reembolsos, cuotas e importación/exportación; también restricciones de las cuentas sin registro. [Sitio](https://www.qianjiapp.com/), [FAQ oficial](https://docs.qianjiapp.com/faq.html).

La FAQ conserva texto antiguo contrario a automatización y una actualización del 5-dic-2024 que anuncia desarrollo con activación manual. **No inferir el estado actual de una función por leer solo el primer párrafo**.

**Pendiente:** probar app vigente, idioma, membresía actual, canal, moneda CNY, periodo y precio vitalicio/renovación. Los precios ¥6/¥36/¥128 del documento anterior **no quedan confirmados aquí**; además, no confundir CNY con JPY por compartir símbolo ¥.

## 18. Síntesis de recomendaciones y opciones, sin sustituir el historial

Las propuestas detalladas, cálculos y tablas de cada conversación se conservan íntegros en el apéndice C. Esta sección sirve de índice de decisiones:

| Línea | Estado | Qué se recomendó / qué falta |
|---|---|---|
| Ingreso principal | Hipótesis prioritaria | Suscripción personal antes que crédito o venta de datos. Validar clientes y margen. |
| Plan gratuito | Propuesta, no especificación | Útil para registrar/entender dinero; no exigir pago por seguridad o recuperar datos. Límites aún no aprobados. |
| Trial Pro | Propuesta base | 30 días sin tarjeta en alta web, con final claro y retorno al gratuito. No extrapolar condiciones a Apple/Google sin revisar reglas. |
| 60–90 días | Experimento, no estándar | Probar luego, campaña o cohorte delimitada; no aprobar por intuición de “enganche”. |
| Precio México | Hipótesis C3 | Comparar MXN59/599 y MXN79/799 mensual/anual con mismos beneficios. No son precios aprobados ni garantía de margen. |
| Otro ejemplo de precio | Matemática C1 | MXN79 con distintos porcentajes de pago fue una ilustración, no forecast ni contrato comercial. |
| Brasil | Investigación separada | Portugués, BRL, pago y prueba por canal, contexto local. No simple conversión diaria desde MXN/USD. |
| Activación | Propuesta | Demo ligera, importación de historial y primer insight temprano; no esperar meses para mostrar utilidad. |
| Pro personal | Propuesta | Más capacidad y planificación/análisis/automatización; no hacer insoportable Free. |
| IA / bancos / OCR | Costes por medir | Cuotas, créditos o complemento según coste marginal; no “ilimitado” sin números. |
| Facturación | Fase posterior opcional | Pro Independiente o complemento con cupo; primero validar necesidad. No incluir costes por RFC a todos los personales. |
| Cobros/CFDI | Investigación técnica futura | Integrar proveedor adecuado, diferenciar emitido/cobrado, XML y conciliación. No ser PAC propio por defecto. |
| Inversiones | Idea de producto | Simulador educativo con fechas, flujos y supuestos explícitos; asesoría/referidos requieren otro análisis. |
| Crédito / score | Fuera del inicio | Indicador interno no es Buró ni aprobación. No prestar con capital propio ahora. |
| Datos agregados | No implementado | Demanda, calidad, consentimiento aplicable y evaluación de anonimización antes de recolectar/vender. |
| Privacidad | Diseño pendiente | Plan contratado separado de finalidades/consentimientos; no un permiso comercial global a cambio de usar Free. |
| Infraestructura | Sin presupuesto cerrado | Medir IA, base de datos, archivos, conexiones, soporte, cobros y usuarios gratuitos. |
| Prioridad actual | **Investigación** | Completar fichas de producto y entrevistas, después escoger planes y proveedor. |

### 18.1 Diseño de validación propuesto

- No variar precio, trial y límites a la vez.
- Con poco tráfico, piloto acompañado antes que afirmar significancia con pocas ventas.
- Definir evento de activación, cohorte, país, canal y denominador antes de medir.
- Comparar ingresos/margen por registrado a horizontes comunes y renovaciones después del trial; no declarar peor una prueba larga que aún no terminó.
- Separar retención mensual observada, intención de cancelar anual, reembolso y renovación anual real.
- No usar promedios globales de apps como promesa de conversión.
- Antes de una subida: explicar motivo, fecha, renovación y alternativas, respetar el periodo pagado y la normativa del país. Una política de aviso de 60 días sería una **decisión propuesta**, no una afirmación de plazo legal universal.
- Si se ofrece beneficio fundador: plazo y alcance claros; no prometer precio congelado/servicio ilimitado de por vida sin un modelo de coste.
- El anual mejora previsibilidad y reduce frecuencia de cobros, pero también adelanta obligaciones de servicio; no equivale automáticamente a utilidad.
- Las exportaciones, borrado y seguridad no son palancas de coerción comercial.

### 18.2 Evolución por fases, propuesta consolidada de Codex

1. **Fase de investigación actual:** comparación documental/práctica de 10 + 2 productos, Mobills primero, México muy presente.
2. **Decisión de producto:** definir necesidad central, persona objetivo, valor Free/Pro, métricas y precio de experimento.
3. **Diseño técnico posterior:** cobros, derechos por plan, límites de servidor compartidos web/móvil/MCP, gestión de errores y cancelación. No iniciado.
4. **Piloto personal:** pagos reales consentidos, soporte y cohortes; verificar margen después de costes.
5. **Independientes:** separación personal/actividad, XML/cobros y necesidad de facturar; añadir emisión solo si se valida.
6. **Servicios de terceros:** banca, pagos o referidos si usuarios y acuerdos los justifican.
7. **Datos agregados / préstamos propios:** no son compromisos de roadmap; requieren decisiones y condiciones nuevas.

### 18.3 Dudas del usuario que deben seguir visibles

- ¿Por qué pagaría alguien si solo quiere saber en qué gasta?
- ¿Qué cosas de Mobills ya hace Gastify, cuáles hace mejor y cuáles sobran?
- ¿Debe existir Free permanente o una prueba con pago obligatorio al final?
- ¿30, 60 o 90 días? ¿Con tarjeta o sin ella? ¿Qué pasa si no registra nada?
- ¿Qué cambia entre mensual cancelable y anual pagado en cuotas?
- ¿Cuánto puede pagar nuestro segmento concreto en México y Brasil?
- ¿Qué funciones Pro motivan pago sin destruir el hábito gratuito?
- ¿Existe demanda de facturación entre nuestros usuarios personales o sería otro segmento?
- ¿Puede un plan con CFDI sencillo ser diferenciador y cubrir su operación?
- ¿Qué se puede medir con registros manuales y qué requeriría verificación bancaria?
- ¿Conviene permitir pareja/familia bajo una suscripción y con qué permisos?
- ¿Cómo transferir historial, cancelar y seguir accediendo a datos?
- ¿Qué enseña un cierre/pivote, y qué causas financieras siguen sin prueba?
- ¿Cómo separar privacidad del cobro y no prometer capacidades que no existen?
- ¿Qué información falta antes de aprobar desarrollo?

## 19. Estado y próximos pasos al cerrar esta entrada

### Hecho

- [x] Localizar y leer el documento previo de Claude y las reglas de coordinación.
- [x] Conservar íntegro su contenido y su top 10.
- [x] Recuperar tres respuestas originales de Codex desde la primera pregunta de privacidad, con tablas y enlaces.
- [x] Recuperar las preguntas originales completas, incluida la extensión México/Brasil y la solicitud actual.
- [x] Conservar fuentes citadas, URLs de consultas y resultados recuperables; separar resultados de evidencia validada.
- [x] Añadir correcciones, recomendaciones, hipótesis, dudas y fases sin convertirlas en implementaciones aprobadas.
- [x] Proponer top 10 independiente, con Nextik/Vittio y conservación de Finerio/Fintonic: 12 únicos entre ambas listas.
- [x] Iniciar investigación documental de Mobills; localizar documentación primaria de Emma/Qianji.
- [x] Dejar escenarios, dataset, entregables y criterios para continuar la fase.

### Pendiente — siguiente trabajo, no realizado todavía

- [ ] Completar ficha práctica de **Mobills** con cuenta ficticia o cuenta de prueba que facilite el usuario.
- [ ] Confirmar precio y renovación en checkout/app de Mobills, por canal, Premium y PRO.
- [ ] Completar Nextik y Vittio; verificar prestaciones anunciadas y valores reales del paywall.
- [ ] Revisar Organizze en app, cancelación y complementos; no depender de precios antiguos indexados.
- [ ] Completar pruebas de YNAB, Monarch, Money Forward ME, Emma y Qianji según elegibilidad.
- [ ] Investigar Finerio histórico y actual/Fintonic sin fingir acceso a productos retirados.
- [ ] Evaluar Wave como referencia empresarial, no como obligación de añadir contabilidad.
- [ ] Identificar otro PFM de un tercer país latinoamericano, si esa ampliación sigue siendo deseada.
- [ ] Elaborar comparativo de funciones contra la **versión vigente** de Gastify.
- [ ] Hacer entrevistas con usuarios potenciales y medir disposición a pagar mediante comportamiento/pagos, no solo opiniones.
- [ ] Medir coste propio y obtener presupuestos para cobro, IA, almacenamiento, bancos y CFDI si aplica.
- [ ] Validar normativa/condiciones por país antes de diseñar facturación, uso comercial de datos o productos financieros.
- [ ] Elegir planes y experimento con visto bueno del usuario.
- [ ] Implementar solo después de esa decisión.

**No se hizo commit, push, merge, build, despliegue, registro en competidores ni conexión a bancos.** Esta entrada documenta y prepara el siguiente paso; no marca completa la investigación práctica.


---

## Apéndice C — Archivo íntegro del intercambio con Codex

**Fecha de archivo:** 2026-10-28. **Autor/modelo de los tres turnos:** OpenAI / gpt-6.1-sol (Codex), confirmado en los metadatos locales por identificador de turno. Se transcriben mensajes del usuario, avances públicos y respuestas finales; no razonamientos internos ni resultados completos de herramientas. Se mantiene el Markdown original de las respuestas y, por tanto, todas sus tablas. **Es archivo histórico: aplicar las aclaraciones de la sección 13 antes de reutilizar precios o conclusiones.**

### C.1 — Privacidad, datos, OAuth y modelos regionales

- **Inicio:** 28 de octubre de 2026, 3:50 a.m., America/Mexico_City.
- **Turno:** `01a181ea-bc19-7b50-92e4-e29443f90461`.
- **Modelo:** gpt-6.1-sol.

<details>
<summary>Pregunta original completa C1</summary>

Oye wey, ¿me puedes ayudar a ver el enrutamiento, o sea, le vamos a poner opciones de privacidad a Gatsby. Según yo ya tienes acceso a mi repositorio de Gatsby actual. Entonces esto te debería de servir lo suficiente como para que vayas al repositorio, estudies cómo está la cosa porque después, ¿cuál es el modelo que planeamos implementar acá? O sea, es un modelo de suscripción que van a ser cuentas pro que van a tener pues ya sabes accesos a crear más categorías o a tener más ciertos funcionamientos que todavía justo me gustaría ayudar a definir el de la aplicación. Pero si no fuera eso también sería ver los modelos de privacidad. ¿Por qué? Porque las cuentas gratuitas deben de venderse datos, que supongo que sería el grueso de venta, por así decirlo, para estas cuentas. Pero la idea es buscar el equilibrio. O sea yo pensaba hacer un perfilamiento de tipo, obviamente no vamos a poner el usuario Juanito Pérez que, o sea es un ejemplo, ¿no? Ponemos usuario Juanito Pérez que, no sé, gastó 545 pesos el 14 de octubre de 2026 en, yo qué sé, un huento, ¿no? O sea no vamos a hacer ese tipo de cosas. Pero tal vez sí sería bueno si no compartimos obviamente nombres, sino más bien datos de segmentación. O sea, por ejemplo, hombre de o mujer de tal edad a tal edad y, o sea datos más que sirvan para segmentación, o sea género, nombre. Y bueno, si podemos saber Y si o sea y también cómo podemos obtener esos datos de segmentación? O sea, obviamente si podemos hacer conexiones desde Facebook o desde Google, que pensaría Google porque Facebook según yo la última vez que chequeé el logout, el OAuth de Facebook creo que para conectarlo necesitas pagar. Entonces el de Google en este caso sería más interesante y tal vez obtener muchos datos de segmento desde ahí. También como para hacer los logins o mejor dicho la creación de cuenta pues menos engorrosa. Pero obviamente aquí hay varios problemas, ¿no? Uno, en cuestión de transacciones, ¿cómo te aseguras que las transacciones de los usuarios realmente estén cotejadas con banco? Pues creo que eso sería difícil de venderlo si es que no hay una integración con el API del banco, porque si no hay una integración, el usuario obviamente pone sus datos, pero no sé eso qué tan vendible sea. Entonces Chance si habría una forma de hacer un scorer para el usuario o si la aplicación, su modelo de negocio 100% pues va a ser un modelo de suscripción. Pero sería bueno tal vez, o sea es que algún uso debe tener el usuario gratuito, ¿sabes? Si no poner publicidad, pero tal vez muy dirigida basada en su gasto, su patrón y todo ese coso. Y es justo como lo que quiero checar y que me ayudes. Entonces también requiero que se haga un análisis, pues ahí completito,. Es que estoy de acuerdo en el, o sea, es que creo que sí se podrían agarrar más datos obviamente. Mientras nosotros en los términos y condiciones y de forma expresa digamos todo la serie de datos que se exponen, pues creo que no hay ningún problema. O sea, por ejemplo, Facebook vende hasta tu alma en cuanto a información, ¿no? O sea, la verdad es que vende mucho. Entonces, pensando en el uso de información que nosotros podemos hacer, pues vendría siendo lo mismo. Y la realidad es que no muchos leen los términos y condiciones en donde viene explícitamente todo. Entonces, bueno, sería poner ahí explícitamente todo y pues sí, captar la mayoría de información posible de hábitos de gasto, días de gastos mayores o meses o ubicaciones tal vez, objetivos del usuario y las categorías sí son como súper, súper, súper útiles, súper importantes. Pero antes de hacer eso, vamos a hacer primero yo creo que una investigación de mercado de aplicaciones similares, principalmente en Estados Unidos, pero vamos a buscar por ejemplo en Japón, hay aplicaciones similares en Japón para esto, en China, en Europa, en Latinoamérica, para ver cuál es más o menos su modelo de pago. Entonces sí requiero que hagas una investigación completa, te pongas a ver varias aplicaciones, veas cómo generan, cuál es su modelo de negocios. Muchas me imagino, la gran mayoría vienen de suscripciones, pero habrán otras que seguramente vienen de otro lado. Entonces nada más tenemos que ver pues cuál es, o sea, y ya. Entonces ayúdame a hacer la investigación


</details>

<details>
<summary>Avances públicos de investigación C1 (4)</summary>

**Avance 1**

Voy a revisar el repositorio actual y contrastarlo con aplicaciones de EE. UU., Japón, China, Europa y Latinoamérica: cómo cobran, cómo monetizan las cuentas gratuitas y qué uso hacen de los datos. También revisaré qué permite obtener Google y qué requisitos tendría usar datos financieros para segmentación, porque ponerlo en términos y condiciones no necesariamente basta.

**Avance 2**

Ya encontré algo importante: hay varias formas de sostener una cuenta gratuita sin vender sus transacciones. Algunas apps la usan para convertir a Premium; otras cobran por referidos, servicios financieros o software para empresas. En Gastify, la sección de Privacidad todavía es un espacio reservado y no veo un sistema de suscripciones implementado; eso permite definir ambos antes de construirlos.

**Avance 3**

Encontré un caso muy cercano a tu idea: Zaim, en Japón, ofrece tanto una app de finanzas como una herramienta empresarial de análisis de compras. Estoy revisando cómo separa ambas cosas. También hay una limitación relevante para Gastify móvil: Google Play prohíbe vender datos personales y sensibles, incluidos los financieros; aceptar términos no elimina esa restricción.

**Avance 4**

La revisión del código confirma que Gastify aún no registra si una transacción fue capturada a mano, importada de un archivo o verificada mediante una API bancaria. El campo que menciona Revolut describe el tipo de cambio, no la autenticidad del movimiento. Eso importa para vender estadísticas: se podría evaluar un panel de gastos declarados, pero hoy no sería correcto presentarlo como gasto bancario verificado.

</details>

<details>
<summary>Respuesta final íntegra C1 — incluye tablas y fuentes</summary>

Sí, bro. Revisé el código actual de Gastify y comparé modelos de negocio en las regiones que mencionaste. **Mi recomendación para Gastify sería un gratuito útil + suscripción Pro como ingreso principal. La comercialización de estadísticas de gasto sí existe, pero la evaluaría como un negocio adicional, con sus propios requisitos de calidad y privacidad.**

Tu idea tiene precedentes bastante cercanos, especialmente en Japón. Lo que sí cambia de tu planteamiento es esto: **una cuenta gratuita no necesita vender datos para aportar valor al negocio, y poner el uso de datos en términos y condiciones no permite automáticamente cualquier tratamiento.**

La investigación está consultada al **28 de octubre de 2026**. Los precios siguientes son referencias públicas en su moneda original; pueden cambiar según país, tienda y modalidad de contratación. Las fuentes permiten identificar cómo monetizan, pero no demostrar qué porcentaje de su facturación procede de cada vía.

La comparación de aplicaciones queda así:

| Región | Aplicación | Modelo de negocio observado | Referencia de pago |
|---|---|---|---|
| EE. UU. | [YNAB](https://www.ynab.com/pricing) | Suscripción después de una prueba gratuita. Declara que sus ingresos proceden de las suscripciones y que no vende los datos del usuario. | USD 14.99/mes o USD 109/año; prueba de 34 días. |
| EE. UU. | [Monarch](https://www.monarch.com/pricing) | Suscripción con niveles para presupuestos y planificación más avanzada. | Core: USD 99.99/año; Plus: USD 199.99/año. |
| EE. UU. | [Rocket Money](https://www.rocketmoney.com/learn/personal-finance/how-much-does-rocket-money-cost) | Gratuito + Premium + Premium+. También monetiza servicios como negociación de facturas. | Premium suele ofrecerse entre USD 7–14/mes; Premium+ cuesta USD 15/mes. |
| Japón | [Money Forward ME](https://moneyforward.com/me/courses) | Gratuito con límites y suscripciones que amplían conexiones, historial y análisis. | Standard web: JPY 540/mes o JPY 5,940/año. [Tarifas oficiales](https://support.me.moneyforward.com/hc/ja/articles/4409828451993). |
| Japón | [Zaim](https://zaim.net/) | Gratuito con publicidad + Premium. Además, el grupo ofrece análisis empresarial de compras con datos anonimizados. | Web: JPY 440/mes o JPY 4,378/año. [Planes](https://content.zaim.net/premium). |
| Japón | [Moneytree](https://help.getmoneytree.com/en/articles/12707580-moneytree-grow-plan-pricing-update) | Gratuito + Grow. La empresa también ofrece infraestructura financiera para otras aplicaciones mediante Moneytree LINK. | Grow web: JPY 390/mes o JPY 3,900/año. |
| China | [Suishouji / 随手记](https://apps.apple.com/cn/app/id372353614) | Gratuito con anuncios y compras/membresías, incluida eliminación de publicidad. Su política contempla recomendaciones y publicidad personalizadas. | Depende de la versión y membresía; no es una única tarifa universal. |
| China | [Shark Accounting / 鲨鱼记账](https://apps.apple.com/cn/app/id1079718756) | Gratuito + VIP. También existe una edición Pro de compra única con prestaciones distintas de VIP. | VIP: CNY 15/mes o CNY 148/año, según la ficha del desarrollador. |
| Europa | [Wallet, de BudgetBakers](https://budgetbakers.com/en/products/wallet/) | Gratuito + Premium. Combina suscripciones y una licencia Lifetime. | Precio según canal y oferta; confirma oficialmente la compra Lifetime. |
| Europa | [Toshl](https://toshl.com/pricing/) | Gratuito limitado; Pro para funciones avanzadas con registro manual; Medici añade sincronización bancaria. | El gratuito incluye 2 cuentas y 2 presupuestos. |
| Reino Unido | [Emma](https://help.emma-app.com/en/article/how-does-emma-app-make-money-g4ahl7/) | Gratuito + Plus/Pro/Ultimate; también comisiones de afiliados y servicios de ahorro/inversión. | Varios niveles de suscripción; tarifas según plan y contratación. |
| España | [Fintonic](https://www.fintonic.com/blog/es-fintonic-estafa-analizamos-la-verdad-detras-de-esta-app-financiera/) | Gestión financiera gratuita y comisiones por intermediación de préstamos y seguros. | El ingreso aparece cuando se contrata un producto de una entidad colaboradora. |
| Brasil | [Mobills](https://www.mobills.com.br/pricing/) | Suscripción Premium y un ecosistema de comparación/intermediación de productos financieros. | Hay distintas modalidades y campañas; separaría el precio del gestor del de otros servicios. |
| Brasil | [Organizze](https://www.organizze.com.br/planos/) | Suscripción, incluso para registro completamente manual. Cobra más por conexiones bancarias. | Manual: BRL 35/mes; Conectado: BRL 45/mes; Conectado Plus: BRL 69/mes. |

Hay un cambio próximo que conviene señalar: Rocket Money anuncia que **desde el 2 de noviembre de 2026** las nuevas negociaciones de facturas pasarán a Premium+, sin la comisión adicional por negociación exitosa. Es un ejemplo de cómo una empresa puede mover un servicio cobrado por resultado hacia una suscripción. [Anuncio oficial](https://help.rocketmoney.com/en/articles/17141357-bill-negotiations-is-moving-to-premium).

También encontré tres modelos cercanos que ayudan a entender para qué puede servir un gratuito:

- **Credit Karma:** analiza el perfil del usuario y cobra normalmente una comisión cuando este resulta aprobado para un producto recomendado. Monetiza la contratación, sin cobrar por consultar el perfil. [Cómo funciona](https://www.creditkarma.com/about/howitworks).
- **Empower:** ofrece gratuitamente su dashboard financiero y tiene servicios de asesoramiento de inversiones sujetos a pago. El producto gratuito puede atraer futuros clientes de un servicio de mayor valor. [Herramientas gratuitas](https://www.empower.com/tools).
- **Finerio Connect, en México y Latinoamérica:** muestra otra ruta: vender infraestructura de Open Finance y herramientas a empresas. Eso es cobrar por tecnología e integración, que es distinto de vender las transacciones de los usuarios. [Oferta empresarial](https://www.finerioconnect.com/).

El caso más parecido a tu propuesta es Zaim. Su empresa describe expresamente una herramienta de marketing que **anonimiza y analiza estadísticamente los datos de la aplicación** para estudiar qué se compra, dónde y cómo cambia el comportamiento de compra. Tu hipótesis, por tanto, sí tiene un precedente comercial concreto. [Descripción empresarial de Zaim](https://kufu.co.jp/zaim_service/).

Money Forward también declara que proporciona estadísticas a clientes empresariales, instituciones e intermediarios publicitarios. Es interesante su criterio: define esos datos como agregados que no permiten identificar personas y dice que excluye resultados con grupos demasiado pequeños. [Guía de datos estadísticos](https://corp.moneyforward.com/user_data_guide/statistical-data/).

Lo que esas fuentes **no demuestran** es cuánto pagaría un comprador por los datos de Gastify, qué volumen mínimo necesitaría o si serían su principal fuente de ingresos. Eso requiere validar compradores, no solamente acumular información.

Sobre tu preocupación de que las transacciones sean manuales: **no impide vender una buena aplicación por suscripción**. Organizze cobra por su plan manual y Toshl distingue precisamente entre funciones avanzadas manuales y sincronización bancaria. El valor para quien paga puede estar en ordenar, planear y entender su dinero.

Para vender estadísticas a empresas, en cambio, el origen de la información sí pesa mucho. En el código actual encontré que:

- El [modelo de usuario](</Users/luisjairvazqueznavarrete/Coding Proyects/Gastify/src/model/User.ts:3>) contiene nombre, correo, imagen, teléfono, idioma y país; todavía no contiene edad, género, preferencias de privacidad ni plan de suscripción.
- La [sección de Privacidad](</Users/luisjairvazqueznavarrete/Coding Proyects/Gastify/src/components/ProfileClient.tsx:196>) está reservada, pero aún no tiene controles funcionales.
- El [modelo de transacción](</Users/luisjairvazqueznavarrete/Coding Proyects/Gastify/src/model/Transaction.ts:31>) no registra una procedencia verificable del movimiento. El `source` que incluye `revolut` pertenece a la conversión monetaria: **no acredita que Revolut haya confirmado la transacción**.

Por eso, en vez de un “score del usuario”, construiría primero una **evaluación de calidad de los registros**:

| Origen | Qué permite afirmar |
|---|---|
| Capturado manualmente | El usuario declaró ese movimiento. |
| Importado de Excel, CSV o PDF | Procede del archivo aportado; eso no acredita por sí solo su autenticidad bancaria. |
| Extraído mediante IA | La IA interpretó un documento; la confianza de extracción no equivale a verificación bancaria. |
| Recibido de una API bancaria autorizada | Se puede acreditar esa procedencia, conservando identificadores, estados y modificaciones posteriores. |

Después mediríamos continuidad del registro, duplicados, periodos cubiertos y cuentas incluidas. Una persona puede registrar únicamente su tarjeta de viajes: eso no representa todo su consumo. Tampoco una muestra de usuarios de Gastify representaría automáticamente a México.

Podría tener valor comercial un **panel de gastos declarados**, pero habría que presentarlo como tal. No lo anunciaría como “consumo bancario verificado” con la arquitectura actual.

En privacidad hay una distinción fundamental: **quitar nombres no basta para anonimizar**. Un identificador persistente unido a edad, zona, fechas y gastos puede seguir permitiendo reconocer a alguien. La autoridad británica ICO distingue expresamente la anonimización de la seudonimización; esta última continúa siendo tratamiento de datos personales. [Guía de anonimización](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-sharing/anonymisation/introduction-to-anonymisation/).

Tu producto estadístico debería parecerse más a esto:

> “Dentro de una muestra suficientemente amplia de personas de 30–39 años, en una región y durante un mes, el gasto mediano en restaurantes fue X.”

Y menos a esto:

> “Usuario 8472, hombre de 34 años, hizo estos veinte pagos con sus fechas e importes.”

Para la primera alternativa necesitaríamos categorías normalizadas, grupos suficientemente grandes, supresión de combinaciones poco frecuentes y controles contra la identificación mediante consultas sucesivas. El nombre no aporta valor a ese análisis. Tampoco entregaría notas, títulos personales de proyectos o itinerarios.

Hay además requisitos concretos que afectan tu idea de “dejarlo explícito en los términos”:

- **México:** la ley vigente exige consentimiento expreso para datos financieros o patrimoniales, salvo sus excepciones. También exige finalidades determinadas, proporcionalidad y mecanismos de revocación y derechos ARCO. Un uso comercial nuevo puede requerir obtener nuevamente el consentimiento; publicar una cláusula no resuelve por sí solo todo el flujo. [LFPDPPP, artículos 7, 11, 12 y 15](https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf).
- **Google Play:** prohíbe vender datos personales y sensibles, incluidos datos financieros y de pago. Para usos inesperados exige una explicación destacada dentro de la aplicación y consentimiento afirmativo; dice expresamente que la explicación no puede quedar únicamente en términos o en la política. Esto afecta directamente a Gastify Android. [Política de datos de usuario](https://support.google.com/googleplay/android-developer/answer/10144311?hl=en).
- **Europa:** el consentimiento debe ser libre y poder rechazarse o retirarse. Condicionar el servicio a tratamientos innecesarios puede impedir que sea válido. No asumiría que “paga o acepta perfilamiento” funciona en cualquier circunstancia. [Comisión Europea](https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/legal-grounds-processing-data_en).
- **Estados Unidos:** según dónde opere Gastify y si queda sujeto a las leyes correspondientes, pueden existir derechos para rechazar venta o intercambio de información. California contempla expresamente esos controles. [CCPA](https://www.oag.ca.gov/privacy/ccpa).

**Publicar estadísticas efectivamente anónimas, mostrar anuncios dentro de Gastify y vender registros individuales son operaciones diferentes.** Habría que validar cada una según el dato, su procedencia, el destinatario y las plataformas de distribución.

Respecto a Google: **sí simplifica el registro, pero no entrega automáticamente un perfil demográfico completo**. El inicio de sesión básico permite obtener identidad y datos como correo, nombre y foto, según los permisos y campos disponibles. No incluye automáticamente edad, género, ingresos, ocupación o historial de compras. [Referencia de Google OpenID Connect](https://developers.google.com/identity/openid-connect/reference).

Cumpleaños y género requieren permisos adicionales de People API y no son datos necesariamente disponibles o completos. Además, los datos obtenidos bajo permisos sujetos a las restricciones de *Limited Use* no se pueden destinar libremente a publicidad, intermediarios de datos o evaluación crediticia. [Permisos de People API](https://developers.google.com/people/api/rest/v1/people/get), [política de datos de Google](https://developers.google.com/terms/api-services-user-data-policy).

Para Gastify mantendría Google como está y, después del registro, pediría solamente datos voluntarios con una utilidad clara: país de residencia, rango de edad si realmente lo necesitamos, objetivos generales y quizá composición del hogar. Evitaría inferir género por el nombre o tratar una ubicación de IP como residencia confirmada.

Sobre Facebook, **no pude confirmar en la documentación accesible tu premisa de que Facebook Login exige pagar**. No tomaría esa suposición como criterio de decisión. En Gastify, Google ya está implementado; añadir Facebook solamente para intentar obtener más datos no ofrece una ventaja demostrada.

Mi propuesta comercial para Gastify sería la siguiente, como hipótesis para probar con usuarios:

| Gratuito | Pro | Servicios con coste propio |
|---|---|---|
| Registro manual, categorías suficientes para formar el hábito, dashboard y análisis básico. | Más cuentas, presupuestos y proyectos; reglas avanzadas, comparaciones, planificación y análisis completos. | Lectura de documentos con IA, procesamiento intensivo y futuras conexiones bancarias. |
| Algunos límites de cantidad, sin dificultar el registro cotidiano. | Límites más amplios y herramientas para usuarios que ya gestionan más complejidad. | Cuotas o créditos que permitan cubrir el consumo real. |
| Exportación básica de datos, eliminación de cuenta y seguridad. | Comodidad y capacidad adicionales. | Coste explicado antes de consumirlo. |

No cobraría por passkeys, 2FA, borrar la cuenta o recuperar los propios datos. Y no convertiría las categorías en una restricción tan fuerte que el usuario no llegue a entender el valor del producto.

El gratuito aportaría adquisición, recomendaciones y futuros suscriptores. No necesita resultar rentable individualmente si el conjunto funciona. Como ejemplo matemático —no como previsión—, con 10,000 usuarios activos y una suscripción de MXN 79/mes:

| Porcentaje que paga | Ingreso mensual bruto |
|---|---:|
| 2% | MXN 15,800 |
| 5% | MXN 39,500 |
| 10% | MXN 79,000 |

Después habría que descontar impuestos, cobros, infraestructura, soporte y procesamiento. Antes de fijar el precio mediría cuánto cuesta atender al gratuito y qué funciones consiguen que la gente pague.

La publicidad o los referidos pueden añadirse después. Por ejemplo, una sección voluntaria de ofertas para viajes encaja con un proyecto de vacaciones, siempre que explique quién paga la comisión y qué información se comparte al continuar. No empezaría enviando movimientos a una red publicitaria. Incluso Google Ads restringe segmentaciones relacionadas con dificultades financieras, salud y otras categorías sensibles. [Política de publicidad personalizada](https://support.google.com/adspolicy/answer/143465?hl=en).

En cuanto al enrutamiento y la arquitectura, separaría **plan contratado** de **permisos sobre los datos**:

- `/privacy` y `/terms`: documentos públicos.
- `/dashboard/profile/privacy`: controles sobre analítica opcional, comunicaciones, ofertas y eventual participación en estudios.
- `/dashboard/profile/plan`: suscripción, límites y facturación.
- Backend: historial de consentimientos con finalidad, versión, fecha y revocación; suscripciones y límites en un módulo independiente.
- Web, móvil, importaciones y MCP: las mismas comprobaciones de límites en el servidor.
- Si se valida el negocio estadístico: un proceso separado que produzca únicamente las salidas agregadas autorizadas, con evaluación de anonimización.

Hay un texto del repositorio que también conviene revisar: el catálogo afirma que la información sensible no es accesible para nosotros ni para terceros. Es una promesa muy amplia y no queda acreditada simplemente porque los datos estén almacenados en MongoDB. Antes de definir el aviso real habría que describir fielmente qué puede procesar Gastify, qué proveedores intervienen y qué controles existen. [Texto actual](</Users/luisjairvazqueznavarrete/Coding Proyects/Gastify/packages/core/src/i18n/messages/es/inicio.ts:31>).

**Para empezar elegiría dos planes, Gratuito y Pro, y controles de privacidad independientes del pago.** Validaría la demanda de estadísticas con posibles compradores antes de construir esa infraestructura o recolectar más datos demográficos. Japón demuestra que esa línea puede existir; para Gastify todavía falta demostrar quién compraría qué información, con qué calidad y a qué precio.

</details>

### C.2 — Ingresos, rentabilidad, cinco casos y expansión por fases

- **Inicio:** 28 de octubre de 2026, 4:28 a.m., America/Mexico_City.
- **Turno:** `01a1820e-2776-7e42-abce-b353db4bb2ee`.
- **Modelo:** gpt-6.1-sol.

<details>
<summary>Pregunta original completa C2</summary>

Ok, ¿cómo actualmente está? O sea, ¿cuáles aplicaciones parecidas a Gastify son las que mejor facturan y cuál es su modelo de negocio? Si es que suscripciones o, por ejemplo, tal vez te hacen un score para luego hacerte préstamos o checan tal vez otra cosa con tu buró de crédito. O sea, ¿cómo es que buscan ese aspecto de la facturación? ¿Cómo es que se podría obtener dinero? Actualmente, ¿cómo lo hacen otros como Monarch, YNAB o Simplify o Rocket Money, Mind? Tal vez Fintonic, Money Forward Me o Same, ZAIM en Japón, o Wallet by Budget Markers en Chequia. O sea, ¿cómo sacan su dinero? ¿Cuál es de todas las aplicaciones similares a Gastify la que mejor retorno, digo, la que mejor, pues sí, retorno de inversión, o la que mejor, como la que más dinero saca, la que es más buena siendo rentable? O sea, porque de las opciones, pues ya entendí que la venta de datos realmente no es tan buena idea. Entonces, probablemente sí sea la suscripción. O tal vez crear también un modelo de facturación, poderle ayudar a facturar, a no solamente llevar la organización bancaria y todo esto de unas, sobre todo de los reciclos, podría apuntar mucho a los reciclos, pequeños negocios, y darle insights muy interesantes, analítica y todo eso. Sino también podría hacerlo, pues tal vez un modelo super pro que sea como para pequeños negocios, o ayudar a la facturación, o hacerles scores para saber, ayudarles a que los bancos les presten dinero, o yo mismo ser una entidad que presta dinero. O no sé qué otros modelos de negocio, cómo le hacen las otras empresas para ser tan rentables. Tal vez podamos investigar 5 empresas muy específicas que sean parecidas a Gastify, que estén en otros lados del mundo, para tratar de replicar su modelo en Latinoamérica o en Europa o en Estados Unidos incluso. O sea, incluso podría ser por fases, ¿no? Podría ser la primera fase, o sea, porque, a ver, yo estoy empezando, soy un bichito, soy un pececito en un mar de tiburones, entonces podría empezar por lo que en términos de infraestructura me podría salir más barato, pero hay que investigar en términos de infraestructura que podría salir más barato. Pero lo más fácil de escalar y mover, pues, serían planes de suscripción. Yo creo que sería el modelo a seguir. Basado en las empresas que actualmente tengan más éxito, hay muchas como Credit Karma en Estados Unidos, Nerd Wallet, Rocket Money, Monarch, otra sería YNAB, otra podría ser Money Forward en Japón, Wave en Canadá y Estados Unidos. Aunque realmente unas de estas no son realmente tan parecidas a Gastify, porque Gastify es como la aplicación para que tú sepas en qué gastas, puedas controlar, ahorrar, etcétera, ¿no? Entonces, pues, eso puede dar paso a diferentes perfilamientos. Entonces podríamos estudiar los casos de éxito primero con relación a las suscripciones, que es lo que podríamos hacer. Y tal vez en un futuro, o mientras estamos en el modelo de suscripciones, ir desarrollando la función que nos podría dar el mejor retorno de inversión. También aplicado al problema mexicano, podríamos crear una sección que enlace con inversiones, ver si podemos hacer APIs con GBM o con... ¿cómo se llama esto? Mercado Pago, Nubank, Sofipos, para que puedan mostrar los rendimientos de inversiones o decir, como tenemos los datos del usuario, decir, oye, no sé, este año te gastaste 140 mil pesos en cigarros. ¿Por qué? Porque compras tantos al día y esto con esto, pudiste haber invertido en esto y ya tendrías tanto dinero, ¿no? Que de hecho sería una sección muy interesante para agregar a Gastify. Entonces, ser prestamista cuesta mucho capital. No creo que pueda ser ahorita también. Podría ser en un futuro. Entonces, pues de momento ser un gestor de finanzas, nada más. O sea, que le digamos en qué gasta, que le ayudamos a entender sus finanzas y todo eso. Tal vez preparar productos para ser intermediario de préstamos. Eso sí podría ser. Uno, ¿no? Dos, llevarle su facturación, que también podrías tener un modelo de suscripción. Tal vez hacer cosas como lo que ya se alegra, por ejemplo. Enfocarnos tal vez en el reciclo podría ser interesante. Porque, bueno, claro, lo que más nos importa ahorita, pues, es la rentabilidad del negocio. Entonces podríamos fijarnos mucho en Money Forward de Japón. O sea, que la personal atraiga gente. Y ya dentro de eso, pues ya le podemos ofrecer los servicios de facturación para reciclo o para freelancers, facturación general, tal vez también planes de inversión. O sea, como hoy hemos identificado que gastas esto, podrías esto invertirlo en esto y te presentan los productos de inversión que podrás tener. Directamente ser gestores o ser intermediarios. Podríamos ser tal vez como Wave, que opera en Canadá y Estados Unidos, que encargan de facturación, contabilidad gratis, solamente para reciclos o para cosas que nosotros sí podemos medir, ¿no? Que sean entes pequeños. Después tal vez veríamos el tema de entes grandes. Podamos también operar como libreta de cuentas para microcomerciantes como OK Credit o Katabook de India. Pero también sería bueno hacer una investigación en México para ver qué afecta a los usuarios mexicanos y ayudarle a llevar sus cuentas de negocio. O personales. También tal vez un planner de viajes. También podremos ver el caso de same a futuro, o sea, se escribe como Z-A-I-M, que sí medio vende datos de usuario anonimizados, pero bueno, esto ya sería mucho más futuro, porque necesitamos un grueso de usuarios grande. Pero podría estar dentro de los planes a futuro. O sea, estamos haciendo ahorita como una lluvia de ideas para pues analizar, porque sí es un poco complejo entender cómo es que podemos hacer estos negocios, ¿no? Tal vez también dentro del análisis podremos investigar negocios que, aplicaciones que ya han sido como Gastify en México y que han fracasado también, pues como para aprender de sus errores, ¿no? Y sobre todo para empezar a atacar todo el tema de Latinoamérica y México.


</details>

<details>
<summary>Avances públicos de investigación C2 (4)</summary>

**Avance 1**

Voy a comparar cinco casos con distintos modelos de ingresos y separar lo comprobable de las estimaciones. Facturar mucho no necesariamente significa ser rentable; revisaré suscripciones, intermediación y servicios para pequeños negocios, además de casos mexicanos y los costes que implicaría cada camino para Gastify.

**Avance 2**

Encontré dos datos útiles para decidir el rumbo: Monarch anunció este mes que superó USD 100 millones de ingresos recurrentes anualizados, aunque no publica su utilidad. Wave, por su parte, combina suscripciones con cobros por pagos y nómina. Los dos muestran que Gastify podría crecer cobrando por organización y herramientas, antes de asumir el coste y el riesgo de prestar dinero.

**Avance 3**

Para México apareció un coste que sí cambia el diseño: emitir CFDI y descargarlos automáticamente del SAT se cobran de formas distintas. Un proveedor revisado cobra MXN 99 al mes por RFC y por tipo de descarga —emitidos o recibidos—, además de su cuota base. Eso favorece empezar con importación de XML y conciliación, y reservar la automatización fiscal para un plan que cubra ese coste.

**Avance 4**

La conclusión es bastante clara: Gastify puede empezar cobrando por control y planeación, sin meterse todavía en préstamos. También encontré cifras que permiten comparar ingresos reales; lo que no permiten es declarar a Monarch o YNAB “la más rentable”, porque no publican una utilidad comparable.


</details>

<details>
<summary>Respuesta final íntegra C2 — incluye tablas y fuentes</summary>

Sí, bro. La investigación apunta a una ruta bastante clara para Gastify: **suscripción personal primero; herramientas para independientes después; intermediación financiera como una tercera etapa opcional**.

No necesitas convertirte en prestamista ni vender datos para construir un negocio importante. Pero tampoco basta con copiar las funciones de una app exitosa: hay que entender por qué pagan sus clientes y cuánto cuesta conservarlos.

Revisé los casos con información disponible al 28 de octubre de 2026. Separaré los datos publicados de mis recomendaciones.

## 1. ¿Cuáles realmente generan más dinero?

Primero, cuatro cosas distintas:

- **Ingresos:** lo que cobra la empresa.
- **Utilidad:** lo que queda después de sus gastos.
- **ARR:** ingresos recurrentes anualizados; no necesariamente lo facturado durante el último año.
- **Retorno de inversión:** lo ganado respecto al capital invertido. No se puede deducir únicamente de los ingresos.

Esto importa porque varias apps privadas no publican su utilidad. Sería inventarte una respuesta decir que YNAB o Monarch son “las más rentables”.

### Los cinco casos que más nos sirven

| Empresa | Cómo cobra | Cifras verificables | Qué podemos concluir |
|---|---|---|---|
| **Monarch — Estados Unidos** | Suscripción personal, con distintos niveles. | Anunció haber superado **USD 100 millones de ARR** en octubre de 2026. | Prueba importante de que la organización financiera personal puede venderse por sí misma. No publica una utilidad comparable. |
| **YNAB — Estados Unidos** | Suscripción por su aplicación y método de presupuestación. | Precio publicado: **USD 109 al año o USD 14.99 al mes**, antes de impuestos aplicables. | Es una referencia muy directa para Gastify, pero no encontré estados financieros públicos suficientes para establecer su rentabilidad. |
| **Rocket Money — Estados Unidos** | Modelo gratuito y suscripciones; servicios adicionales de ahorro y gestión de facturas. | **USD 390 millones de ingresos en 2025**, frente a USD 297 millones en 2024. | Es el mayor ingreso anual publicado entre los gestores personales directamente comparables de esta selección. Su utilidad individual no aparece separada en la información revisada. |
| **Money Forward — Japón** | Suscripciones personales, software empresarial, servicios para instituciones financieras y otros servicios financieros. | El **grupo** reportó **¥46 908 millones de ingresos** y **¥1 686 millones de utilidad operativa** durante los nueve meses terminados en agosto de 2026. | Es una buena referencia de expansión hacia negocios, pero esas cifras **no pertenecen solamente a Money Forward ME**. |
| **Wave — Canadá/Estados Unidos** | Software gratuito y de pago, procesamiento de pagos, nómina y complementos. | **USD 122.7 millones de ingresos** en el ejercicio terminado en junio de 2026. | Demuestra que se puede monetizar el trabajo financiero del pequeño negocio mediante software y servicios. No encontré utilidad individual publicada. |

Fuentes: [anuncio de Monarch](https://www.monarch.com/blog/welcoming-MBI), [precios de YNAB](https://www.ynab.com/pricing), [reporte anual de Rocket ante la SEC](https://www.sec.gov/Archives/edgar/data/1805284/000162828026013283/rkt-20251231.htm), [reporte del emisor Money Forward, reproducido en FinancialFilings](https://financialfilings.com/filings/money-forward-inc/interim-quarterly-report/2026/72554346/), [resultados de H&R Block con la línea de ingresos de Wave](https://investors.hrblock.com/news-releases/news-release-details/hr-block-reports-fiscal-2026-results-and-enters-fiscal-2027).

**Respuesta directa:** Rocket Money destaca por ingresos publicados entre las apps más cercanas a Gastify; Monarch ofrece una señal fuerte del potencial de suscripción. Pero **no hay información suficiente para declarar cuál de estas cinco tiene el mejor ROI**.

### ¿Y los gigantes de las recomendaciones financieras?

Aquí cambia el negocio.

**Credit Karma:** Intuit reportó aproximadamente **USD 2 600 millones de ingresos de Credit Karma en su ejercicio 2026**. Su modelo principal no consiste en cobrarte por organizar tus gastos: bancos y otras instituciones pagan por conexiones comerciales que generan sus recomendaciones. Credit Karma explica que normalmente recibe una comisión cuando el usuario es aprobado para un producto recomendado. [Resultados de Intuit](https://investors.intuit.com/news-events/press-releases/detail/1320/intuit-reports-fourth-quarter-and-full-year-fiscal-2026-results-sets-fiscal-2027-guidance), [cómo gana dinero Credit Karma](https://www.creditkarma.com/about/howitworks).

**NerdWallet:** reportó **USD 836.6 millones de ingresos y USD 48.7 millones de utilidad neta en 2025**. Eso equivale a un margen neto aproximado de **5.8%**, calculado a partir de sus resultados. Es un ejemplo con rentabilidad publicada, pero su negocio de información, comparación y adquisición de clientes financieros es distinto al de una app de presupuestos. [Resultados de NerdWallet](https://investors.nerdwallet.com/news-releases/news-release-details/nerdwallet-reports-fourth-quarter-and-full-year-2025-results).

La lectura importante es esta: **intermediar productos financieros puede generar muchísimo dinero, pero también exige distribución, acuerdos comerciales y capacidad para conseguir clientes rentables**. No es simplemente agregar un botón de “solicitar préstamo”.

## 2. ¿Qué copiaría de cada modelo?

### Monarch y YNAB: cobrar por un resultado recurrente

Mi lectura es que Gastify debería vender una promesa como:

> “Entiende cuánto puedes gastar, prepara tus metas y evita sorpresas financieras”.

No solamente:

> “Paga para crear más categorías”.

Puedes poner límites por plan, pero el motivo principal para pagar debería ser el resultado: mejores decisiones, menos trabajo y mayor tranquilidad.

Con lo que ya tiene Gastify, los candidatos naturales son presupuestos, ahorros, proyectos, multimoneda, proyecciones, análisis históricos y automatizaciones. La ventaja inicial es que puedes monetizar capacidades cercanas al producto actual, sin construir primero otra industria.

Monarch ofrece actualmente Core por USD 99.99 anuales y Plus por USD 199.99; YNAB mantiene su suscripción como fuente central de ingresos. Eso valida la existencia del modelo, **no garantiza que México tenga la misma disposición a pagar**. [Precios de Monarch](https://www.monarch.com/pricing), [precios y explicación de YNAB](https://www.ynab.com/pricing).

### Rocket Money: hacer visible el beneficio económico

Lo que tomaría como inspiración es que el usuario perciba una mejora concreta:

- Detectaste un gasto recurrente que olvidó.
- Evitó exceder un presupuesto.
- Identificó un aumento importante en una categoría.
- Entendió cuánto debe separar para una meta.

Para Gastify, esto puede empezar como inteligencia y seguimiento, sin negociar contratos ni operar servicios financieros externos.

No asumiría que los ingresos de Rocket Money provienen principalmente de prestar: su reporte identifica el crecimiento de suscriptores de pago como un motor del aumento de ingresos. Además, Rocket Money y Rocket Loans aparecen como líneas distintas. [Reporte de Rocket](https://www.sec.gov/Archives/edgar/data/1805284/000162828026013283/rkt-20251231.htm).

### Money Forward: separar productos personales y empresariales

Este es el modelo más interesante para tu visión de largo plazo.

Money Forward combina un producto personal con software de contabilidad y administración empresarial, además de servicios para instituciones financieras. Pero no debemos dar por hecho que todos sus usuarios personales terminan comprando software empresarial: **ese embudo tendríamos que validarlo en Gastify**. [Reporte de Money Forward](https://financialfilings.com/filings/money-forward-inc/interim-quarterly-report/2026/72554346/).

Mi adaptación sería:

- Gastify Personal: organiza mi dinero.
- Gastify Independiente: organiza el dinero de mi actividad y lo conecta con mi vida personal.

Mismo ecosistema, pero espacios, necesidades y permisos claramente separados.

### Wave: cobrar alrededor de “que el negocio funcione”

Wave no se queda en mostrar gráficas. Se acerca a tareas operativas: facturar, cobrar, registrar y administrar.

Tiene un plan gratuito y un plan Pro; el precio publicado de Pro en Estados Unidos es **USD 19 mensuales o USD 190 anuales**, además de servicios con sus propias tarifas. [Wave Pro](https://www.waveapps.com/pro), [explicación de sus servicios gratuitos y de pago](https://support.waveapps.com/hc/en-us/articles/208621296-Is-Wave-free).

La lección para Gastify no sería regalar contabilidad completa desde mañana. Sería encontrar una tarea por la que un independiente pagaría todos los meses porque le ahorra trabajo o le ayuda a cobrar.

## 3. Para México, ¿qué oportunidad veo más cercana?

Cuando dices “reciclos”, estoy entendiendo **RESICO**. No es equivalente a todos los freelancers ni a todos los microcomercios; conviene segmentar por necesidad y después por régimen fiscal.

Mi primera hipótesis de cliente sería:

> **Una persona independiente que mezcla ingresos variables, gastos personales y gastos de su actividad, y necesita saber cuánto dinero realmente tiene disponible.**

Por ejemplo, un diseñador, consultor, programador, fotógrafo o profesionista que necesita:

- Separar dinero personal y de trabajo.
- Distinguir lo facturado de lo cobrado.
- Tener presentes pagos pendientes.
- Preparar dinero para obligaciones y temporadas bajas.
- Entregar información ordenada a su contador.
- Entender ingresos en distintas monedas.

Esto está más cerca de Gastify que construir desde cero un sistema para tiendas con inventario, caja, proveedores y ventas fiadas.

El microcomerciante también es una oportunidad, pero **es otro flujo de trabajo**. No intentaría resolver ambos segmentos simultáneamente.

Además, no diseñaría México como un mercado exclusivamente bancarizado: la ENIF 2024 reporta que el 63% de la población de 18 a 70 años tiene una cuenta de ahorro formal y documenta un uso importante del efectivo. El registro manual y las importaciones siguen siendo relevantes. [INEGI, ENIF 2024](https://www.inegi.org.mx/contenidos/saladeprensa/boletines/2025/enif/ENIF2024_RR.pdf).

### Facturación: sí puede ser negocio, pero no por emitir una factura aislada

El SAT ya ofrece generación gratuita de CFDI. Por eso, “también puedes emitir facturas” no sería por sí solo una diferenciación fuerte. [Servicio gratuito del SAT](https://www.gob.mx/sat/acciones-y-programas/servicio-gratuito-de-generacion-de-factura-electronica-ofrecido-por-el-sat).

La propuesta valiosa sería:

> “Sabes qué facturaste, qué te pagaron, qué falta por cobrar y cómo afecta eso al dinero que puedes usar”.

Aquí hay una distinción indispensable: **una factura no demuestra por sí sola que el dinero ya entró**. La factura y el movimiento de dinero deben poder vincularse sin tratarse como lo mismo.

Antes de emitir CFDI, empezaría con importación de XML y conciliación. Eso permite probar el valor del producto sin incorporar inmediatamente toda la operación fiscal.

## 4. ¿Qué resulta más barato de construir y operar?

Esta es una evaluación relativa para Gastify, no una cotización:

| Camino | Coste y complejidad incremental | Prioridad que le daría |
|---|---|---|
| Suscripción sobre el gestor personal actual | Bajo a medio: cobros, permisos por plan, soporte y retención. | **Primera** |
| Planeación y simulaciones de ahorro/inversión | Bajo a medio, sin necesidad de mover dinero. | **Primera** |
| Espacio para independientes, XML y conciliación manual | Desarrollo medio; operación potencialmente contenida. | **Segunda** |
| CFDI y sincronización fiscal o bancaria automática | Mayor mantenimiento, soporte y costes de proveedores. | **Después de validar demanda** |
| Referidos de crédito o inversión | Acuerdos comerciales, cumplimiento, integración y adquisición. | **Tercera etapa** |
| Prestar dinero propio | Capital, impagos, cobranza y operación especializada. | **Fuera del plan inicial** |

Dos costes reales ayudan a aterrizarlo:

**Cobrar suscripciones.** Stripe México publica una tarifa estándar de tarjetas nacionales de **3.6% + MXN 3 por operación**; Stripe Billing publica adicionalmente **0.7% del volumen de Billing** en su modalidad de pago por uso. Deben considerarse los impuestos y condiciones aplicables. Cobrar anualmente reduce el impacto del componente fijo por mes de servicio, aunque no garantiza rentabilidad. [Stripe Payments México](https://stripe.com/mx/pricing), [Stripe Billing](https://stripe.com/mx/billing/pricing).

**Automatizar información fiscal.** Como ejemplo de proveedor, FiscalAPI publica una cuota base de MXN 199 mensuales y descarga automática del SAT de **MXN 99 mensuales por RFC y por tipo de descarga**, emitidos o recibidos. Hay costes adicionales para otros servicios. No es una recomendación de proveedor: demuestra que no puedes prometer automatización fiscal ilimitada dentro de una suscripción barata sin calcularla. [Precios de FiscalAPI](https://fiscalapi.com/precios).

También vigilaría especialmente las funciones de IA y las conexiones externas: sus límites deberían responder a su coste real. No asumiría “IA ilimitada” antes de medir el consumo.

## 5. Tu idea de mostrar “esto podrías haberlo invertido” sí tiene valor

La incorporaría como **planeación**, antes de conectar con una casa de bolsa.

Ejemplo:

> “Durante el año destinaste MXN 140 000 a esta categoría. Si hubieras reducido ese gasto un 20%, habrías liberado MXN 28 000. Así habría evolucionado ese ahorro bajo estos escenarios”.

Eso permite ofrecer:

- Un escenario de guardar el dinero.
- Escenarios con rendimientos hipotéticos o históricos claramente identificados.
- Aportaciones según las fechas reales del gasto.
- Comparación con una meta del usuario.

No calcularía como si los MXN 140 000 hubieran estado disponibles desde enero: se gastaron durante el año.

Esta función puede aportar valor a Pro sin integrar GBM, custodiar inversiones ni mover dinero. Si después se convierte en recomendaciones individualizadas sobre valores o gestión de inversiones, ya estaríamos ante un alcance diferente que requiere revisar el encuadre regulatorio. La CNBV distingue expresamente la actividad profesional de asesoría en inversiones. [Preguntas frecuentes de la CNBV](https://www.cnbv.gob.mx/SECTORES-SUPERVISADOS/ASESORES_EN_INVERSIONES/Paginas/PreguntasFrecuentes.aspx).

Tampoco daría por hecho que GBM, Nu o Mercado Pago permiten consultar todas las inversiones de cualquier usuario mediante una API pública: eso hay que verificar proveedor por proveedor.

## 6. Scores y préstamos: dónde estaría realmente el ingreso

Un score propio puede servir para explicar:

- Estabilidad de ingresos.
- Cobertura de gastos.
- Capacidad de ahorro.
- Endeudamiento registrado.

Pero eso sería un **indicador de salud financiera de Gastify**, no automáticamente un score de Buró ni una aprobación de crédito.

Y si el usuario captura datos manualmente, no debes presentarlos a un prestamista como información bancaria verificada. Para una futura integración convendría distinguir la procedencia de cada dato: manual, importado, fiscal o bancario.

El modelo comercial cercano a Credit Karma sería que una institución pague por un cliente referido que cumple determinadas condiciones, según el acuerdo. El prestamista conserva su evaluación y decisión; Gastify no necesita financiar el préstamo.

Consultar información crediticia tampoco se vuelve libre porque ya tengas datos de gastos: requiere las autorizaciones y relaciones correspondientes. [Centro de ayuda de Buró de Crédito](https://www.burodecredito.com.mx/generales/centro-de-ayuda/ayuda.html).

Para ti, lo dejaría para cuando exista una base de usuarios activa y una necesidad comprobada. **No construiría primero un score esperando que después aparezca quién lo compre.**

## 7. ¿Qué aprendemos de cierres y cambios de modelo?

Hay que separar fracaso, cierre de un producto y cambio de estrategia.

**Finerio, México:** es un caso especialmente pertinente. Su cofundador describe el paso de una aplicación personal al modelo B2B de APIs de Open Finance. No lo presentaría como una quiebra: es un cambio de cliente y de producto. La lección posible es que la tecnología también puede venderse a instituciones, aunque eso trae ventas y soporte empresariales distintos. [Entrevista con Nick Grassi](https://thebusinessyear.com/interview/nick-grassi-mexico-2026/).

**Mint:** Intuit anunció su desaparición y la transición hacia Credit Karma. Eso demuestra que tener una aplicación conocida no asegura su continuidad como producto independiente; no prueba que todos los gestores gratuitos sean inviables. [Anuncio de Credit Karma para usuarios de Mint](https://www.creditkarma.com/about/releases/intuit-credit-karma-welcomes-all-minters).

**Fintonic:** está documentada su salida de Chile en 2023. No encontré documentación primaria suficiente para atribuir con certeza un cierre mexicano concreto a determinada causa financiera; no usaría rumores de disponibilidad como explicación de rentabilidad. [Cobertura de su salida de Chile](https://www.df.cl/mercados/banca-fintech/nuestro-viaje-ha-terminado-fintech-espanola-fintonic-cierra-sus).

Sobre Wallet, Zaim y otros nombres: son referencias de producto, pero no encontré cifras públicas comparables que permitan colocarlos honestamente en un ranking de utilidad.

## 8. La ruta que elegiría para Gastify

**Fase 1: demostrar que alguien paga por el producto personal.**

Mantendría la demo como escaparate y probaría una oferta Pro coherente: control, planeación, análisis y ahorro de trabajo. No cargaría al plan gratuito con operaciones externas caras. El precio y los límites se validarían con clientes reales, no copiando el precio estadounidense.

**Fase 2: validar “Gastify Independiente” con un grupo pequeño.**

Separación personal/actividad, ingresos variables, cuentas por cobrar, XML, conciliación y exportación para contador. Primero resolver organización y flujo de dinero; después decidir si merece la pena incorporar emisión y automatización fiscal.

**Fase 3: añadir servicios que ya tengan demanda.**

Cobros, facturación integrada o referidos financieros mediante socios. Elegiría una sola expansión a la vez y mediría si mejora el margen, no únicamente los ingresos.

Para saber si funciona, observaría cuatro cosas: conversión a pago, permanencia, coste de adquisición y margen por cliente después de cobros, infraestructura, IA, proveedores y soporte. Después hay que cubrir también desarrollo y tu propio trabajo.

Un ejemplo **puramente hipotético**: si cada cliente deja MXN 65 mensuales de contribución y conseguirlo cuesta MXN 300, recuperas esa adquisición en unos 4.6 meses. Si cuesta MXN 800, tardas 12.3 meses. El mismo precio puede producir negocios muy distintos.

**Mi recomendación final:** tomaría de **Monarch y YNAB el negocio inicial**, de **Money Forward la dirección de expansión**, de **Wave las tareas empresariales que merece la pena cobrar**, y de **Credit Karma la posible intermediación futura**.

Gastify no necesita empezar haciendo todo eso. Primero debe probar que puede cobrar de forma recurrente por ayudar a una persona a entender y controlar su dinero. Esa es hoy la apuesta más cercana al producto y con menor necesidad de capital adicional.

</details>

### C.3 — Historia de suscripciones, pruebas y adaptación México/Brasil

- **Inicio:** 28 de octubre de 2026, 4:59 a.m., America/Mexico_City.
- **Turno:** `01a1822a-9f62-7b61-981f-897394d439d9`.
- **Modelo:** gpt-6.1-sol.

<details>
<summary>Pregunta original completa C3</summary>

Yo creo que ahorita lo que más vamos a investigar son los modelos de suscripción. Podríamos seguir investigando más cosas, pero vámonos de lo general a lo específico. Por ejemplo, vamos a investigar las tres empresas que mejor hayan llevado su modelo de suscripción. Que empezaron como una aplicación explícitamente, así como Gastify, que simplemente es para que sepas de qué gastas, te categoriza tus gastos y todo eso, que entiendas en qué gastas, todo eso. Y que haya llevado un modelo de suscripción correcto. Eso para nosotros es sumamente importante. Y sobre todo estudiar su historial, cómo empezaron, cómo fueron mutando. Cuáles fueron sus claves a la hora de cambiar precios, de implementar suscripciones, si empezaron gratis, cuántos meses de plan gratuito dan porque pues supongo que es importante que el usuario se enganche, entonces darle 2 o 3 meses suena buena idea en la teoría, pero en la práctica, ¿qué tal? ¿Cómo ha funcionado modelos de suscripción en Japón, por ejemplo, en Europa, en Estados Unidos? Si es que ya hay modelos de suscripción exitosos en Latinoamérica, no como Alegra, porque Alegra sí creo que es un producto más profesional, sino como productos más como personales, porque Alegra sí es más un servicio como de facturación a reciclo o a pequeñas empresas. Sería algo más, todavía aún más bajo, como Gastify, pues simplemente que te categoriza tus gastos y te ayuda a entenderlos. A ver si es que existe algo como eso, y si no, pues justo tal vez podemos pensar implementar nuevas funciones, incluso en el plan pro, pues agregar el mismo plan de facturación y tal vez podría ser, esa sería la revolución, ¿no? Hacer que cueste poco dinero meter el plan pro que te permitas, pues digamos, todo el acceso y funciones de Gastify y además un plan de facturación sencillo para reciclo, cosas de ese tipo. Podría servir un gran punch. Pero hay que verlo. Entonces, pues ayúdame a checar a ver qué. O sea, quiero que entiendas, de esta investigación de mercado, nosotros tenemos que saber muy específicamente cómo deberíamos de implementar nuestros modelos de suscripciones basados en otros países. También los basados en Latinoamérica y México son súper importantes porque pues, nuestra economía es menor. Pero México y Brasil específicamente son como casos aparte, podrían ser temas muy interesantes que podamos explotar. Entonces, valdría la pena revisar con detenimiento cómo implementar eso.


</details>

<details>
<summary>Avances públicos de investigación C3 (4)</summary>

**Avance 1**

Voy a estudiar tres casos de suscripción personal: cómo arrancaron, qué dejaron gratis y cómo cambiaron precios y pruebas. También los contrastaré con México y Brasil; distinguiré las estrategias que usan de los resultados que realmente han publicado.


**Avance 2**

Encontré un caso brasileño muy útil: Organizze afirma que se financia con suscripciones desde 2009, sin vender datos ni ofrecer productos financieros. Hoy separa el plan manual del conectado a bancos. Lo estudiaré a fondo junto con YNAB y Money Forward ME; Monarch servirá como contraste por su crecimiento reciente.


**Avance 3**

Sobre los dos o tres meses gratis: no encontré evidencia para adoptarlos como regla. Los casos revisados usan pruebas de 7 a 34 días o un plan gratuito limitado. También encontré ofertas mexicanas de MXN 59–99 al mes con 30 días de prueba: sirven como referencia de precio, aunque no publican resultados que demuestren su rentabilidad.


**Avance 4**

Hay otro hallazgo importante para tu idea de facturación: Money Forward cobra por separado ME, su gestor personal, y Cloud, su producto contable. No valida un “todo incluido barato”. Para Gastify, eso favorece probar primero la suscripción personal y dejar la facturación como un paquete opcional para quienes sí la necesitan.


</details>

<details>
<summary>Respuesta final íntegra C3 — incluye tablas y fuentes</summary>

Sí, bro. Ya enfocándolo exclusivamente en suscripciones, **mi propuesta inicial para Gastify sería: una versión gratuita útil, Pro con 30 días de prueba sin tarjeta y precios locales. No arrancaría ofreciendo tres meses de Pro gratis para todos ni incluyendo facturación ilimitada.**

No porque esas ideas estén mal, sino porque la evidencia que encontré favorece probar primero algo más sencillo y medirlo.

Para estudiar a fondo elegiría **YNAB, Money Forward ME y Organizze**: Estados Unidos, Japón y Brasil. No puedo afirmar que sean “las tres más rentables del mundo”: faltan datos públicos comparables. Las selecciono por su trayectoria, su cercanía con Gastify y las decisiones de suscripción que podemos reconstruir. Monarch y Toshl sirven como contrastes adicionales.

*Precios consultados al 28 de octubre de 2026.*

## 1. YNAB: construyó primero una razón para pagar

### Cómo empezó y cómo cambió

Hay un matiz: YNAB no nació como una app móvil gratuita. Empezó vendiendo una hoja de cálculo en **2004**, pasó a software de escritorio y después a una aplicación con suscripción.

Su historia oficial registra dos movimientos interesantes: además del software, desarrolló un método de presupuestación y educación. Según la propia empresa, un curso gratuito por correo lanzado en 2006 duplicó sus ventas; después incorporó clases y talleres. Es un resultado comunicado por YNAB, no un experimento independiente. [Historia oficial de YNAB](https://www.ynab.com/about/timeline).

La evolución de precios y condiciones está bastante bien documentada:

| Etapa | Qué hizo |
|---|---|
| Diciembre de 2015 | Lanzó la versión web por **USD 5 mensuales o USD 50 anuales**, con 34 días de prueba. |
| Noviembre de 2017 | Subió a **USD 83.99 anuales para nuevos clientes**, conservando entonces los precios anteriores para los existentes. |
| Diciembre de 2021 | Pasó a **USD 98.99 anuales o USD 14.99 mensuales**, incluyendo clientes con tarifas antiguas. Mantuvo el descuento porcentual de ciertos usuarios históricos, no necesariamente su precio absoluto. |
| Actualmente | **USD 109 anuales o USD 14.99 mensuales**. Prueba directa de 34 días sin tarjeta. No tiene una versión gratuita permanente general. |

Fuentes originales archivadas: [lanzamiento de 2015](https://web.archive.org/web/20151231182644/http://www.youneedabudget.com/blog/post/the-new-ynab-is-here), [cambio de 2017](https://web.archive.org/web/20181017033648/https://www.youneedabudget.com/price-change-faqs-2017/), [cambio de 2021](https://web.archive.org/web/20211101121240/https://www.youneedabudget.com/price-change-2021/). Condiciones actuales: [precios de YNAB](https://www.ynab.com/pricing).

### Qué aprendería para Gastify

Mi interpretación es que YNAB no vende principalmente “más gráficas”. Vende **un método para tomar decisiones**, acompañado de herramientas y aprendizaje.

Para Gastify, eso significa que la prueba debería guiar al usuario hacia resultados concretos:

- Saber cuánto puede gastar.
- Detectar una categoría que se le está saliendo de control.
- Preparar un gasto futuro.
- Separar dinero para una meta.

También deja una lección sobre precios: **un descuento permanente no equivale a un precio congelado permanentemente**. Nosotros deberíamos distinguir ambas cosas desde el principio y evitar promesas ambiguas a los primeros usuarios.

No encontré resultados públicos que permitan saber cuánto aumentó o cayó su conversión después de cada subida. Su continuidad demuestra que sostuvo el negocio, pero no que todas sus decisiones fueran óptimas.

## 2. Money Forward ME: gratuito para entrar, pago para profundizar

Este es probablemente el caso más cercano a tu idea de “primero entiende tus gastos y después descubre todo lo que puedes hacer”.

### Su evolución

**Diciembre de 2012:** lanzó una beta gratuita de gestión de cuentas y finanzas personales.

**Julio de 2013:** introdujo Premium, aproximadamente siete meses después. Costaba **¥525 mensuales, impuestos incluidos**, y añadía simulaciones de futuro, reportes mensuales, consulta de datos de más de un año y otros beneficios. Su promoción inicial incluía 30 días de prueba.

Es importante: esos siete meses de beta gratuita **no eran siete meses gratis para cada nuevo usuario**. Era una etapa inicial del producto. [Comunicado original de lanzamiento de Premium](https://corp.moneyforward.com/service/img/20130716press.pdf).

Después hizo cambios relevantes:

- **2022:** redujo de diez a cuatro las conexiones financieras permitidas en la versión gratuita. [Anuncio oficial](https://corp.moneyforward.com/news/info/20221107-mf-press/).
- **2023:** añadió un nivel avanzado de formación patrimonial por ¥980 mensuales, conservando el nivel estándar y el gratuito. [Anuncio del nuevo nivel](https://corp.moneyforward.com/news/info/20230227-mf-press-2/).
- **2025:** revisó precios del estándar, explicando aumentos en mantenimiento, operación e integraciones API. Los cambios se aplicaron según renovación y modalidad de cobro. [Aviso oficial de revisión](https://support.me.moneyforward.com/hc/ja/articles/48081250560409).

Actualmente, el estándar contratado por web cuesta **¥540 mensuales o ¥5,940 anuales**; mediante las tiendas móviles, **¥590 o ¥6,490**. El avanzado cuesta **¥980 mensuales o ¥10,700 anuales**. Sigue ofreciendo una prueba inicial de Premium de 30 días. [Precios oficiales](https://support.me.moneyforward.com/hc/ja/articles/4409828451993), [oferta de Premium](https://moneyforward.com/pages/premium).

### ¿Hay evidencia de que la gente paga?

Sí. Su presentación de resultados del trimestre terminado en mayo de 2025 mostraba **más de 617,000 usuarios Premium**. Es una evidencia específica del producto personal, más útil aquí que los ingresos de todo el grupo. [Presentación del emisor, página 35](https://fs2.magicalir.net/tdnet/2025/3994/20250714513794.pdf).

No tomaría su número acumulado de registros o descargas como denominador para calcular una “tasa de conversión”: no equivale a usuarios activos elegibles para pagar.

### Qué aprendería para Gastify

La estructura tiene lógica:

> Gratis te ayuda a comenzar; Premium te permite planear, comparar y gestionar una vida financiera más compleja.

Pero no copiaría automáticamente la reducción de prestaciones gratuitas. Que una empresa grande haya restringido cuentas no demuestra que hacer eso ahora vaya a mejorar Gastify.

Lo que sí copiaría es **separar funciones con costes diferentes**. Si una integración bancaria cuesta por usuario conectado, no conviene regalarla ilimitadamente solo porque el registro manual sea barato.

## 3. Organizze: el caso brasileño que más nos sirve

Este caso responde directamente a tu duda: **sí existen gestores personales latinoamericanos que cobran por organización financiera, sin necesitar convertirse primero en un servicio contable**.

### Cómo empezó y mutó

Organizze opera desde **2009**. La empresa afirma que se sostiene y reinvierte con ingresos de suscriptores desde su primer año. Es una declaración empresarial, no una auditoría pública de rentabilidad. [Historia de Organizze](https://www.organizze.com.br/quem-somos/).

En etapas anteriores coexistían una versión gratuita y prestaciones de pago: una cobertura de la época, con entrevista a sus responsables, documentaba funciones gratuitas y un plan superior con tarjetas, metas, varias cuentas y recordatorios. [Cobertura histórica de Tecnoblog](https://tecnoblog.net/arquivo/controle-financeiro-android-organizze/).

Posteriormente abandonó la versión gratuita permanente. Hoy ofrece **siete días de prueba del plan Manual, sin tarjeta**, y luego exige suscripción. [Planes actuales](https://www.organizze.com.br/planos/).

### Cómo cobra actualmente

Su ayuda, actualizada el 19 de octubre de 2026, publica:

| Plan | Mensual | Anual | Diferencia principal |
|---|---:|---:|---|
| Manual | **R$39** | **R$358.80** | Organización sin conexión bancaria. |
| Conectado | **R$49** | **R$478.80** | Hasta tres conexiones personales. |
| Conectado Plus | **R$79** | **R$838.80** | Hasta diez conexiones, personales y empresariales. |

Además, publica un **complemento de IA de R$19.90 mensuales**, con 3,300 créditos. [Precios y condiciones oficiales](https://ajuda.organizze.com.br/hc/pt-br/articles/5661263190035-Conhe%C3%A7a-nossos-pre%C3%A7os-e-assinaturas).

Ojo con una diferencia comercial importante: **un plan anual dividido en doce pagos no es necesariamente una suscripción mensual que puedes cancelar mes a mes**.

### Qué aprendería para Gastify

Para mí, las lecciones son fuertes:

1. **La captura manual puede ser un producto de pago.** No necesitas tener conexión bancaria para comenzar a cobrar.
2. Puedes cobrar más por automatización, sin encarecer obligatoriamente el producto manual.
3. La IA puede tener límites o un complemento propio.
4. Brasil no debe tratarse como “Estados Unidos, pero traducido”.

No encontré datos públicos suficientes para cuantificar cuánto mejoró su conversión al quitar el gratuito. Por eso, **no recomendaría eliminar nuestro gratuito solamente porque Organizze lo hizo**.

## 4. Los contrastes: Estados Unidos, Europa y México

### Monarch: una segunda capa de valor, no solo subir la tarifa

Monarch aporta una señal importante de escala: anunció haber superado **USD 100 millones de ingresos recurrentes anualizados** en octubre de 2026. Eso no equivale a utilidad. [Anuncio de Monarch](https://www.monarch.com/blog/welcoming-MBI).

Hoy mantiene Core por USD 99.99 anuales y ofrece Plus por USD 199.99. Plus incorpora necesidades más complejas, como planificación a largo plazo y seguimiento de ingresos y gastos de negocio. Su prueba ordinaria es de siete días; durante la migración desde Mint ofreció una campaña de 30 días y descuento del primer año. [Precios](https://www.monarch.com/pricing), [lanzamiento de Plus](https://www.monarch.com/blog/monarch-plus), [campaña publicada por Monarch](https://www.linkedin.com/posts/monarch-money_mint-shutting-down-how-to-migrate-to-monarch-activity-7128885843364089856-RyNh).

**Lección:** ampliar temporalmente una prueba para una campaña concreta es distinto de regalar tres meses permanentemente a todo el mundo.

### Europa: Toshl separa organización de automatización

Toshl, originado en Eslovenia, lanzó su gestor en 2010. Actualmente combina gratuito, Pro manual y Medici con sincronización bancaria. Ofrece 30 días de prueba de los niveles de pago; el gratuito incluye dos cuentas y dos presupuestos. [Historia de Toshl](https://toshl.com/blog/the-story-of-toshl-thus-far/), [comparación oficial de planes](https://toshl.com/pricing/).

Es otra referencia útil para **no meter el coste bancario dentro del precio mínimo de todos**. No encontré resultados financieros públicos que permitan proclamarlo líder europeo por rentabilidad.

### México: ya hay ofertas personales de suscripción

Encontré dos referencias locales bastante cercanas:

| Producto | Oferta publicada | Prueba |
|---|---|---|
| **Nextik Finance** | Gratuito esencial; Premium de **MXN59 mensuales o MXN549 anuales**. | 30 días sin tarjeta. |
| **Vittio** | Gratuito; Premium de **MXN99 mensuales o MXN899 anuales**. | 30 días sin tarjeta. |

Nextik presenta registro manual, presupuestos, análisis y funciones compartidas; Vittio diferencia su Premium con automatización e IA. [Nextik Finance](https://finance.nextik.mx/), [precios de Vittio](https://vitt.io/pricing).

**Son referencias de oferta y precio, no pruebas de éxito comercial:** no encontré cifras verificables de suscriptores, retención o utilidad. Pero sí descartan que Gastify vaya a introducir una categoría de cobro inexistente en México.

## 5. Entonces, ¿convienen dos o tres meses gratis?

**No encontré evidencia para establecerlo como regla.**

Hay tres modelos distintos que no debemos mezclar:

- **Prueba gratuita:** Premium completo durante cierto tiempo.
- **Freemium:** versión básica gratuita permanente.
- **Descuento anual:** pagar menos por comprometerse a un año; no significa probar sin pagar durante varios meses.

Sobre resultados prácticos, RevenueCat reporta para 2026 una mediana de conversión de prueba a pago de **42.5% en pruebas de 17–32 días**, frente a **37.4% en las de 5–9 días** y **25.5% en las de hasta cuatro días**. Pero son comparaciones observacionales entre apps distintas, no evidencia causal específica de gestores financieros mexicanos. Tampoco prueban que 60 o 90 días sean mejores. [Informe de RevenueCat](https://www.revenuecat.com/state-of-subscription-apps).

Como contraste, un experimento aleatorio en otra empresa SaaS comparó siete, catorce y treinta días y encontró que siete era la mejor política uniforme en ese contexto. **No hay una duración universalmente ganadora.** [Investigación de Yoganarasimhan, Barzegary y Pani](https://arxiv.org/abs/2006.13420).

Para Gastify elegiría **30 días como hipótesis inicial**, porque permite vivir varias semanas de gastos, quincenas y al menos un cierre mensual.

Y haría algo más importante que alargar la prueba:

> **Permitir importar historial para que el usuario vea comparativos desde el primer día, en vez de esperar dos meses para descubrir el valor.**

La demo ya ayuda a enseñar el producto. La importación ayuda a demostrarlo con su propio dinero.

Los 60 días los reservaría para un experimento posterior o una campaña concreta. Los 90, para programas delimitados —por ejemplo, colaboradores iniciales—, no como condición general sin medir resultados.

## 6. Cómo implementaría el modelo comercial de Gastify

Esta es una **propuesta para validar**, no una decisión definitiva ni cambios ya realizados.

### Primero: solamente Gratis y Pro

| Gratis | Pro |
|---|---|
| Registro y categorización manual realmente utilizables. | Gestión más amplia de cuentas, presupuestos, metas y proyectos. |
| Resumen de ingresos, gastos y categorías. | Comparaciones históricas, proyecciones y análisis avanzados. |
| Una cantidad inicial de presupuestos y metas. | Automatizaciones y ahorro de trabajo. |
| Acceso y exportación básica de sus datos. | Importaciones y capacidades de IA con cuotas acordes a su coste. |

No bloquearía seguridad, exportación básica ni el acceso a datos ya registrados para forzar el pago.

Y no cerraría aún cifras como “cinco categorías gratuitas”: primero necesitamos observar qué límites permiten un uso satisfactorio y cuáles solo frustran. **Pro debe vender una mejora reconocible, no la reparación de una versión gratuita deliberadamente incómoda.**

### Segundo: una prueba guiada de 30 días

Sin tarjeta en el alta directa por web. Con fecha de finalización clara y explicación de qué seguirá funcionando gratis.

La experiencia debería llevar al usuario por este recorrido:

1. Configurar e importar o registrar sus primeros movimientos.
2. Descubrir su distribución de gastos.
3. Crear un presupuesto o una meta.
4. Recibir una observación útil.
5. Revisar qué cambió durante el periodo.

Si alguien nunca llega al paso dos, regalarle sesenta días adicionales no resuelve necesariamente el problema.

### Tercero: probar precios mexicanos, no convertir dólares

Las ofertas locales de MXN59–99 dan un rango de comparación, pero **no demuestran cuánto pagará nuestro público**.

Yo contrastaría inicialmente dos propuestas de precio:

- **MXN59 mensuales / MXN599 anuales.**
- **MXN79 mensuales / MXN799 anuales.**

Son hipótesis de investigación, sujetas a nuestros costes e impuestos; no una afirmación de que cualquiera de ellas ya sea rentable.

Mantendría inicialmente las mismas prestaciones para aislar el efecto del precio. Después probaría duración de prueba. **No cambiaría simultáneamente precio, funciones y días gratis**, porque no sabríamos qué produjo el resultado.

Para Brasil haría una validación separada en reales, portugués y con condiciones de pago locales. Los precios de Organizze orientan, pero no justifican trasladar automáticamente nuestro precio mexicano mediante el tipo de cambio.

## 7. Tu idea de Pro con facturación: sí tiene potencial, pero como paquete específico

Aquí apareció un hallazgo relevante: **Money Forward ME y Money Forward Cloud se cobran por separado**. Su ayuda dice expresamente que contratar el producto contable no incluye Premium de ME ni ofrece actualmente un descuento por usarlos juntos. [Explicación oficial](https://support.me.moneyforward.com/hc/ja/articles/55460846509209).

Por tanto, Japón valida la coexistencia de necesidades personales y empresariales, **no valida que convenga incluir ambas ilimitadamente por un precio bajo**.

Para Gastify lo imaginaría después como:

> **Pro Independiente: todo Pro + facturación sencilla con un cupo definido + relación entre facturas, cobros y gastos.**

Eso podría ser atractivo para freelancers y personas en RESICO. Pero lo probaría con ese segmento, no se lo cobraría indirectamente a todos los usuarios personales.

Primero mediría cuántos lo necesitan, cuánto pagarían adicionalmente y cuánto cuesta atenderlos. No necesitamos construir facturación para demostrar que la suscripción personal funciona.

## 8. Qué tenemos que medir para decidir de verdad

No me quedaría únicamente con “qué porcentaje pagó al acabar la prueba”. Compararía:

- Cuántos registrados llegan a usar el producto con datos propios.
- Cuántos pagan y cuántos renuevan.
- Ingreso y margen por usuario registrado, no solamente por comprador.
- Coste de soporte, IA, importaciones y proveedores.
- Cancelaciones, devoluciones y fallos de cobro.
- Motivos de abandono.

Al comparar pruebas de 30 y 60 días, hay que dar tiempo a que ambas terminen y observar renovaciones. Sería incorrecto declarar ganadora a la de 30 días simplemente porque al día 35 la otra todavía no podía convertirse.

Con poco tráfico, empezaría con un piloto acompañado y entrevistas; no presentaría unas cuantas compras como un resultado estadístico definitivo.

**Mi conclusión:** tomaría de YNAB el acompañamiento para crear hábito; de Money Forward, la entrada gratuita con profundidad de pago; de Organizze, la separación entre organización manual y servicios costosos.

Para Gastify, la primera apuesta sería **Gratis útil + Pro de 30 días + precio mexicano validado con pagos reales**. La facturación puede ser una expansión potente, pero no hace falta que sea el argumento que sostenga desde el inicio toda la suscripción.

</details>

### C.4 — Solicitud original de consolidación y top 10 propio

<details>
<summary>Pregunta original completa que dio lugar a esta entrada</summary>

Haz un punto MD de todo lo que hemos investigado, con todos los links que has investigado, todas las empresas que has investigado, todas las fuentes, las direcciones, etcétera, etcétera. Desde que te hice el primer prompt relacionado a esto de investigar, que fue cuando te dije, oye, güey, ¿me puedes ayudar a ver el enrutamiento? O sea, vamos a poner opciones de privacidad de Gastify, según yo ya tiene, desde ese, que empezamos a ver opciones, empezamos a analizar empresas, modelos, todo, todo, absolutamente todo, tanto las preguntas que te he hecho, las respuestas que me has dado, los todos, absolutamente todos los links de investigación, las tablas que me has presentado, los competidores, fuentes de referencia, la planeación y todo eso, déjalo en un punto MD que se llame... Obtención de ingresos Gastify.md. Primero deja reglas de investigación, que se tiene que poner la fecha, el modelo que lo está investigando, y toda la y que tiene que poner fuentes y toda la información. Deja entonces tu entrada, lo que investigaste, absolutamente todo, porque puede ser que en ese mismo este chat GPT después integre otros detalles de la investigación. Entonces, agrégalo. Agrega también lo que es tus recomendaciones, mis dudas, los planes, como hemos visto todo. Y yo creo que la primera fase ahorita sería una sección de investigación. Vamos a determinar 10 empresas. Las que más me importan ahorita es Móviles de Brasil, M-O-B-I-L-L-S, para ver qué tan parecida o no es de Gastify y si realmente podemos aprender algo de su forma de hacer las cosas. Vamos a poner Finerio, que es nuestra referencia más importante en España, y pon las opciones de Inglaterra, Estados Unidos, Canadá y Japón y China, y busca una otra en Latinoamérica, si es que existe, porque creo que también sería muy interesante. Y pues empecemos de una vez. Entonces, ya después de que hagas el punto MD y los siguientes pasos, pon que el primer paso ahorita es justo pues hacer una investigación súper, súper específica de todos estos productos. Probablemente yo tengo que hacerme una cuenta en cada uno de ellos, por lo menos en los gratuitos o en los otros, para ir viendo qué podemos nosotros, por ejemplo, pues copiar directamente o no, o ver o no, o estudiar, analizar, para que tengamos nuestra aplicación también más completa y aumenten las probabilidades de uso. Este prompt ya se lo pasé a Cloud e hizo en la carpeta DMDs.mds obtención de ingresos, Gastify.md y ahí puso su informe de investigación. También en su tabla me dio: 1, Mobile de Brasil; 2, Finerio México; 3, Fintonic España; 4, EMA Reino Unido; 5, Monarch de Estados Unidos; 6 W... no, perdón, YNA B de Estados Unidos; 6 Wave de Canadá; 8 Money Forward Me de Japón; 9, Qianji de China; y 10 Organize de Brasil. Tú me estás dando otras opciones, por ejemplo, yo diría que de México. Tú dame las 10 opciones. La que sí yo te estoy diciendo de México agreguemos Nextic Finance y Bitio de una vez para investigar cómo es que tiene y ver si podemos incorporar alguna de esas cosas a nuestra aplicación. Y tú, por ejemplo, me das otras alternativas para Brasil que suenan muy interesantes. Entonces podríamos... tú dame también tu top 10 separado de lo que me dé, y agrega tu investigación después de la que puso este Cloud en el mismo documento.


</details>

La entrega correspondiente a C4 son las secciones 12–19 y los apéndices C–E de este archivo. No se incorpora una respuesta futura inventada.


---

## Apéndice D — Registro completo de fuentes y URLs recuperadas

- **Fecha de recuperación:** 2026-10-28. **Investigador/modelo:** OpenAI / Codex / gpt-6.1-sol.
- Se recuperaron **595 URLs distintas de los resultados web históricos** de C1–C3. Se añadieron URLs citadas o intentadas directamente, referencias de C4 y nuevas consultas documentales; la tabla contiene **648 direcciones únicas**.
- **Incluye resultados incidentales o no pertinentes**: se guardan para trazabilidad, no para usarlos como soporte. No todas las páginas fueron abiertas, accesibles, verificadas o utilizadas. Un resultado relacionado con otra empresa o con un homónimo puede ser ruido.
- La columna de procedencia distingue la respuesta donde se citó una URL del simple hallazgo en buscador. Una consulta fallida también puede figurar; no se transforma en verificación por estar listada.
- Las secciones de análisis y respuestas originales indican las fuentes que sí sustentan cada afirmación. Las fuentes del informe de Claude siguen conservadas en su sección 7, sin borrarse ni atribuirse a Codex.
- Las URLs se conservan completas en los destinos Markdown; los títulos son metadatos recuperados. Que una URL distinta redirija a la misma página no elimina su rastro.
- Este registro guarda **enlaces y procedencia**, no una reproducción masiva del contenido de terceros ni una garantía de que hoy sigan accesibles.

<details>
<summary>Expandir catálogo completo de 648 URLs — fuentes citadas primero, luego hallazgos y consultas</summary>

| ID | Página / dirección completa en el enlace | Procedencia y estado de evidencia |
|---|---|---|
| S001 | [Conheça nossos preços e assinaturas – Organizze](https://ajuda.organizze.com.br/hc/pt-br/articles/5661263190035-Conhe%C3%A7a-nossos-pre%C3%A7os-e-assinaturas) | Apareció en resultados web recuperados C1–C3; no implica validación; Citada en respuesta final (C3); Referenciada en consolidación C4 |
| S002 | [https://apps.apple.com/cn/app/id1079718756](https://apps.apple.com/cn/app/id1079718756) | Citada en respuesta final (C1) |
| S003 | [https://apps.apple.com/cn/app/id372353614](https://apps.apple.com/cn/app/id372353614) | Citada en respuesta final (C1) |
| S004 | [Design and Evaluation of Personalized Free Trials](https://arxiv.org/abs/2006.13420) | Apareció en resultados web recuperados C1–C3; no implica validación; Citada en respuesta final (C3); Referenciada en consolidación C4 |
| S005 | [Wallet](https://budgetbakers.com/en/products/wallet/) | Citada en respuesta final (C1); Referenciada en consolidación C4 |
| S006 | [https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/legal-grounds-processing-data_en](https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/legal-grounds-processing-data_en) | Citada en respuesta final (C1) |
| S007 | [プレミアム会員のご紹介｜家計簿アプリ くふう Zaim](https://content.zaim.net/premium) | Apareció en resultados web recuperados C1–C3; no implica validación; Citada en respuesta final (C1) |
| S008 | [『マネーフォワード ME』無料会員における金融関連サービス連携上限数変更のお知らせ｜株式会社マネーフォワード](https://corp.moneyforward.com/news/info/20221107-mf-press/) | Apareció en resultados web recuperados C1–C3; no implica validación; Citada en respuesta final (C3) |
| S009 | [『マネーフォワード ME』プレミアムサービスのコースおよび今後のサービス体系について｜株式会社マネーフォワード](https://corp.moneyforward.com/news/info/20230227-mf-press-2/) | Apareció en resultados web recuperados C1–C3; no implica validación; Citada en respuesta final (C3) |
| S010 | [マネーフォワードがオープンβ版](https://corp.moneyforward.com/service/img/20130716press.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación; Citada en respuesta final (C3) |
| S011 | [Money Forward \| User Data Guide](https://corp.moneyforward.com/user_data_guide/statistical-data/) | Apareció en resultados web recuperados C1–C3; no implica validación; Consulta/intentó open; no implica acceso exitoso (C1); Citada en respuesta final (C1) |
| S012 | [Google OpenID Connect API Reference  \|  Authentication  \|  Google for Developers](https://developers.google.com/identity/openid-connect/reference) | Apareció en resultados web recuperados C1–C3; no implica validación; Consulta/intentó open; no implica acceso exitoso (C1); Citada en respuesta final (C1) |
| S013 | [Method: people.get  \|  People API  \|  Google for Developers](https://developers.google.com/people/api/rest/v1/people/get) | Apareció en resultados web recuperados C1–C3; no implica validación; Consulta/intentó open; no implica acceso exitoso (C1); Citada en respuesta final (C1) |
| S014 | [https://developers.google.com/terms/api-services-user-data-policy](https://developers.google.com/terms/api-services-user-data-policy) | Consulta/intentó open; no implica acceso exitoso (C1); Citada en respuesta final (C1) |
| S015 | [Nextik Finance — Tus finanzas personales, claras y bajo control](https://finance.nextik.mx/) | Apareció en resultados web recuperados C1–C3; no implica validación; Citada en respuesta final (C3); Referenciada en consolidación C4 |
| S016 | [Money Forward, Inc. - Interim / Quarterly Report 2026 \| FinancialFilings](https://financialfilings.com/filings/money-forward-inc/interim-quarterly-report/2026/72554346/) | Apareció en resultados web recuperados C1–C3; no implica validación; Consulta/intentó open; no implica acceso exitoso (C2); Consulta/intentó find; no implica acceso exitoso (C2); Citada en respuesta final (C2); Referenciada en consolidación C4 |
| S017 | [Precios: API de Facturación CFDI desde $199 MXN/mes \| Fiscalapi](https://fiscalapi.com/precios) | Apareció en resultados web recuperados C1–C3; no implica validación; Consulta/intentó open; no implica acceso exitoso (C2); Consulta/intentó find; no implica acceso exitoso (C2); Citada en respuesta final (C2) |
| S018 | [Presentation Material for FY11/25 2Q Financial Results](https://fs2.magicalir.net/tdnet/2025/3994/20250714513794.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación; Acción web registrada; acceso por verificar (C3); Citada en respuesta final (C3); Referenciada en consolidación C4 |
| S019 | [https://help.emma-app.com/en/article/how-does-emma-app-make-money-g4ahl7/](https://help.emma-app.com/en/article/how-does-emma-app-make-money-g4ahl7/) | Citada en respuesta final (C1) |
| S020 | [Moneytree Grow Plan Pricing Update \| Help Centre \| Moneytree](https://help.getmoneytree.com/en/articles/12707580-moneytree-grow-plan-pricing-update) | Apareció en resultados web recuperados C1–C3; no implica validación; Citada en respuesta final (C1) |
| S021 | [https://help.rocketmoney.com/en/articles/17141357-bill-negotiations-is-moving-to-premium](https://help.rocketmoney.com/en/articles/17141357-bill-negotiations-is-moving-to-premium) | Citada en respuesta final (C1) |
| S022 | [ICO](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-sharing/anonymisation/introduction-to-anonymisation/) | Citada en respuesta final (C1); Referenciada en consolidación C4 |
| S023 | [H&R Block Reports Fiscal 2026 Results and Enters Fiscal 2027 with Confidence \| H&R Block®](https://investors.hrblock.com/news-releases/news-release-details/hr-block-reports-fiscal-2026-results-and-enters-fiscal-2027) | Apareció en resultados web recuperados C1–C3; no implica validación; Consulta/intentó open; no implica acceso exitoso (C2); Consulta/intentó find; no implica acceso exitoso (C2); Citada en respuesta final (C2); Referenciada en consolidación C4 |
| S024 | [Intuit Reports Fourth Quarter and Full Year Fiscal 2026 Results; Sets Fiscal 2027 Guidance :: Intuit Inc. (INTU)](https://investors.intuit.com/news-events/press-releases/detail/1320/intuit-reports-fourth-quarter-and-full-year-fiscal-2026-results-sets-fiscal-2027-guidance) | Apareció en resultados web recuperados C1–C3; no implica validación; Consulta/intentó open; no implica acceso exitoso (C2); Consulta/intentó find; no implica acceso exitoso (C2); Citada en respuesta final (C2) |
| S025 | [NerdWallet Reports Fourth Quarter and Full Year 2025 Results \| NerdWallet, Inc](https://investors.nerdwallet.com/news-releases/news-release-details/nerdwallet-reports-fourth-quarter-and-full-year-2025-results) | Apareció en resultados web recuperados C1–C3; no implica validación; Consulta/intentó open; no implica acceso exitoso (C2); Consulta/intentó find; no implica acceso exitoso (C2); Citada en respuesta final (C2) |
| S026 | [くふう Zaim \| くふうカンパニー](https://kufu.co.jp/zaim_service/) | Apareció en resultados web recuperados C1–C3; no implica validación; Consulta/intentó open; no implica acceso exitoso (C1); Citada en respuesta final (C1) |
| S027 | [https://moneyforward.com/me/courses](https://moneyforward.com/me/courses) | Citada en respuesta final (C1) |
| S028 | [プレミアムサービスでできること｜マネーフォワード ME](https://moneyforward.com/pages/premium) | Apareció en resultados web recuperados C1–C3; no implica validación; Citada en respuesta final (C3) |
| S029 | [Stripe Billing \| Tarifas](https://stripe.com/mx/billing/pricing) | Apareció en resultados web recuperados C1–C3; no implica validación; Consulta/intentó open; no implica acceso exitoso (C2); Consulta/intentó find; no implica acceso exitoso (C2); Citada en respuesta final (C2) |
| S030 | [Tarifas y comisiones](https://stripe.com/mx/pricing) | Apareció en resultados web recuperados C1–C3; no implica validación; Citada en respuesta final (C2) |
| S031 | [Restricted targeting in Personalized advertising - Advertising Policies Help](https://support.google.com/adspolicy/answer/143465?hl=en) | Apareció en resultados web recuperados C1–C3; no implica validación; Consulta/intentó open; no implica acceso exitoso (C1); Citada en respuesta final (C1) |
| S032 | [User Data - Play Console Help](https://support.google.com/googleplay/android-developer/answer/10144311?hl=en) | Apareció en resultados web recuperados C1–C3; no implica validación; Consulta/intentó open; no implica acceso exitoso (C1); Citada en respuesta final (C1); Referenciada en consolidación C4 |
| S033 | [https://support.me.moneyforward.com/hc/ja/articles/4409828451993](https://support.me.moneyforward.com/hc/ja/articles/4409828451993) | Citada en respuesta final (C1, C3) |
| S034 | [〖重要〗『マネーフォワード ME』プレミアムサービス スタンダードコースの料金改定に関するお知らせ（2025年8月5日 改定） – マネーフォワード MEサポートサイト](https://support.me.moneyforward.com/hc/ja/articles/48081250560409) | Apareció en resultados web recuperados C1–C3; no implica validación; Citada en respuesta final (C3) |
| S035 | [Ayuda de ME sobre Cloud](https://support.me.moneyforward.com/hc/ja/articles/55460846509209) | Citada en respuesta final (C3); Referenciada en consolidación C4 |
| S036 | [Is Wave free? – Help Center](https://support.waveapps.com/hc/en-us/articles/208621296-Is-Wave-free) | Apareció en resultados web recuperados C1–C3; no implica validación; Citada en respuesta final (C2) |
| S037 | [Controle financeiro Organizze lança aplicativo para Android • Tecnoblog](https://tecnoblog.net/arquivo/controle-financeiro-android-organizze/) | Apareció en resultados web recuperados C1–C3; no implica validación; Acción web registrada; acceso por verificar (C3); Citada en respuesta final (C3) |
| S038 | [Nick Grassi - The Business Year](https://thebusinessyear.com/interview/nick-grassi-mexico-2026/) | Apareció en resultados web recuperados C1–C3; no implica validación; Consulta/intentó open; no implica acceso exitoso (C2); Consulta/intentó find; no implica acceso exitoso (C2); Citada en respuesta final (C2); Referenciada en consolidación C4 |
| S039 | [The Story of Toshl Thus Far – Toshl Finance Blog](https://toshl.com/blog/the-story-of-toshl-thus-far/) | Apareció en resultados web recuperados C1–C3; no implica validación; Citada en respuesta final (C3) |
| S040 | [Toshl Finance - Personal finance, budget and expense tracker app](https://toshl.com/pricing/) | Apareció en resultados web recuperados C1–C3; no implica validación; Citada en respuesta final (C1, C3); Referenciada en consolidación C4 |
| S041 | [Precios — Vittio](https://vitt.io/pricing) | Apareció en resultados web recuperados C1–C3; no implica validación; Citada en respuesta final (C3); Referenciada en consolidación C4 |
| S042 | [https://web.archive.org/web/20151231182644/http://www.youneedabudget.com/blog/post/the-new-ynab-is-here](https://web.archive.org/web/20151231182644/http://www.youneedabudget.com/blog/post/the-new-ynab-is-here) | Citada en respuesta final (C3) |
| S043 | [https://web.archive.org/web/20181017033648/https://www.youneedabudget.com/price-change-faqs-2017/](https://web.archive.org/web/20181017033648/https://www.youneedabudget.com/price-change-faqs-2017/) | Citada en respuesta final (C3) |
| S044 | [https://web.archive.org/web/20211101121240/https://www.youneedabudget.com/price-change-2021/](https://web.archive.org/web/20211101121240/https://www.youneedabudget.com/price-change-2021/) | Citada en respuesta final (C3) |
| S045 | [Buró de Crédito \| Buró de Crédito](https://www.burodecredito.com.mx/generales/centro-de-ayuda/ayuda.html) | Apareció en resultados web recuperados C1–C3; no implica validación; Citada en respuesta final (C2) |
| S046 | [Preguntas Frecuentes](https://www.cnbv.gob.mx/SECTORES-SUPERVISADOS/ASESORES_EN_INVERSIONES/Paginas/PreguntasFrecuentes.aspx) | Apareció en resultados web recuperados C1–C3; no implica validación; Citada en respuesta final (C2) |
| S047 | [How does Credit Karma work? \| Intuit Credit Karma](https://www.creditkarma.com/about/howitworks) | Apareció en resultados web recuperados C1–C3; no implica validación; Consulta/intentó open; no implica acceso exitoso (C1, C2); Citada en respuesta final (C1, C2) |
| S048 | [Intuit Credit Karma welcomes all Minters!  - Intuit Credit Karma](https://www.creditkarma.com/about/releases/intuit-credit-karma-welcomes-all-minters) | Apareció en resultados web recuperados C1–C3; no implica validación; Consulta/intentó open; no implica acceso exitoso (C2); Citada en respuesta final (C2) |
| S049 | [“Nuestro viaje ha terminado”: fintech española Fintonic cierra sus operaciones en Chile \| Diario Financiero](https://www.df.cl/mercados/banca-fintech/nuestro-viaje-ha-terminado-fintech-espanola-fintonic-cierra-sus) | Apareció en resultados web recuperados C1–C3; no implica validación; Consulta/intentó open; no implica acceso exitoso (C2); Citada en respuesta final (C2) |
| S050 | [LEY FEDERAL DE PROTECCIÓN DE DATOS PERSONALES EN POSESIÓN DE LOS PARTICULARES](https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación; Consulta/intentó open; no implica acceso exitoso (C1); Citada en respuesta final (C1); Referenciada en consolidación C4 |
| S051 | [Financial Tools \| Empower](https://www.empower.com/tools) | Apareció en resultados web recuperados C1–C3; no implica validación; Citada en respuesta final (C1) |
| S052 | [Finerio Connect \| Open Finance en LATAM](https://www.finerioconnect.com/) | Apareció en resultados web recuperados C1–C3; no implica validación; Citada en respuesta final (C1); Referenciada en consolidación C4 |
| S053 | [¿Es Fintonic estafa? Analizamos la verdad detrás de esta app financiera - Fintonic News](https://www.fintonic.com/blog/es-fintonic-estafa-analizamos-la-verdad-detras-de-esta-app-financiera/) | Apareció en resultados web recuperados C1–C3; no implica validación; Consulta/intentó open; no implica acceso exitoso (C1); Citada en respuesta final (C1); Referenciada en consolidación C4 |
| S054 | [Servicio gratuito de generación de factura electrónica ofrecido por el SAT \| Servicio de Administración Tributaria \| Gobierno \| gob.mx](https://www.gob.mx/sat/acciones-y-programas/servicio-gratuito-de-generacion-de-factura-electronica-ofrecido-por-el-sat) | Apareció en resultados web recuperados C1–C3; no implica validación; Citada en respuesta final (C2) |
| S055 | [REPORTE DE RESULTADOS 7/25](https://www.inegi.org.mx/contenidos/saladeprensa/boletines/2025/enif/ENIF2024_RR.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación; Consulta/intentó open; no implica acceso exitoso (C2); Consulta/intentó find; no implica acceso exitoso (C2); Citada en respuesta final (C2) |
| S056 | [Mint shutting down; How to migrate to Monarch (with discount!) \| Monarch](https://www.linkedin.com/posts/monarch-money_mint-shutting-down-how-to-migrate-to-monarch-activity-7128885843364089856-RyNh) | Apareció en resultados web recuperados C1–C3; no implica validación; Citada en respuesta final (C3) |
| S057 | [Mobills Premium](https://www.mobills.com.br/pricing/) | Apareció en resultados web recuperados C1–C3; no implica validación; Consulta/intentó open; no implica acceso exitoso (C1); Citada en respuesta final (C1); Referenciada en consolidación C4 |
| S058 | [Introducing Monarch Plus \| Monarch](https://www.monarch.com/blog/monarch-plus) | Apareció en resultados web recuperados C1–C3; no implica validación; Citada en respuesta final (C3) |
| S059 | [Monarch hits $100M in ARR and welcomes the team behind HMBradley \| Monarch](https://www.monarch.com/blog/welcoming-MBI) | Apareció en resultados web recuperados C1–C3; no implica validación; Consulta/intentó open; no implica acceso exitoso (C2, C3); Consulta/intentó find; no implica acceso exitoso (C2, C3); Citada en respuesta final (C2, C3); Acción web registrada; acceso por verificar (C2, C3); Referenciada en consolidación C4 |
| S060 | [Monarch Pricing: Personal Finance App Plans \| Monarch](https://www.monarch.com/pricing) | Apareció en resultados web recuperados C1–C3; no implica validación; Citada en respuesta final (C1, C2, C3) |
| S061 | [https://www.oag.ca.gov/privacy/ccpa](https://www.oag.ca.gov/privacy/ccpa) | Citada en respuesta final (C1) |
| S062 | [Planos e Preços \| Organizze: Controle as suas finanças pessoais](https://www.organizze.com.br/planos/) | Apareció en resultados web recuperados C1–C3; no implica validación; Citada en respuesta final (C1, C3); Acción web registrada; acceso por verificar (C1, C3); Referenciada en consolidación C4 |
| S063 | [Quem Somos \| Organizze: Controle as suas finanças pessoais](https://www.organizze.com.br/quem-somos/) | Apareció en resultados web recuperados C1–C3; no implica validación; Citada en respuesta final (C3) |
| S064 | [State of Subscription Apps 2026 – RevenueCat](https://www.revenuecat.com/state-of-subscription-apps) | Apareció en resultados web recuperados C1–C3; no implica validación; Citada en respuesta final (C3); Referenciada en consolidación C4 |
| S065 | [https://www.rocketmoney.com/learn/personal-finance/how-much-does-rocket-money-cost](https://www.rocketmoney.com/learn/personal-finance/how-much-does-rocket-money-cost) | Citada en respuesta final (C1) |
| S066 | [rkt-20251231](https://www.sec.gov/Archives/edgar/data/1805284/000162828026013283/rkt-20251231.htm) | Apareció en resultados web recuperados C1–C3; no implica validación; Consulta/intentó open; no implica acceso exitoso (C2); Consulta/intentó find; no implica acceso exitoso (C2); Citada en respuesta final (C2); Referenciada en consolidación C4 |
| S067 | [Wave Pro Plan - Wave Financial](https://www.waveapps.com/pro) | Apareció en resultados web recuperados C1–C3; no implica validación; Citada en respuesta final (C2) |
| S068 | [Timeline \| YNAB](https://www.ynab.com/about/timeline) | Apareció en resultados web recuperados C1–C3; no implica validación; Acción web registrada; acceso por verificar (C3); Citada en respuesta final (C3) |
| S069 | [Pricing \| YNAB](https://www.ynab.com/pricing) | Apareció en resultados web recuperados C1–C3; no implica validación; Consulta/intentó open; no implica acceso exitoso (C1, C2, C3); Citada en respuesta final (C1, C2, C3) |
| S070 | [家計簿アプリ くふう Zaim：簡単・無料でできるお金の管理](https://zaim.net/) | Apareció en resultados web recuperados C1–C3; no implica validación; Consulta/intentó open; no implica acceso exitoso (C1); Citada en respuesta final (C1) |
| S071 | [Hard Questions: What Information Do Facebook Advertisers Know About Me?](https://about.fb.com/news/2018/04/data-and-advertising/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S072 | [Hard Questions: What Data Does Facebook Collect When I'm Not Using Facebook, and Why?](https://about.fb.com/news/2018/04/data-off-facebook/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S073 | [Here's What You Need to Know About Our Updated Privacy Policy and Terms of Service](https://about.fb.com/news/2022/05/metas-updated-privacy-policy/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S074 | [Building and Innovating With Privacy in Mind](https://about.fb.com/news/2023/01/building-and-innovating-with-privacy-in-mind/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S075 | [Introducing Facebook Verified](https://about.fb.com/news/2026/07/introducing-facebook-verified/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S076 | [Data and Privacy News \| Page 2 of 28 \| Meta Newsroom](https://about.fb.com/news/category/data-and-privacy/page/2/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S077 | [Part 5 – Protecting privacy is important for our business, and we support effective privacy regulation](https://about.fb.com/wp-content/uploads/2019/03/facebook-submission-in-response-to-accc-preliminary-report.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S078 | [State of Paywalls 2026: Paywall Benchmarks \| Adapty](https://adapty.io/state-of-paywalls/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S079 | [Credit Score App White Paper](https://advocacy.consumerreports.org/wp-content/uploads/2021/09/Credit-Score-App-White-Paper-2.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S080 | [Web - Formas de pagamento – Organizze](https://ajuda.organizze.com.br/hc/pt-br/articles/5661276183699-Web-Formas-de-pagamento) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S081 | [O que é o Organizze? – Organizze](https://ajuda.organizze.com.br/hc/pt-br/articles/6105543338771-O-que-%C3%A9-o-Organizze) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S082 | [OkCredit company profile: firmographics, business model, customers, competitors \| akta.pro](https://akta.pro/company-profiles/0003opo/okcredit) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S083 | [Software Contable para pymes y contadores en México](https://alegra.com/mexico/contabilidad/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S084 | [Precios de Alegra México: planes para contadores y pymes](https://alegra.com/mexico/precios/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S085 | [YNAB in 2026: Pricing, Plans and Alternatives \| AndroidExperto](https://androidexperto.com/apps/ynab/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S086 | [API REST Facturación Electrónica CFDI 4.0 y recibos de nómina](https://api.facturama.mx/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S087 | [API REST Facturación Electrónica CFDI 4.0 y recibos de nómina](https://api.facturama.mx/costos) | Apareció en resultados web recuperados C1–C3; no implica validación; Consulta/intentó open; no implica acceso exitoso (C2) |
| S088 | [Productos API Buró de Crédito](https://apif.burodecredito.com.mx/pages/bc/home.html) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S089 | [Nuestras APIs \| Productos API Buró de Crédito](https://apif.burodecredito.com.mx/pages/bc/nuestras-apis.html) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S090 | [鲨鱼记账-3秒钟快速记账手机助手 \| AppFollow \| App’s reputation platform](https://apps.appfollow.io/ios/%E9%B2%A8%E9%B1%BC%E8%AE%B0%E8%B4%A6%E6%9C%AC%E5%9F%8E%E5%B8%82%E7%90%86%E8%B4%A2%E5%9C%88%E5%AD%90%E5%BF%85%E5%A4%87%E5%B7%A5%E5%85%B7%E8%BD%AF%E4%BB%B6/1079718756?country=tr) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S091 | [‎随口记 - 本地 AI 语音笔记 App - App Store](https://apps.apple.com/cn/app/%E9%9A%8F%E5%8F%A3%E8%AE%B0-%E6%9C%AC%E5%9C%B0-ai-%E8%AF%AD%E9%9F%B3%E7%AC%94%E8%AE%B0/id6813771700) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S092 | [‎随心记 -生活备忘录，极简日记本，以时间轴的方式记录生活日常 App - App Store](https://apps.apple.com/cn/app/%E9%9A%8F%E5%BF%83%E8%AE%B0-%E7%94%9F%E6%B4%BB%E5%A4%87%E5%BF%98%E5%BD%95-%E6%9E%81%E7%AE%80%E6%97%A5%E8%AE%B0%E6%9C%AC-%E4%BB%A5%E6%97%B6%E9%97%B4%E8%BD%B4%E7%9A%84%E6%96%B9%E5%BC%8F%E8%AE%B0%E5%BD%95%E7%94%9F%E6%B4%BB%E6%97%A5%E5%B8%B8/id6458586163?platform=mac) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S093 | [‎随心记 -生活备忘录，极简日记本，以时间轴的方式记录生活日常 App - App Store](https://apps.apple.com/cn/app/%E9%9A%8F%E5%BF%83%E8%AE%B0-%E7%94%9F%E6%B4%BB%E5%A4%87%E5%BF%98%E5%BD%95-%E6%9E%81%E7%AE%80%E6%97%A5%E8%AE%B0%E6%9C%AC-%E4%BB%A5%E6%97%B6%E9%97%B4%E8%BD%B4%E7%9A%84%E6%96%B9%E5%BC%8F%E8%AE%B0%E5%BD%95%E7%94%9F%E6%B4%BB%E6%97%A5%E5%B8%B8/id6458586163?platform=watch) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S094 | [‎随手写笔记 App - App Store](https://apps.apple.com/cn/app/%E9%9A%8F%E6%89%8B%E5%86%99%E7%AC%94%E8%AE%B0/id6751489346) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S095 | [‎随手笔记软件 App - App Store](https://apps.apple.com/cn/app/%E9%9A%8F%E6%89%8B%E7%AC%94%E8%AE%B0%E8%BD%AF%E4%BB%B6/id6502567368) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S096 | [‎随手记-快捷自动记账 App - App Store](https://apps.apple.com/cn/app/%E9%9A%8F%E6%89%8B%E8%AE%B0-%E5%BF%AB%E6%8D%B7%E8%87%AA%E5%8A%A8%E8%AE%B0%E8%B4%A6/id372353614) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S097 | [‎随手记-快捷自动记账 App - App Store](https://apps.apple.com/cn/app/%E9%9A%8F%E6%89%8B%E8%AE%B0-%E5%BF%AB%E6%8D%B7%E8%87%AA%E5%8A%A8%E8%AE%B0%E8%B4%A6/id372353614?platform=mac) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S098 | [‎随手记Pro–个人家庭生意记账 App - App Store](https://apps.apple.com/cn/app/%E9%9A%8F%E6%89%8B%E8%AE%B0pro-%E4%B8%AA%E4%BA%BA%E5%AE%B6%E5%BA%AD%E7%94%9F%E6%84%8F%E8%AE%B0%E8%B4%A6/id373454750) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S099 | [‎随手记Pro–个人家庭生意记账 App - App Store](https://apps.apple.com/cn/app/%E9%9A%8F%E6%89%8B%E8%AE%B0pro-%E4%B8%AA%E4%BA%BA%E5%AE%B6%E5%BA%AD%E7%94%9F%E6%84%8F%E8%AE%B0%E8%B4%A6/id373454750?platform=ipad) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S100 | [‎随手记Pro–个人家庭生意记账 App - App Store](https://apps.apple.com/cn/app/%E9%9A%8F%E6%89%8B%E8%AE%B0pro-%E4%B8%AA%E4%BA%BA%E5%AE%B6%E5%BA%AD%E7%94%9F%E6%84%8F%E8%AE%B0%E8%B4%A6/id373454750?platform=mac) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S101 | [‎随身小记-你的随身AI记事本 App - App Store](https://apps.apple.com/cn/app/%E9%9A%8F%E8%BA%AB%E5%B0%8F%E8%AE%B0-%E4%BD%A0%E7%9A%84%E9%9A%8F%E8%BA%ABai%E8%AE%B0%E4%BA%8B%E6%9C%AC/id6753668059) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S102 | [‎鲨鱼记账-快速记账&语音记账&拍照记账&随手记&快捷记账 App - App Store](https://apps.apple.com/cn/app/%E9%B2%A8%E9%B1%BC%E8%AE%B0%E8%B4%A6-%E5%BF%AB%E9%80%9F%E8%AE%B0%E8%B4%A6-%E8%AF%AD%E9%9F%B3%E8%AE%B0%E8%B4%A6-%E6%8B%8D%E7%85%A7%E8%AE%B0%E8%B4%A6-%E9%9A%8F%E6%89%8B%E8%AE%B0-%E5%BF%AB%E6%8D%B7%E8%AE%B0%E8%B4%A6/id6813754561?platform=ipad) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S103 | [‎鲨鱼记账-3秒钟快速记账手机助手 App - App Store](https://apps.apple.com/cn/app/%E9%B2%A8%E9%B1%BC%E8%AE%B0%E8%B4%A6-3%E7%A7%92%E9%92%9F%E5%BF%AB%E9%80%9F%E8%AE%B0%E8%B4%A6%E6%89%8B%E6%9C%BA%E5%8A%A9%E6%89%8B/id1079718756?platform=ipad) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S104 | [‎鲨鱼记账-3秒钟快速记账手机助手 - 你可能还喜欢 - App Store](https://apps.apple.com/cn/app/%E9%B2%A8%E9%B1%BC%E8%AE%B0%E8%B4%A6-3%E7%A7%92%E9%92%9F%E5%BF%AB%E9%80%9F%E8%AE%B0%E8%B4%A6%E6%89%8B%E6%9C%BA%E5%8A%A9%E6%89%8B/id1079718756?platform=iphone&see-all=customers-also-bought-apps) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S105 | [‎鲨鱼记账Pro-3秒钟快速记账 App - App Store](https://apps.apple.com/cn/app/%E9%B2%A8%E9%B1%BC%E8%AE%B0%E8%B4%A6pro-3%E7%A7%92%E9%92%9F%E5%BF%AB%E9%80%9F%E8%AE%B0%E8%B4%A6/id1163515895) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S106 | [‎鲨鱼记账本-城市理财圈子必备工具软件 App - App Store](https://apps.apple.com/us/app/%E9%B2%A8%E9%B1%BC%E8%AE%B0%E8%B4%A6%E6%9C%AC-%E5%9F%8E%E5%B8%82%E7%90%86%E8%B4%A2%E5%9C%88%E5%AD%90%E5%BF%85%E5%A4%87%E5%B7%A5%E5%85%B7%E8%BD%AF%E4%BB%B6/id1079718756) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S107 | [‎鲨鱼记账本-城市理财圈子必备工具软件 App - App Store](https://apps.apple.com/us/app/%E9%B2%A8%E9%B1%BC%E8%AE%B0%E8%B4%A6%E6%9C%AC-%E5%9F%8E%E5%B8%82%E7%90%86%E8%B4%A2%E5%9C%88%E5%AD%90%E5%BF%85%E5%A4%87%E5%B7%A5%E5%85%B7%E8%BD%AF%E4%BB%B6/id1079718756?platform=ipad) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S108 | [‎鲨鱼记账本-城市理财圈子必备工具软件 App - App Store](https://apps.apple.com/us/app/%E9%B2%A8%E9%B1%BC%E8%AE%B0%E8%B4%A6%E6%9C%AC-%E5%9F%8E%E5%B8%82%E7%90%86%E8%B4%A2%E5%9C%88%E5%AD%90%E5%BF%85%E5%A4%87%E5%B7%A5%E5%85%B7%E8%BD%AF%E4%BB%B6/id1079718756?platform=watch) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S109 | [How to cancel Monarch subscription](https://appshunter.io/ios/app/monarch-budget-and-track-money/id1459319842/how-to-cancel-subscription) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S110 | [Organizze Budget Planner Reviews \| Read user reviews of Organizze Budget Planner](https://appshunter.io/ios/app/organizze-budget-planner/id677699286/reviews) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S111 | [Trial Length, Pricing, and Rationally Inattentive Customers](https://arxiv.org/abs/2507.06422) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S112 | [Fintonic México: ya no opera + mejores alternativas (2026)](https://asesoresinversion.com/academia/finanzas-personales/fintonic-el-app-para-controlar-gastos/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S113 | [Mejores apps de finanzas personales en México (2026) \| Asistente RD](https://asistente-rd.com/blog/mejores-apps-finanzas-mexico/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S114 | [Trial Conversion Rate: 2026 Benchmarks by Trial Length](https://asoitis.com/glossary/trial-conversion-rate) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S115 | [Responsible Lending as a LSP](https://assets.khatabook.com/kb-responsible-lending/khatabook-responsible-lending.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S116 | [Yodlee Transaction Data Enrichment by Yodlee — Service Research \| aVenture](https://aventure.vc/companies/yodlee-redwood-city-ca-us/products-services/yodlee-transaction-data-enrichment) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S117 | [Monarch Buys MBI, the Team Behind HMBradley, as It Pushes](https://bankgenx.com/monarch-buys-mbi-the-team-behind-hmbradley-as-it-pushes-from/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S118 | [Alternativa a Fintonic Finanzas Personales \| Banktrack Blog](https://banktrack.com/blog/fintonic-banktrack-cual-es-el-mejor-para-tus-finanzas-personales) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S119 | [UNIVERSIDADE DE BRASÍLIA](https://bdm.unb.br/bitstream/10483/29413/1/2019_WexssandreAthaydeGoncalves_tcc.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S120 | [Novidades no Plano Free \| NectarCRM](https://blog.nectarcrm.com.br/novidades-no-plano-free/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S121 | [O que há de novo - Tratativa Blog](https://blog.tratativa.com.br/o-que-ha-de-novo/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S122 | [Baixe Organizze: Controle Financeiro - Appxis](https://br.appxis.com/app/organizze-controle-financeiro.html) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S123 | [Khatabook — Digital ledger for India's small businesses](https://businessideas.live/startups/khatabook) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S124 | [Mês Do Consumidor](https://campanhas.organizze.com.br/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S125 | [Controle seus gastos com o app Organizze - Canaltech](https://canaltech.com.br/apps/como-controlar-seus-gastos-com-o-app-organizze/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S126 | [Monarch Money Price Oct 2026: $14.99/Mo or $99.99/Yr & How to Cancel](https://cancelcost.com/monarch-money-cancel/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S127 | [Lançada nova versão do Mapa das Organizações da Sociedade Civil – ABCR – Associação Brasileira de Captadores de Recursos](https://captadores.org.br/noticias/gerais/lancada-nova-versao-do-mapa-das-organizacoes-da-sociedade-civil/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S128 | [株式会社マネーフォワードの決算公告・子会社・関連会社情報 \| 官報決算データベース](https://catr.jp/companies/b66fe/47854) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S129 | [PlanoActividades_Miolo_Ultimo.cdr](https://cdn.edm.co.mz/website/imprensa/Plano-de-Actividades-e-Orcamento-2022.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S130 | [https://cdn.financialreports.eu/financialreports/media/filings/14049/2026/RNS/14049_rns_2026-10-15_22f7041b-77b7-47f1-a21c-ed118f460ab9.pdf](https://cdn.financialreports.eu/financialreports/media/filings/14049/2026/RNS/14049_rns_2026-10-15_22f7041b-77b7-47f1-a21c-ed118f460ab9.pdf) | Consulta/intentó find; no implica acceso exitoso (C2); Consulta/intentó open; no implica acceso exitoso (C2) |
| S131 | [--------------------------------------------------------------------------------](https://cg.sc.gov/sites/cg/files/Documents/Fiscal%20Transparency/Monthly%20Charge%20Card%20Usage/2024/CCU-September2024.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S132 | [--------------------------------------------------------------------------------](https://checkout.mobills.com.br/subscription) | Apareció en resultados web recuperados C1–C3; no implica validación; Resultado de consulta documental C4-2; verificar ficha; Referenciada en consolidación C4 |
| S133 | [people/v1/people-gen.go - google-api-go-client - Git at Google](https://code.googlesource.com/google-api-go-client/%2B/refs/heads/master/people/v1/people-gen.go) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S134 | [Colaboralia — Marcas y creadores, ganando juntos](https://colaboralia.com/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S135 | [Legal grounds for processing data](https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/legal-grounds-processing-data_en?prefLang=de) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S136 | [Information for individuals - European Commission](https://commission.europa.eu/law/law-topic/data-protection/information-individuals_en) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S137 | [株式会社マネーフォワード（東京都） (3994 東証プライム)の会社概要・売上・役員 \| Compalyze](https://compalyze.co.jp/company/6011101063359) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S138 | [法人向けの利用はできますか:よくある質問｜家計簿アプリ くふう Zaim](https://content.zaim.net/questions/show/101) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S139 | [Fintech Finerio untangles open banking in Mexico](https://contxto.com/en/mexico/fintech-finerio-open-banking-mexico/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S140 | [Zaveapp, the virtual piggy bank encouraging users to save money](https://contxto.com/en/mexico/zaveapp-the-virtual-piggy-bank-supporting-users-to-save-money/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S141 | [Zaveapp, la alcancía digital que alienta a los usuarios a ahorrar dinero \| Contxto](https://contxto.com/es/mexico-es/zaveapp-la-alcancia-digital-que-alienta-a-los-usuarios-a-ahorrar-dinero/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S142 | [La fintech, Finerio, ayuda a descifrar la banca abierta en México](https://contxto.com/es/noticias/fintech-finerio-banca-abierta-mexico/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S143 | [Money Forward Benefits](https://corp.moneyforward.com/assets/en/sustainability/pdf/MoneyForwardBenefits.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S144 | [https://corp.moneyforward.com/en/ir/](https://corp.moneyforward.com/en/ir/) | Consulta/intentó open; no implica acceso exitoso (C2) |
| S145 | [IR Calendar｜Money Forward, Inc.](https://corp.moneyforward.com/en/news/investorrelations/calendar/) | Apareció en resultados web recuperados C1–C3; no implica validación; Consulta/intentó open; no implica acceso exitoso (C2) |
| S146 | [IR Library｜Money Forward, Inc.](https://corp.moneyforward.com/en/news/investorrelations/library/) | Apareció en resultados web recuperados C1–C3; no implica validación; Consulta/intentó open; no implica acceso exitoso (C2); Consulta/intentó find; no implica acceso exitoso (C2) |
| S147 | [プレミアムサービスをご利用のお客様へ｜株式会社マネーフォワード](https://corp.moneyforward.com/news/info/3188-mf/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S148 | [プレスリリース｜株式会社マネーフォワード](https://corp.moneyforward.com/news/release/page/2/?category=release&y=2013) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S149 | [マネーフォワード、確定申告ソフトのチャットサポート開始 ～確定申告受付最終日3月17日まで、チャットでのお問い合わせを受付～｜株式会社マネーフォワード](https://corp.moneyforward.com/news/release/service/2434-mf/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S150 | [iPhone向けアプリ「マネーフォワード」正式リリース！｜株式会社マネーフォワード](https://corp.moneyforward.com/news/release/service/324-mf/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S151 | [株式会社クラウドワークスと提携](https://corp.moneyforward.com/service/img/20140203press.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S152 | [各位](https://corp.moneyforward.com/service/img/20140513press1.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S153 | [Money Forward](https://corp.moneyforward.com/service/img/20141204press01.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S154 | [各位](https://corp.moneyforward.com/service/img/2015/20150529press.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S155 | [Money Forward](https://corp.moneyforward.com/service/img/20150410press.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S156 | [Money Forward \| User Data Guide](https://corp.moneyforward.com/user_data_guide/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S157 | [Money Forward \| User Data Guide](https://corp.moneyforward.com/user_data_guide/personal-data/definition/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S158 | [Money Forward \| User Data Guide](https://corp.moneyforward.com/user_data_guide/personal-data/purpose/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S159 | [Money Forward](https://corp.moneyforward.com/wp-content/uploads/2015/07/20150723press.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S160 | [Transparencia: cómo gana dinero Coupondroid Chile](https://coupondroid.cl/corp/afiliacion) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S161 | [WaveApps Review: What the Free Plan Covers, What Pro Adds](https://cpaadvisor.us/articles/waveapps-review/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S162 | [CCPA - Effective January 1, 2026](https://cppa.ca.gov/regulations/pdf/ccpa_statute_eff_20260101.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S163 | [Q1 2026 Update](https://csv-storage.forexpros.com/slides/d4969f22f2de5946ebc008d0217b4f5fbe099f6847fa62f9f335acef3113608f.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S164 | [Scan Receipts with Wave - iOS & Android](https://d1wh1qqqu6lwfi.cloudfront.net/receipts) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S165 | [議会だよりの作成、発送に係る政務活動費の面積按分率Ⓐ 34.8 + 39.25 + 18.5 + 2](https://db.pref.tottori.jp/Pref_Seimu_R04.nsf/ba85c3de4cb25d2249258392001950ed/234544bb1a1628f2492588e60081d865/%24FILE/R4_03%E9%A0%98%E5%8F%8E%E6%9B%B8%E7%AD%89_26%E5%AE%89%E7%94%B0%E8%AD%B0%E5%93%A1.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S166 | [Monarch hits $100M ARR, buys HMBradley team in first acquisition \| Dealroom News](https://dealroom.co/news/158324-monarch-hits-100m-arr-buys-hmbradley-team-in-first-acquisition/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S167 | [App Review Guidelines - Apple Developer](https://developer.apple.com/app-store/review/guidelines/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S168 | [https://developer.apple.com/app-store/review/guidelines/#data-use-and-sharing](https://developer.apple.com/app-store/review/guidelines/#data-use-and-sharing) | Consulta/intentó open; no implica acceso exitoso (C1) |
| S169 | [Insights \| Data Model \| Yodlee Developer Portal](https://developer.yodlee.com/products/yodlee/insights/docs/data-model) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S170 | [FAQ \| General FAQ \| Yodlee Developer Portal](https://developer.yodlee.com/resources/yodlee/faqs/docs/faq_to_general) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S171 | [FAQ \| Transaction Data Enrichment (TDE) \| Yodlee Developer Portal](https://developer.yodlee.com/resources/yodlee/faqs/docs/TDE) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S172 | [Transaction Data Enrichment \| Overview \| Yodlee Developer Portal](https://developer.yodlee.com/resources/yodlee/transaction-data-enrichment/docs/overview) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S173 | [https://developers.facebook.com/docs/development/release/business-verification/](https://developers.facebook.com/docs/development/release/business-verification/) | Consulta/intentó open; no implica acceso exitoso (C1) |
| S174 | [https://developers.facebook.com/docs/facebook-login/overview/](https://developers.facebook.com/docs/facebook-login/overview/) | Consulta/intentó open; no implica acceso exitoso (C1) |
| S175 | [OAuth 2.0 Scopes for Google APIs  \|  Google for Developers](https://developers.google.cn/identity/protocols/oauth2/scopes?hl=en) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S176 | [User profile information  \|  Google Health API  \|  Google for Developers](https://developers.google.com/health/profile) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S177 | [User profile information  \|  Google Health API  \|  Google for Developers](https://developers.google.com/health/profile?hl=en) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S178 | [OpenID Connect  \|  Sign in with Google  \|  Google for Developers](https://developers.google.com/identity/openid-connect/openid-connect) | Apareció en resultados web recuperados C1–C3; no implica validación; Consulta/intentó open; no implica acceso exitoso (C1) |
| S179 | [OAuth 2.0 Scopes for Google APIs  \|  Google for Developers](https://developers.google.com/identity/protocols/oauth2/scopes) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S180 | [OAuth 2.0 Scopes for Google APIs  \|  Google for Developers](https://developers.google.com/identity/protocols/oauth2/scopes?authuser=3) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S181 | [Method: people.get  \|  People API  \|  Google for Developers](https://developers.google.com/people/api/rest/v1/people/get?authuser=0000) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S182 | [Google API Services User Data Policy  \|  Google for Developers](https://developers.google.com/terms/api-services-user-data-policy?recordId=finding-the-hellhound-2756cbc0-85b1-11ef-a77e-a78f08c49890) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S183 | [Google API Services User Data Policy  \|  Google for Developers](https://developers.google.com/terms/api-services-user-data-policy?recordId=finding-the-hellhound-516cb840-8960-11ef-920e-c589cb7d6dc7) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S184 | [Google Workspace user data and developer policy  \|  Google for Developers](https://developers.google.com/workspace/workspace-api-user-data-developer-policy) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S185 | [©Copyright 2021](https://digital.lib.washington.edu/bitstreams/503a8630-1c4c-40de-94f5-1777352d856e/download) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S186 | [株式会社マネーフォワード 2025年11月期決算短信〔日本基準〕(連結) 2026年1月14日発表 \| 開示情報データベース](https://disclosure.catr.jp/companies/b66fe/47854/tdnet/48ffc/720116) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S187 | [株式会社マネーフォワード 決算短信詳細 \| 開示情報データベース](https://disclosure.catr.jp/companies/b66fe/47854/tdnet/cff04/26934) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S188 | [株式会社マネーフォワード 2026年11月期第3四半期決算短信〔日本基準〕(連結) 2026年10月15日発表 \| 開示情報データベース](https://disclosure.catr.jp/companies/b66fe/47854/tdnet/deed1/787459) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S189 | [EDINET (E30005)](https://disclosure2dl.edinet-fsa.go.jp/searchdocument/pdf/S100BDYX.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S190 | [GESTIÓN FINANCIERA PARA USUARIOS ESPECÍFICOS](https://diseno.uc.cl/memorias/pdf/memoria_dno_uc_2023_2_VALLEJOS_BURGOS_G.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S191 | [主な画面](https://docs.link.getmoneytree.com/v2025-09-01/docs/link-sdk-main-screens) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S192 | [常见问题 · 钱迹用户指南](https://docs.qianjiapp.com/faq.html) | Resultado de consulta documental C4-1; verificar ficha; Resultado de consulta documental C4-3; verificar ficha; Referenciada en consolidación C4 |
| S193 | [主界面 · 钱迹用户指南](https://docs.qianjiapp.com/home/index.html) | Resultado de consulta documental C4-1; verificar ficha |
| S194 | [Moneytree LINK connector](https://documentation.blueprism.com/workhq/en-us/connectors/connector-moneytree-link.htm?TocPath=Connectors%7CConnectors%7C_____51) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S195 | [リモートワーク　ｓａａｓの転職・求人・中途採用情報〖doda（デューダ）〗 - 108ページ](https://doda.jp/keyword/%E3%83%AA%E3%83%A2%E3%83%BC%E3%83%88%E3%83%AF%E3%83%BC%E3%82%AF%E3%80%80%EF%BD%93%EF%BD%81%EF%BD%81%EF%BD%93/108/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S196 | [SG_260115](https://dof.gob.mx/SG/SG_260115.html) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S197 | [株式会社マネーフォワード - 連結経営指標等(2025年11月期) 有価証券報告書 レポート抜粋 (健全！どんぶり会計β版)](https://donburi.accountant/report/?cname=%E6%A0%AA%E5%BC%8F%E4%BC%9A%E7%A4%BE%E3%83%9E%E3%83%8D%E3%83%BC%E3%83%95%E3%82%A9%E3%83%AF%E3%83%BC%E3%83%89&es=71273) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S198 | [Best Budgeting Apps 2024 \| TIME Stamped](https://dorizinn.com/wp-content/uploads/2024/12/Best-Budgeting-Apps-2024-TIME-Stamped.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S199 | [Mint Alternatives: 8 Best Replacements for the Budgeting App \| TIME Stamped](https://dorizinn.com/wp-content/uploads/2024/12/Mint-Alternatives-8-Best-Replacements-for-the-Budgeting-App-TIME-Stamped.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S200 | [Money Forward, Inc. (3994) Financial Statements — EDINET Financials API](https://edinet-api-base.pages.dev/companies/3994/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S201 | [Earnings Calendar for Japanese Listed Companies — Schedule by Industry \| EDINET DB](https://edinetdb.com/calendar?from=2026-10-15&order=desc&sort=marketCap&to=2026-11-14) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S202 | [株式会社マネーフォワード 決算説明資料 — EDINET DB](https://edinetdb.jp/company/E33390/presentations/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S203 | [di](https://editorial.iaen.edu.ec/wp-content/uploads/sites/12/2023/06/Finanzas-e%CC%81ticas-y-solidarias-en-Ame%CC%81rica-Latina-diagno%CC%81sticos-debates-y-propuestas-25-de-mayo.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S204 | [Compare Emma Plans: Budgeting, Saving & More in One App](https://emma-app.com/plans/compare-emma-plans) | Resultado de consulta documental C4-1; verificar ficha; Resultado de consulta documental C4-3; verificar ficha; Referenciada en consolidación C4 |
| S205 | [YNAB](https://en.wikipedia.org/wiki/YNAB) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S206 | [株式会](https://equity.jiji.com/storage/tdnet/140120250408510433.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S207 | [自社利用でも金融データの取得は可能ですか？](https://faq.getmoneytree.com/internal-use) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S208 | [Organizze - suas finanças na palma da mão](https://financas.organizze.com.br/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S209 | [Presentation Material for FY1126 1Q Financial Results](https://finance-frontend-pc-dist.west.edge.storage-yahoo.jp/disclosure/20260414/20260414503964.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S210 | [マネーフォワード(3994) 東証プライム 決算 \| マーケット情報 \| 松井証券](https://finance.matsui.co.jp/stock/3994/settlement/index) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S211 | [(株)マネーフォワード〖3994〗：適時開示情報 - Yahoo!ファイナンス](https://finance.yahoo.co.jp/quote/3994.T/disclosure) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S212 | [(株)マネーフォワード〖3994〗：決算情報 - Yahoo!ファイナンス](https://finance.yahoo.co.jp/quote/3994.T/financials) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S213 | [(株)マネーフォワード〖3994〗：決算説明会書き起こし - Yahoo!ファイナンス](https://finance.yahoo.co.jp/quote/3994.T/financials?styl=presentation) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S214 | [(株)マネーフォワード〖3994〗：業績・財務・キャッシュフロー(通期・四半期)・アナリスト予想- Yahoo!ファイナンス](https://finance.yahoo.co.jp/quote/3994.T/performance) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S215 | [(株)マネーフォワード〖MNFYY〗：業績・決算（通期・四半期） - Yahoo!ファイナンス](https://finance.yahoo.co.jp/quote/MNFYY/performance) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S216 | [Best YNAB Alternatives in 2026: Every Price Checked](https://financewithoutfluff.com/blog/best-ynab-alternatives) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S217 | [Money Forward, Inc. - Annual Report 2025 \| FinancialFilings](https://financialfilings.com/filings/money-forward-inc/annual-report/2026/57438411/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S218 | [Money Forward, Inc. - Earnings Release 2026 \| FinancialFilings](https://financialfilings.com/filings/money-forward-inc/earnings-release/2026/72561271/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S219 | [Money Forward, Inc. - Interim / Quarterly Report 2023 \| FinancialFilings](https://financialfilings.com/filings/money-forward-inc/interim-quarterly-report/2023/7542430/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S220 | [¿Qué es Fintonic en México? - Información para 2026](https://finmart.mx/prestamos/producto/fintonic/fintonic-prestamos/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S221 | [FinZenio — Tu dinero, tus reglas](https://finzenio.app/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S222 | [Monarch \| LinkedIn](https://fr.linkedin.com/company/monarch-money) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S223 | [YNAB Pricing 2026: $14.99/mo, $109/yr — and What It Really Costs in the EU](https://freenance.io/products/ynab-pricing-2026/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S224 | [YNAB Pricing 2026: $109/yr and Every Price Increase Since $60](https://fundkeep.app/ynab-pricing) | Apareció en resultados web recuperados C1–C3; no implica validación; Acción web registrada; acceso por verificar (C3) |
| S225 | [ホーム｜マネーツリー](https://getmoneytree.com/) | Apareció en resultados web recuperados C1–C3; no implica validación; Consulta/intentó open; no implica acceso exitoso (C1) |
| S226 | [La vida después de Mint — Tidy Cents](https://gettidycents.com/es/blog/budgeting-apps-after-mint) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S227 | [La vie après Mint : ce que coûtent les applis — Tidy Cents](https://gettidycents.com/fr/blog/budgeting-apps-after-mint) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S228 | [facebook-ios-sdk/FBSDKCoreKit/FBSDKCoreKit/Profile.swift at main · facebook/facebook-ios-sdk · GitHub](https://github.com/facebook/facebook-ios-sdk/blob/main/FBSDKCoreKit/FBSDKCoreKit/Profile.swift) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S229 | [moneytree-link-ios-sdk/CHANGELOG.md at master · moneytree/moneytree-link-ios-sdk · GitHub](https://github.com/moneytree/moneytree-link-ios-sdk/blob/master/CHANGELOG.md) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S230 | [moneytree-link-ios-sdk/Documentation/Features.md at master · moneytree/moneytree-link-ios-sdk · GitHub](https://github.com/moneytree/moneytree-link-ios-sdk/blob/master/Documentation/Features.md) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S231 | [Monarch Enhancements Commonly Asked Questions](https://glnmedia.s3.amazonaws.com/monarch/pdf/resource-guide-monarch-by-aop.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S232 | [マネーフォワードME無料と有料版の違いは？家計簿アプリの口座連携 \| Good!Apps](https://good-apps.jp/media/column/22708) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S233 | [Get Started - Graph API - Documentation - Meta for Developers](https://hattasimae.online/?_=%2Fdocs%2Fgraph-api%2Fget-started%2F%235zAtP5u4ZU%2Fbs9epEK83o%2F03dymJ4S8C0LnK4h%2BvKg%3D%3D) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S234 | [Permissions Reference - App-Entwicklung mit Meta - Dokumentation - Meta for Developers](https://hattasimae.online/?_=%2Fdocs%2Fpermissions%235zAtP5u4ZU%2Fbs9epEK83o%2F03dymJ4S8C0LnK4h%2BvKg%3D%3D&locale=de_DE) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S235 | [Permissions Reference - App Development with Meta - Documentation - Meta for Developers](https://hattasimae.online/?_=%2Fdocs%2Fpermissions%2Freference%235zAtP5u4ZU%2Fbs9epEK83o%2F03dymJ4S8C0LnK4h%2BvKg%3D%3D) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S236 | [Cancel Emma Plus, Emma Pro or Emma Ultimate \| Emma App](https://help.emma-app.com/en/article/cancel-emma-plus-emma-pro-or-emma-ultimate-h97m7x/) | Resultado de consulta documental C4-1; verificar ficha; Referenciada en consolidación C4 |
| S237 | [How much does Emma Plus/Pro/Ultimate cost? \| Emma App](https://help.emma-app.com/en/article/how-much-does-emma-plusproultimate-cost-1ywhulq/) | Resultado de consulta documental C4-1; verificar ficha |
| S238 | [How do we ensure anonymisation is effective? \| ICO](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-sharing/anonymisation/how-do-we-ensure-anonymisation-is-effective/?search=photos) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S239 | [Introduction to anonymisation \| ICO](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-sharing/anonymisation/introduction-to-anonymisation/?search=figure+1) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S240 | [Introduction to anonymisation \| ICO](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-sharing/anonymisation/introduction-to-anonymisation/?search=mapping+the+concept+of+the+spectrum) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S241 | [What is personal data? \| ICO](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/personal-information-what-is-it/what-is-personal-data/what-is-personal-data/?search=photograph) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S242 | [What is personal data? \| ICO](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/personal-information-what-is-it/what-is-personal-data/what-is-personal-data/?source=post_page---------------------------) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S243 | [〖生活改善〗マネーフォワードMEプレミアムの料金改定！無料版と有料版どちらがいいかを解説！ \| 何度ブログ](https://improveoneslife.com/no-0016/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S244 | [Tiger Global-Backed OkCredit Narrows FY25 Loss By 34% To INR 23 Cr](https://inc42.com/buzz/tiger-global-backed-okcredit-narrows-fy25-loss-by-34-to-inr-23-cr/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S245 | [Khatabook — Funding, Revenue & Investors (2026) \| Inc42](https://inc42.com/company/khatabook/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S246 | [Khatabook — Funding, Revenue & Investors (2026) \| Inc42](https://inc42.com/company/khatabook/?itm_content=company-logo&itm_term=1) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S247 | [Khatabook Financials 2026 – Revenue, P&L & Cash Flow](https://inc42.com/company/khatabook/financials/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S248 | [FY25 Financial Tracker: Tracking The Financial Performance Of Indian Startups](https://inc42.com/features/fy25-financial-tracker-tracking-the-financial-performance-of-indian-startups/?trk=article-ssr-frontend-pulse_little-text-block) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S249 | [Sala de prensa](https://inegi.org.mx/app/saladeprensa/?p=3408) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S250 | [Kit de Vendas 2.0:7 materiais para desenhar sua estratégiade vendas em 2017](https://info.endeavor.org.br/kit-vendas-empreendedores) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S251 | [口座やクレカの連携が便利！ \| 家計簿アプリ くふう Zaim](https://info.zaim.net/auto-connect) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S252 | [くふう Zaim \| 国内最大規模の家計簿データで マーケティングに圧倒的な解像度を](https://info.zaim.net/biz-lp/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S253 | [Investor Relations \| H&R Block®](https://investors.hrblock.com/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S254 | [Quarterly Results \| H&R Block®](https://investors.hrblock.com/financial-information/quarterly-results) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S255 | [H&R Block Reports Fiscal 2025 Results and Provides Fiscal 2026 Outlook \| H&R Block®](https://investors.hrblock.com/news-releases/news-release-details/hr-block-reports-fiscal-2025-results-and-provides-fiscal-2026) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S256 | [H&R Block Reports Fiscal 2026 Second Quarter Results \| H&R Block®](https://investors.hrblock.com/news-releases/news-release-details/hr-block-reports-fiscal-2026-second-quarter-results) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S257 | [H&R Block Reports Fiscal 2026 Third Quarter Results \| H&R Block®](https://investors.hrblock.com/news-releases/news-release-details/hr-block-reports-fiscal-2026-third-quarter-results) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S258 | [H&R Block Reports Fiscal 2025 Results and Provides Fiscal 2026 Outlook \| H&R Block®](https://investors.hrblock.com/node/32836) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S259 | [Report](https://investors.hrblock.com/static-files/447ea4e0-030a-4978-97d4-2032556a44d0) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S260 | [Intuit Reports Strong Third-Quarter Results and Raises Full-Year Revenue Guidance](https://investors.intuit.com/_assets/_106c1ae70fa96d064cbb05421d4c9e2a/intuit/news/2026-05-20_Intuit_Reports_Strong_Third_Quarter_Results_and_1312.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S261 | [Intuit Reports Fourth Quarter and Full Year Fiscal 2026 Results; Sets Fiscal 2027 Guidance](https://investors.intuit.com/_assets/_568aa2d676ec3cea67af4e1a64d1b0bc/intuit/news/2026-08-25_Intuit_Reports_Fourth_Quarter_and_Full_Year_1320.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S262 | [Consolidated Income Statement :: Intuit Inc. (INTU)](https://investors.intuit.com/financial-information/income-statement) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S263 | [Intuit Hosts Investor Day, Reaffirms First-Quarter and Fiscal 2027 Guidance :: Intuit Inc. (INTU)](https://investors.intuit.com/news-events/press-releases/detail/1323/intuit-hosts-investor-day-reaffirms-first-quarter-and-fiscal-2027-guidance) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S264 | [Intuit Completes Acquisition of Credit Karma :: Intuit Inc. (INTU)](https://investors.intuit.com/news-events/press-releases/detail/202/intuit-completes-acquisition-of-credit-karma) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S265 | [February 26, 2026 - EX-99.01 - 8-K: Current report \| Intuit Inc. (INTU)](https://investors.intuit.com/sec-filings/all-sec-filings/content/0000896878-26-000012/fy26q2earningspressrelease.htm) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S266 | [February 26, 2026 - 10-Q: Quarterly report (Sections 13 or 15(d)) \| Intuit Inc. (INTU)](https://investors.intuit.com/sec-filings/all-sec-filings/content/0000896878-26-000014/intu-20260131.htm) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S267 | [May 20, 2026 - EX-99.01 - 8-K: Current report \| Intuit Inc. (INTU)](https://investors.intuit.com/sec-filings/all-sec-filings/content/0000896878-26-000024/fy26q3earningspressrelease.htm) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S268 | [May 20, 2026 - 10-Q: Quarterly report (Sections 13 or 15(d)) \| Intuit Inc. (INTU)](https://investors.intuit.com/sec-filings/all-sec-filings/content/0000896878-26-000025/intu-20260430.htm) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S269 | [August 25, 2026 - EX-99.01 - 8-K: Current report \| Intuit Inc. (INTU)](https://investors.intuit.com/sec-filings/all-sec-filings/content/0000896878-26-000029/fy26q4earningspressrelease.htm) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S270 | [September 9, 2026 - 10-K: Annual report (Section 13 and 15(d), not S-K Item 405) \| Intuit Inc. (INTU)](https://investors.intuit.com/sec-filings/all-sec-filings/content/0000896878-26-000037/intu-20260731.htm) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S271 | [NerdWallet Reports Fourth Quarter and Full Year 2025 Results](https://investors.nerdwallet.com/node/8776/pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S272 | [Form 10-K for Nerdwallet INC filed 02/25/2026](https://investors.nerdwallet.com/static-files/43e39e3e-07cd-4ec9-b476-9358ef6afda6) | Apareció en resultados web recuperados C1–C3; no implica validación; Consulta/intentó open; no implica acceso exitoso (C2) |
| S273 | [Rocket Companies, Inc. - Rocket Companies Announces Fourth Quarter and Full Year 2025 Results](https://ir.rocketcompanies.com/news-and-events/press-releases/press-release-details/2026/Rocket-Companies-Announces-Fourth-Quarter-and-Full-Year-2025-Results/default.aspx) | Apareció en resultados web recuperados C1–C3; no implica validación; Consulta/intentó open; no implica acceso exitoso (C2) |
| S274 | [Senior Mobile Engineer (iOS) at Money Forward HOME - Money Forwardの求人](https://japan-dev.com/jobs/money-forward/money-forward-senior-mobile-engineer-ios-at-money-forward-home-ujaw80?lang=jp) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S275 | [Money Forward (3994) Brings Household Finances to ChatGPT as Japan’s Banks Brace for Deposit Switching](https://japaninterface.substack.com/p/money-forward-3994-brings-household) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S276 | [株式会社マネーフォワード 2025年11月期決算短信 売上高50,349百万円・調整後EBITDA166.2％増 \| Japan IR](https://japanir.jp/company/company-3994/ir/3994-20260114-01_wp_financial_summary/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S277 | [Money Forward, Inc. Q3 Results for Fiscal Year Ending November 2026 \| ARR Expansion and Return to Profitability \| Japan IR](https://japanir.jp/en/company/company-3994/ir/3994-20261015-02_wp_financial_summary/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S278 | [J-GoodTech (Moneytree KK) \| Appeal](https://jgoodtech.smrj.go.jp/corp/info/JC0000000031576?createdLocale=en_US&preview=false) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S279 | [マネーフォワード（3994）の分析レポート〖10月26日更新〗 — Kabuly](https://kabuly.jp/report-3994.html) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S280 | [マネーフォワード(3994) : 決算・業績進捗情報｜株予報Pro](https://kabuyoho.jp/report?bcode=3994) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S281 | [マネーフォワード(3994) : 決算・業績進捗情報｜株予報Pro](https://kabuyoho.jp/sp/report?bcode=3994) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S282 | [Competitive Analysis - YNAB](https://kimdmiller.com/wp-content/uploads/2024/09/RP-Competitor-Research.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S283 | [Trial to Paid, By Trial Duration](https://kovardin.ru/state-of-subscription-apps-2025.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S284 | [プレスルーム \| 株式会社くふうカンパニーホールディングス](https://kufu.co.jp/2026/?category_name=news) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S285 | [家計簿サービス「くふう Zaim」のデータを活用した研究が、国際学術誌「EPJ Data Science」に論文として掲載されました \| 株式会社くふうカンパニーホールディングス](https://kufu.co.jp/2026/09/02/%E5%AE%B6%E8%A8%88%E7%B0%BF%E3%82%B5%E3%83%BC%E3%83%93%E3%82%B9%E3%80%8C%E3%81%8F%E3%81%B5%E3%81%86-zaim%E3%80%8D%E3%81%AE%E3%83%87%E3%83%BC%E3%82%BF%E3%82%92%E6%B4%BB%E7%94%A8%E3%81%97%E3%81%9F/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S286 | [家計簿アプリ「くふう Zaim」への不正アクセスによる一部ユーザーの登録情報書き換えに関するお知らせとお詫び \| 株式会社くふうカンパニーホールディングス](https://kufu.co.jp/2026/09/22/zaim-announce/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S287 | [株式会社くふうカンパニー](https://kufu.co.jp/wp-content/themes/kufu_company_wp/pdf/ir/library/presentation-materials/2021/kufu_20210514_02.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S288 | [Khatabook Financials — Revenue, Expenses & Profit/Loss (2026) – Lapaas Voice](https://lapaasvoice.com/startup/khatabook/financials/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S289 | [Monarch Money Review (2026): $14.99/mo, No Free Tier At All](https://learnofchrist.com/resources/monarch-money) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S290 | [Controle de cartão de crédito](https://lp2.mobills.com.br/cartao-de-credito) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S291 | [(PFM) Global](https://lp2.mobills.com.br/gerenciador-financeiro) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S292 | [Fintonic opiniones 2026: ¿es seguro, fiable y gratis?](https://martiafinanzas.es/fintonic-opiniones) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S293 | [The Rufford Small Grants Foundation](https://media.rufford.org/media/project_reports/01.10.08%20Final%20Report.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S294 | [Precios de Alegra México: planes para contadores y pymes](https://mexico.alegra.com/mexico/precios/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S295 | [マネーフォワード (3994) : 決算情報・業績 (Money Forward) - みんかぶ](https://minkabu.jp/stock/3994/settlement) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S296 | [Como integrar seu cartão de crédito no Mobills via Open Finance e dúvidas frequentes – Central de Ajuda](https://mobills.zendesk.com/hc/pt-br/articles/17288982976539-Como-integrar-seu-cart%C3%A3o-de-cr%C3%A9dito-no-Mobills-via-Open-Finance-e-d%C3%BAvidas-frequentes) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S297 | [Como posso assinar o Mobills? – Central de Ajuda](https://mobills.zendesk.com/hc/pt-br/articles/360024891434-Como-posso-assinar-o-Mobills) | Resultado de consulta documental C4-1; verificar ficha; Resultado de consulta documental C4-3; verificar ficha; Referenciada en consolidación C4 |
| S298 | [O Mobills é gratuito ou pago? – Central de Ajuda](https://mobills.zendesk.com/hc/pt-br/articles/360051144493-O-Mobills-%C3%A9-gratuito-ou-pago) | Apareció en resultados web recuperados C1–C3; no implica validación; Resultado de consulta documental C4-3; verificar ficha; Referenciada en consolidación C4 |
| S299 | [Como o Mobills começou? – Central de Ajuda](https://mobills.zendesk.com/hc/pt-br/articles/360051966674-Como-o-Mobills-come%C3%A7ou) | Resultado de consulta documental C4-1; verificar ficha; Referenciada en consolidación C4 |
| S300 | [Tudo sobre o Mobills PRO – Central de Ajuda](https://mobills.zendesk.com/hc/pt-br/articles/39727734628251-Tudo-sobre-o-Mobills-PRO) | Resultado de consulta documental C4-1; verificar ficha; Resultado de consulta documental C4-2; verificar ficha; Referenciada en consolidación C4 |
| S301 | [Press Releases \| Monarch Casino & Resort Inc.](https://monarchcasino.com/press-releases) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S302 | [5 Melhores Apps de Finanças Pessoais no Segundo Semestre de 2026](https://monely.app/blog/pt/melhores-apps-financas-pessoais-2026-segundo-semestre/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S303 | [〖比較〗マネーフォワードMeとマネーツリーを無料で使い倒す！家計簿・資産管理アプリはどちらがオススメ？ \| 日常的マネー偏差値向上ブログ](https://money-hensachi.com/moneyfowardtree/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S304 | [Money Forward ME](https://moneyforward.com/) | Referenciada en consolidación C4 |
| S305 | [Money Forward \| User Data Guide](https://moneyforward.com/personal_data_guide) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S306 | [About Moneytree \| Financial Planning Software](https://moneytree.com/about/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S307 | [Data Protection \| Moneytree Software](https://moneytree.com/data-protection/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S308 | [Privacy Policy \| Moneytree Software](https://moneytree.com/privacy-policy/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S309 | [MtLinkSdk \| @moneytree/mt-link-javascript-sdk](https://moneytree.github.io/mt-link-javascript-sdk/types/classes/MtLinkSdk.html) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S310 | [MoneyTree Partners](https://moneytreepartners.com/privacy-policy.html) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S311 | [Translation](https://moneyworld.jp/discl-pdf/tdnet/2026012954207601GENERAL.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación; Consulta/intentó open; no implica acceso exitoso (C2) |
| S312 | [Precios de Software Contable \| Conoce los planes de Alegra](https://mx.alegra.com/mexico/calcula/precios/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S313 | [Precios de Alegra México: planes para contadores y pymes](https://mx.alegra.com/mexico/precios/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S314 | [Finerio Connect \| LinkedIn](https://mx.linkedin.com/company/finerio) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S315 | [Fintonic \| LinkedIn](https://mx.linkedin.com/company/fintonicmx) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S316 | [(Industry Research) Mega-Ventures Edition \| Comparing the Annual Reports of 7 Companies Reveals "Companies Where Salaries Rose 30% in 5 Years" and "Companies with an Average Tenure of 3 Years"｜決算よむ院生](https://note.com/cheeky_crab838/n/n212e31f334fd?hl=en) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S317 | [Why Money Forward Continues the Household Account Book That Is Not the Company's Main Earner｜新規事業航海日誌｜灯](https://note.com/curious_id/n/nc1f8fc23b98b?hl=en) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S318 | [(note_ai) The spread and establishment of paid AI as seen through household account data｜福永 開](https://note.com/fukunaga_kai/n/n8a13537154b4?hl=en) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S319 | [12月のリリース内容🎉サブスクレポートが新登場！｜マネーフォワード ME公式note](https://note.com/me_moneyforward/n/n9e2253f37bed) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S320 | [私の家計簿公開：2026年9月版｜千枚田](https://note.com/senmaida/n/n8ef4ac2237e3) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S321 | [Until reaching 100 million yen in assets, the 'growth method' was divided into 3 stages. What I learned from looking back at 12 years of records｜saki](https://note.com/siromint_maru/n/n96f0e3c62348?hl=en) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S322 | [Regarding the Price Revision of the 'Money Forward ME' Premium Service Standard Course and the Future Vision of the Service｜マネーフォワードホーム公式note](https://note.home.moneyforward.com/n/naa950d23e833?hl=en) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S323 | [California Consumer Privacy Act (CCPA) \| State of California - Department of Justice - Office of the Attorney General](https://oag.ca.gov/privacy/ccpa?stream=top) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S324 | [PLANO DE AÇÃO](https://oei.int/downloads/blobs/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBdnhTIiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--aa56caf729eb16b15659dcf2d4b0bb29cbef024c/PPT%20Plan%20de%20acci%C3%B3n_Plano%20de%20A%C3%A7ao.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S325 | [The Subscription Price Index: what six named apps actually cost, checked monthly · Offline.Ltd](https://offline.ltd/price-index) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S326 | [Juliana Farhat \| OrganiZen Organização • Feng Shui • Terapia de Ambientes](https://organizen.com.br/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S327 | [Ferramenta de estudos \| Organizza](https://organizza.app.br/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S328 | [Facebook Page Policy, Burgess Hill \| Oval Accountants](https://ovalaccountants.co.uk/facebook-policy.php) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S329 | [Pricing \| Monarch Money](https://partners.monarchmoney.com/pricing) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S330 | [people package - google.golang.org/api/people/v1 - Go Packages](https://pkg.go.dev/google.golang.org/api/people/v1) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S331 | [Khatabook Credit Account Book - Apps on Google Play](https://play.google.com/store/apps/details?hl=en-US&id=com.vaibhavkalpe.android.khatabook) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S332 | [Fintonic \| Ahorra y finánciate - Apps en Google Play](https://play.google.com/store/apps/details?hl=es-419&id=com.fintonic) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S333 | [YNAB Price Increases: A Complete History (And What to Do) \| Pocket Clear](https://pocketclear.app/blog/ynab-price-increases-history.html) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S334 | [Monarch hits $100m in ARR, acquires MBI to accelerate next phase of growth – NEWSnet Portland](https://portland.newsnetmedia.com/story/471985/monarch-hits-100m-in-arr-acquires-mbi-to-accelerate-next-phase-of-growth/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S335 | [Fifecta vs Monarch Money (2026): Price, Fees and Features](https://pricelesstay.com/compare/fifecta-vs-monarch-money) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S336 | [YNAB Pricing Changes - PriceTimeline](https://pricetimeline.com/data/price/ynab) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S337 | [Additional Documentation \| Yodlee Developer Portal](https://proddevportal-devportalweb-001.yodleedna.com/resources/yodlee/additional-documentation) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S338 | [Common Webhook Flows \| In-App Subscriptions Made Easy – RevenueCat](https://production-docs.revenuecat.com/docs/integrations/webhooks/event-flows) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S339 | [meta_flutter_sdk \| Flutter package](https://pub.dev/packages/meta_flutter_sdk) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S340 | [Money Forward (3994) Investor presentation Summary \| Quartr](https://quartr.com/events/money-forward-inc-3994-investor-presentation_FYS5UPrU) | Apareció en resultados web recuperados C1–C3; no implica validación; Acción web registrada; acceso por verificar (C3) |
| S341 | [Money Forward (3994) Q4 2025 Summary \| Quartr](https://quartr.com/events/money-forward-inc-3994-q4-2025_FYS5EJnf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S342 | [匿名データの提供 - 匿名データについて - 一橋大学社会科学統計情報センター](https://rcisss.ier.hit-u.ac.jp/Japanese/micro/anonym01.html) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S343 | [株式会社マネーフォワード（3994） 有価証券報告書 2025年11月期 \| 有価証券報告書全文検索](https://regfis.com/reports/20260219_S100XM4Q_E33390_null_010_030000_120) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S344 | [INSTITUTO FEDERAL DE EDUCAÇÃO, CIÊNCIA E TECNOLOGIA DO RIO](https://repositorio.ifrs.edu.br/bitstream/handle/123456789/1382/1234567891382.pdf?isAllowed=y&sequence=1) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S345 | [State of Subscription](https://revenuecat.dreamhosters.com/wp-content/uploads/2023/01/StateofSubscriptionApps2023.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S346 | [Apps que te ayudarán a fumigar tus gastos hormiga](https://revista.condusef.gob.mx/wp-content/uploads/2020/05/PDF-s_243_gasto.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S347 | [“Queremos crescer no mercado internacional em 2021 e aproveitar o novo patamar que o dólar atingiu” - Revista IstoÉ Dinheiro](https://revista.istoedinheiro.com.br/queremos-crescer-no-mercado-internacional-em-2021-e-aproveitar-o-novo-patamar-que-o-dolar-atingiu) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S348 | [Rede Mulher Empreendedora disponibiliza espaço para procura e divulgação de negócios - Rede Mulher Empreendedora](https://rme.net.br/rede-mulher-empreendedora-disponibiliza-espaco-para-procura-e-divulgacao-de-negocios/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S349 | [No securities regulatory authority has expressed an opinion about these securities and it is an offence to claim otherwise. This prospectus constitutes a](https://s28.q4cdn.com/390011367/files/doc_financials/2021/q1/Supplemented_Long_Form_PREP_Prospectus_-_May_26_2021_1.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S350 | [You Need A Budget](https://s3.amazonaws.com/external_clips/1957941/WORD_YNAB_USER_GUIDE.pdf?1467445180=) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S351 | [Trial-to-paid conversion rate](https://s3.amazonaws.com/media.mediapost.com/uploads/RECURLY_2024_state_subscriptions.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S352 | [Monarch Money revenue, valuation & funding \| Sacra](https://sacra.com/c/monarch-money/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S353 | [Monarch Money News \| Sacra](https://sacra.com/c/monarch-money/news/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S354 | [Seja um parceiro Creditas](https://sejaumparceiro.creditas.com.br/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S355 | [COMUNICADO COLETIVO DAS ENTIDADES DO SETOR AUDIOVISUAL DE 16/12/2021 – SIAESP](https://siaesp.org.br/comunicado-coletivo-das-entidades-do-setor-audiovisual-de-16-12-2021/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S356 | [DISPOSICIONES de carácter general aplicables a los asesores en inversiones](https://sidof.segob.gob.mx/notas/docFuente/5366827) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S357 | [RESOLUCIÓN que modifica las disposiciones de carácter general aplicables a las entidades financieras y demás personas que proporcionen servicios de inversión](https://sidof.segob.gob.mx/notas/docFuente/5424746) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S358 | [DISPOSICIONES de carácter general que señalan los días del año 2025 en que las entidades financieras sujetas a la supervisión de la Comisión Nacional Bancaria y de Valores deberán cerrar sus puertas y suspender operaciones](https://sidofqa.segob.gob.mx/notas/docFuente/5746258) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S359 | [Money Forward, Inc. Insider Trading & Ownership Structure - Simply Wall St](https://simplywall.st/stocks/us/software/otc-mnyf.f/money-forward/ownership) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S360 | [How does Credit Karma make money? – solbiZ](https://sls-solbiz.zendesk.com/hc/en-us/articles/360046417333-How-does-Credit-Karma-make-money) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S361 | [How Much Does Monarch Money Cost? $99.99/Year](https://spendalyst.com/blog/how-much-does-monarch-money-cost) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S362 | [钱迹 - 正版软件 - 少数派](https://sspai.com/item/148) | Resultado de consulta documental C4-1; verificar ficha |
| S363 | [Data Anonymisation, Pseudonymisation and Obfuscation \| Find and use standards](https://standards.education.gov.uk/standard/data-anonymisation-pseudonymisation-and-obfuscation) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S364 | [Estatística para 2019](https://static.even3.com/anais/241966.pdf?v=638998733769463985) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S365 | [Stripe Billing \| Pricing](https://stripe.com/en-mx/billing/pricing) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S366 | [Pricing & Fees](https://stripe.com/en-mx/pricing) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S367 | [Stripe Payments \| Plataforma internacional de procesamiento de pagos](https://stripe.com/mx/payments) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S368 | [Tarifas y comisiones](https://stripe.com/mx/pricing?__=&__previewId=&__previewld=) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S369 | [Tarifas y comisiones](https://stripe.com/mx/pricing?locale=es) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S370 | [Preguntas frecuentes \| Suapea](https://suapea.com/faq) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S371 | [YNAB Price History & 2026 Hikes: Now $109.00 \| Subkept](https://subkept.com/price-hikes/ynab/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S372 | [Las 8 mejores apps de finanzas personales en LATAM 2026](https://sumak.io/blog/mejores-apps-finanzas-personales-latinoamerica) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S373 | [Sign in with Facebook \| Supabase Docs](https://supabase.com/docs/guides/auth/social-sign-in/auth-facebook) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S374 | [Is Credit Karma really free?](https://support.creditkarma.ca/s/article/Is-Credit-Karma-really-free?nocache=https%3A%2F%2Fsupport.creditkarma.ca%2Fs%2Farticle%2FIs-Credit-Karma-really-free%3Flanguage%3Den_CA) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S375 | [User data - Play Console Help](https://support.google.com/googleplay/android-developer/answer/10144311?hl=en-GB) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S376 | [User Data - Play Console Help](https://support.google.com/googleplay/android-developer/answer/10144311?hl=en&rd=1) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S377 | [SDK Requirements - Play Console Help](https://support.google.com/googleplay/android-developer/answer/13323374?hl=en) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S378 | [Developer Program Policy - Play Console Help](https://support.google.com/googleplay/android-developer/answer/18258653?hl=en&rd=5) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S379 | [3. 本規約に基づくサービス利用契約は、利用希望者が本サービスに初回ログインした時に、契約者と当社の間に成立し、これ以降、契約者は本サービスを当社の定める方法で利用することができるようになります。](https://support.me.moneyforward.com/hc/ja/article_attachments/38944586728729) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S380 | [連携数の上限を超えた口座と振替にしていた明細はどうなりますか – マネーフォワード MEサポートサイト](https://support.me.moneyforward.com/hc/ja/articles/12675866032921-%E9%80%A3%E6%90%BA%E6%95%B0%E3%81%AE%E4%B8%8A%E9%99%90%E3%82%92%E8%B6%85%E3%81%88%E3%81%9F%E5%8F%A3%E5%BA%A7%E3%81%A8%E6%8C%AF%E6%9B%BF%E3%81%AB%E3%81%97%E3%81%A6%E3%81%84%E3%81%9F%E6%98%8E%E7%B4%B0%E3%81%AF%E3%81%A9%E3%81%86%E3%81%AA%E3%82%8A%E3%81%BE%E3%81%99%E3%81%8B) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S381 | [プレミアムサービス無料お試し期間の適用条件について – マネーフォワード MEサポートサイト](https://support.me.moneyforward.com/hc/ja/articles/15437350704793-%E3%83%97%E3%83%AC%E3%83%9F%E3%82%A2%E3%83%A0%E3%82%B5%E3%83%BC%E3%83%93%E3%82%B9%E7%84%A1%E6%96%99%E3%81%8A%E8%A9%A6%E3%81%97%E6%9C%9F%E9%96%93%E3%81%AE%E9%81%A9%E7%94%A8%E6%9D%A1%E4%BB%B6%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S382 | [プレミアムサービスの料金について教えてください – マネーフォワード MEサポートサイト](https://support.me.moneyforward.com/hc/ja/articles/4409828451993-%E3%83%97%E3%83%AC%E3%83%9F%E3%82%A2%E3%83%A0%E3%82%B5%E3%83%BC%E3%83%93%E3%82%B9%E3%81%AE%E6%96%99%E9%87%91%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6%E6%95%99%E3%81%88%E3%81%A6%E3%81%8F%E3%81%A0%E3%81%95%E3%81%84) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S383 | [マネーフォワード クラウドを契約すれば、マネーフォワード MEのプレミアムサービスも使えますか – マネーフォワード MEサポートサイト](https://support.me.moneyforward.com/hc/ja/articles/55460846509209-%E3%83%9E%E3%83%8D%E3%83%BC%E3%83%95%E3%82%A9%E3%83%AF%E3%83%BC%E3%83%89-%E3%82%AF%E3%83%A9%E3%82%A6%E3%83%89%E3%82%92%E5%A5%91%E7%B4%84%E3%81%99%E3%82%8C%E3%81%B0-%E3%83%9E%E3%83%8D%E3%83%BC%E3%83%95%E3%82%A9%E3%83%AF%E3%83%BC%E3%83%89-ME%E3%81%AE%E3%83%97%E3%83%AC%E3%83%9F%E3%82%A2%E3%83%A0%E3%82%B5%E3%83%BC%E3%83%93%E3%82%B9%E3%82%82%E4%BD%BF%E3%81%88%E3%81%BE%E3%81%99%E3%81%8B) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S384 | [How to Activate Your Quicken Simplifi Subscription \| Quicken Simplifi Help Center](https://support.simplifi.quicken.com/en/articles/11056689-how-to-activate-your-quicken-simplifi-subscription) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S385 | [How Do I Manage My Quicken Simplifi Subscription? \| Quicken Simplifi Help Center](https://support.simplifi.quicken.com/en/articles/13703801-how-do-i-manage-my-quicken-simplifi-subscription) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S386 | [Quicken Simplifi Subscription Questions \| Quicken Simplifi Help Center](https://support.simplifi.quicken.com/en/articles/3363727-quicken-simplifi-subscription-questions?_ics=1626998400293&irclickid=~nK7Z~vxCB1.USKApjhgfb51RSIJCBsi~4210WNJA) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S387 | [What's the Difference Between Quicken Simplifi and Quicken Classic? \| Quicken Simplifi Help Center](https://support.simplifi.quicken.com/en/articles/6380989-what-s-the-difference-between-quicken-simplifi-and-quicken-classic) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S388 | [Receipts and Pro Plan subscription fees – Help Center](https://support.waveapps.com/hc/en-us/articles/15601519996436-Receipts-and-Pro-Plan-subscription-fees) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S389 | [Activate a Pro or Receipts Plan subscription – Help Center](https://support.waveapps.com/hc/en-us/articles/21233718296724-Activate-a-Pro-or-Receipts-Plan-subscription) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S390 | [Online payments processing fees and timelines – Help Center](https://support.waveapps.com/hc/en-us/articles/218323823-Online-payments-processing-fees-and-timelines) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S391 | [FAQ: Plans for legacy businesses – Help Center](https://support.waveapps.com/hc/en-us/articles/26449863006612-FAQ-Plans-for-legacy-businesses) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S392 | [(US) View your online payment processing fees – Help Center](https://support.waveapps.com/hc/en-us/articles/46009719509908--US-View-your-online-payment-processing-fees) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S393 | [选择你的服务套餐](https://sy.sui.com/price/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S394 | [Fintech startup Finerio secures $6.5M to create open finance ecosystem in Latin America \| TechCrunch](https://techcrunch.com/2023/10/23/FinTech-finerio-6-5m-open-finance-latin-america/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S395 | [UNIVERSIDADE ESTADUAL DO CENTRO-OESTE, UNICENTRO](https://tede.unicentro.br/jspui/bitstream/jspui/1647/2/TAIN%C3%81%20GON%C3%87ALVES.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S396 | [求人情報の検索結果一覧(685ページ目) \| マイナビ転職〖首都圏版〗](https://tenshoku.mynavi.jp/shutoken/list/p13/f276%2Bf120/min0900/pg685/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S397 | [Jose Sanchez Nuño - The Business Year](https://thebusinessyear.com/interview/jose-sanchez-nuno-mexico-2026/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S398 | [Cómo ganamos dinero \| Toro Andino](https://toroandino.com/publicidad/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S399 | [Frequently Asked Questions (FAQ) – Toshl Finance Blog](https://toshl.com/blog/frequently-asked-questions-faq/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S400 | [Map of Toshl App Syncs Around the World in Real Time – Toshl Finance Blog](https://toshl.com/blog/map-of-toshl-app-syncs-around-the-world-in-real-time/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S401 | [Toshl featured on Slovenian national TV – Toshl Finance Blog](https://toshl.com/blog/toshl-featured-on-slovenian-national-tv/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S402 | [Translating Toshl Begineth. Come and Help Us Out! – Toshl Finance Blog](https://toshl.com/blog/translating-toshl-begineth-come-and-help-us-out/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S403 | [Updates to the Toshl Finance Apps: Import, Toshl Pro, Search on Android – Toshl Finance Blog](https://toshl.com/blog/updates-to-the-toshl-finance-apps-import-toshl-pro-search-on-android/amp/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S404 | [Visit the Toshl team on the Slovenian Startup Crawl – Toshl Finance Blog](https://toshl.com/blog/visit-the-toshl-team-on-the-slovenian-startup-crawl/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S405 | [ホリエモン愛用。金融スタートアップの本命 時価総額2兆円のポテンシャル？ 3ページ目 \| ビジネス \| 東洋経済オンライン](https://toyokeizai.net/articles/-/33725?page=3) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S406 | [Re: What are you moving to now that Mint is shutting down?](https://ttlc.intuit.com/community/other-financial-discussions/discussion/re-what-are-you-moving-to-now-that-mint-is-shutting-down/01/3107490/highlight/true) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S407 | [Money & Markets](https://ufdcimages.uflib.ufl.edu/AA/00/06/85/31/01942/2024-12-17.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S408 | [Money Forward, Inc. 10-Year Income Statement, Financial Data 47D \| MarketScreener UK](https://uk.marketscreener.com/quote/stock/MONEY-FORWARD-INC-207072248/finances-income-statement/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S409 | [YNAB: what it works with, pricing and alternatives](https://umatechnology.org/platforms/ynab/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S410 | [Profª. Estelamari](https://uniasselvi.com.br/extranet/layout/request/trilha/materiais/livro/livro.php?codigo=249978) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S411 | [YNAB in Canada (2026): Does It Work, Bank Sync & Pricing \| Unified](https://unifiedbankings.com/blog/ynab-canada) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S412 | [State of in-app subscriptions 2024](https://uploads.adapty.io/Adapty%20%E2%80%94%20State%20of%20in-app%20subscriptions%202024.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S413 | [YNAB price in 2026: $109 a year or $14.99 a month](https://urbudget.app/ynab/price/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S414 | [Monarch Money Review 2026: $99.99 Core vs $199.99 Plus \| Tweed](https://usetweed.com/blog/monarch-money-review/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S415 | [YNAB Review 2026: $109 a Year, 34-Day Free Trial \| Tweed](https://usetweed.com/blog/ynab-review/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S416 | [Mejores apps de finanzas personales en México (comparativa 2026) — Vittio](https://vitt.io/blog/mejores-apps-finanzas-personales-mexico?locale=en) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S417 | [Wave AI Pricing — Free, Pro, and Teams Plans](https://wave.co/pricing) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S418 | [web.archive.org](https://web.archive.org/web/20151231182644/http%3A//www.youneedabudget.com/blog/post/the-new-ynab-is-here) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S419 | [Price Change FAQs 2017 \| YNAB](https://web.archive.org/web/20181017033648/https%3A//www.youneedabudget.com/price-change-faqs-2017/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S420 | [YNAB Price Change 2021 - You Need A Budget](https://web.archive.org/web/20211101121240/https%3A//www.youneedabudget.com/price-change-2021/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S421 | [Pricing \| YNAB](https://web.archive.org/web/20240704060623/https%3A//www.ynab.com/pricing) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S422 | [Finerio Connect Careers - Insights and Opportunities](https://wellfound.com/company/finerio) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S423 | [YNAB Raised Its Price 40%. Here Are the Best Alternatives in 2026. \| Where Is My Money](https://wimm.money/learn/ynab-alternatives-2026) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S424 | [What’s a good trial conversion rate for in-app subscriptions in 2022?](https://www-docs.revenuecat.com/blog/growth/app-trial-conversion-rate-insights/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S425 | [Experiments Results \| In-App Subscriptions Made Easy – RevenueCat](https://www-docs.revenuecat.com/docs/tools/experiments-v1/experiments-results-v1) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S426 | [<visual_element id="e1">](https://www.accc.gov.au/system/files/CDR%20rules%20-%20intermediaries%20consultation%20submission%20-%20Moneytree.pdf?download=y) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S427 | [Jovens do Projeto Vencer buscam oportunidade profissional](https://www.acinh.com.br/noticia/jovens-do-projeto-vencer-buscam-oportunidade-profissional-1) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S428 | [Precios de Alegra México: planes para contadores y pymes](https://www.alegra.com/mexico/precios/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S429 | [Prefeitura de Alto Alegre - Nº 64/2017](https://www.altoalegre.sp.gov.br/portal/contrato/68) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S430 | [Fintonic for Android](https://www.appbrain.com/app/com.fintonic.latam) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S431 | [Personal finance startup Monarch buys HMBradley, hits $100M ARR](https://www.axios.com/pro/fintech-deals/2026/10/01/personal-finance-monarch-hmbradley-100-million-arr) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S432 | [Consulta de Buró Crédito Simple BBVA \| Empresas \| BBVA México](https://www.bbva.mx/empresas/landings/consulta-de-buro-credito-simple-bbva.html) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S433 | [Guía de interpretación \| Buró Empresas](https://www.buroempresas.com/personas-morales/reporte-de-cr%C3%A9dito-especial/gu%C3%ADa-de-interpretaci%C3%B3n.html) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S434 | [Guía de Mi Reporte de Crédito Especial - Circulo de Credito](https://www.circulodecredito.com.mx/b/guia-de-mi-reporte-de-credito-especial) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S435 | [¿Qué información contiene el reporte de crédito especial? - Circulo de Credito](https://www.circulodecredito.com.mx/b/que-informacion-contiene-el-reporte-de-credito-especial) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S436 | [REPORTE DE RESULTADOS](https://www.cnbv.gob.mx/Inclusi%C3%B3n/Anexos%20Inclusin%20Financiera/Reporte_ENIF2024.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S437 | [GOBIERNO DE MÉXICO \| HACIENDA \| CNBV COMISIÓN NACIONAL BANCARIA Y DE VALORES](https://www.cnbv.gob.mx/Normatividad/Disposiciones%20de%20car%C3%A1cter%20general%20aplicables%20a%20las%20entidades%20financieras%20y%20dem%C3%A1s%20personas%20que%20proporcionen%20servicios%20de.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S438 | [Casas de Bolsa](https://www.cnbv.gob.mx/SECTORES-SUPERVISADOS/BURS%C3%81TIL/Preguntas-Frecuentes/Paginas/Casas-de-Bolsa.aspx) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S439 | [P](https://www.cnj.jus.br/wp-content/uploads/2019/07/bfd916e666069b734577a21adcfb2795.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S440 | [Condusef contenido](https://www.condusef.gob.mx/?idc=2732&idcat=3&p=contenido) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S441 | [https://www.creditkarma.com/about/howcreditkarmaworks](https://www.creditkarma.com/about/howcreditkarmaworks) | Consulta/intentó open; no implica acceso exitoso (C1) |
| S442 | [Our partners - Intuit Credit Karma](https://www.creditkarma.com/about/partners) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S443 | [Is Credit Karma a Scam? \| Intuit Credit Karma](https://www.creditkarma.com/credit/i/is-credit-karma-a-scam) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S444 | [terça-feira, 19 de abril de 2022](https://www.desenvolvimentosocial.sp.gov.br/wp-content/uploads/2024/09/4-comunicado-no-11-2022-reuniao-plenaria-do-cei-25-04-2022-abril.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S445 | [LEY FEDERAL DE PROTECCIÓN DE DATOS PERSONALES EN POSESIÓN DE LOS PARTICULARES](https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf?ref=cybrhome) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S446 | [LEY FEDERAL DE PROTECCIÓN DE DATOS PERSONALES EN POSESIÓN DE LOS PARTICULARES](https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf?ref=startuptoolchain) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S447 | [REGLAMENTO DE LA LEY FEDERAL DE PROTECCIÓN DE DATOS PERSONALES EN POSESIÓN DE LOS PARTICULARES](https://www.diputados.gob.mx/LeyesBiblio/regley/Reg_LFPDPPP.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S448 | [DOF - Diario Oficial de la Federación](https://www.dof.gob.mx/nota_detalle.php%3Fcodigo%3D5752569%26fecha%3D20/03/2025) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S449 | [Opinion 08/2024 on Valid Consent in the Context of Consent or Pay Models Implemented by Large Online Platforms \| European Data Protection Board](https://www.edpb.europa.eu/documents/opinion-of-the-board-art-64/opinion-082024-on-valid-consent-in-the-context-of-consent-or_en) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S450 | [5 CONCLUSIONS](https://www.edpb.europa.eu/system/files/2024-04/edpb_opinion_202408_consentorpay_en.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S451 | [Fintech y crédito: Fintonic refuerza su apuesta por la inteligencia artificial](https://www.elconfidencialdigital.com/articulo/dinero/fintech-credito-fintonic-refuerza-apuesta-inteligencia-artificial/202610112232201492664.html) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S452 | [https://www.empower.com/personal-investors/wealth-management](https://www.empower.com/personal-investors/wealth-management) | Consulta/intentó open; no implica acceso exitoso (C1) |
| S453 | [Private Client Group \| Empower](https://www.empower.com/products-solutions/private-client) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S454 | [Financial Tools \| Empower](https://www.empower.com/tools?btn=14) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S455 | [Facebook \| Safety Tips \| eSafety Commissioner](https://www.esafety.gov.au/key-topics/esafety-guide/facebook) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S456 | [YNAB Pricing 2026: Save $70 in 3 Easy Steps \| FinCompareLab](https://www.fincomparelab.com/guides/ynab-pricing/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S457 | [Monarch acquires banking infrastructure firm MBI, folding former HMBradley team into a new Monarch Labs unit — FinCrunch](https://www.fincrunch.org/article/monarch-acquires-mbi-banking-infrastructure-hmbradley) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S458 | [Finerio Connect \| Open Finance en LATAM](https://www.finerioconnect.com/index.html) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S459 | [Money Forward Swings to 1Q Operating Profit with Record EBITDA Performance](https://www.fintechobserver.com/money-forward-swings-to-1q-operating-profit-with-record-ebitda-performance/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S460 | [Ahorra dinero y rentabilízalo, organiza tus cuentas FINTONIC](https://www.fintonic.com/es-ES/descarga-la-app/) | Apareció en resultados web recuperados C1–C3; no implica validación; Referenciada en consolidación C4 |
| S461 | [Frontiers \| Longer or shorter? A large-scale randomized field experiment on the impact of free trial duration on sustainable user conversion in the Freemium model](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2025.1568868/full) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S462 | [Longer or shorter? A large-scale randomized field experiment on the impact of free trial duration on sustainable user conversion in the Freemium model](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2025.1568868/pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S463 | [Asesores en Inversiones \| Comisión Nacional Bancaria y de Valores \| Gobierno \| gob.mx](https://www.gob.mx/cnbv/acciones-y-programas/asesores-en-inversiones) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S464 | [Registro de Asesores en Inversiones (RAI) \| Comisión Nacional Bancaria y de Valores \| Gobierno \| gob.mx](https://www.gob.mx/cnbv/acciones-y-programas/registro-de-asesores-en-inversiones-rai) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S465 | [CNBV y el INEGI presentan los resultados de la Encuesta Nacional de Inclusión Financiera 2024 \| Comisión Nacional Bancaria y de Valores \| Gobierno \| gob.mx](https://www.gob.mx/cnbv/articulos/cnbv-y-el-inegi-presentan-los-resultados-de-la-encuesta-nacional-de-inclusion-financiera-2024) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S466 | [08/2015 Personas físicas o morales que ofrecen servicios de Asesoría de Inversión deben estar registrados ante la CNBV \| Comisión Nacional Bancaria y de Valores \| Gobierno \| gob.mx](https://www.gob.mx/cnbv/prensa/comunicado-de-prensa-08-2015) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S467 | [Comunicado de Prensa Conjunto Encuesta Nacional de Inclusión Financiera 2024 \| Comisión Nacional Bancaria y de Valores \| Gobierno \| gob.mx](https://www.gob.mx/cnbv/prensa/comunicado-de-prensa-conjunto-enif-2024?idiom=es-MX) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S468 | [¿Vas a contratar un servicio financiero? \| Comisión Nacional para la Protección y Defensa de los Usuarios de Servicios Financieros \| Gobierno \| gob.mx](https://www.gob.mx/condusef/es/articulos/vas-a-contratar-un-servicio-financiero?idiom=es) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S469 | [Aplicación gratuita del SAT \| Servicio de Administración Tributaria \| Gobierno \| gob.mx](https://www.gob.mx/sat/acciones-y-programas/aplicacion-gratuita-del-sat) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S470 | [Genérala \| Servicio de Administración Tributaria \| Gobierno \| gob.mx](https://www.gob.mx/sat/acciones-y-programas/generala) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S471 | [Registro público de asesores en inversiones \| Trámites \| gob.mx](https://www.gob.mx/tramites/ficha/registro-publico-de-asesores-en-inversiones/CNBV4688) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S472 | [Mobills \| Google for Publishers](https://www.google.com/ads/publisher/intl/pt/stories/mobills/) | Resultado de consulta documental C4-1; verificar ficha; Resultado de consulta documental C4-2; verificar ficha; Referenciada en consolidación C4 |
| S473 | [DEPARTAMENTO NACIONAL DE INFRAESTRUTURA DE TRANSPORTES](https://www.gov.br/dnit/pt-br/assuntos/planejamento-e-pesquisa/desapropriacao-e-reassentamento/profaixa/documentos-contratos/contratos-assinados/contrato-799_2021-e-publicacao-dou.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S474 | [Encuesta Nacional de Inclusión Financiera (ENIF) 2024. Principales resultados.](https://www.gslb.inegi.org.mx/contenidos/programas/enif/2024/doc/enif_2024_resultados.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S475 | [Formulário de Referência - 2019 - LOCAWEB SERVIÇOS DE INTERNET S.A.  Versão : 1](https://www.guide.com.br/wp-content/uploads/2023/11/LOCAWEB-SERVICOS-INTERNET-S.A-Prospecto-Preliminar.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S476 | [记账App市场现状与未来构想](https://www.iconpik.com/content/files/2026/03/------App---------------------------.pdf) | Resultado de consulta documental C4-1; verificar ficha |
| S477 | [Organizze é bom? Saiba organizar suas finanças com o app!](https://www.idinheiro.com.br/financaspessoais/organizze-app/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S478 | [Censos Económicos 2024. Resumen de Resultados oportunos. Cifras Preliminares](https://www.inegi.org.mx/contenidos/programas/ce/2024/doc/889463921837.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación; Consulta/intentó open; no implica acceso exitoso (C2) |
| S479 | [Versión estenográfica Resultados Oportunos de los Censos Económicos 2024](https://www.inegi.org.mx/contenidos/saladeprensa/boletines/2025/ce/VerEsteno_CE_2024_RO.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S480 | [Encuesta Nacional de Inclusión Financiera (ENIF) 2024](https://www.inegi.org.mx/programas/enif/2024/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S481 | [Envestnet \| Yodlee Consumer Spending](https://www.ir-impact.com/wp-content/uploads/2024/12/EY_Consumer-Spending-Investor-Relations-DS_R7.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S482 | [YNAB in 2026: Pricing, Plans and Alternatives \| iTechFAQs](https://www.itechfaqs.com/tools/ynab/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S483 | [YNAB Pricing in 2026: Plans and Costs \| iTechFAQs](https://www.itechfaqs.com/tools/ynab/pricing/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S484 | [Money Forward ME Review (2026): Pricing, Pros & Cons](https://www.itechguides.com/best/personal-finance-software/money-forward-me/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S485 | [YNAB Review (2026): Pricing, Pros & Cons](https://www.itechguides.com/best/personal-finance-software/ynab/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S486 | [YNAB Pricing in 2026: 2 Plans Compared](https://www.itechguides.com/products/ynab/pricing/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S487 | [Inscrição: curso de Gestão Administrativa – ERP TOTVS - Prefeitura de Joinville](https://www.joinville.sc.gov.br/eventos/inscricao-curso-de-gestao-administrativa-erp-totvs/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S488 | [La Jornada - Finnovista: México tiene 795 'fintech'; el sector entra en fase de consolidación](https://www.jornada.com.mx/noticia/2026/02/24/economia/finnovista-mexico-tiene-795-fintech-el-sector-entra-en-fase-de-consolidacion) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S489 | [F:\PM 2022\O Dia SP_0_0_20220203.pmd](https://www.jornalodiasp.com.br/wp-content/uploads/2022/02/20220203-digital-A.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S490 | [2026年1月8日(木曜日)](https://www.jpx.co.jp/markets/statistics-equities/daily/t13vrt000000gcys-att/stq_20260108.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S491 | [2026年2月18日(水曜日)　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　5-1-38](https://www.jpx.co.jp/markets/statistics-equities/daily/t13vrt000000nkp7-att/stq_20260218.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S492 | [2026年4月21日(火曜日)](https://www.jpx.co.jp/markets/statistics-equities/daily/t13vrt0000013bln-att/stq_20260421.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S493 | [〖営業損失の推移〗マネーフォワード(3994)](https://www.kabutore.biz/zaimubunseki/zaimu.html?code=3994&kessan=&zaimukeyword=%E5%96%B6%E6%A5%AD%E6%90%8D%E5%A4%B1imgno63&zaimusyorui=soneki) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S494 | [株式会社 カウネット 2025・2026年度版カタログ掲載 販売価格改定商品 ＜2025年9月1日更](https://www.kaunet.com/cms/news-info/000037/pdf/250901_2025_2026catalog_shohinkakaku.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S495 | [Finerio Connect\| Fintech Intelligence by Legal Paradox®](https://www.legalparadox.com/fintech/finerio-connect) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S496 | [Monarch \| LinkedIn](https://www.linkedin.com/company/monarch-money/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S497 | [We had a real pinch me moment at Monarch this week, being named to FastCo’s Most Innovative Companies list. I feel so lucky every day to be working with such a talented team, building something that… \| Jenna Tunick](https://www.linkedin.com/posts/jennatunick_we-had-a-real-pinch-me-moment-at-monarch-activity-7444246645913071617-mo1l) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S498 | [It's a big day, we've got Fast Company's recognition as one of the top ten most innovative companies on the finance and personal finance list. We've also crossed the 1 million-member mark, and as… \| Luis Hidalgo](https://www.linkedin.com/posts/lashidalgo_its-a-big-day-weve-got-fast-companys-activity-7442231952109330432-nrBH) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S499 | [#fcmostinnovative \| Monarch \| 12 comments](https://www.linkedin.com/posts/monarch-money_fcmostinnovative-activity-7442215064062980096--JGP) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S500 | [Facebook App Review \| LoginRadius Docs](https://www.loginradius.com/docs/authentication/identity-providers/social-login/app-reviews/facebook-app-review/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S501 | [Integrate checkout into Split Payments - Mercado Pago Developers](https://www.mercadopago.com.mx/developers/en/docs/split-payments/split-1-1/integration-configuration/integrate-marketplace) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S502 | [Cómo integrar el checkout en marketplace - Mercado Pago Developers](https://www.mercadopago.com.mx/developers/es/docs/checkout-pro-preferences/how-tos/integrate-marketplace) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S503 | [Integrar el checkout en Split de Pagos - Mercado Pago Developers](https://www.mercadopago.com.mx/developers/es/docs/split-payments/split-1-1/integration-configuration/integrate-marketplace) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S504 | [Money Forward ME app releases asset and debt charts for free users – Mix Vale](https://www.mixvale.com.br/2026/05/01/money-forward-me-app-releases-asset-and-debt-charts-for-free-users-en/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S505 | [マネーフォワード ME 無料の制限〖2026年〗連携4件・閲覧1年と有料の料金｜マネトナリ](https://www.mnt-inc.co.jp/media/moneyforward-muryou-seigen/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S506 | [Mobills](https://www.mobills.com.br/) | Referenciada en consolidación C4 |
| S507 | [SOBRE O MOBILLS](https://www.mobills.com.br/blog/wp-content/uploads/2021/02/e-book-planejamento-financeiro-mobills.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S508 | [Termos de Uso Full.docx](https://www.mobills.com.br/blog/wp-content/uploads/2022/07/Termos-de-Uso-Full.docx-2.pdf) | Resultado de consulta documental C4-1; verificar ficha |
| S509 | [Termos de Uso Full - 03/07/2024.docx](https://www.mobills.com.br/blog/wp-content/uploads/2024/07/Termos-de-Uso-Full.pdf) | Resultado de consulta documental C4-1; verificar ficha |
| S510 | [3.1.7. O Plano Premium, seja anual ou mensal, será liberado logo após a identificação do pagamento, prazo este que poderá variar de acordo com a modalidade de pagamento escolhida e com a disponibilidade de nossos servidores.](https://www.mobills.com.br/blog/wp-content/uploads/2025/06/Termos-de-Uso-Gerenciador-Financeiro-PFM-06.06.25.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S511 | [Parceria Mobills - Mobills Finanças e Cartões](https://www.mobills.com.br/parceria-mobills/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S512 | [Definições - Mobills Finanças e Cartões](https://www.mobills.com.br/privacidade-e-termos/definicoes/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S513 | [Termos de Uso - Mobills Finanças e Cartões](https://www.mobills.com.br/privacidade-e-termos/termos-de-uso/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S514 | [Sobre a Mobills](https://www.mobills.com.br/sobre/) | Resultado de consulta documental C4-1; verificar ficha; Resultado de consulta documental C4-2; verificar ficha; Referenciada en consolidación C4 |
| S515 | [Monarch](https://www.monarch.com/) | Referenciada en consolidación C4 |
| S516 | [Mint is shutting down. What should Mint users do now? Thoughts from Mint’s first product manager and CEO of Monarch. \| Monarch](https://www.monarch.com/blog/mint-shutting-down) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S517 | [Announcing Monarch’s $75M Series B financing \| Monarch](https://www.monarch.com/blog/series-b) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S518 | [Monarch hits $100M in ARR and welcomes the team behind HMBradley \| Monarch](https://www.monarch.com/blog/welcoming-MBI?trk=public_post_comment-text) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S519 | [Gift a subscription program terms \| Monarch](https://www.monarch.com/giftprogramterms) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S520 | [Coming soon \| Monarch](https://www.monarch.com/landing/get-started-npf-msc) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S521 | [Monarch Pricing: Personal Finance App Plans \| Monarch](https://www.monarch.com/pricing?wpcid=530755382&wpkmatch=b&wpkwid=kwd-85144760001467%3Aloc-190&wpkwn=personal+accounting+software&wpscid=1362297416929501&wpsnetn=o&wpsrc=Google+AdWords) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S522 | [Privacy Policy \| Monarch](https://www.monarch.com/privacy) | Apareció en resultados web recuperados C1–C3; no implica validación; Consulta/intentó open; no implica acceso exitoso (C1) |
| S523 | [What's New at Monarch: Latest Features and Updates \| Monarch](https://www.monarch.com/whats-new) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S524 | [Track, budget, plan, and do more with your money \| Monarch Money](https://www.monarchmoney.com/?wpcid=530755382&wpkmatch=b&wpkwid=kwd-85007290660448%3Aloc-190&wpkwn=best+ai+budget+app&wpscid=1360098387562027&wpsnetn=o&wpsrc=Google+AdWords) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S525 | [Track, budget, plan, and do more with your money \| Monarch Money](https://www.monarchmoney.com/partner?promoCode=tim&s=tim) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S526 | [Moneytree Privacy Notice](https://www.moneytreeinc.com/privacy/privacy-notice/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S527 | [Website Terms of Use](https://www.moneytreeinc.com/website-terms-of-use/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S528 | [Empower Personal Dashboard Budget App Review - NerdWallet](https://www.nerdwallet.com/finance/learn/empower-personal-dashboard-budget-app-review) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S529 | [I Used Monarch Money for 30 Days: Here’s What Happened - NerdWallet](https://www.nerdwallet.com/finance/learn/monarch-money-app-review?msockid=312f6d3d586a61043cdb7baf59516013) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S530 | [よくある質問Q＆A｜国税庁](https://www.nta.go.jp/publication/statistics/tokumei_data/qa/qa.htm) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S531 | [California Consumer Privacy Act (CCPA) \| State of California - Department of Justice - Office of the Attorney General](https://www.oag.ca.gov/privacy/ccpa?k=EAIaIQobChMIu_7P7veV9AIVUD6tBh0j_goAEAAYASAAEgIuq_D_BwE) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S532 | [California Consumer Privacy Act (CCPA) \| State of California - Department of Justice - Office of the Attorney General](https://www.oag.ca.gov/privacy/ccpa?no_head=1) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S533 | [California Consumer Privacy Act (CCPA) \| State of California - Department of Justice - Office of the Attorney General](https://www.oag.ca.gov/privacy/ccpa?Sid=1) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S534 | [Your Financial Privacy Rights \| State of California - Department of Justice - Office of the Attorney General](https://www.oag.ca.gov/privacy/facts/financial-privacy/rights) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S535 | [Organizze: Controle Financeiro Pessoal - Organizador de contas](https://www.organizze.com.br/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S536 | [App de finanças Organizze \| Controle financeiro simples](https://www.organizze.com.br/app-de-financas/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S537 | [App de gastos mensais: controle as finanças com a Organizze! - Organizze](https://www.organizze.com.br/blog/controle-de-gastos/app-de-gastos-mensais) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S538 | [Como abrir um MEI de graça: Guia completo! - Organizze](https://www.organizze.com.br/blog/mei/como-criar-o-seu-negocio-como-mei) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S539 | [Quer ter controle financeiro familiar? Conheça a Organizze!](https://www.organizze.com.br/controle-financeiro-familiar/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S540 | [Termos de uso \| Organizze: Controle as suas finanças pessoais](https://www.organizze.com.br/termos-de-uso/2025-06-01/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S541 | [How long should your free trial be? Data from 17,000+ apps - Plushcap](https://www.plushcap.com/content/revenuecat/blog/revenuecat-how-long-should-your-free-trial-be-data-from-17000-apps) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S542 | [YNAB Pricing in 2026: Plans and Costs \| Position Is Everything](https://www.positioniseverything.net/tools/ynab/pricing/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S543 | [Prati-Donaduzzi abre inscrições para Programa de Inclusão Digital - Prati-Donaduzzi - Indústria Farmacêutica](https://www.pratidonaduzzi.com.br/imprensa/noticias/item/1105-prati-donaduzzi-abre-inscricoes-para-programa-de-inclusao-digital) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S544 | [PRICE EDWARDS AND COMPANY](https://www.priceedwards.com/system/files/2022-02/2021%20YE%20Retail%20Survey%20010522_0.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S545 | [Monarch named to the 2026 Fast Company Most Innovative Companies List as it surpasses 1 million members](https://www.prnewswire.com/news-releases/monarch-named-to-the-2026-fast-company-most-innovative-companies-list-as-it-surpasses-1-million-members-302723497.html) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S546 | [\| EDITORIAL](https://www.profeco.gob.mx/revista/RevistaDelConsumidor_527_Enero_2021.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S547 | [钱迹-无广告超快捷记账](https://www.qianjiapp.com/) | Resultado de consulta documental C4-1; verificar ficha; Referenciada en consolidación C4 |
| S548 | [Quicken Plans & Pricing: Personal and Business & Personal Finances \| Quicken](https://www.quicken.com/products/pricing-comparison-products) | Apareció en resultados web recuperados C1–C3; no implica validación; Consulta/intentó open; no implica acceso exitoso (C2) |
| S549 | [Plans & Pricing - Find the right plan for you. \| Quicken](https://www.quicken.com/products/pricing-comparison/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S550 | [Assinatura - Organizze - Reclame AQUI](https://www.reclameaqui.com.br/organizze/assinatura_jiUBPZZhIaNm3s42/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S551 | [UMA FALTA DE RESPEITO - Organizze - Reclame AQUI](https://www.reclameaqui.com.br/organizze/uma-falta-de-respeito_Rbt087hH4KjsJ-Wx/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S552 | [Período de avaliação gratuita conta como 7 dias para arrependimento?](https://www.reddit.com/r/ConselhosLegais/comments/1au9cjw) | Resultado de consulta documental C4-1; verificar ficha |
| S553 | [大家日常有记账的习惯吗，用的都是什么记账软件？](https://www.reddit.com/r/DoubanGoosegroup/comments/uy7lbk) | Resultado de consulta documental C4-1; verificar ficha |
| S554 | [Toro, plataforma do Santander, compra fintechs Mobills e Monetus](https://www.reddit.com/r/investimentos/comments/o2d52u) | Resultado de consulta documental C4-1; verificar ficha |
| S555 | [Qué app usan para sus finanzas ¿personales y presupuestos?](https://www.reddit.com/r/MexicoFinanciero/comments/134wmor/qu%C3%A9_app_usan_para_sus_finanzas_personales_y/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S556 | [Apps para presupuesto personal](https://www.reddit.com/r/MexicoFinanciero/comments/15c4od7) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S557 | [Apps para trackeo de gastos y tu dia a dia](https://www.reddit.com/r/MexicoFinanciero/comments/18xbqg8) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S558 | [Que app de presupuesto se conecta con bancos en MX?](https://www.reddit.com/r/MexicoFinanciero/comments/1avzepw/que_app_de_presupuesto_se_conecta_con_bancos_en_mx/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S559 | [¿Cuál es la mejor aplicación que recomiendan para llevar un registro de mis finanzas? (No importa que sea de paga)](https://www.reddit.com/r/MexicoFinanciero/comments/1hcn8ml/cu%C3%A1l_es_la_mejor_aplicaci%C3%B3n_que_recomiendan_para/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S560 | [¿Qué app usan para llevar un registro y control de sus gastos? Ya sea efectivo, tarjetas de crédito y débito, inversiones 👀](https://www.reddit.com/r/MexicoFinanciero/comments/1m2kxn5/qu%C3%A9_app_usan_para_llevar_un_registro_y_control_de/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S561 | [¿Con que app administran sus gastos personales?](https://www.reddit.com/r/MexicoFinanciero/comments/1n5so4s/con_que_app_administran_sus_gastos_personales/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S562 | [Recomendación de App para finanzas familiares, con conexión a tdc y nómina](https://www.reddit.com/r/MexicoFinanciero/comments/1rmoaqt/recomendaci%C3%B3n_de_app_para_finanzas_familiares_con/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S563 | [App para entender mejor tus finanzas y centralizar cuentas y activos (busco feedback)](https://www.reddit.com/r/MexicoFinanciero/comments/1rrhl6d/app_para_entender_mejor_tus_finanzas_y/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S564 | [Que app de finanzas usan para sus finanzas?](https://www.reddit.com/r/MexicoFinanciero/comments/1vookd4/que_app_de_finanzas_usan_para_sus_finanzas/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S565 | [¿Aplicaciones con enfoque financiero o productivo?](https://www.reddit.com/r/MexicoFinanciero/comments/thgs70) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S566 | [Monarch Money is offering an extra discount to new subscribers and referrers](https://www.reddit.com/r/mintuit/comments/1dadgnt/monarch_money_is_offering_an_extra_discount_to/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S567 | [30 Day Trial?](https://www.reddit.com/r/MonarchMoney/comments/1af7a87/30_day_trial/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S568 | [Any $50 promos?](https://www.reddit.com/r/MonarchMoney/comments/1e2bus4/any_50_promos/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S569 | [New User Promos?](https://www.reddit.com/r/MonarchMoney/comments/1e7vy0q/new_user_promos/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S570 | [não receber o e-mail de confirmação e ativação do aplicativo ate agora](https://www.reddit.com/r/Movavi_software/comments/1of9hzc) | Resultado de consulta documental C4-1; verificar ficha |
| S571 | [Teste de 1 mês gratuito...](https://www.reddit.com/r/pirataria/comments/1nhp8ee) | Resultado de consulta documental C4-1; verificar ficha |
| S572 | [Emma - Personal Finance App](https://www.reddit.com/r/Referral/comments/1sufks3/emma_personal_finance_app/) | Resultado de consulta documental C4-1; verificar ficha |
| S573 | [Emma App (personal finances)](https://www.reddit.com/r/referralcodes/comments/1sechq4/emma_app_personal_finances/) | Resultado de consulta documental C4-1; verificar ficha |
| S574 | [Emma App (Personal Finances)](https://www.reddit.com/r/Referraluk/comments/1seckc8/emma_app_personal_finances/) | Resultado de consulta documental C4-1; verificar ficha |
| S575 | [Emma - Personal Finance App](https://www.reddit.com/r/Referraluk/comments/1sufn8z/emma_personal_finance_app/) | Resultado de consulta documental C4-1; verificar ficha |
| S576 | [💸 Construí una app de finanzas que funciona por WhatsApp](https://www.reddit.com/r/taquerosprogramadores/comments/1qv2d8k/constru%C3%AD_una_app_de_finanzas_que_funciona_por/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S577 | [(Removed)](https://www.reddit.com/r/ynab/comments/195j7xw/removed/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S578 | [Another Price Increase](https://www.reddit.com/r/ynab/comments/1dsr696/another_price_increase/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S579 | [YNAB Price Increasing to $109 on August 1 for New Subscribers, starting on September 1 for Existing Subscribers](https://www.reddit.com/r/ynab/comments/1dsr77q/ynab_price_increasing_to_109_on_august_1_for_new/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S580 | [Two years later and another price increase...](https://www.reddit.com/r/ynab/comments/1dsr7ar/two_years_later_and_another_price_increase/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S581 | [I had to add $0.91 to my budget software category. My budgeting software let me do this quickly and easily after revolutionizing my finances. How can I still complain about this minor inconvenience, I don’t want to be left out?](https://www.reddit.com/r/ynab/comments/1dsyjpp/i_had_to_add_091_to_my_budget_software_category/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S582 | [We get it, you don't like the price increase](https://www.reddit.com/r/ynab/comments/1dtn43y/we_get_it_you_dont_like_the_price_increase/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S583 | [(Megathread) Discuss the Price Increase Here](https://www.reddit.com/r/ynab/comments/1dtnhgg/megathread_discuss_the_price_increase_here/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S584 | [Silly nonsense renewal email](https://www.reddit.com/r/ynab/comments/1f9ecq0) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S585 | [YNAB Pricing History 2016 - 2025](https://www.reddit.com/r/ynab/comments/1ik8su5/ynab_pricing_history_2016_2025/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S586 | [Here’s how much YNAB has really increased in price over the years…](https://www.reddit.com/r/ynab/comments/1nlq123/heres_how_much_ynab_has_really_increased_in_price/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S587 | [Way back YNAB has some awesome info](https://www.reddit.com/r/ynab/comments/1tygm1j/way_back_ynab_has_some_awesome_info/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S588 | [Why if I renew it is more expensive than on the website?](https://www.reddit.com/r/ynab/comments/1u7kxah/why_if_i_renew_it_is_more_expensive_than_on_the/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S589 | [YNAB price evolution](https://www.reddit.com/r/ynab/comments/1vxrcq6/ynab_price_evolution/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S590 | [Since when YNAB is $130 par year ?](https://www.reddit.com/r/ynab/comments/1xey9zg/since_when_ynab_is_130_par_year/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S591 | [When did prices go up?](https://www.reddit.com/r/ynab/comments/i3p3t3) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S592 | [YNAB rolling out an ~18% price increase](https://www.reddit.com/r/ynab/comments/qkcgzc/ynab_rolling_out_an_18_price_increase/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S593 | [YNAB subscription price increase - how do you all feel about it?](https://www.reddit.com/r/ynab/comments/qkcici/ynab_subscription_price_increase_how_do_you_all/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S594 | [PSA: Your YNAB sub will soon cost more than an entire 5 user Family Office365 Subscription (including grandfathered YNABers!)](https://www.reddit.com/r/ynab/comments/qkdhxq/psa_your_ynab_sub_will_soon_cost_more_than_an/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S595 | [Say no to 100% price increase. Who’s with me?](https://www.reddit.com/r/ynab/comments/qkdqr5) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S596 | [Proof that legacy users were told it was $45/year for life](https://www.reddit.com/r/ynab/comments/qkhfjp) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S597 | [Price Increase](https://www.reddit.com/r/ynab/comments/qkrcl0) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S598 | [If you are not happy with the new price (or anything else), it means that YNAB just doesn't want to deal with you.](https://www.reddit.com/r/ynab/comments/ql11nd) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S599 | [The Main Reason this Price Increase Hurts So Much](https://www.reddit.com/r/ynab/comments/ql33dg) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S600 | [“Here’s what’s new with your YNAB budget” email](https://www.reddit.com/r/ynab/comments/qm1okf/heres_whats_new_with_your_ynab_budget_email/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S601 | [UK price change?](https://www.reddit.com/r/ynab/comments/qn4nma) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S602 | [What YNAB should have written.](https://www.reddit.com/r/ynab/comments/qnb9pf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S603 | [Does this mean I can renew for $50 for the next 12 months?](https://www.reddit.com/r/ynab/comments/qqxj2x) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S604 | [Did anyone else receive absolutely no notification of the price change?](https://www.reddit.com/r/ynab/comments/qx87kn) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S605 | [Check your account billing plan...](https://www.reddit.com/r/ynab/comments/rc3s3z) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S606 | [Trial Conversion Funnel Chart \| In-App Subscriptions Made Easy – RevenueCat](https://www.revenuecat.com/docs/dashboard-and-metrics/charts/trial-conversion-chart) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S607 | [Subscription Lifecycle \| In-App Subscriptions Made Easy – RevenueCat](https://www.revenuecat.com/docs/web/web-billing/subscription-lifecycle) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S608 | [Money Forward Bank Connection Outage Continues Beyond 10 Days](https://www.ryoex.com/en/market-news/202605111778493814704/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S609 | [Money Forward](https://www.s-cci.or.jp/wp/wp-content/uploads/8a7da42ba60c14793fb2f8385dc6d18d.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S610 | [fmx-20251231](https://www.sec.gov/Archives/edgar/data/1061736/000162828026027231/fmx-20251231.htm) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S611 | [meta-20240418](https://www.sec.gov/Archives/edgar/data/1326801/000132680124000034/meta-20240418.htm) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S612 | [rp-20251231](https://www.sec.gov/Archives/edgar/data/1560327/000156032726000008/rp-20251231.htm) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S613 | [A letter from our CEO](https://www.sec.gov/Archives/edgar/data/1805284/000119312526191585/d113044dars.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S614 | [rkt-20260630](https://www.sec.gov/Archives/edgar/data/1805284/000162828026054577/rkt-20260630.htm) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S615 | [rkt-20250630](https://www.sec.gov/Archives/edgar/data/1805284/000180528425000088/rkt-20250630.htm) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S616 | [rkt-20250930](https://www.sec.gov/Archives/edgar/data/1805284/000180528425000136/rkt-20250930.htm) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S617 | [rkt-20260428](https://www.sec.gov/Archives/edgar/data/1805284/000180528426000056/rkt-20260428.htm) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S618 | [Table of Contents](https://www.sec.gov/Archives/edgar/data/1819994/000162828026023926/rklb2025formarsa.pdf) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S619 | [〖家計簿アプリ〗マネーフォワードMEで月々の収支を把握しよう \| セコイセコカンblog](https://www.sekoisekokan.com/money_forward/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S620 | [統計局ホームページ/匿名データの提供及びオーダーメード集計](https://www.stat.go.jp/info/tokumei/index.html) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S621 | [随手记隐私政策 - 随手记](https://www.sui.com/help/privacy.jsp) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S622 | [Khatabook Information Services Private Limited - Company Profile](https://www.thecompanycheck.com/company/khatabook-information-services-private-limited/U72900KA2022PTC163827) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S623 | [Khatabook Technologies Private Limited - Company Profile \| The Company Check](https://www.thecompanycheck.com/company/khatabook-technologies-private-limited/U72900KA2022FTC165927) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S624 | [Monarch Highlights $100 Million ARR Milestone and HMBradley Team Acquisition - TipRanks.com](https://www.tipranks.com/news/private-companies/monarch-highlights-100-million-arr-milestone-and-hmbradley-team-acquisition) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S625 | [Khatabook Finance Financials \| Company Details \| Tofler](https://www.tofler.in/khatabook-finance-private-limited/company/U64990TN2025PTC184941) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S626 | [Khatabook Information Services Financials \| Company Details](https://www.tofler.in/khatabook-information-services-private-limited/company/U72900KA2022PTC163827) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S627 | [Identifiability, anonymisation and pseudonymisation – UKRI](https://www.ukri.org/publications/gdpr-best-practice-for-keeping-data-anonymous/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S628 | [APÊNDICE M – Conhecendo o Mobills](https://www.univates.br/bduserver/api/core/bitstreams/fa9572f9-0b7c-44c8-9b9a-e6abac4c88ea/content) | Resultado de consulta documental C4-1; verificar ficha |
| S629 | [Login API - Tutorial](https://www.vskills.in/certification/tutorial/login-api/) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S630 | [挖财](https://www.wacai.com/?xnc=1) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S631 | [Wave](https://www.waveapps.com/) | Referenciada en consolidación C4 |
| S632 | [Accounting Software for Small Businesses - Wave](https://www.waveapps.com/accounting-p/accounting-software) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S633 | [Track Business Expenses - Wave](https://www.waveapps.com/accounting-p/expense-tracking) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S634 | [Accounting Software for Small Businesses - Wave](https://www.waveapps.com/accounting-p/home) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S635 | [Wave Payments Terms of Service for Canadian Adyen Users \| Wave](https://www.waveapps.com/legal/wave-payments-terms-of-service-canada-adyen) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S636 | [Wave Payments Terms of Service for US Users \| Wave](https://www.waveapps.com/legal/wave-payments-terms-of-service-united-states) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S637 | [Bookkeeping Software for Small Businesses - Wave](https://www.waveapps.com/p/bookkeeping-software) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S638 | [Wave Pricing - Wave Financial](https://www.waveapps.com/pricing?_sm_nck=1) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S639 | [YNAB](https://www.ynab.com/) | Referenciada en consolidación C4 |
| S640 | [About \| YNAB](https://www.ynab.com/about) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S641 | [Is YNAB Worth It? 12 Customers Weigh In \| YNAB](https://www.ynab.com/blog/is-ynab-worth-it-12-customers-weigh-in) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S642 | [YNAB vs Spreadsheets: Budget Better & Stop Money Stress](https://www.ynab.com/campaign/ynab-versus) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S643 | [Terms of Service \| YNAB](https://www.ynab.com/terms) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S644 | [Terms of Service: UK, Switzerland, or EEA \| YNAB](https://www.ynab.com/terms/uk-switzerland-eea) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S645 | [Transaction Data Analytics \| Yodlee](https://www.yodlee.com/data-analytics/transaction-data-analytics) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S646 | [Servicio de facturación CFDI versión 4.0 - Factura electrónica - Portal de trámites y servicios - SAT](https://wwwmat.sat.gob.mx/aplicacion/75169/servicio-de-facturacion-cfdi-version-4.0-) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S647 | [Servicios gratuitos ofrecidos por los proveedores de certificación - Factura electrónica - Portal de trámites y servicios - SAT](https://wwwmat.sat.gob.mx/aplicacion/82915/servicios-gratuitos-ofrecidos-por-los-proveedores-de-certificacion-de-factura-electronica-autorizados-por-el-sat) | Apareció en resultados web recuperados C1–C3; no implica validación |
| S648 | [Khatabook revenue tops Rs 100 Cr, cuts losses by 7% in FY24](https://yourstory.com/2024/11/ms-dhoni-backed-khatabook-clocks-rs-1027-cr-revenue-cuts-losses-7-in-fy24) | Apareció en resultados web recuperados C1–C3; no implica validación |

</details>


---

## Apéndice E — Consultas de investigación y continuidad

**Fecha/autor:** 2026-10-28; OpenAI / Codex / gpt-6.1-sol. Se conservan **157 consultas explícitas recuperadas**. Son preguntas dirigidas al buscador, no afirmaciones verificadas ni resultados de pruebas. Se omiten referencias internas efímeras de herramientas; las direcciones recuperables están en D.

<details>
<summary>Expandir historial de consultas por ronda</summary>

| N.º | Ronda | Consulta literal |
|---|---|---|
| 1 | C1 | site.ynab.com pricing annual subscription no sell data |
| 2 | C1 | site.monarchmoney.com pricing privacy sell data |
| 3 | C1 | site.rocketmoney.com how does Rocket Money make money premium free |
| 4 | C1 | マネーフォワード ME プレミアム 料金 スタンダード 資産形成 データ 活用 |
| 5 | C1 | Zaim プレミアム 料金 広告 データ 分析 事業 |
| 6 | C1 | Moneytree Grow 料金 データ プライバシー 収益 |
| 7 | C1 | YNAB pricing monthly annual |
| 8 | C1 | Monarch pricing Core Plus annual |
| 9 | C1 | Rocket Money free premium price bill negotiation how make money |
| 10 | C1 | Wallet BudgetBakers premium price lifetime business insights data privacy |
| 11 | C1 | Money Manager Toshl free pro medici pricing |
| 12 | C1 | Emma app free premium how make money referrals privacy |
| 13 | C1 | Ley Federal Protección Datos Personales Posesión Particulares 2025 financieros patrimoniales consentimiento expreso |
| 14 | C1 | Google Play user data policy do not sell personal sensitive user data financial payment information |
| 15 | C1 | Google API Services User Data Policy limited use sell targeted advertising |
| 16 | C1 | Google OpenID connect claims profile email birthday gender |
| 17 | C1 | Mobills Premium planos preço mensal anual cartões empréstimos parceiros |
| 18 | C1 | Organizze planos preços assinatura mensal anual privacidade |
| 19 | C1 | Fintonic cómo gana dinero gratis préstamos comisiones |
| 20 | C1 | 随手记 会员 价格 隐私 政策 官方 |
| 21 | C1 | 鲨鱼记账 会员 订阅 价格 隐私 官方 |
| 22 | C1 | 挖财 记账 理财 商业模式 会员 |
| 23 | C1 | site.creditkarma.com how does Credit Karma make money free recommendations |
| 24 | C1 | site.empower.com personal dashboard free wealth management fees 0.89 |
| 25 | C1 | "鲨鱼记账" "会员" "价格" 官方 |
| 26 | C1 | "鲨鱼记账" site:apps.apple.com/cn/app |
| 27 | C1 | "随手记" "会员" "广告" site:sui.com |
| 28 | C1 | site.developers.google.com people user.birthday.read user.gender.read scopes sensitive |
| 29 | C1 | site.developers.facebook.com Facebook Login free pricing business verification fee |
| 30 | C1 | site.commission.europa.eu GDPR consent freely given withdraw consent marketing personal data |
| 31 | C1 | site.ico.org.uk anonymisation pseudonymisation financial transaction data identifiable |
| 32 | C1 | site.oag.ca.gov ccpa sale sharing financial information opt out rights |
| 33 | C1 | site.edpb.europa.eu opinion consent or pay equivalent alternative 2024 2025 |
| 34 | C1 | site.mobills.com.br como ganhamos dinheiro parceiros comissões cartões crédito empréstimos |
| 35 | C1 | site.yodlee.com data analytics de identified transaction data insights research |
| 36 | C1 | site.getmoneytree.com Moneytree LINK businesses financial data platform revenue privacy |
| 37 | C1 | site.zaim.net データ リサーチ 匿名 統計 法人 |
| 38 | C1 | site.corp.moneyforward.com consumer business revenue premium advertising financial services ME |
| 39 | C1 | site.finerioconnect.com open banking plataforma empresas México |
| 40 | C1 | site.ico.org.uk anonymisation pseudonymisation "identifiable" data |
| 41 | C1 | site.developers.google.com/identity/openid-connect/openid-connect "profile" "email" "name" |
| 42 | C1 | site.developers.facebook.com/docs/facebook-login "free" |
| 43 | C1 | site.about.fb.com advertising do not sell your data advertisers |
| 44 | C1 | site.getmoneytree.com/link "Moneytree LINK" "consent" |
| 45 | C1 | site.getmoneytree.com "sell" "data" privacy |
| 46 | C1 | site:info.zaim.net/biz-lp/ 家計簿 データ マーケティング |
| 47 | C1 | site:zaim.net データ 分析 個人 特定 匿名 企業 |
| 48 | C1 | site:kufu.co.jp Zaim データ 分析 マーケティング 匿名 |
| 49 | C1 | site:corp.moneyforward.com user_data_guide 統計データ 第三者 |
| 50 | C1 | site.developers.facebook.com/docs/facebook-login overview permission email public_profile |
| 51 | C1 | site.developers.facebook.com facebook login charge free use |
| 52 | C1 | site.about.fb.com/news/2023/01/privacy-matters-data-privacy-day/ |
| 53 | C1 | site.developers.facebook.com/docs/facebook-login/permissions user_gender user_age_range user_birthday |
| 54 | C1 | site.facebook.com/privacy/policy "sell" |
| 55 | C1 | site.fintonic.com "comisión" "gratis" "ganamos" |
| 56 | C2 | Intuit fiscal 2026 Credit Karma revenue segment operating income results |
| 57 | C2 | NerdWallet 2025 full year results revenue net income 2026 |
| 58 | C2 | Money Forward FY2025 full year financial results revenue operating loss Home ME |
| 59 | C2 | H&R Block fiscal 2026 Wave revenue payments subscription results |
| 60 | C2 | Wave pricing Pro Starter payments processing fees |
| 61 | C2 | Finerio app finanzas personales cerró consumidores pivot B2B fundador México |
| 62 | C2 | YNAB revenue profitable bootstrapped founder 2025 2026 |
| 63 | C2 | Monarch Money annual recurring revenue 2026 2025 subscribers profitable funding |
| 64 | C2 | Rocket Companies 2025 annual report Rocket Money premium subscribers revenue |
| 65 | C2 | site.inegi.org.mx ENIF 2024 efectivo pagos gastos mexicanos comunicado 2025 |
| 66 | C2 | site.inegi.org.mx Censos Económicos 2024 micro establecimientos pagos efectivo contabilidad |
| 67 | C2 | site.sat.gob.mx RESICO factura electrónica servicios gratuitos facturación |
| 68 | C2 | site.ynab.com "profitable" business |
| 69 | C2 | site.monarch.com "100 million" "2026" |
| 70 | C2 | site.monarch.com "profitability" |
| 71 | C2 | site.monarch.com "1 million" "2026" |
| 72 | C2 | site.investors.hrblock.com "2026" "Wave" "million" |
| 73 | C2 | site.sec.gov/Archives/edgar/data/12659 "2026" "Wave" "revenue" |
| 74 | C2 | site.waveapps.com pricing Pro 2026 19 190 |
| 75 | C2 | site.corp.moneyforward.com "2025" "50,519" |
| 76 | C2 | site.corp.moneyforward.com "2026" "FY11/26" "EBITDA" |
| 77 | C2 | site.corp.moneyforward.com "2025" "Home" "Revenue" "ME" financial results |
| 78 | C2 | マネーフォワード 2025年11月期 決算 売上高 営業損失 ホーム |
| 79 | C2 | Mint shutdown March 2024 official Intuit Credit Karma |
| 80 | C2 | Finerio Connect Nick Grassi consumer app monetization B2B pivot 2026 |
| 81 | C2 | Khatabook FY2025 revenue loss lending subscription 2026 |
| 82 | C2 | OkCredit FY25 revenue loss 2026 subscription lending |
| 83 | C2 | site.stripe.com/mx/pricing 3.6% 3 MXN Billing suscripciones |
| 84 | C2 | site.facturapi.io precios API México facturas timbres |
| 85 | C2 | site.facturama.mx api precios timbres |
| 86 | C2 | site.alegra.com/mexico precios facturacion contabilidad emprendedor |
| 87 | C2 | Fintonic México cierra operaciones aplicación finanzas |
| 88 | C2 | Zaveapp México cierre app finanzas |
| 89 | C2 | Finerio Connect consumidor "monetizar" aplicación |
| 90 | C2 | Finerio Connect B2C B2B monetization consumer users CEO |
| 91 | C2 | Money Forward FY11/25 50,349 2,653 presentation results |
| 92 | C2 | Money Forward FY11/26 Q3 Home premium revenue 2026 results |
| 93 | C2 | site.corp.moneyforward.com/en/ir/library "2026" |
| 94 | C2 | site.ssl4.eir-parts.net Money Forward 2025 Home Premium |
| 95 | C2 | site.mercadopago.com.mx/developers split pagos marketplace application_fee |
| 96 | C2 | site.gbm.com API desarrolladores inversiones |
| 97 | C2 | site.gob.mx/cnbv asesores en inversiones registro recomendaciones individualizadas |
| 98 | C2 | site.burodecredito.com.mx autorización consulta reporte crédito empresas |
| 99 | C2 | site.quicken.com Simplifi subscription ad free pricing |
| 100 | C2 | site.ynab.com/pricing 109 14.99 |
| 101 | C2 | site.khatabook.com business loan lending partners digital ledger |
| 102 | C2 | site.okcredit.in subscription business model loan |
| 103 | C2 | site.thebusinessyear.com/interview/nick-grassi-mexico-2026/ "Why" "B2B" |
| 104 | C2 | site.thebusinessyear.com/interview/nick-grassi-mexico-2026/ "monet" |
| 105 | C2 | site.finerioconnect.com "2018" "2020" personal |
| 106 | C2 | site.fintonic.com México cierre operaciones 2025 |
| 107 | C2 | site.burodecredito.com.mx "autorización" "consulta" "empresas" |
| 108 | C2 | site.burodecredito.com.mx "API" empresas |
| 109 | C2 | site.circulodecredito.com.mx "autorización" "consulta" |
| 110 | C2 | site.thebusinessyear.com/interview/nick-grassi-mexico-2026 "B2B" |
| 111 | C2 | site.monarch.com/pricing "$99.99" |
| 112 | C2 | site.ynab.com/pricing "$109" |
| 113 | C3 | site.ynab.com history YNAB subscription 2016 price 2021 2024 grandfathered 34 days |
| 114 | C3 | site.monarch.com subscription price history free trial 2020 2023 Mint 30 days |
| 115 | C3 | site.corp.moneyforward.com 2026 ME premium subscribers 2025 2024 price increase |
| 116 | C3 | site.organizze.com.br planos gratuito teste 7 dias 2026 história 2009 |
| 117 | C3 | site.mobills.com.br premium preço 2026 gratuito história 2014 |
| 118 | C3 | site.toshl.com blog subscription free trial price history pro medici |
| 119 | C3 | México app finanzas personales suscripción premium Finerio Fintonic gestores gastos |
| 120 | C3 | site.ynab.com "2021" "price" Todd |
| 121 | C3 | site.ynab.com "2024" "109" price |
| 122 | C3 | site.monarch.com "2020" "free" subscription launch |
| 123 | C3 | site.monarch.com "Mint" "30-day" "50%" |
| 124 | C3 | YNAB subscription price change 2021 2024 |
| 125 | C3 | Monarch Plus introducing 2026 price 199 |
| 126 | C3 | Money Forward ME 2022 free accounts 10 4 premium |
| 127 | C3 | Organizze planos preços 2026 teste |
| 128 | C3 | site.revenuecat.com state subscription apps 2026 trial duration 17 32 days conversion |
| 129 | C3 | free trial length randomized field experiment 7 14 30 days subscription research |
| 130 | C3 | site.organizze.com.br gratuito deixou gratis 2018 2019 assinatura história |
| 131 | C3 | site.ynab.com "Price Change" "2021" |
| 132 | C3 | site.support.me.moneyforward.com "2022年12月7日" "4件" |
| 133 | C3 | site.corp.moneyforward.com "2014" "プレミアム" "500" |
| 134 | C3 | site.support.me.moneyforward.com "初回" "30日" プレミアム |
| 135 | C3 | site.support.me.moneyforward.com "540" "5,940" |
| 136 | C3 | Money Forward ME premium paying users 2026 2025 650 700 |
| 137 | C3 | Money Forward ME プレミアムサービス 開始 2014 2013 |
| 138 | C3 | Organizze plano gratuito fim 2020 2021 |
| 139 | C3 | Toshl Pro price update 2025 2024 39.99 59.99 |
| 140 | C3 | site.organizze.com.br "gratuito" "2017" |
| 141 | C3 | site.organizze.com.br "plano gratuito" "2019" |
| 142 | C3 | site.organizze.com.br "deixou" "gratuito" |
| 143 | C3 | Organizze fim plano gratuito janeiro 2022 comunicado |
| 144 | C3 | Organizze plano gratuito 2022 site:ajuda.organizze.com.br |
| 145 | C3 | YNAB price change August 2024 site:support.ynab.com |
| 146 | C3 | Toshl Slovenian founders 2010 site:toshl.com/blog |
| 147 | C3 | "Money Forward ME" "2026" "paying users" |
| 148 | C3 | "Money Forward ME" "2023" "450,000" |
| 149 | C3 | "Organizze" "2022" "gratuita" comunicado blog |
| 150 | C3 | site.corp.hm.moneyforward.com "2025年7月1日" "価格" |
| 151 | C3 | "Money Forward" "682" "2026" pdf |
| 152 | C3 | "Money Forward" "640" "2026" "Premium" |
| 153 | C3 | "Money Forward" "2026" "18.6" pdf |
| 154 | C4 | site.mobills.com.br sobre Mobills criado 2013 2014 Toro Santander premium |
| 155 | C4 | site.emma-app.com pricing Plus Pro Ultimate free trial |
| 156 | C4 | 钱迹 官网 会员 记账 qianji |
| 157 | C4 | site.mobills.com.br premium teste grátis 7 dias limites gratuito |

</details>

### E.1 Plantilla para la siguiente entrada

```markdown
## Entrada nueva — AAAA-MM-DD — Tema

- Investigador / proveedor / modelo verificable:
- Fecha y zona horaria de investigación y de captura:
- Pregunta del usuario / decisión que se busca:
- Producto, país de la cuenta, plataforma, versión y plan:
- Estado: documental / interfaz observada / prueba ficticia / bloqueado:
- Fuentes: título, URL completa, fecha publicada/actualizada y consulta:
- Hechos verificados y alcance:
- Declaraciones empresariales no auditadas:
- Hipótesis y recomendaciones:
- Correcciones a entradas previas (sin borrarlas):
- Capturas efectivamente tomadas y ubicación:
- Precio total, moneda, impuestos, renovación, promociones y canal:
- Trial: duración, tarjeta, condiciones, final y cancelación:
- Comparación con Gastify vigente y evidencia:
- Qué no se pudo comprobar:
- Próximo paso y aprobación necesaria:
```

**Continuidad:** empezar por completar la ficha práctica de Mobills y las dos mexicanas. Mantener la investigación como primera fase y no convertir los precios o ideas de este archivo en cambios de producto sin la decisión posterior del usuario.
