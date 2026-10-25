// Performance marks and the history debug delay, as hooks the app can fill in.
// Core does not touch `performance` or localStorage itself: the web app installs
// its real implementations at startup (src/lib/store.ts); elsewhere they do nothing.

export interface PerfHooks {
  mark: (name: string, once?: boolean) => void;
  delay: (key: string) => Promise<void>;
}

let hooks: PerfHooks = {
  mark: () => {},
  delay: async () => {},
};

export function configurePerf(next: Partial<PerfHooks>): void {
  hooks = { ...hooks, ...next };
}

export function perfMark(name: string, once = true): void {
  hooks.mark(name, once);
}

export function debugDelay(key: string): Promise<void> {
  return hooks.delay(key);
}
