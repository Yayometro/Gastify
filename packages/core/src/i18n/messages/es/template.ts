// Texts of the "template" namespace: the Excel template people download to import their movements. Spanish is the source text.
// The import reads the file by column position, not by header name, so these words can change without breaking an import.
const template = {
  "template.sheet": "Movimientos",
  "template.header.date": "Fecha *",
  "template.header.concept": "Concepto *",
  "template.header.accountAmount": "Monto en cuenta *",
  "template.header.accountCurrency": "Moneda de la cuenta",
  "template.header.type": "Tipo (Gasto/Ingreso) *",
  "template.header.category": "Categoría",
  "template.header.subCategory": "Subcategoría",
  "template.header.tags": "Etiquetas (separadas por coma)",
  "template.header.account": "Cuenta",
  "template.header.merchantAmount": "Monto del comercio",
  "template.header.merchantCurrency": "Moneda del comercio",
  "template.header.reportingAmount": "Monto de referencia",
  "template.header.reportingCurrency": "Moneda de referencia",
  "template.header.fxSource": "Fuente del tipo de cambio",
  "template.type.bill": "Gasto",
  "template.type.income": "Ingreso",
  "template.note":
    "📌 OBLIGATORIO: Fecha, Concepto, Monto en cuenta y Tipo (* = obligatorio). Si el Tipo está vacío, se toma como Gasto. " +
    "Moneda de la cuenta: obligatoria si no eliges una Cuenta (si está vacía y no hay Cuenta, se usa la moneda principal de tu billetera); " +
    "si eliges una Cuenta, debe coincidir con la moneda de esa cuenta o dejarse vacía. " +
    "Llena Categoría O Subcategoría, no ambas. Monto del comercio necesita Moneda del comercio (y al revés): llénalos solo si te cobraron en una moneda distinta a la de tu cuenta. " +
    "Monto de referencia es el equivalente exacto en la moneda principal de tu billetera, si ya lo conoces; su moneda debe ser esa misma moneda principal. " +
    "Déjalos vacíos para que Gastify lo estime con tipos de cambio históricos. " +
    "Fuente del tipo de cambio: déjala vacía para una estimación automática, o escribe \"manual\" si el Monto de referencia es un valor exacto que tú escribes.",
  "template.example.concept": "Movimiento de ejemplo",
  "template.example.tags": "etiqueta1, etiqueta2",
  "template.validation.typeTitle": "Tipo no válido",
  "template.validation.currencyTitle": "Moneda no válida",
  "template.validation.categoryTitle": "Categoría no válida",
  "template.validation.subCategoryTitle": "Subcategoría no válida",
  "template.validation.accountTitle": "Cuenta no válida",
} as const;

export default template;
