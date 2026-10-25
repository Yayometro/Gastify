// Several components dispatch the same initial fetch when they mount (the data
// provider, Dashboard, BudgetCont, TopElementsContainer, AccountClient...). They
// all check `status === "idle"` first, but on a cold page load they mount in the
// same tick, before any of them flips the status, so each one fired its own copy
// of the request: 5 copies of the 7 MB movements list on one dashboard load.
// With this `condition` a dispatch is dropped while the same slice is already
// loading; a later refresh (status "succeeded"/"failed") still goes through.
export function skipWhileLoading(sliceKey: string) {
  return {
    condition: (_arg: unknown, { getState }: { getState: () => unknown }): boolean => {
      const slice = (getState() as Record<string, { status?: string } | undefined>)[sliceKey];
      return slice?.status !== "loading";
    },
  };
}
