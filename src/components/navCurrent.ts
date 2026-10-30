// Which tab of the navigation bar is current for a path. A tab is current on its own page and on the pages under it
// (/dashboard/budgets/x is Budgets). The section's home (the wallet, "/dashboard", or "/demo" in the demo) is current on its own
// page only: it is the home of every page below it, so a prefix match would make it current everywhere.
export function isNavCurrent(pathname: string, target: string, home: string): boolean {
  if (target === home) return pathname === target;
  return pathname === target || pathname.startsWith(`${target}/`);
}
