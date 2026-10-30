import type { IPerson } from "@/model/Person";

// What the screens get of a person: ids as plain strings, nothing of the wallet.
export interface PresentedPerson {
  id: string;
  name: string;
  relationship: string;
  icon: string | null;
  color: string | null;
  categoryId: string | null;
  subCategoryIds: string[];
  tagNames: string[];
  accountId: string | null;
  contact: { pattern: string; days: number[]; frequency: string; typicalMeetingsPerMonth: number | null };
  limit: { amount: number; period: "monthly" | "per_meeting" } | null;
  note: string;
  archived: boolean;
}

export function presentPerson(doc: IPerson): PresentedPerson {
  return {
    id: String(doc._id),
    name: doc.name,
    relationship: doc.relationship,
    icon: doc.icon ?? null,
    color: doc.color ?? null,
    categoryId: doc.category ? String(doc.category) : null,
    subCategoryIds: (doc.subCategories ?? []).map(String),
    tagNames: doc.tagNames ?? [],
    accountId: doc.account ? String(doc.account) : null,
    contact: {
      pattern: doc.contact?.pattern ?? "random",
      days: doc.contact?.days ?? [],
      frequency: doc.contact?.frequency ?? "sporadic",
      typicalMeetingsPerMonth: doc.contact?.typicalMeetingsPerMonth ?? null,
    },
    limit: doc.limit ? { amount: doc.limit.amount, period: doc.limit.period } : null,
    note: doc.note ?? "",
    archived: Boolean(doc.archived),
  };
}

const PATTERNS = ["weekdays", "weekends", "daily", "random", "custom"];
const FREQUENCIES = ["daily", "few_per_week", "weekly", "biweekly", "monthly", "sporadic"];
const RELATIONSHIPS = ["partner", "family", "friend", "coworker", "group", "other"];

export interface PersonInput {
  name?: unknown;
  relationship?: unknown;
  icon?: unknown;
  color?: unknown;
  tagNames?: unknown;
  accountId?: unknown;
  contact?: { pattern?: unknown; days?: unknown; frequency?: unknown; typicalMeetingsPerMonth?: unknown };
  limit?: { amount?: unknown; period?: unknown } | null;
  note?: unknown;
}

// Checks and cleans what the person typed: the fields that are present, in the shape the model wants. Throws a message the
// screen can show.
export function readPersonFields(input: PersonInput, requireName: boolean): Partial<IPerson> {
  const out: Record<string, unknown> = {};
  if (input.name !== undefined || requireName) {
    const name = String(input.name ?? "").trim();
    if (!name || name.length > 40) throw new Error("The name is needed (up to 40 characters)");
    out.name = name;
  }
  if (input.relationship !== undefined) out.relationship = RELATIONSHIPS.includes(String(input.relationship)) ? String(input.relationship) : "other";
  if (input.icon !== undefined) out.icon = input.icon ? String(input.icon) : null;
  if (input.color !== undefined) out.color = input.color ? String(input.color) : null;
  if (input.tagNames !== undefined) out.tagNames = Array.isArray(input.tagNames) ? (input.tagNames as unknown[]).map((tag) => String(tag).trim()).filter(Boolean).slice(0, 20) : [];
  if (input.accountId !== undefined) out.account = input.accountId || null;
  if (input.note !== undefined) out.note = String(input.note ?? "").slice(0, 200);
  if (input.contact) {
    const pattern = PATTERNS.includes(String(input.contact.pattern)) ? String(input.contact.pattern) : "random";
    const frequency = FREQUENCIES.includes(String(input.contact.frequency)) ? String(input.contact.frequency) : "sporadic";
    const days = Array.isArray(input.contact.days) ? (input.contact.days as unknown[]).map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6) : [];
    const typical = Number(input.contact.typicalMeetingsPerMonth);
    out.contact = { pattern, frequency, days, typicalMeetingsPerMonth: Number.isFinite(typical) && typical > 0 ? typical : null };
  }
  if (input.limit !== undefined) {
    const amount = Number(input.limit?.amount);
    out.limit = input.limit && Number.isFinite(amount) && amount > 0 ? { amount, period: input.limit.period === "per_meeting" ? "per_meeting" : "monthly" } : null;
  }
  return out as Partial<IPerson>;
}
