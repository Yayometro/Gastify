/** API endpoints are never valid dependencies of the public, fictional demo. */
export function isBlockedDemoRequest(input: RequestInfo | URL, baseUrl: string): boolean {
  const requested = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  let pathname: string;
  try {
    pathname = new URL(requested, baseUrl).pathname;
  } catch {
    // Fail closed if a future request source cannot be parsed safely.
    return true;
  }
  return /(^|\/)(api|general-data)(\/|$)/i.test(pathname);
}
