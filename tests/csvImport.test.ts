import { describe, expect, it } from 'vitest';
import { transactionsToCsv } from '@/services/export';
import { buildImportPreview, parseCsvRows, parseSpreadsheetDate } from '@/services/import/spreadsheetCsv';
import { categories, tx } from './helpers';

const TODAY = '2026-10-31';

describe('importação de planilha (CSV)', () => {
  it('lê separador ";" ou ",", aspas, aspas escapadas, CRLF e BOM', () => {
    expect(parseCsvRows('﻿Data;Descrição\r\n01/10/2026;"Mercado; feira"\r\n')).toEqual([
      ['Data', 'Descrição'],
      ['01/10/2026', 'Mercado; feira'],
    ]);
    expect(parseCsvRows('Data,Descrição,Valor\n2026-10-01,"Disse ""oi""","-10.50"\n\n')).toEqual([
      ['Data', 'Descrição', 'Valor'],
      ['2026-10-01', 'Disse "oi"', '-10.50'],
    ]);
  });

  it('reconhece datas brasileiras e ISO', () => {
    expect(parseSpreadsheetDate('5/3/2026')).toBe('2026-03-05');
    expect(parseSpreadsheetDate('31/10/26')).toBe('2026-10-31');
    expect(parseSpreadsheetDate('2026-10-31')).toBe('2026-10-31');
    expect(parseSpreadsheetDate('outubro')).toBeNull();
  });

  it('monta a prévia: negativo = despesa, positivo = receita, categoria pelo nome ou "Outros", erros por linha', () => {
    const csv = [
      'Data;Descrição;Valor;Categoria',
      '01/10/2026;Mercado;-150,00;alimentacao',
      '02/10/2026;Salário;5.000,00;Salário',
      '03/10/2026;Presente;-80,00;Categoria que não existe',
      '32/10/2026;Data ruim;-10,00;Lazer',
      '04/10/2026;Sem valor;abc;Lazer',
      '05/10/2026;;-10,00;Lazer',
    ].join('\n');
    const preview = buildImportPreview(csv, categories, [], TODAY);
    expect(preview.error).toBeUndefined();
    expect(preview.ready).toEqual([
      { type: 'expense', description: 'Mercado', amount: 15_000, date: '2026-10-01', categoryId: 'food', note: undefined },
      { type: 'income', description: 'Salário', amount: 500_000, date: '2026-10-02', categoryId: 'salary', note: undefined },
      { type: 'expense', description: 'Presente', amount: 8_000, date: '2026-10-03', categoryId: 'misc', note: undefined },
    ]);
    const presente = preview.rows[2];
    expect(presente).toMatchObject({ ok: true, categoryMatched: false, categoryName: 'Outros' });
    expect(preview.rows.filter((r) => !r.ok).map((r) => r.line)).toEqual([5, 6, 7]);
    expect(preview.rows[3]).toMatchObject({ ok: false, error: 'Informe uma data válida.' });
    expect(preview.rows[4]).toMatchObject({ ok: false, error: 'Valor inválido.' });
    expect(preview.rows[5]).toMatchObject({ ok: false, error: 'Descrição é obrigatório.' });
  });

  it('usa a coluna Tipo quando existe e ignora lançamentos que já estão no app', () => {
    const existing = [tx({ type: 'expense', amount: 4_000, date: '2026-10-10', description: 'Cinema', categoryId: 'fun' })];
    const csv = 'Data,Tipo,Descrição,Valor\n10/10/2026,Despesa,cinema,40.00\n10/10/2026,Despesa,Cinema,40.00\n11/10/2026,Despesa,Pipoca,15\n';
    const preview = buildImportPreview(csv, categories, existing, TODAY);
    expect(preview.rows.map((r) => r.ok && r.duplicate)).toEqual([true, true, false]);
    expect(preview.ready).toHaveLength(1);
    expect(preview.ready[0]).toMatchObject({ type: 'expense', description: 'Pipoca', amount: 1_500, categoryId: 'misc' });
  });

  it('o CSV exportado pelo app volta igual pela importação (ida e volta com a planilha)', () => {
    const original = [
      tx({ type: 'expense', amount: 12_345, date: '2026-10-05', description: 'Farmácia', categoryId: 'misc', note: 'Remédio' }),
      tx({ type: 'income', amount: 500_000, date: '2026-10-01', description: 'Salário', categoryId: 'salary' }),
    ];
    const preview = buildImportPreview(transactionsToCsv(original, categories), categories, [], TODAY);
    expect(preview.ready).toEqual([
      { type: 'expense', description: 'Farmácia', amount: 12_345, date: '2026-10-05', categoryId: 'misc', note: 'Remédio' },
      { type: 'income', description: 'Salário', amount: 500_000, date: '2026-10-01', categoryId: 'salary', note: undefined },
    ]);
  });

  it('recusa arquivo sem as colunas obrigatórias ou vazio', () => {
    expect(buildImportPreview('Nome;Preço\nA;1', categories, [], TODAY).error).toMatch(/Cabeçalho não reconhecido/);
    expect(buildImportPreview('', categories, [], TODAY).error).toMatch(/não tem lançamentos/);
  });
});
