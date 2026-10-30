import RecurringExpense from "@/model/RecurringExpense";
import { handleRecurring, presentRecurring } from "@/lib/recurring/recurringService";

// The person's recurring expenses, with the next date of each.
export async function POST(request: Request) {
  return handleRecurring(request, async ({ user }) => {
    const docs = await RecurringExpense.find({ user }).sort({ createdAt: -1 });
    return docs.map(presentRecurring);
  });
}
