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
