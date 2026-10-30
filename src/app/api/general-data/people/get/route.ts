import Person from "@/model/Person";
import { handleRecurring } from "@/lib/recurring/recurringService";
import { presentPerson } from "@/lib/people/peopleService";

// The person's people (the ones not archived first).
export async function POST(request: Request) {
  return handleRecurring(request, async ({ user }) => {
    const docs = await Person.find({ user }).sort({ archived: 1, createdAt: 1 });
    return docs.map(presentPerson);
  });
}
