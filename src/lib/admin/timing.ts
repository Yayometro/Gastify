// Times an API route and counts its failures. The sample is written after the response goes out (next/server `after`), so the
// person never waits for the metric. A route that throws is counted as failed and the error still reaches Next as before.
import { after } from "next/server";
import { recordRouteTiming } from "./metrics";

export function withRouteTiming<A extends unknown[]>(route: string, handler: (...args: A) => Promise<Response>): (...args: A) => Promise<Response> {
  return async (...args: A): Promise<Response> => {
    const started = performance.now();
    let failed = false;
    try {
      const response = await handler(...args);
      failed = response.status >= 500;
      return response;
    } catch (error) {
      failed = true;
      throw error;
    } finally {
      const ms = performance.now() - started;
      try {
        after(() => recordRouteTiming(route, ms, failed));
      } catch {
        // Not inside a request (tests, scripts): nothing to time against.
      }
    }
  };
}
