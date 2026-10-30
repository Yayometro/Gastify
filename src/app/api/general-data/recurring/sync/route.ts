import { handleRecurring, syncRecurring } from "@/lib/recurring/recurringService";

// The catch-up: creates the fixed-price charges that fell due and lists the variable ones waiting for an amount.
export async function POST(request: Request) {
  return handleRecurring(request, async ({ user, wallet }) => syncRecurring(user, wallet));
}
