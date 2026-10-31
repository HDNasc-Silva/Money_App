import type { Category, IsoDate, Transaction, TransactionType } from '@/models';
import { normalizeText } from '@/utils/format';
import { centsToInput, parseMoney } from '@/utils/money';
import { validateTransaction, type TransactionDraft } from '@/validations';

/**
 * Importação de lançamentos a partir de uma planilha exportada em CSV (DT-020).
 * Colunas reconhecidas pelo cabeçalho (sem acento e sem diferenciar maiúsculas):
 * `Data`, `Descrição`, `Valor` (obrigatórias), `Categoria`, `Tipo` e `Observação` (opcionais).
 * Sem a coluna `Tipo`, valores negativos são despesas e positivos são receitas.
 */

/** Limite de linhas por importação (protege a interface e o `localStorage`). */
export const MAX_IMPORT_ROWS = 5000;
/** Tamanho máximo do arquivo aceito na tela de importação. */
export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;

const SEPARATORS = [';', ',', '\t'] as const;
/** Marca de ordem de bytes UTF-8 (U+FEFF) que o Excel coloca no início do arquivo. */
const BOM = 0xfeff;

/** Escolhe o separador mais frequente na primeira linha (fora de aspas); empate favorece `;` (Excel pt-BR). */
function detectSeparator(firstLine: string): string {
  let best: string = ';';
  let bestCount = 0;
  for (const separator of SEPARATORS) {
    let count = 0;
    let quoted = false;
    for (const char of firstLine) {
      if (char === '"') quoted = !quoted;
      else if (!quoted && char === separator) count += 1;
    }
    if (count > bestCount) {
      best = separator;
      bestCount = count;
    }
  }
  return best;
}

/** Lê o texto CSV em linhas e campos (aspas duplas, aspas escapadas, quebras CRLF/LF e BOM). */
export function parseCsvRows(text: string): string[][] {
  const content = text.charCodeAt(0) === BOM ? text.slice(1) : text;
  const separator = detectSeparator(content.split(/\r?\n/, 1)[0] ?? '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i]!;
    if (quoted) {
      if (char === '"' && content[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === separator) {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && content[i + 1] === '\n') i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((value) => value.trim() !== ''));
}

type Column = 'date' | 'description' | 'amount' | 'category' | 'type' | 'note';

function columnFor(header: string): Column | null {
  const name = normalizeText(header);
  if (name === 'data') return 'date';
  if (name === 'descricao' || name === 'historico') return 'description';
  if (name.startsWith('valor')) return 'amount';
  if (name === 'categoria') return 'category';
  if (name === 'tipo') return 'type';
  if (name.startsWith('observacao') || name === 'obs') return 'note';
  return null;
}

/** "31/10/2026", "31/10/26" ou "2026-10-31" → ISO; `null` se não reconhecer. */
export function parseSpreadsheetDate(raw: string): IsoDate | null {
  const value = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(value);
  if (!match) return null;
  const [, day, month, year] = match;
  const fullYear = year!.length === 2 ? `20${year}` : year!;
  return `${fullYear}-${month!.padStart(2, '0')}-${day!.padStart(2, '0')}`;
}

function typeFrom(raw: string | undefined, amount: number): TransactionType {
  const value = normalizeText(raw ?? '');
  if (value.startsWith('rec') || value.startsWith('entrada')) return 'income';
  if (value.startsWith('desp') || value.startsWith('saida')) return 'expense';
  return amount < 0 ? 'expense' : 'income';
}

/** Categoria pelo nome (mesmo tipo); sem correspondência, usa "Outros" ou a primeira do tipo. */
function resolveCategory(name: string, type: TransactionType, categories: readonly Category[]) {
  const ofType = categories.filter((c) => c.kind === type);
  const wanted = normalizeText(name);
  const exact = wanted ? ofType.find((c) => normalizeText(c.name) === wanted) : undefined;
  if (exact) return { category: exact, matched: true };
  const fallback = ofType.find((c) => normalizeText(c.name) === 'outros') ?? ofType[0];
  return { category: fallback, matched: false };
}

export interface ImportRowOk {
  line: number;
  ok: true;
  draft: TransactionDraft;
  categoryName: string;
  /** `false` quando a categoria da planilha não existe e foi usada a categoria padrão do tipo. */
  categoryMatched: boolean;
  /** Já existe um lançamento com a mesma data, descrição, valor e tipo: não é importado de novo. */
  duplicate: boolean;
}

export interface ImportRowError {
  line: number;
  ok: false;
  error: string;
}

export type ImportRow = ImportRowOk | ImportRowError;

export interface ImportPreview {
  /** Erro que impede a importação inteira (cabeçalho inválido, arquivo vazio...). */
  error?: string;
  rows: ImportRow[];
  /** Lançamentos válidos e não duplicados, prontos para importar. */
  ready: TransactionDraft[];
}

const duplicateKey = (t: Pick<Transaction, 'date' | 'description' | 'amount' | 'type'>) =>
  `${t.date}|${normalizeText(t.description)}|${t.amount}|${t.type}`;

/** Monta a prévia da importação: valida cada linha com as mesmas regras do formulário de lançamento. */
export function buildImportPreview(
  text: string,
  categories: readonly Category[],
  existing: readonly Transaction[],
  today: IsoDate,
): ImportPreview {
  const [header, ...body] = parseCsvRows(text);
  if (!header || body.length === 0) return { error: 'O arquivo não tem lançamentos (é preciso um cabeçalho e ao menos uma linha).', rows: [], ready: [] };
  if (body.length > MAX_IMPORT_ROWS) return { error: `O arquivo tem mais de ${MAX_IMPORT_ROWS} linhas. Divida-o em partes menores.`, rows: [], ready: [] };

  const columns = new Map<Column, number>();
  header.forEach((name, index) => {
    const column = columnFor(name);
    if (column && !columns.has(column)) columns.set(column, index);
  });
  const missing = (['date', 'description', 'amount'] as const).filter((c) => !columns.has(c));
  if (missing.length > 0) {
    return { error: 'Cabeçalho não reconhecido. A primeira linha precisa ter as colunas Data, Descrição e Valor (Categoria é opcional).', rows: [], ready: [] };
  }

  const existingKeys = new Set(existing.map(duplicateKey));
  const rows: ImportRow[] = [];
  const ready: TransactionDraft[] = [];
  const cell = (values: string[], column: Column) => {
    const index = columns.get(column);
    return index === undefined ? undefined : (values[index] ?? '').trim();
  };

  for (const [index, values] of body.entries()) {
    const line = index + 2;
    const fail = (error: string) => rows.push({ line, ok: false, error });
    const date = parseSpreadsheetDate(cell(values, 'date') ?? '');
    if (!date) {
      fail('Data inválida (use DD/MM/AAAA).');
      continue;
    }
    const signed = parseMoney(cell(values, 'amount') ?? '');
    if (signed === null || signed === 0) {
      fail('Valor inválido.');
      continue;
    }
    const type = typeFrom(cell(values, 'type'), signed);
    const { category, matched } = resolveCategory(cell(values, 'category') ?? '', type, categories);
    if (!category) {
      fail(`Nenhuma categoria de ${type === 'income' ? 'receita' : 'despesa'} cadastrada.`);
      continue;
    }
    const result = validateTransaction(
      {
        type,
        description: cell(values, 'description') ?? '',
        amount: centsToInput(Math.abs(signed)),
        date,
        categoryId: category.id,
        note: cell(values, 'note') ?? '',
      },
      categories,
      today,
    );
    if (!result.ok) {
      fail(Object.values(result.errors)[0] ?? 'Linha inválida.');
      continue;
    }
    // Só compara com o que já está no app: linhas iguais dentro da própria planilha (ex.: dois cafés) são mantidas.
    const duplicate = existingKeys.has(duplicateKey(result.value));
    rows.push({ line, ok: true, draft: result.value, categoryName: category.name, categoryMatched: matched, duplicate });
    if (!duplicate) ready.push(result.value);
  }

  return { rows, ready };
}
