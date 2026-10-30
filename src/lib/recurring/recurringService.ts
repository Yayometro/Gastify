import { NextResponse } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import RecurringExpense, { type IRecurringExpense } from "@/model/RecurringExpense";
import User from "@/model/User";
import { getVerifiedSession } from "@/lib/auth/requireVerifiedSession";
import { createTransaction } from "@/lib/transactions/createTransaction";
import {
  atNoon,
  isRecurrenceFrequency,
  nextOccurrenceAfter,
  occurrenceKey,
  planCatchUp,
  type RecurrenceFrequency,
} from "@gastify/core/recurring/recurrence";

// Recurring expenses on the server: the routes' shared session handling, and the catch-up that creates the charges that fell
// due (a fixed price: by itself) or lists the ones that need the person's amount (a variable price).

export interface RecurringContext {
  user: unknown;
  wallet: unknown;
  body: Record<string, unknown>;
}

// Runs a route: verified session -> the person and their wallet (never taken from the body) -> the handler.
export async function handleRecurring(request: Request, run: (context: RecurringContext) => Promise<unknown>): Promise<NextResponse> {
  try {
    const session = await getVerifiedSession(request.headers);
    if (!session) return NextResponse.json({ ok: false, message: "No session" }, { status: 401 });
    await dbConnection();
    const found = await User.findOne({ mail: session.user.email }).lean();
    if (!found) return NextResponse.json({ ok: false, message: "User not found" }, { status: 401 });
    const body = ((await request.json().catch(() => ({}))) || {}) as Record<string, unknown>;
    const data = await run({ user: found._id, wallet: found.wallet, body });
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}

export interface PresentedRecurring {
  id: string;
  name: string;
  amount: number;
  currency: string | null;
  frequency: RecurrenceFrequency;
  isVariable: boolean;
  active: boolean;
  anchorDate: string;
  endDate: string | null;
  nextDueDate: string;
  account: string | null;
  category: string | null;
  subCategory: string | null;
  tags: string[];
}

export function presentRecurring(doc: IRecurringExpense): PresentedRecurring {
  return {
    id: String(doc._id),
    name: doc.name,
    amount: doc.amount,
    currency: doc.currency ?? null,
    frequency: doc.frequency,
    isVariable: Boolean(doc.isVariable),
    active: Boolean(doc.active),
    anchorDate: new Date(doc.anchorDate).toISOString(),
    endDate: doc.endDate ? new Date(doc.endDate).toISOString() : null,
    nextDueDate: nextOccurrenceAfter({ frequency: doc.frequency, anchorDate: doc.anchorDate }, doc.lastHandledDate).toISOString(),
    account: doc.account ? String(doc.account) : null,
    category: doc.category ? String(doc.category) : null,
    subCategory: doc.subCategory ? String(doc.subCategory) : null,
    tags: doc.tags ?? [],
  };
}

export interface PendingRecurring {
  recurringId: string;
  name: string;
  dueDate: string;
  amount: number;
  currency: string | null;
  frequency: RecurrenceFrequency;
}

export interface SyncResult {
  created: number;
  pending: PendingRecurring[];
  skipped: number;
}

function rule(doc: IRecurringExpense) {
  return { frequency: doc.frequency, anchorDate: doc.anchorDate };
}

function isDuplicate(error: unknown): boolean {
  const text = error instanceof Error ? error.message : String(error);
  return text.includes("E11000") || text.includes("duplicate key");
}

async function createCharge(doc: IRecurringExpense, user: unknown, wallet: unknown, due: Date, amount: number): Promise<boolean> {
  try {
    await createTransaction({
      user,
      wallet,
      name: doc.name,
      amount,
      isBill: true,
      isIncome: false,
      date: due,
      account: doc.account ? String(doc.account) : null,
      category: doc.category ? String(doc.category) : null,
      subCategory: doc.subCategory ? String(doc.subCategory) : null,
      tags: doc.tags ?? [],
      budget: doc.budget ? String(doc.budget) : null,
      recurringId: String(doc._id),
      recurringDueDate: due,
    });
    return true;
  } catch (error) {
    // The same occurrence already exists (the catch-up ran twice at once): nothing to do.
    if (isDuplicate(error)) return false;
    throw error;
  }
}

// Creates what fell due for every active rule of the person and lists what still needs an answer.
export async function syncRecurring(user: unknown, wallet: unknown, today: Date = new Date()): Promise<SyncResult> {
  const docs = await RecurringExpense.find({ user, active: true });
  const result: SyncResult = { created: 0, pending: [], skipped: 0 };
  for (const doc of docs) {
    const plan = planCatchUp({
      rule: rule(doc),
      lastHandled: doc.lastHandledDate,
      today,
      isVariable: doc.isVariable,
      active: doc.active,
      endDate: doc.endDate,
      handledKeys: doc.handledKeys,
    });
    result.skipped += plan.skipped;
    for (const due of plan.autoCreate) {
      if (await createCharge(doc, user, wallet, due, doc.amount)) result.created += 1;
    }
    for (const due of plan.pending) {
      result.pending.push({ recurringId: String(doc._id), name: doc.name, dueDate: due.toISOString(), amount: doc.amount, currency: doc.currency ?? null, frequency: doc.frequency });
    }
    // Everything due is created or waiting for an answer: nothing older has to be looked at again.
    if (plan.processedUntil && plan.pending.length === 0) {
      doc.lastHandledDate = plan.processedUntil;
      doc.handledKeys = [];
      await doc.save();
    }
  }
  return result;
}

// The person's answer to one pending occurrence: create the charge with the confirmed amount, or leave that one out.
export async function confirmOccurrence(user: unknown, wallet: unknown, input: { id: string; dueDate: string; amount?: number; skip?: boolean }, today: Date = new Date()): Promise<{ created: boolean }> {
  const doc = await RecurringExpense.findOne({ _id: input.id, user });
  if (!doc) throw new Error("Recurring expense not found");
  const key = occurrenceKey(input.dueDate);
  const plan = planCatchUp({ rule: rule(doc), lastHandled: doc.lastHandledDate, today, isVariable: doc.isVariable, active: true, endDate: doc.endDate, handledKeys: doc.handledKeys });
  if (!plan.pending.some((day) => occurrenceKey(day) === key)) throw new Error("That occurrence is not waiting for an answer");
  let created = false;
  if (!input.skip) {
    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount < 0) throw new Error("A valid amount is needed");
    created = await createCharge(doc, user, wallet, atNoon(input.dueDate), amount);
    doc.amount = amount;
  }
  doc.handledKeys = [...doc.handledKeys, key].slice(-48);
  const after = planCatchUp({ rule: rule(doc), lastHandled: doc.lastHandledDate, today, isVariable: doc.isVariable, active: true, endDate: doc.endDate, handledKeys: doc.handledKeys });
  if (after.pending.length === 0 && after.processedUntil) {
    doc.lastHandledDate = after.processedUntil;
    doc.handledKeys = [];
  }
  await doc.save();
  return { created };
}

export function readFrequency(value: unknown): RecurrenceFrequency {
  if (!isRecurrenceFrequency(value)) throw new Error("Unknown frequency");
  return value;
}
