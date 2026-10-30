import type { Category, FinanceData, Transaction } from '@/models';
import { formatDateBr } from '@/utils/dates';
import { serializeFinanceData } from '../storage/FinanceDocument';

const CSV_SEPARATOR = ';';
/** BOM UTF-8: faz o Excel reconhecer acentos. */
const CSV_BOM = String.fromCharCode(0xfeff);

/** Escapa um campo CSV e neutraliza fórmulas (proteção contra CSV injection). */
function csvField(value: string): string {
  const isNumber = /^-?\d+(,\d+)?$/.test(value);
  const safe = !isNumber && /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[";\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** CSV compatível com Excel pt-BR (separador `;`, vírgula decimal, BOM UTF-8). */
export function transactionsToCsv(transactions: readonly Transaction[], categories: readonly Category[]): string {
  const names = new Map(categories.map((c) => [c.id, c.name]));
  const header = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Valor (R$)', 'Observação'];
  const rows = transactions.map((t) => [
    formatDateBr(t.date),
    t.type === 'income' ? 'Receita' : 'Despesa',
    t.description,
    names.get(t.categoryId) ?? '',
    ((t.type === 'income' ? 1 : -1) * t.amount / 100).toFixed(2).replace('.', ','),
    t.note ?? '',
  ]);
  return CSV_BOM + [header, ...rows].map((row) => row.map(csvField).join(CSV_SEPARATOR)).join('\r\n');
}

export const backupToJson = (data: FinanceData): string => serializeFinanceData(data);

/** Dispara o download de um arquivo gerado no navegador. */
export function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
