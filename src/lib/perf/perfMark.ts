// Named point in time of the page load (`performance.mark`), readable later from
// DevTools (Performance panel) or `performance.getEntriesByType("mark")`.
// Set `localStorage.gfPerf = "1"` to also log each mark to the console.
const logged = new Set<string>();

export function perfMark(name: string, once = true): void {
  if (typeof performance === "undefined") return;
  if (once && logged.has(name)) return;
  logged.add(name);
  try {
    performance.mark(name);
  } catch {
    // Marks are best-effort; never break the page for them.
  }
  try {
    if (localStorage.getItem("gfPerf") === "1") {
      console.log(`[perf] ${name} @ ${Math.round(performance.now())} ms`);
    }
  } catch {
    // localStorage may be unavailable (private mode).
  }
}

// Debug aid: `localStorage.gfHistoryDelayMs = "30000"` makes the background history
// request wait that long first, to see how each screen behaves while only the recent
// months are loaded. Nothing happens unless the key is set by hand.
export async function debugDelay(key: string): Promise<void> {
  try {
    const ms = Number(localStorage.getItem(key));
    if (Number.isFinite(ms) && ms > 0) await new Promise((resolve) => setTimeout(resolve, ms));
  } catch {
    // localStorage unavailable (private mode, server): no delay.
  }
}
