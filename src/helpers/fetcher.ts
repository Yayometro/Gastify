// The API client now lives in packages/core (shared with the mobile app). This wrapper keeps
// the web imports unchanged and reads the API base URL from the web environment.
import { createApiClient, type ApiClient } from "@gastify/core/api/client";

export type FetcherInstance = ApiClient;

export default function fetcher(): FetcherInstance {
  return createApiClient({ baseUrl: process.env.NEXT_PUBLIC_API_ROUTE ?? "" });
}
