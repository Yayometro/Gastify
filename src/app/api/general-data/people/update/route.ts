import Person from "@/model/Person";
import { handleRecurring } from "@/lib/recurring/recurringService";
import { presentPerson, readPersonFields } from "@/lib/people/peopleService";

// Edits a person (what they are about, how often they are seen, the limit) or archives / restores them.
export async function POST(request: Request) {
  return handleRecurring(request, async ({ user, body }) => {
    const doc = await Person.findOne({ _id: body.id, user });
    if (!doc) throw new Error("Person not found");
    doc.set(readPersonFields(body as never, false));
    if (body.archived !== undefined) doc.archived = Boolean(body.archived);
    await doc.save();
    return presentPerson(doc);
  });
}
