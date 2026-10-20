import { getApi } from '@gastify/core/api/client';

type ApiAnswer<T> = { ok?: boolean; message?: string; data?: T };

// Sends a change the way the web does (POST with a JSON body). When the server says no, the error
// carries its own message, so the form can show it in Spanish as the server wrote it.
export async function sendWrite<T = unknown>(path: string, body: unknown): Promise<T> {
  const answer = await getApi().post<ApiAnswer<T>>(path, body);
  if (!answer?.ok) throw new Error(answer?.message || 'No pudimos guardar los cambios.');
  return answer.data as T;
}

export function messageOf(error: unknown): string {
  return error instanceof Error && error.message ? error.message : 'No pudimos guardar los cambios. Intenta de nuevo.';
}
