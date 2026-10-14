// While the rest of the history is still loading (see historyWindow.ts), a period that
// starts BEFORE the cutoff of the recent part would show incomplete figures - worse,
// zeros that read as "nothing happened". This says whether a period can be trusted yet.
export interface HistoryProgress {
  historyStatus?: string | null;
  historyCutoff?: string | null;
}

type DateLike = Date | string | number | null | undefined;

export function isHistoryReadyFor(progress: HistoryProgress, ...starts: DateLike[]): boolean {
  // Done, or gave up: nothing more is coming (the pill tells the user it failed).
  if (progress.historyStatus === "complete" || progress.historyStatus === "failed") return true;
  // The recent part has not even arrived: no cutoff to compare with.
  if (!progress.historyCutoff) return true;
  const cutoff = new Date(progress.historyCutoff).getTime();
  if (Number.isNaN(cutoff)) return true;
  return starts.every((start) => {
    if (start === null || start === undefined || start === "") return true;
    const time = new Date(start).getTime();
    return Number.isNaN(time) || time >= cutoff;
  });
}
