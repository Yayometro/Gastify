import RecurringExpense from "@/model/RecurringExpense";
import { atNoon } from "@gastify/core/recurring/recurrence";
import { handleRecurring, presentRecurring, readFrequency } from "@/lib/recurring/recurringService";

// Makes a recurring expense from the charge the person just created: it repeats from that date on.
export async function POST(request: Request) {
  return handleRecurring(request, async ({ user, wallet, body }) => {
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount < 0) throw new Error("A valid amount is needed");
    if (!body.anchorDate) throw new Error("The date of the first charge is needed");
    const anchor = atNoon(body.anchorDate as string);
    if (Number.isNaN(anchor.getTime())) throw new Error("The date is not valid");
    const doc = await RecurringExpense.create({
      user,
      wallet,
      name: String(body.name || "").trim() || "Recurring expense",
      amount,
      currency: typeof body.currency === "string" ? body.currency : undefined,
      account: body.account || null,
      category: body.category || null,
      subCategory: body.subCategory || null,
      budget: body.budget || null,
      tags: Array.isArray(body.tags) ? (body.tags as unknown[]).map((tag) => String(tag).trim()).filter(Boolean) : [],
      frequency: readFrequency(body.frequency),
      anchorDate: anchor,
      lastHandledDate: anchor,
      isVariable: Boolean(body.isVariable),
      active: true,
      endDate: body.endDate ? atNoon(body.endDate as string) : null,
      sourceTransaction: body.sourceTransactionId || null,
    });
    return presentRecurring(doc);
  });
}
