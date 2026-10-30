import Category from "@/model/Category";
import Person from "@/model/Person";
import SubCategory from "@/model/SubCategory";
import { handleRecurring } from "@/lib/recurring/recurringService";
import { presentPerson, readPersonFields } from "@/lib/people/peopleService";

// Creates a person together with the category that stands for them and its sub-categories, in one step. If anything fails
// half way, what was already created is removed again, so no orphan category is left behind.
export async function POST(request: Request) {
  return handleRecurring(request, async ({ user, wallet, body }) => {
    const fields = readPersonFields(body as never, true);
    const subNames = Array.isArray(body.subCategories) ? (body.subCategories as unknown[]).map((name) => String(name).trim()).filter(Boolean).slice(0, 10) : [];
    const created: { category?: { _id: unknown }; subs: { _id: unknown }[] } = { subs: [] };
    try {
      const category = await Category.create({ user, wallet, name: fields.name, icon: fields.icon ?? null, color: fields.color ?? null });
      created.category = category;
      for (const name of [...new Set(subNames)]) {
        const sub = await SubCategory.create({ user, wallet, fatherCategory: category._id, name, icon: fields.icon ?? null, color: fields.color ?? null });
        created.subs.push(sub);
      }
      const person = await Person.create({ ...fields, user, wallet, category: category._id, subCategories: created.subs.map((sub) => sub._id) });
      return presentPerson(person);
    } catch (error) {
      if (created.subs.length) await SubCategory.deleteMany({ _id: { $in: created.subs.map((sub) => sub._id) } });
      if (created.category) await Category.deleteOne({ _id: created.category._id });
      throw error;
    }
  });
}
