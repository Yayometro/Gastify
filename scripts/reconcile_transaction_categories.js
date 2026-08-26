// Reconciles Transaction.category (a denormalized snapshot taken at
// transaction-creation time) against the live SubCategory.fatherCategory
// relationship. Needed because reparenting a subcategory (moving it to a
// different parent Category) never used to update transactions that were
// already tagged with that subcategory - they kept the OLD parent forever,
// which is why moved subcategories still showed up under their old category
// in every widget. The subcategory/update API route now backfills this
// automatically going forward; this script is a one-time fix for whatever
// mismatches already exist in the live database from before that fix.
//
// Dry-run by default - only reports what it would change. Pass --confirm to
// actually write.
//
// Usage:
//   node --env-file=.env scripts/reconcile_transaction_categories.js
//   node --env-file=.env scripts/reconcile_transaction_categories.js --confirm

const mongoose = require('mongoose');

const CONFIRM = process.argv.includes('--confirm');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const subCategories = await db.collection('subcategories').find({}).toArray();
  console.log(`Found ${subCategories.length} subcategories.\n`);

  let totalMismatched = 0;
  const report = [];

  for (const sub of subCategories) {
    if (!sub.fatherCategory) continue;
    const mismatched = await db
      .collection('transactions')
      .find({
        subCategory: sub._id,
        category: { $ne: sub.fatherCategory },
      })
      .toArray();

    if (mismatched.length === 0) continue;

    totalMismatched += mismatched.length;
    report.push({
      subCategoryId: String(sub._id),
      subCategoryName: sub.name,
      correctFatherCategory: String(sub.fatherCategory),
      mismatchedTransactionCount: mismatched.length,
      mismatchedTransactionIds: mismatched.map((t) => String(t._id)),
      staleCategoriesFound: [...new Set(mismatched.map((t) => String(t.category)))],
    });
  }

  console.log(`Subcategories with stale transaction.category: ${report.length}`);
  console.log(`Total mismatched transactions: ${totalMismatched}\n`);
  console.log(JSON.stringify(report, null, 2));

  if (!CONFIRM) {
    console.log('\nDry run only - no writes made. Re-run with --confirm to apply fixes.');
    return;
  }

  console.log('\n--confirm passed - applying fixes...');
  for (const entry of report) {
    const result = await db.collection('transactions').updateMany(
      { subCategory: new mongoose.Types.ObjectId(entry.subCategoryId), category: { $ne: new mongoose.Types.ObjectId(entry.correctFatherCategory) } },
      { $set: { category: new mongoose.Types.ObjectId(entry.correctFatherCategory) } }
    );
    console.log(`  ${entry.subCategoryName}: matched ${result.matchedCount}, modified ${result.modifiedCount}`);
  }
  console.log('\nDone.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
