import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { API_URL, authClient } from '@/auth-client';

export type ExportFormat = 'csv' | 'json' | 'xlsx';

export const EXPORT_FORMATS: { value: ExportFormat; label: string; hint: string }[] = [
  { value: 'xlsx', label: 'Excel (.xlsx)', hint: 'Igual que la exportación de la web' },
  { value: 'csv', label: 'CSV (.csv)', hint: 'Para cualquier hoja de cálculo' },
  { value: 'json', label: 'JSON (.json)', hint: 'Para otras herramientas o respaldos' },
];

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
  if (!(await Sharing.isAvailableAsync())) throw new Error('Este dispositivo no puede compartir archivos.');
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
    throw new Error(answer?.message || 'No pudimos crear el archivo de Excel.');
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  await shareFile(exportFileName('xlsx', today), bytes, 'xlsx', title);
}
