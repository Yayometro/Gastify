/* eslint-disable @typescript-eslint/no-explicit-any */
// Client for the Gastify API (the routes under /api/). The web app and the mobile
// app call configureApi() once at startup; slices use lazyApi(), which reads that
// configuration when a request is made, not when the module is loaded.
import type { SessionStatus, StepUpReason } from "../auth/sessionStatus";

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
  // Left out on the web (the browser default). The mobile app sets "omit": it sends the session
  // cookie by hand in the Cookie header and the platform cookie jar must not interfere.
  credentials?: "omit" | "same-origin" | "include";
  // Called when a data route refuses the session because the second factor needs confirming again. The screen sends the
  // person to the verification with the reason, so it can say why (see checkStepUp below).
  onStepUpRequired?: (reason: StepUpReason) => void;
}

let config: ApiConfig = { baseUrl: "" };

// The check runs at most this often: a burst of failing requests asks the server once, not once per request.
const STEP_UP_CHECK_GAP_MS = 5_000;
let lastStepUpCheck = 0;

export function configureApi(next: Partial<ApiConfig>): void {
  config = { ...config, ...next };
}

// The configured base URL ("" on the web), for assets served by the same site (category icons).
export function getApiBaseUrl(): string {
  return config.baseUrl;
}

export function createApiClient(overrides: Partial<ApiConfig> = {}): ApiClient {
  const { baseUrl, getHeaders, credentials, onStepUpRequired } = { ...config, ...overrides };
  const credentialsInit = credentials ? { credentials } : {};
  const fullPath = baseUrl.concat("/api/");

  const headersFor = async (): Promise<Record<string, string>> => ({
    "Content-Type": "application/json",
    ...((await getHeaders?.()) ?? {}),
  });

  // A data route answers with an error once its session stops being accepted (see stepUpPolicy.ts). The error text says
  // nothing about why, so ask the server for the status and report the reason. The caller still gets its own answer.
  const checkStepUp = async (): Promise<void> => {
    if (!onStepUpRequired || Date.now() - lastStepUpCheck < STEP_UP_CHECK_GAP_MS) return;
    lastStepUpCheck = Date.now();
    try {
      const res = await fetch(fullPath.concat("session-status"), { method: "GET", headers: await headersFor(), ...credentialsInit });
      const status = (await res.json()) as SessionStatus;
      if (status.ok && status.signedIn && status.stepUp !== "fresh") onStepUpRequired(status.stepUp);
    } catch {
      // Offline or unreachable: the caller already has its own error to show.
    }
  };

  return {
    get: async function <T = any>(path: string): Promise<T> {
      try {
        const res = await fetch(fullPath.concat(path), { method: "GET", headers: await headersFor(), ...credentialsInit });
        if (!res.ok) void checkStepUp();
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
          ...credentialsInit,
        });
        if (!res) throw new Error("No data from response");
        if (!res.ok) void checkStepUp();
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
