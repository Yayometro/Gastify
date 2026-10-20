/* eslint-disable @typescript-eslint/no-explicit-any */
// Client for the Gastify API (the routes under /api/). The web app and the mobile
// app call configureApi() once at startup; slices use lazyApi(), which reads that
// configuration when a request is made, not when the module is loaded.

export interface ApiClient {
  get: <T = any>(path: string) => Promise<T>;
  post: <T = any>(path: string, content?: unknown) => Promise<T>;
  getFullPath: (path: string) => string;
}

export interface ApiConfig {
  // "" means same origin (the web app). The mobile app passes the full Vercel URL.
  baseUrl: string;
  // Extra headers for every request (the mobile app adds its session cookie here).
  getHeaders?: () => Record<string, string> | Promise<Record<string, string>>;
}

let config: ApiConfig = { baseUrl: "" };

export function configureApi(next: Partial<ApiConfig>): void {
  config = { ...config, ...next };
}

export function createApiClient(overrides: Partial<ApiConfig> = {}): ApiClient {
  const { baseUrl, getHeaders } = { ...config, ...overrides };
  const fullPath = baseUrl.concat("/api/");

  const headersFor = async (): Promise<Record<string, string>> => ({
    "Content-Type": "application/json",
    ...((await getHeaders?.()) ?? {}),
  });

  return {
    get: async function <T = any>(path: string): Promise<T> {
      try {
        const res = await fetch(fullPath.concat(path), { method: "GET", headers: await headersFor() });
        return (await res.json()) as T;
      } catch (e) {
        throw new Error(e as unknown as string);
      }
    },
    post: async function <T = any>(path: string, content?: unknown): Promise<T> {
      try {
        const res = await fetch(fullPath.concat(path), {
          method: "POST",
          headers: await headersFor(),
          body: JSON.stringify(content),
        });
        if (!res) throw new Error("No data from response");
        return (await res.json()) as T;
      } catch (e) {
        // The caller decides what to show; this only rethrows, like the web fetcher always did.
        throw new Error(e as unknown as string);
      }
    },
    getFullPath: (path: string) => fullPath.concat(path),
  };
}

export function getApi(): ApiClient {
  return createApiClient();
}

// Same surface as getApi(), but created on each call, so a slice can keep its
// `const toFetch = lazyApi();` line at the top of the file.
export function lazyApi(): ApiClient {
  return {
    get: (path) => getApi().get(path),
    post: (path, content) => getApi().post(path, content),
    getFullPath: (path) => getApi().getFullPath(path),
  };
}
