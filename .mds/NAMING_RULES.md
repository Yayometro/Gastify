# Concept Naming & Normalization Rules for Gastify

> **Architecture Note**: This document works in tandem with [`NAMING_RULES.json`](file:///Users/luisjairvazqueznavarrete/Coding%20Proyects/Gastify/.mds/NAMING_RULES.json).
> - `NAMING_RULES.json`: Machine-executable rule definitions for scripts (Node.js/Python).
> - `NAMING_RULES.md`: Human & Multi-LLM documentation (Gemini, Claude, ChatGPT, Qwen, local LLMs).

---

## 🎯 Objective
Bank statements often contain noisy string codes (e.g. `OPM 150323DI1 PAYPAL *GOOGLE GOOGLE CIU`, `MAG 2105031W3 MERPAGO*MELIMAS CIU`).
To ensure Gastify data is clean, consistent, and readable, raw merchant strings MUST be normalized according to the rules below before writing to `gastify-template.xlsx`.

---

## 📋 Normalization Rules Table

| Target Merchant / Keyword | Match Criteria / Amount | Clean Concept Name | SubCategory | Category |
| :--- | :--- | :--- | :--- | :--- |
| **Credit Card Payments** | `SU PAGO GRACIAS`, `PAGO POR TRANSFERENCIA`, `CARGO PAGO TARJETA CREDITO`, `PAGO TNOW` | `Pago de Tarjeta de Crédito` | — | `Services` |
| **Nómina Octaura** | `NOMINA TEF PAGO DE NOMINA`, `Nomina octaura`, `Octaura nomina` | `Nómina Octaura` | — | `Salary` |
| **Pago al SAT (RESICO)** | `IMPTO FED TRANSF ELECT`, `CGO IMPTO FED` | `Pago al SAT - RESICO` | `Goverment` | `Taxes` |
| **Gaby Contadora** | `GABY CONTADORA` | `Pago Mensual - Gaby Contadora` | `Contador` | `Taxes` / `Services` |
| **Water Filter Purified** | `OPENPAY ROTOPLAS SERVI`, `ROTOPLAS SERVI` | `Mensualidad - Agua Purificada` | `House services` | `House` |
| **Anthropic Claude AI** | `ANTHROPIC CLAUDE` | `Subscription - Anthropic Claude` | `IA Tools` | `E-accounts` |
| **OpenAI ChatGPT** | `OPENAI`, `CHATGPT` | `Subscription - OpenAI ChatGPT` | `IA Tools` | `E-accounts` |
| **Google Gemini AI** | `GOOGLE GOOGLE`, `GOOGLE GEMINI` | `Subscription - Google Gemini` | `IA Tools` | `E-accounts` |
| **HBO Max Subscription** | `HELPHBOMAX`, `HBO MAX` | `HBO Max Subscription` | `Series-Movies E-Account ` | `E-accounts` |
| **Holiday Inn Gym** | `HOLIDAY INN BUENAVIS` | `Gimnasio Holiday Inn` | `Coach gym` | `Health` / `Gym` |
| **Punto Clínico Studies** | `PUNTO CLINICO DOCTORES` (> $700) | `Punto Clínico Doctores - Estudios Médicos` | — | `Health` |
| **Invictus Store** | `INNVICTUS REFORMA 222` | `Invictus - Reforma 222` | — | `Clothes` |
| **Walmart Supermarket** | `WALMART`, `NWM 9709244W4` | `Walmart - Despensa` | `Despensa` | `Food` |
| **La Comer Supermarket** | `LA COMER` | `La Comer - Despensa` | `Despensa` | `Food` |
| **Sumesa Supermarket** | `SUMESA` | `Sumesa - Despensa` | `Despensa` | `Food` |
| **Wild Fork Meat** | `WILDFORK`, `WILD FORK` | `Wild Fork - Proteína` | `Proteina 🍗` | `Food` |
| **Farmacias del Ahorro** | `F. AHORRO`, `F AHORRO`, `FARMACIAS DEL AHORRO` | `Farmacias del Ahorro - Medicinas` | `Pills` | `Health` |
| **7-Eleven Store** | `7 ELEVEN`, `7-ELEVEN`, `7ELEVEN` | `7-Eleven` | `Oxxo` | — |
| **OXXO Store** | `OXXO` | `OXXO` | `Oxxo` | — |
| **Telmex Internet** | `TELMEX` | `Telmex - Pago de Internet` | `House services` | `House` |
| **Amazon Prime** | `AMAZON`, `ANE 140618P37` | `Amazon Prime - Suscripción` | — | `Electronics 📱` |
| **iTunes / iCloud** | `ITUNES`, `APPLE.COM` | `iTunes - iCloud Subscription` | `Apple` | `E-accounts` |
| **Pull&Bear Clothing** | `PULL&BEAR`, `PULL AND BEAR` | `Pull&Bear - Ropa` | — | `Clothes` |
| **Movistar Mobile** | `TELEFONICA`, `TELEFÓNICA`, `MOVISTAR` | `Movistar - Pago de Datos Móviles` | `Phone rent  ` | `House` |
| **DiDi Rides** | `DIDI RIDES`, `DLO DIDI RIDES` | `DiDi - Viaje` | `Uber` | `Transport` |
| **MeliMás Subscription** | `MELIMAS`, `MERPAGO*MELIMAS` ($299.00) | `Cobro cuenta MeliMás` | `Series-Movies E-Account ` | `E-accounts` |
| **Water Service** | `SEGIAGUA`, `SEGUAGUA` | `Seguagua - Pago de agua` | `House services` | `House` |
| **Electricity Service** | `CFE`, `MERCADOPAGO *CFE` | `CFE - Pago de luz` | `Electricity ⚡️ ` | `House` |
| **Cinépolis Tickets** | `CINEPOLIS`, `PPCINEPOLIS` | `Cinépolis` | `Cine` | `Entertainment` |
| **Cinemex Tickets** | `CINEMEX` | `Cinemex` | `Cine` | `Entertainment` |
| **Uber Rides** | `UBER RIDE`, `DLO*UBER`, `UBER TRIP` | `Viaje en Uber` | `Uber` | `Transport` |
| **Food Delivery** | `UBER EATS`, `RAPPI`, `RAPPIPRO` | `Rappi / Uber Eats` | `Rappi y Diddi` | `Restaurant` |

---

## 🛠️ Code Implementation Strategy

When writing scripts in Node.js or Python:
1. Load `NAMING_RULES.json`.
2. Iterate through each transaction row.
3. Check `regex` and optional `minAmount`/`maxAmount`/`amount` parameters.
4. Replace raw concept with `rule.concept` and set appropriate `subCategory` or `category`.
