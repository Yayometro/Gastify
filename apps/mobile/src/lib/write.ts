import { getApi } from '@gastify/core/api/client';
import { tNow } from '@/i18n/now';

type ApiAnswer<T> = { ok?: boolean; message?: string; data?: T };

// Sends a change the way the web does (POST with a JSON body). When the server says no, the error
// carries its own message, so the form can show it in Spanish as the server wrote it.
export async function sendWrite<T = unknown>(path: string, body: unknown): Promise<T> {
  const answer = await getApi().post<ApiAnswer<T>>(path, body);
  if (!answer?.ok) throw new Error(answer?.message || tNow("mobile.no.pudimos.guardar.los.cambios"));
  return answer.data as T;
}

export function messageOf(error: unknown): string {
  return error instanceof Error && error.message ? error.message : tNow("mobile.no.pudimos.guardar.los.cambios.intenta.de.nuevo");
}

// The whole answer of a change, for the routes that report more than their data (a list of what they could not do).
export async function sendWriteAnswer<T = unknown, Extra extends object = Record<string, never>>(path: string, body: unknown): Promise<{ data: T } & Extra> {
  const answer = await getApi().post<ApiAnswer<T> & Extra>(path, body);
  if (!answer?.ok) throw new Error(answer?.message || tNow("mobile.no.pudimos.guardar.los.cambios"));
  return answer as unknown as { data: T } & Extra;
}
