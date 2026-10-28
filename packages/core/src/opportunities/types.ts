export type OpportunityDateRange = { startDate: string; endDate: string; complete: boolean };
export type OpportunityDimension = "all" | "category" | "subcategory" | "tag" | "concept";

export interface OpportunityFilters {
  includeAllExpenses?: boolean;
  categoryIds?: string[];
  subCategoryIds?: string[];
  tagIds?: string[];
  conceptQuery?: string;
  /** A reporting value is accepted only when it is denominated in this currency. */
  primaryCurrency?: string;
}

export interface OpportunitySelection {
  id: string;
  name: string;
  dimension: OpportunityDimension;
  amountMinor: number;
  currency: string;
  transactionIds: string[];
  count: number;
  refundMinor: number;
  unmatchedRefundCount: number;
  feeMinor: number;
  partial: boolean;
  range: OpportunityDateRange;
}

export interface OpportunityScenario {
  principalMinor: number;
  currency: string;
  goalTargetMinor?: number;
  goalSavedMinor?: number;
  goalRemainingMinor?: number;
  goalCoverage?: number;
  scenarioPercent: number;
}
