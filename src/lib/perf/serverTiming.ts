// Collects named durations for one request and renders them as a standard
// `Server-Timing` header, which Chrome DevTools shows in the Network tab
// (Timing -> Server Timing). Cheap enough to leave on in production.
export interface ServerTimer {
  // Measures an async step and returns its result.
  time<T>(name: string, fn: () => Promise<T> | T): Promise<T>;
  // Records a duration measured elsewhere (milliseconds).
  add(name: string, ms: number): void;
  header(): string;
}

export function createServerTimer(): ServerTimer {
  const entries: { name: string; ms: number }[] = [];
  return {
    async time<T>(name: string, fn: () => Promise<T> | T): Promise<T> {
      const start = performance.now();
      try {
        return await fn();
      } finally {
        entries.push({ name, ms: performance.now() - start });
      }
    },
    add(name: string, ms: number) {
      entries.push({ name, ms });
    },
    header() {
      return entries.map((e) => `${e.name};dur=${e.ms.toFixed(1)}`).join(", ");
    },
  };
}
