// Read-only audit for the multi-currency migration. Never writes anything.
// Reports per-collection counts, missing/invalid amounts, before/after MXN
// totals (should be equal - this is a currency-labeling migration, not a
// value-changing one), and known data-quality issues the migration should
// flag rather than silently paper over.
//
// Usage: node --env-file=.env scripts/audit_multicurrency_migration.js

const mongoose = require('mongoose');

function toMinor(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const report = { generatedAt: new Date().toISOString(), collections: {} };

  // --- Wallets ---
  {
    const wallets = await db.collection('wallets').find({}).toArray();
    report.collections.wallets = {
      total: wallets.length,
      alreadyMigrated: wallets.filter((w) => w.primaryCurrency).length,
      pendingMigration: wallets.filter((w) => !w.primaryCurrency).length,
    };
  }

  // --- Accounts ---
  {
    const accounts = await db.collection('accounts').find({}).toArray();
    const invalidAmount = accounts.filter((a) => typeof a.amount !== 'number' || Number.isNaN(a.amount));
    const beforeTotal = accounts.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
    const afterTotal = accounts.reduce((sum, a) => sum + toMinor(a.amount || 0) / 100, 0);
    report.collections.accounts = {
      total: accounts.length,
      alreadyMigrated: accounts.filter((a) => a.currency && a.balanceMinor !== null && a.balanceMinor !== undefined).length,
      invalidAmount: invalidAmount.length,
      invalidAmountIds: invalidAmount.map((a) => String(a._id)),
      beforeTotalMXN: Math.round(beforeTotal * 100) / 100,
      afterTotalMXN: Math.round(afterTotal * 100) / 100,
      difference: Math.round((beforeTotal - afterTotal) * 100) / 100,
    };
  }

  // --- Transactions ---
  {
    const transactions = await db.collection('transactions').find({}).toArray();
    const invalidAmount = transactions.filter((t) => typeof t.amount !== 'number' || Number.isNaN(t.amount));
    const contradictoryFlags = transactions.filter((t) => t.isBill && t.isIncome);
    const neitherFlag = transactions.filter((t) => !t.isBill && !t.isIncome);
    const alreadyMigrated = transactions.filter((t) => t.kind && t.money && t.money.account && t.money.reporting);
    const beforeTotal = transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const afterTotal = transactions.reduce((sum, t) => sum + toMinor(t.amount || 0) / 100, 0);
    report.collections.transactions = {
      total: transactions.length,
      alreadyMigrated: alreadyMigrated.length,
      pendingMigration: transactions.length - alreadyMigrated.length,
      invalidAmount: invalidAmount.length,
      invalidAmountIds: invalidAmount.slice(0, 20).map((t) => String(t._id)),
      contradictoryIsBillIsIncome: contradictoryFlags.length,
      contradictoryIds: contradictoryFlags.slice(0, 20).map((t) => String(t._id)),
      neitherBillNorIncome: neitherFlag.length,
      neitherIds: neitherFlag.slice(0, 20).map((t) => String(t._id)),
      beforeTotalMXN: Math.round(beforeTotal * 100) / 100,
      afterTotalMXN: Math.round(afterTotal * 100) / 100,
      difference: Math.round((beforeTotal - afterTotal) * 100) / 100,
    };
  }

  // --- Budgets ---
  {
    const budgets = await db.collection('budgets').find({}).toArray();
    let historyEntriesMissingAmounts = 0;
    for (const b of budgets) {
      for (const h of b.history || []) {
        if (typeof h.goalAmount !== 'number' && typeof h.savingAmount !== 'number') {
          historyEntriesMissingAmounts++;
        }
      }
    }
    report.collections.budgets = {
      total: budgets.length,
      alreadyMigrated: budgets.filter((b) => b.goalMoney || b.savingMoney).length,
      historyEntriesMissingAmounts,
    };
  }

  // --- IncomeSources ---
  {
    const incomeSources = await db.collection('incomesources').find({}).toArray();
    report.collections.incomeSources = {
      total: incomeSources.length,
      alreadyMigrated: incomeSources.filter((s) => s.money).length,
    };
  }

  // --- ProjectionSettings ---
  {
    const projectionSettings = await db.collection('projectionsettings').find({}).toArray();
    report.collections.projectionSettings = { total: projectionSettings.length };
  }

  // --- CategoryRules ---
  {
    const categoryRules = await db.collection('categoryrules').find({}).toArray();
    const minGreaterThanMax = categoryRules.filter(
      (r) => typeof r.minAmount === 'number' && typeof r.maxAmount === 'number' && r.minAmount > r.maxAmount
    );
    report.collections.categoryRules = {
      total: categoryRules.length,
      alreadyMigrated: categoryRules.filter((r) => r.amountCurrency && (r.minAmountMinor !== null && r.minAmountMinor !== undefined)).length,
      minGreaterThanMax: minGreaterThanMax.length,
      minGreaterThanMaxIds: minGreaterThanMax.map((r) => String(r._id)),
    };
  }

  // --- Orphan reference check (Accounts/Wallets referenced by Transactions) ---
  {
    const walletIds = new Set((await db.collection('wallets').find({}, { projection: { _id: 1 } }).toArray()).map((w) => String(w._id)));
    const accountIds = new Set((await db.collection('accounts').find({}, { projection: { _id: 1 } }).toArray()).map((a) => String(a._id)));
    const transactions = await db.collection('transactions').find({}, { projection: { wallet: 1, account: 1 } }).toArray();
    const orphanWallet = transactions.filter((t) => t.wallet && !walletIds.has(String(t.wallet)));
    const orphanAccount = transactions.filter((t) => t.account && !accountIds.has(String(t.account)));
    report.orphanReferences = {
      transactionsWithOrphanWallet: orphanWallet.length,
      transactionsWithOrphanAccount: orphanAccount.length,
    };
  }

  console.log(JSON.stringify(report, null, 2));
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
