import Category from "@/model/Category";
import Person from "@/model/Person";
import SubCategory from "@/model/SubCategory";
import Transaction from "@/model/Transaction";
import { handleRecurring } from "@/lib/recurring/recurringService";

// Deletes a person. `deleteCategory: false` keeps their category (and its movements); `true` deletes the category and its
// sub-categories and leaves the movements without a category. Movements are never deleted.
export async function POST(request: Request) {
  return handleRecurring(request, async ({ user, body }) => {
    const doc = await Person.findOne({ _id: body.id, user });
    if (!doc) throw new Error("Person not found");
    if (body.deleteCategory === true && doc.category) {
      const subIds = doc.subCategories ?? [];
      await Transaction.updateMany({ user, category: doc.category }, { $set: { category: null, subCategory: null } });
      if (subIds.length) await Transaction.updateMany({ user, subCategory: { $in: subIds } }, { $set: { subCategory: null } });
      await SubCategory.deleteMany({ _id: { $in: subIds }, user });
      await Category.deleteOne({ _id: doc.category, user });
    }
    await Person.deleteOne({ _id: doc._id, user });
    return { id: String(doc._id) };
  });
}
