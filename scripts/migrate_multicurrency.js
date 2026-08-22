// Multi-currency migration. DRY RUN BY DEFAULT - pass --confirm to actually
// write. Migrates all legacy monetary values as MXN, rate 1, exact/
// non-estimated (source: "legacy_migration"), per section 21 of
// .mds/MULTI_CURRENCY_IMPLEMENTATION_PLAN.md.
//
// Idempotent: skips documents that already look migrated. Safe to re-run.
// Never deletes or overwrites legacy fields - purely additive writes.
//
// Usage:
//   node --env-file=.env scripts/migrate_multicurrency.js                (dry run)
//   node --env-file=.env scripts/migrate_multicurrency.js --confirm      (writes)

const mongoose = require('mongoose');

const CONFIRM = process.argv.includes('--confirm');
const BATCH_SIZE = 200;

function toMinor(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

function legacyReportingMoney(amountMinor, effectiveDate) {
  return {
    amountMinor,
    currency: 'MXN',
    rate: '1',
    source: 'legacy_migration',
    effectiveDate: effectiveDate || new Date(),
    estimated: false,
  };
}

async function migrateWallets(db, counters) {
  const cursor = db.collection('wallets').find({ primaryCurrency: { $exists: false } });
  let batch = [];
  const flush = async () => {
    if (batch.length === 0) return;
    counters.wallets.wouldWrite += batch.length;
    if (CONFIRM) {
      const ops = batch.map((id) => ({
        updateOne: {
          filter: { _id: id },
          update: { $set: { primaryCurrency: 'MXN', currencyUpdatedAt: new Date() } },
        },
      }));
      await db.collection('wallets').bulkWrite(ops);
    }
    batch = [];
  };
  for await (const doc of cursor) {
    batch.push(doc._id);
    if (batch.length >= BATCH_SIZE) await flush();
  }
  await flush();
}

async function migrateAccounts(db, counters) {
  const cursor = db.collection('accounts').find({
    $or: [{ currency: { $exists: false } }, { balanceMinor: { $exists: false } }, { balanceMinor: null }],
  });
  let batch = [];
  const flush = async () => {
    if (batch.length === 0) return;
    counters.accounts.wouldWrite += batch.length;
    if (CONFIRM) {
      const ops = batch.map((doc) => ({
        updateOne: {
          filter: { _id: doc._id },
          update: {
            $set: {
              currency: 'MXN',
              balanceMinor: toMinor(doc.amount || 0),
              balanceUpdatedAt: new Date(),
              schemaVersion: 1,
            },
          },
        },
      }));
      await db.collection('accounts').bulkWrite(ops);
    }
    batch = [];
  };
  for await (const doc of cursor) {
    batch.push(doc);
    if (batch.length >= BATCH_SIZE) await flush();
  }
  await flush();
}

async function migrateTransactions(db, counters) {
  const cursor = db.collection('transactions').find({
    $or: [{ kind: { $exists: false } }, { 'money.account': { $exists: false } }],
  });
  let batch = [];
  const flush = async () => {
    if (batch.length === 0) return;
    counters.transactions.wouldWrite += batch.length;
    if (CONFIRM) {
      const ops = batch.map((doc) => {
        const amountMinor = toMinor(doc.amount || 0);
        // Tie-breaker matches the Transaction model's pre-validate hook:
        // isIncome wins when both isBill and isIncome are true.
        const kind = doc.isIncome ? 'income' : 'expense';
        const direction = kind === 'income' ? 'credit' : 'debit';
        return {
          updateOne: {
            filter: { _id: doc._id },
            update: {
              $set: {
                kind,
                direction,
                state: 'completed',
                money: {
                  account: { amountMinor, currency: 'MXN' },
                  reporting: legacyReportingMoney(amountMinor, doc.date),
                },
                schemaVersion: 1,
              },
            },
          },
        };
      });
      await db.collection('transactions').bulkWrite(ops);
    }
    batch = [];
  };
  for await (const doc of cursor) {
    batch.push(doc);
    if (batch.length >= BATCH_SIZE) await flush();
  }
  await flush();
}

async function migrateBudgets(db, counters) {
  const cursor = db.collection('budgets').find({
    $or: [{ goalMoney: { $exists: false } }, { goalMoney: null }],
  });
  let batch = [];
  const flush = async () => {
    if (batch.length === 0) return;
    counters.budgets.wouldWrite += batch.length;
    if (CONFIRM) {
      const ops = batch.map((doc) => {
        const goalAmountMinor = toMinor(doc.goalAmount || 0);
        const savingAmountMinor = toMinor(doc.savingAmount || 0);
        const migratedHistory = (doc.history || []).map((h) => ({
          ...h,
          goalMoney: { amountMinor: toMinor(h.goalAmount || 0), currency: 'MXN' },
          savingMoney: { amountMinor: toMinor(h.savingAmount || 0), currency: 'MXN' },
        }));
        return {
          updateOne: {
            filter: { _id: doc._id },
            update: {
              $set: {
                goalMoney: { amountMinor: goalAmountMinor, currency: 'MXN' },
                savingMoney: { amountMinor: savingAmountMinor, currency: 'MXN' },
                history: migratedHistory,
              },
            },
          },
        };
      });
      await db.collection('budgets').bulkWrite(ops);
    }
    batch = [];
  };
  for await (const doc of cursor) {
    batch.push(doc);
    if (batch.length >= BATCH_SIZE) await flush();
  }
  await flush();
}

async function migrateIncomeSources(db, counters) {
  const cursor = db.collection('incomesources').find({ money: { $exists: false } });
  let batch = [];
  const flush = async () => {
    if (batch.length === 0) return;
    counters.incomeSources.wouldWrite += batch.length;
    if (CONFIRM) {
      const ops = batch.map((doc) => {
        const migratedHistory = (doc.history || []).map((h) => ({
          ...h,
          money: { amountMinor: toMinor(h.amount || 0), currency: 'MXN' },
        }));
        return {
          updateOne: {
            filter: { _id: doc._id },
            update: {
              $set: {
                money: { amountMinor: toMinor(doc.amount || 0), currency: 'MXN' },
                history: migratedHistory,
              },
            },
          },
        };
      });
      await db.collection('incomesources').bulkWrite(ops);
    }
    batch = [];
  };
  for await (const doc of cursor) {
    batch.push(doc);
    if (batch.length >= BATCH_SIZE) await flush();
  }
  await flush();
}

async function migrateProjectionSettings(db, counters) {
  const cursor = db.collection('projectionsettings').find({});
  let batch = [];
  const flush = async () => {
    if (batch.length === 0) return;
    if (CONFIRM) {
      const ops = batch
        .filter((doc) => {
          const balancesDone = (doc.monthlyBalances || []).every((m) => m.money);
          const buffersDone = (doc.monthlyBuffers || []).every((m) => m.expenseMoney && m.incomeMoney);
          return !balancesDone || !buffersDone;
        })
        .map((doc) => {
          const monthlyBalances = (doc.monthlyBalances || []).map((m) => ({
            ...m,
            money: m.money || { amountMinor: toMinor(m.balance || 0), currency: 'MXN' },
          }));
          const monthlyBuffers = (doc.monthlyBuffers || []).map((m) => ({
            ...m,
            expenseMoney: m.expenseMoney || { amountMinor: toMinor(m.unexpectedBuffer || 0), currency: 'MXN' },
            incomeMoney: m.incomeMoney || { amountMinor: toMinor(m.unexpectedIncomeBuffer || 0), currency: 'MXN' },
          }));
          return {
            updateOne: {
              filter: { _id: doc._id },
              update: { $set: { monthlyBalances, monthlyBuffers } },
            },
          };
        });
      counters.projectionSettings.wouldWrite += ops.length;
      if (ops.length > 0) await db.collection('projectionsettings').bulkWrite(ops);
    } else {
      const pending = batch.filter((doc) => {
        const balancesDone = (doc.monthlyBalances || []).every((m) => m.money);
        const buffersDone = (doc.monthlyBuffers || []).every((m) => m.expenseMoney && m.incomeMoney);
        return !balancesDone || !buffersDone;
      });
      counters.projectionSettings.wouldWrite += pending.length;
    }
    batch = [];
  };
  for await (const doc of cursor) {
    batch.push(doc);
    if (batch.length >= BATCH_SIZE) await flush();
  }
  await flush();
}

async function migrateCategoryRules(db, counters) {
  const cursor = db.collection('categoryrules').find({
    $or: [{ amountCurrency: { $exists: false } }, { minAmountMinor: { $exists: false } }],
  });
  let batch = [];
  const flush = async () => {
    if (batch.length === 0) return;
    counters.categoryRules.wouldWrite += batch.length;
    if (CONFIRM) {
      const ops = batch.map((doc) => ({
        updateOne: {
          filter: { _id: doc._id },
          update: {
            $set: {
              amountCurrency: 'MXN',
              minAmountMinor: doc.minAmount !== undefined && doc.minAmount !== null ? toMinor(doc.minAmount) : null,
              maxAmountMinor: doc.maxAmount !== undefined && doc.maxAmount !== null ? toMinor(doc.maxAmount) : null,
            },
          },
        },
      }));
      await db.collection('categoryrules').bulkWrite(ops);
    }
    batch = [];
  };
  for await (const doc of cursor) {
    batch.push(doc);
    if (batch.length >= BATCH_SIZE) await flush();
  }
  await flush();
}

async function main() {
  console.log(CONFIRM ? '*** WRITE MODE (--confirm) ***' : 'DRY RUN (pass --confirm to write)');
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const counters = {
    wallets: { wouldWrite: 0 },
    accounts: { wouldWrite: 0 },
    transactions: { wouldWrite: 0 },
    budgets: { wouldWrite: 0 },
    incomeSources: { wouldWrite: 0 },
    projectionSettings: { wouldWrite: 0 },
    categoryRules: { wouldWrite: 0 },
  };

  await migrateWallets(db, counters);
  await migrateAccounts(db, counters);
  await migrateTransactions(db, counters);
  await migrateBudgets(db, counters);
  await migrateIncomeSources(db, counters);
  await migrateProjectionSettings(db, counters);
  await migrateCategoryRules(db, counters);

  console.log(JSON.stringify({ mode: CONFIRM ? 'write' : 'dry-run', counters }, null, 2));

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
