// The daily snapshot: one document per UTC day with the platform totals as they were when the panel last ran that day. It keeps
// the history of the totals (the users and the activity in the past) even where the raw data is later deleted or grows too
// large to recount every time. The panel writes today's snapshot on every visit; the latest one of the day wins.
import { adminDb, SNAPSHOTS_COLLECTION } from "./adminDb";

export interface DailySnapshot {
  day: string;
  users: number;
  transactions: number;
  wau: number;
  mau: number;
}

export async function saveSnapshot(snapshot: DailySnapshot): Promise<void> {
  const db = await adminDb();
  await db.collection(SNAPSHOTS_COLLECTION).updateOne(
    { _id: snapshot.day as never },
    { $set: { ...snapshot, savedAt: new Date() } },
    { upsert: true }
  );
}

// The snapshots from `fromDay` on, oldest first.
export async function readSnapshots(fromDay: string): Promise<DailySnapshot[]> {
  const db = await adminDb();
  const rows = await db
    .collection(SNAPSHOTS_COLLECTION)
    .find({ day: { $gte: fromDay } }, { projection: { _id: 0, savedAt: 0 } })
    .sort({ day: 1 })
    .toArray();
  return rows.map((row) => ({
    day: String(row.day),
    users: Number(row.users),
    transactions: Number(row.transactions),
    wau: Number(row.wau),
    mau: Number(row.mau),
  }));
}
