// A second tap on a section that is already open (a tab of the bar, or one of its two extra sections): the page scrolls
// to its top and refreshes, as the bars of the big social apps do. Each page listens for the path it shows.
type Listener = (path: string) => void;

const listeners = new Set<Listener>();

export function emitTabReselect(path: string): void {
  listeners.forEach((listener) => listener(path));
}

export function onTabReselect(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
