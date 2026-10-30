import RecurringExpense from "@/model/RecurringExpense";
import { handleRecurring } from "@/lib/recurring/recurringService";

// Deletes the rule. The charges it already created stay as ordinary transactions.
export async function POST(request: Request) {
  return handleRecurring(request, async ({ user, body }) => {
    const removed = await RecurringExpense.findOneAndDelete({ _id: body.id, user });
    if (!removed) throw new Error("Recurring expense not found");
    return { id: String(removed._id) };
  });
}
