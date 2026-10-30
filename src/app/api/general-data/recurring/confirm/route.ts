import { confirmOccurrence, handleRecurring } from "@/lib/recurring/recurringService";

// The person's answer to a pending variable charge: confirm it with its amount, or leave that one out.
export async function POST(request: Request) {
  return handleRecurring(request, async ({ user, wallet, body }) =>
    confirmOccurrence(user, wallet, { id: String(body.id), dueDate: String(body.dueDate), amount: body.amount as number | undefined, skip: Boolean(body.skip) })
  );
}
