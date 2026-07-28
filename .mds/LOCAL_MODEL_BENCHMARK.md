# Benchmark: Claude vs Gemini vs Modelos Locales (Ollama) — Extracción de Estados de Cuenta

> **Metadata**
> - **Ejecutado por**: Claude Sonnet 5 (Anthropic)
> - **Fecha**: 2026-07-24
> - **Objetivo**: Verificar si Gemini 3.6 Flash extrajo correctamente las transacciones de julio 2026 hacia `gastify-template.xlsx`, y evaluar si los modelos locales de Ollama (`qwen3.5:9b`, `qwen3.6:27b`) pueden hacer este mismo trabajo de forma confiable, para reducir consumo de tokens de suscripciones de pago.

---

## 1. Verificación de la extracción de Gemini 3.6 Flash

**Método**: Se leyeron directamente (visión nativa, sin OCR externo) los 3 PDFs fuente de julio 2026 — HSBC 2Now (8pp), Santander Crédito (8pp), Santander Nómina (7pp) — usando el `Read` tool de Claude Code (requiere Poppler/`pdftoppm` para renderizar páginas a imagen). Se transcribieron las 129 líneas de movimiento a una estructura de datos y se comparó programáticamente contra las 129 filas del `gastify-template.xlsx` (conteo, monto, fecha, tipo Bill/Income).

**Resultado**: **129/129 filas correctas en conteo, monto y tipo (Bill/Income)**. Los 3 subtotales de cuenta (HSBC cargos/abonos, Santander Crédito cargos/abonos, Santander Nómina depósitos/retiros) reconcilian exactamente al centavo contra los estados de cuenta originales. Las 31 filas donde aplica `NAMING_RULES.json` tienen Category/SubCategory 100% correctos.

**Errores encontrados** (menores, no afectan montos ni clasificación):
- **4 fechas incorrectas** de 129 (no coinciden ni con "fecha de la operación" ni con "fecha de cargo" del estado de cuenta): PPCINEPOLIS $318.00 (18/06 en vez de 14/06), HELPHBOMAX $239.00, 7 ELEVEN $96.50, WALMART SUPER 1 $433.38.
- 1 inconsistencia menor de convención (usó fecha de cargo en vez de fecha de operación para UBER RIDE $66.19 — fecha válida del estado de cuenta, solo inconsistente con el resto).
- 1 dígito de referencia mal transcrito en el concepto (`ROT 7802026ZA` vs `ROT 7602026ZA` de OPENPAY ROTOPLAS) — no afecta campos funcionales.

**Nota separada — corrupción estructural del archivo xlsx**: `gastify-template.xlsx` contiene XML inválido (`<fill/>` vacío en `styles.xml`, y atributos literales `operator="undefined"` en los `dataValidation` de `sheet1.xml`), casi seguro generado por la librería Node.js `xlsx-populate` al escribir/agregar filas (ver `AI_COORDINATION_LOG.md`). Excel lo tolera pero rompe parsers estrictos como `openpyxl`/`pandas`. Ver memoria `gastify-xlsx-corruption` para el detalle técnico y el parche usado para leerlo.

---

## 2. Benchmark de modelos locales (Ollama)

Prueba representativa: página 4 del PDF de HSBC 2Now (50 de las 129 transacciones), enviada como imagen (`pdftoppm`, 200 DPI) vía `/api/generate` de Ollama con el campo `images`, pidiendo el mismo formato JSON estructurado.

| Modelo | Modo | Tiempo | Filas | Errores tipo | Errores fecha | Errores monto | Resultado |
|---|---|---|---|---|---|---|---|
| `qwen3.5:9b` | thinking ON (default) | 16.4 min | 0 | — | — | — | **Falló**: bucle de razonamiento repetitivo, agotó tokens (`done_reason: length`), respuesta final vacía |
| `qwen3.5:9b` | thinking OFF | 57 seg | 50/50 | 2 (incl. $30,094.83 Income clasificado como Bill) | 1 | 1 (2 centavos) | Rápido pero poco confiable |
| `qwen3.6:27b` | thinking OFF | 6.7 min (400s) | 50/50 | 0 | 0 | 0 | **Perfecto** — igualó la precisión de Claude/Gemini |

**Hallazgo clave sobre memoria/hardware**: la lentitud inicial (10+ min sin respuesta) coincidió con el sistema en 35/36GB de RAM usada y ~5-6GB de swap en disco (Chrome + ChatGPT desktop + Claude desktop + VS Code + ~33 pestañas de Safari abiertas simultáneamente). Tras cerrar esas apps y liberar RAM (bajó a 12-24GB usados, swap <1GB), **el cuello de botella real no era memoria sino el modo "thinking"** del modelo entrando en un ciclo repetitivo al toparse con una fecha ambigua en la imagen — no un problema de hardware del Mac (M4 Max, 36GB unificada).

## 3. Conclusión y recomendación

- **`qwen3.6:27b` sí puede hacer este trabajo con la misma calidad que Claude/Gemini**, pero a ~400x más lento (6.7 min vs segundos por página). Para las 23 páginas de los 3 estados de julio, implicaría ~2.5 horas de proceso local vs. ~1 minuto en la nube.
- **`qwen3.5:9b` no es confiable** para esta tarea (falla en modo thinking, comete errores de clasificación en modo directo).
- Siempre correr estos modelos con `think:false` quando la tarea es de extracción estructurada — el modo thinking puede entrar en bucles improductivos en modelos pequeños/medianos ante ambigüedad visual.
- Si la prioridad es velocidad y no gasto cero, una alternativa de nube barata (DeepSeek-Chat V3.2, Qwen-Plus/Turbo) resuelve esto en segundos por centavos de dólar — ver comparación de precios en `AI_COORDINATION_LOG.md` / conversación de referencia.
