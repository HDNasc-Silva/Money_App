import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ToastProvider } from '@/components/common/Toast';
import { incomeTransactionId, scheduleIncome, skipIncomeMonth, syncMonthlyIncome } from '@/domain/income';
import { DEFAULT_SETTINGS, type FinanceData, type Settings } from '@/models';
import { createRepositories } from '@/services/repositories';
import { DATA_KEY, parseFinanceData, serializeFinanceData } from '@/services/storage/FinanceDocument';
import { MemoryStorageAdapter } from '@/services/storage/StorageAdapter';
import { FinanceProvider, useFinance, type FinanceActions } from '@/store/FinanceProvider';
import { addMonths, monthKeyOf, todayIso } from '@/utils/dates';
import { categories, tx } from './helpers';

const TS = '2026-11-07T10:00:00.000Z';
const settings = (partial: Partial<Settings> = {}): Settings => ({ ...DEFAULT_SETTINGS, userName: 'Ana', ...partial });

describe('renda mensal automática (regra pura)', () => {
  it('agenda a partir do mês atual quando a renda é definida e limpa ao zerar', () => {
    const scheduled = scheduleIncome(settings({ monthlyIncome: 500_000 }), '2026-11-07');
    expect(scheduled.incomeStartMonth).toBe('2026-11');
    // Mudar o valor não muda o mês inicial.
    expect(scheduleIncome({ ...scheduled, monthlyIncome: 600_000 }, '2027-02-10').incomeStartMonth).toBe('2026-11');
    expect(scheduleIncome({ ...scheduled, monthlyIncome: 0 }, '2026-12-01').incomeStartMonth).toBeNull();
  });

  it('gera uma receita no dia 1º de cada mês desde o início, com id determinístico', () => {
    const result = syncMonthlyIncome(settings({ monthlyIncome: 500_000, incomeStartMonth: '2026-09' }), [], 'salary', '2026-11-07', TS);
    expect(result.created.map((t) => t.id)).toEqual(['income-2026-09', 'income-2026-10', 'income-2026-11']);
    expect(result.created[0]).toMatchObject({
      type: 'income',
      description: 'Renda mensal',
      amount: 500_000,
      date: '2026-09-01',
      categoryId: 'salary',
      incomeMonth: '2026-09',
    });
  });

  it('é idempotente: meses já lançados (mesmo com data editada) não são gerados de novo', () => {
    const base = settings({ monthlyIncome: 500_000, incomeStartMonth: '2026-10' });
    const first = syncMonthlyIncome(base, [], 'salary', '2026-11-07', TS);
    const again = syncMonthlyIncome(base, first.created, 'salary', '2026-11-07', TS);
    expect(again.changed).toBe(false);
    expect(again.created).toHaveLength(0);

    const edited = first.created.map((t) => ({ ...t, id: `x-${t.id}`, date: '2026-10-05' }));
    expect(syncMonthlyIncome(base, edited, 'salary', '2026-11-07', TS).created).toHaveLength(0);
  });

  it('não regera mês excluído, para ao zerar e o valor novo vale só para os meses não lançados', () => {
    const base = settings({ monthlyIncome: 500_000, incomeStartMonth: '2026-10' });
    const skipped = skipIncomeMonth(base, '2026-10');
    expect(syncMonthlyIncome(skipped, [], 'salary', '2026-11-07', TS).created.map((t) => t.incomeMonth)).toEqual(['2026-11']);

    expect(syncMonthlyIncome({ ...base, monthlyIncome: 0 }, [], 'salary', '2026-11-07', TS).created).toHaveLength(0);

    const october = syncMonthlyIncome({ ...base }, [], 'salary', '2026-10-15', TS).created;
    const november = syncMonthlyIncome({ ...base, monthlyIncome: 650_000 }, october, 'salary', '2026-11-07', TS).created;
    expect(october[0]?.amount).toBe(500_000);
    expect(november).toHaveLength(1);
    expect(november[0]?.amount).toBe(650_000);
  });

  it('não gera nada com dados de demonstração', () => {
    const demo = settings({ monthlyIncome: 500_000, incomeStartMonth: '2026-10', isDemoData: true });
    expect(syncMonthlyIncome(demo, [], 'salary', '2026-11-07', TS).created).toHaveLength(0);
  });

  it('o storage preserva o agendamento e completa documentos antigos', () => {
    const doc = serializeFinanceData({
      transactions: [],
      categories: [],
      goals: [],
      subscriptions: [],
      loans: [],
      settings: settings({ monthlyIncome: 1, incomeStartMonth: '2026-10', incomeSkippedMonths: ['2026-10', 'lixo' as string] }),
    });
    expect(parseFinanceData(doc)?.settings).toMatchObject({ incomeStartMonth: '2026-10', incomeSkippedMonths: ['2026-10'] });
    const legacy = JSON.stringify({ schemaVersion: 1, transactions: [], categories: [], goals: [], settings: { userName: 'Ana' } });
    expect(parseFinanceData(legacy)?.settings).toMatchObject({ incomeStartMonth: null, incomeSkippedMonths: [] });
  });
});

describe('renda mensal automática (provider)', () => {
  const readStored = (adapter: MemoryStorageAdapter) => JSON.parse(adapter.read(DATA_KEY) ?? '{}') as FinanceData;

  function storageWith(data: Partial<FinanceData>): MemoryStorageAdapter {
    const adapter = new MemoryStorageAdapter();
    const full: FinanceData = { transactions: [], categories, goals: [], subscriptions: [], loans: [], settings: settings(), ...data };
    adapter.write(DATA_KEY, serializeFinanceData(full));
    return adapter;
  }

  async function mount(adapter: MemoryStorageAdapter) {
    const probe: { actions?: FinanceActions; data?: FinanceData } = {};
    function Probe() {
      const finance = useFinance();
      probe.actions = finance.actions;
      probe.data = finance.state.data;
      return <span>{finance.state.status}</span>;
    }
    const view = render(
      <ToastProvider>
        <FinanceProvider repositories={createRepositories(adapter)}>
          <Probe />
        </FinanceProvider>
      </ToastProvider>,
    );
    await screen.findByText('ready');
    return { probe, unmount: view.unmount };
  }

  const month = monthKeyOf(todayIso());
  const incomes = (data: FinanceData) => data.transactions.filter((t) => t.incomeMonth);

  it('definir a renda gera a receita do mês na categoria Salário; reabrir não duplica; excluir não regera', async () => {
    const adapter = storageWith({});
    const first = await mount(adapter);
    await act(async () => {
      await first.probe.actions!.updateSettings({ monthlyIncome: 500_000 });
    });
    expect(incomes(readStored(adapter))).toEqual([
      expect.objectContaining({ id: incomeTransactionId(month), date: `${month}-01`, categoryId: 'salary', amount: 500_000 }),
    ]);
    first.unmount();

    // Reabrir o app (e sincronizar de novo) não duplica.
    const second = await mount(adapter);
    await act(async () => {
      await second.probe.actions!.syncMonthlyIncome();
    });
    expect(incomes(readStored(adapter))).toHaveLength(1);

    await act(async () => {
      await second.probe.actions!.deleteTransaction(incomeTransactionId(month));
    });
    expect(readStored(adapter).settings.incomeSkippedMonths).toEqual([month]);
    second.unmount();

    const third = await mount(adapter);
    expect(incomes(third.probe.data!)).toHaveLength(0);
    expect(incomes(readStored(adapter))).toHaveLength(0);
    third.unmount();
  });

  it('ao abrir, lança os meses que chegaram desde o início e recria "Salário" se ela foi excluída', async () => {
    const start = addMonths(month, -2);
    const adapter = storageWith({
      categories: categories.filter((c) => c.name !== 'Salário'),
      transactions: [tx({ type: 'expense', amount: 1_000, date: todayIso() })],
      settings: settings({ monthlyIncome: 300_000, incomeStartMonth: start }),
    });
    const { probe } = await mount(adapter);
    const generated = incomes(probe.data!);
    expect(generated.map((t) => t.incomeMonth)).toEqual([start, addMonths(month, -1), month]);
    const salary = probe.data!.categories.find((c) => c.name === 'Salário');
    expect(salary?.kind).toBe('income');
    expect(generated.every((t) => t.categoryId === salary?.id)).toBe(true);
    expect(incomes(readStored(adapter))).toHaveLength(3);
  });

  it('zerar a renda para de gerar', async () => {
    const adapter = storageWith({ settings: settings({ monthlyIncome: 300_000, incomeStartMonth: month }) });
    const { probe } = await mount(adapter);
    expect(incomes(probe.data!)).toHaveLength(1);
    await act(async () => {
      await probe.actions!.updateSettings({ monthlyIncome: 0 });
    });
    expect(readStored(adapter).settings.incomeStartMonth).toBeNull();
    // O lançamento já gerado permanece (é histórico); nada novo é criado.
    await act(async () => {
      await probe.actions!.syncMonthlyIncome();
    });
    expect(incomes(readStored(adapter))).toHaveLength(1);
  });
});
