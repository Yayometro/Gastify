import type { BiggestSpendPatternsData } from "./walletAnalyzer";

// Plain-Spanish bullets from the facts computed about the biggest spending of the last months. Every claim is a direct
// readout of a computed boolean or percentage (the same text the web shows in its analysis).
export function buildSpendPatternAnalysis(patterns: BiggestSpendPatternsData): string[] {
  const { biggestTransaction, biggestCategory, biggestSubcategory, mostCommonCategoryTag, analysis } = patterns;
  const bullets: string[] = [];

  bullets.push(
    analysis.transactionIsInBiggestCategory
      ? `La transacción más grande sí pertenece a la categoría con más gasto (${biggestCategory.name}).`
      : `La transacción más grande NO pertenece a la categoría con más gasto — está en ${biggestTransaction.categoryName}, mientras que la categoría con más gasto es ${biggestCategory.name}.`
  );

  bullets.push(`${biggestCategory.name} representa el ${Math.round(analysis.categoryShareOfTotal)}% de tu gasto total en este periodo.`);

  bullets.push(
    analysis.transactionShareOfCategory >= 50
      ? `Dentro de ${biggestTransaction.categoryName}, esa única transacción representa el ${Math.round(analysis.transactionShareOfCategory)}% del gasto — un gasto aislado, no un patrón recurrente.`
      : `Dentro de ${biggestTransaction.categoryName}, esa transacción es solo el ${Math.round(analysis.transactionShareOfCategory)}% del gasto — la categoría acumula gasto de forma recurrente, no por un solo evento.`
  );

  if (biggestSubcategory) {
    bullets.push(
      analysis.subcategoryBelongsToBiggestCategory
        ? `La subcategoría con más gasto (${biggestSubcategory.name}) sí pertenece a la categoría con más gasto.`
        : `La subcategoría con más gasto (${biggestSubcategory.name}) pertenece a ${biggestSubcategory.categoryName}, una categoría distinta a la de más gasto.`
    );
  }

  if (mostCommonCategoryTag) {
    bullets.push(
      `El tag más frecuente en ${biggestCategory.name} es "${mostCommonCategoryTag.name}" (${mostCommonCategoryTag.count} transacciones)` +
        (analysis.transactionSharesTopCategoryTag
          ? ` — y la transacción más grande también lo tiene.`
          : `, pero la transacción más grande no lo tiene.`)
    );
  }

  return bullets;
}
