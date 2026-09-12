import User from "@/model/User";
import Wallet from "@/model/Wallet";
import Account from "@/model/Account";
import Transaction from "@/model/Transaction";
import Category from "@/model/Category";
import SubCategory from "@/model/SubCategory";
import Tag from "@/model/Tag";
import Budget from "@/model/Budget";

// The starter Wallet/Account/Category/SubCategory/Tag/Budget/Transaction a
// brand-new user needs to land on a non-empty dashboard - extracted out of
// the old `/api/register` route (which only ran for the manual email/
// password form) so it can also run for a user's first-ever OAuth sign-in,
// via Better Auth's `databaseHooks.user.create.after`. Before this, OAuth
// first-login provisioning was a second, hand-maintained copy of this same
// logic inside the old NextAuth `signIn` callback (a `fetch("/api/register")`
// call) - one function now, shared by every signup path.
export async function provisionNewUserData(user) {
  const fullName = user.fullName || user.name || "New user";
  // Better Auth's own user objects expose the id as `.id` (a string), not
  // Mongoose's `._id` - `user._id` is silently `undefined` here, and
  // Mongoose drops an undefined value from a save instead of throwing,
  // which is exactly how this went unnoticed: every document below saved
  // "successfully" with its `wallet` link intact but its `user` link
  // missing entirely. Resolving it once, up front, is what the single
  // `user._id || user.id` fallback on the old /api/register route's
  // post-save update was already doing correctly - it just needed to be
  // the one true id used everywhere else in this function too.
  const userId = user._id || user.id;

  const newAssociateWallet = new Wallet({
    name: `${fullName} Wallet`,
    cash: 0,
  });
  const newAssociateAccount = new Account({
    name: `${fullName} General Account`,
    amount: Number(0),
  });
  const firstAssociateTransaction = new Transaction({
    name: `${fullName} first transaction`,
    amount: Number(1),
    isIncome: true,
    isReadable: true,
    date: new Date(),
  });
  const fisrtAssociateCategory = new Category({
    name: `${fullName} First Category`,
  });
  const fisrtAssociateSubCategory = new SubCategory({
    name: `${fullName} First Sub Category`,
  });
  const fisrtAssociateTag = new Tag({
    name: `${fullName} First Tag`,
    user: userId,
  });
  const firstBudget = new Budget({
    name: `${fullName} First Budget`,
    goalAmount: 1,
    isSurpassed: false,
    isSaving: false,
    savingAmount: 0,
  });

  // Associations - same wiring the old /api/register route did.
  newAssociateWallet.user = userId;
  newAssociateWallet.budget.totalBudget = 1000;
  newAssociateWallet.budget.totalSavings = 1000;
  newAssociateWallet.budget.isSaved = false;
  newAssociateWallet.budget.isSurpassed = false;

  newAssociateAccount.user = userId;
  newAssociateAccount.wallet = newAssociateWallet._id;

  firstBudget.user = userId;
  firstBudget.wallet = newAssociateWallet._id;
  firstBudget.category = fisrtAssociateCategory._id;
  firstBudget.subCategory = fisrtAssociateSubCategory._id;

  firstAssociateTransaction.user = userId;
  firstAssociateTransaction.wallet = newAssociateWallet._id;
  firstAssociateTransaction.account = newAssociateAccount._id;
  firstAssociateTransaction.category = fisrtAssociateCategory._id;
  firstAssociateTransaction.subCategory = fisrtAssociateSubCategory._id;
  firstAssociateTransaction.tags.push(fisrtAssociateTag._id);

  fisrtAssociateCategory.user = userId;
  fisrtAssociateCategory.wallet = newAssociateWallet._id;
  fisrtAssociateCategory.accounts.push(newAssociateAccount._id);
  fisrtAssociateCategory.icon = "fa/FaTags";

  fisrtAssociateSubCategory.user = userId;
  fisrtAssociateSubCategory.wallet = newAssociateWallet._id;
  fisrtAssociateSubCategory.fatherCategory = fisrtAssociateCategory._id;
  fisrtAssociateSubCategory.icon = "fa/FaTag";

  fisrtAssociateTag.user = userId;
  fisrtAssociateTag.wallet = newAssociateWallet._id;

  const savedWallet = await newAssociateWallet.save();
  if (!savedWallet) throw new Error("No WALLET was saved creating a NEW USER ❌");
  const savedAccount = await newAssociateAccount.save();
  if (!savedAccount) throw new Error("No ACCOUNT was saved creating a NEW USER ❌");
  const savedBudget = await firstBudget.save();
  if (!savedBudget) throw new Error("No BUDGET was saved creating a NEW USER ❌");
  const savedTransaction = await firstAssociateTransaction.save();
  if (!savedTransaction) throw new Error("No TRANSACTION was saved creating a NEW USER ❌");
  const savedCategory = await fisrtAssociateCategory.save();
  if (!savedCategory) throw new Error("No CATEGORY was saved creating a NEW USER ❌");
  const savedSubCategory = await fisrtAssociateSubCategory.save();
  if (!savedSubCategory) throw new Error("No SUB-CATEGORY was saved creating a NEW USER ❌");
  const savedTag = await fisrtAssociateTag.save();
  if (!savedTag) throw new Error("No TAG was saved creating a NEW USER ❌");

  // Better Auth already created the `user` document by the time this hook
  // runs (unlike the old /api/register flow, which set `newUser.wallet`
  // before the user's own first save) - so the wallet link is a follow-up
  // update instead.
  await User.findByIdAndUpdate(userId, { wallet: savedWallet._id });

  return { wallet: savedWallet };
}
