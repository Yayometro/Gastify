import RecurringExpense from "@/model/RecurringExpense";
import { atNoon, occurrencesBetween } from "@gastify/core/recurring/recurrence";
import { handleRecurring, presentRecurring, readFrequency } from "@/lib/recurring/recurringService";

// Edits a rule: its reference amount, how often, fixed or variable, its end date, or pauses / resumes it.
export async function POST(request: Request) {
  return handleRecurring(request, async ({ user, body }) => {
    const doc = await RecurringExpense.findOne({ _id: body.id, user });
    if (!doc) throw new Error("Recurring expense not found");
    if (typeof body.name === "string" && body.name.trim()) doc.name = body.name.trim();
    if (body.amount !== undefined) {
      const amount = Number(body.amount);
      if (!Number.isFinite(amount) || amount < 0) throw new Error("A valid amount is needed");
      doc.amount = amount;
    }
    if (body.frequency !== undefined) doc.frequency = readFrequency(body.frequency);
    if (body.isVariable !== undefined) doc.isVariable = Boolean(body.isVariable);
    if (body.endDate !== undefined) doc.endDate = body.endDate ? atNoon(body.endDate as string) : null;
    if (body.active !== undefined) {
      const wasPaused = !doc.active;
      doc.active = Boolean(body.active);
      // Resuming does not bring back what fell due while it was paused: it starts again from the next date after today.
      if (wasPaused && doc.active) {
        const past = occurrencesBetween({ frequency: doc.frequency, anchorDate: doc.anchorDate }, doc.lastHandledDate, new Date(), 1);
        if (past.length > 0) doc.lastHandledDate = past[past.length - 1];
        doc.handledKeys = [];
      }
    }
    await doc.save();
    return presentRecurring(doc);
  });
}
