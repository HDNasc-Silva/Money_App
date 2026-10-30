import { describe, expect, it } from 'vitest';
import { EMPTY_DATA } from '@/models';
import { transactionsToCsv } from '@/services/export';
import { createRepositories } from '@/services/repositories';
import { CORRUPTED_BACKUP_KEY, DATA_KEY, parseFinanceData, serializeFinanceData } from '@/services/storage/FinanceDocument';
import { LocalStorageAdapter, MemoryStorageAdapter, StorageError } from '@/services/storage/StorageAdapter';
import { buildDemoData } from '@/store/demoData';
import { categories, tx } from './helpers';

describe('repositórios', () => {
  it('carrega vazio, grava e relê do storage', async () => {
    const adapter = new MemoryStorageAdapter();
    const repos = createRepositories(adapter);
    expect(await repos.load()).toEqual({ status: 'empty' });

    await repos.replaceAll({ ...EMPTY_DATA, categories });
    const transaction = tx({ type: 'expense', amount: 500, date: '2026-10-01' });
    await repos.transactions.upsert(transaction);
    await repos.transactions.upsert({ ...transaction, amount: 900 });

    const reloaded = createRepositories(adapter);
    const result = await reloaded.load();
    expect(result.status).toBe('ok');
    if (result.status === 'ok') {
      expect(result.data.transactions).toEqual([{ ...transaction, amount: 900 }]);
      expect(result.data.categories).toHaveLength(categories.length);
    }

    await reloaded.transactions.remove(transaction.id);
    expect(await reloaded.transactions.list()).toEqual([]);
  });

  it('preserva dados corrompidos em backup e informa o problema', async () => {
    const adapter = new MemoryStorageAdapter();
    adapter.write(DATA_KEY, '{ isto não é json');
    const repos = createRepositories(adapter);
    expect(await repos.load()).toEqual({ status: 'corrupted' });
    expect(adapter.read(CORRUPTED_BACKUP_KEY)).toBe('{ isto não é json');
    expect(adapter.read(DATA_KEY)).toBeNull();
  });

  it('rejeita documentos com estrutura inválida ou versão futura', () => {
    const valid = serializeFinanceData({ ...EMPTY_DATA, categories });
    expect(parseFinanceData(valid)).not.toBeNull();
    expect(parseFinanceData(valid.replace('"schemaVersion":1', '"schemaVersion":99'))).toBeNull();
    expect(parseFinanceData(JSON.stringify({ schemaVersion: 1, transactions: [{ id: 1 }], categories: [], goals: [], settings: {} }))).toBeNull();
    expect(
      parseFinanceData(
        JSON.stringify({ schemaVersion: 1, transactions: [{ ...tx({ type: 'expense', amount: 1.5, date: '2026-10-01' }) }], categories: [], goals: [], settings: {} }),
      ),
    ).toBeNull();
  });

  it('LocalStorageAdapter converte falhas em StorageError', () => {
    const failing = {
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {
        throw new Error('cota');
      },
      removeItem: () => undefined,
    } as unknown as Storage;
    const adapter = new LocalStorageAdapter(failing);
    expect(() => adapter.read('x')).toThrow(StorageError);
    expect(() => adapter.write('x', 'y')).toThrow(StorageError);
  });
});

describe('dados de demonstração', () => {
  it('são determinísticos, válidos e não têm datas futuras', () => {
    const today = '2026-10-15';
    const a = buildDemoData(today);
    const b = buildDemoData(today);
    expect(a).toEqual(b);
    expect(a.settings.isDemoData).toBe(true);
    expect(a.transactions.every((t) => t.date <= today)).toBe(true);
    expect(parseFinanceData(serializeFinanceData(a))).not.toBeNull();
    const categoryIds = new Set(a.categories.map((c) => c.id));
    expect(a.transactions.every((t) => categoryIds.has(t.categoryId))).toBe(true);
  });
});

describe('exportação CSV', () => {
  it('gera CSV pt-BR com BOM e proteção contra fórmulas', () => {
    const csv = transactionsToCsv(
      [
        tx({ type: 'expense', amount: 24550, date: '2026-10-24', description: '=HYPERLINK("x")', categoryId: 'food' }),
        tx({ type: 'income', amount: 750000, date: '2026-10-05', description: 'Salário; outubro', categoryId: 'salary' }),
      ],
      categories,
    );
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const lines = csv.slice(1).split('\r\n');
    expect(lines[0]).toBe('Data;Tipo;Descrição;Categoria;Valor (R$);Observação');
    expect(lines[1]).toBe(`24/10/2026;Despesa;"'=HYPERLINK(""x"")";Alimentação;-245,50;`);
    expect(lines[2]).toBe('05/10/2026;Receita;"Salário; outubro";Salário;7500,00;');
  });
});
