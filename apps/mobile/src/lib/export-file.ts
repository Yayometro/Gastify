import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { tNow } from '@/i18n/now';

import { API_URL, authClient } from '@/auth-client';

export type ExportFormat = 'csv' | 'json' | 'xlsx';

// The export formats, read when they are shown (so they follow the language on screen).
export function exportFormats(): { value: ExportFormat; label: string; hint: string }[] {
  return [
    { value: 'xlsx', label: 'Excel (.xlsx)', hint: tNow("mobile.igual.que.la.exportacion.de.la.web") },
    { value: 'csv', label: 'CSV (.csv)', hint: tNow("mobile.para.cualquier.hoja.de.calculo") },
    { value: 'json', label: 'JSON (.json)', hint: tNow("mobile.para.otras.herramientas.o.respaldos") },
  ];
}

const FILE_TYPES: Record<ExportFormat, { mimeType: string; uti: string }> = {
  csv: { mimeType: 'text/csv', uti: 'public.comma-separated-values-text' },
  json: { mimeType: 'application/json', uti: 'public.json' },
  xlsx: { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', uti: 'org.openxmlformats.spreadsheetml.sheet' },
};

export function exportFileName(format: ExportFormat, today: Date): string {
  const day = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return `gastify-movimientos-${day}.${format}`;
}

// Saves the content in the cache folder and opens the system share sheet (Files, Mail, Drive, Excel...).
async function shareFile(name: string, content: string | Uint8Array, format: ExportFormat, title: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) throw new Error(tNow("mobile.este.dispositivo.no.puede.compartir.archivos"));
  const file = new File(Paths.cache, name);
  file.create({ overwrite: true });
  file.write(content);
  const { mimeType, uti } = FILE_TYPES[format];
  await Sharing.shareAsync(file.uri, { mimeType, UTI: uti, dialogTitle: title });
}

export function shareTextExport(format: 'csv' | 'json', text: string, title: string, today = new Date()): Promise<void> {
  return shareFile(exportFileName(format, today), text, format, title);
}

// The Excel file comes from the server (the same route the web uses), for the movements it is given.
// The route only reads: it builds the workbook from the user's own movements.
export async function shareExcelExport(transactionIds: string[], email: string, title: string, today = new Date()): Promise<void> {
  const cookie = (await authClient.getCookie()) ?? '';
  const response = await fetch(`${API_URL}/api/general-data/files/export/${encodeURIComponent(email)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ transactionIds }),
    credentials: 'omit',
  });
  if (!response.ok) {
    const answer = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(answer?.message || tNow("mobile.no.pudimos.crear.el.archivo.de.excel"));
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  await shareFile(exportFileName('xlsx', today), bytes, 'xlsx', title);
}

// The Excel template the web offers ("Download format"), saved and shared so it can be filled in and uploaded back.
export async function shareExcelTemplate(email: string, title: string): Promise<void> {
  const cookie = (await authClient.getCookie()) ?? '';
  const response = await fetch(`${API_URL}/api/general-data/files/template/${encodeURIComponent(email)}`, { method: 'GET', headers: { Cookie: cookie }, credentials: 'omit' });
  if (!response.ok) throw new Error(tNow("mobile.no.pudimos.descargar.la.plantilla"));
  const bytes = new Uint8Array(await response.arrayBuffer());
  const file = new File(Paths.cache, 'gastify-plantilla.xlsx');
  file.create({ overwrite: true });
  file.write(bytes);
  if (!(await Sharing.isAvailableAsync())) throw new Error(tNow("mobile.este.dispositivo.no.puede.compartir.archivos"));
  await Sharing.shareAsync(file.uri, { mimeType: FILE_TYPES.xlsx.mimeType, UTI: FILE_TYPES.xlsx.uti, dialogTitle: title });
}

// Uploads a filled-in template: the server reads it and creates the movements (the web's "Upload" button). The
// result carries what was created, or why it was refused (an outdated template, for instance).
export type ImportAnswer = { ok?: boolean; message?: string; versionMismatch?: boolean; data?: { _id?: string; category?: unknown; subCategory?: unknown }[] };

export async function uploadExcelTemplate(email: string, file: { uri: string; name: string; mimeType?: string }): Promise<ImportAnswer> {
  const cookie = (await authClient.getCookie()) ?? '';
  const form = new FormData();
  // React Native sends a { uri, name, type } part as a file.
  form.append('file', { uri: file.uri, name: file.name, type: file.mimeType || FILE_TYPES.xlsx.mimeType } as unknown as Blob);
  const response = await fetch(`${API_URL}/api/general-data/files/upload/${encodeURIComponent(email)}`, { method: 'POST', headers: { Cookie: cookie }, body: form, credentials: 'omit' });
  return (await response.json().catch(() => ({ ok: false, message: tNow("mobile.el.servidor.no.respondio.como.se.esperaba") }))) as ImportAnswer;
}
