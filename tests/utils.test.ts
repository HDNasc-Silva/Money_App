import { describe, expect, it } from 'vitest';
import { addMonths, daysInMonth, formatDayMonth, formatMonthLabel, isValidIso, monthsBetween } from '@/utils/dates';
import { formatPercent, formatSignedPercent, initials, normalizeText } from '@/utils/format';
import { centsToInput, formatCurrency, parseMoney } from '@/utils/money';

describe('money', () => {
  it.each([
    ['1.234,56', 123456],
    ['1234,5', 123450],
    ['1234.56', 123456],
    ['1.234', 123400],
    ['R$ 10', 1000],
    ['0,01', 1],
    ['1.234.567', 123456700],
  ])('parseMoney(%s) = %i centavos', (input, expected) => {
    expect(parseMoney(input)).toBe(expected);
  });

  it.each(['', 'abc', '1,2,3', '--5'])('parseMoney rejeita "%s"', (input) => {
    expect(parseMoney(input)).toBeNull();
  });

  it('evita erro de ponto flutuante', () => {
    expect(parseMoney('0,1')! + parseMoney('0,2')!).toBe(30);
  });

  it('formata em BRL', () => {
    expect(formatCurrency(485000)).toBe('R$ 4.850,00');
    expect(formatCurrency(-24550)).toBe('−R$ 245,50');
    expect(formatCurrency(24550, { signed: true })).toBe('+ R$ 245,50');
    expect(formatCurrency(-24550, { signed: true })).toBe('− R$ 245,50');
    expect(formatCurrency(820000, { compact: true })).toBe('R$ 8.200');
    expect(formatCurrency(485000, { bare: true })).toBe('4.850,00');
  });

  it('centsToInput gera texto reconvertível', () => {
    expect(centsToInput(123456)).toBe('1234,56');
    expect(parseMoney(centsToInput(123456))).toBe(123456);
  });
});

describe('dates', () => {
  it('soma meses atravessando o ano', () => {
    expect(addMonths('2026-11', 3)).toBe('2027-02');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
  });

  it('calcula dias do mês, inclusive bissexto', () => {
    expect(daysInMonth('2024-02')).toBe(29);
    expect(daysInMonth('2026-02')).toBe(28);
    expect(daysInMonth('2026-10')).toBe(31);
  });

  it('valida datas ISO', () => {
    expect(isValidIso('2026-02-28')).toBe(true);
    expect(isValidIso('2026-02-30')).toBe(false);
    expect(isValidIso('30/10/2026')).toBe(false);
  });

  it('formata rótulos em português', () => {
    expect(formatMonthLabel('2026-10')).toBe('Outubro 2026');
    expect(formatDayMonth('2026-03-05')).toBe('5 de Março');
    expect(monthsBetween('2026-10', '2027-06')).toBe(8);
  });
});

describe('format', () => {
  it('formata percentuais', () => {
    expect(formatPercent(0.591)).toBe('59,1%');
    expect(formatSignedPercent(0.074)).toBe('+7,4%');
    expect(formatSignedPercent(-0.03)).toBe('−3,0%');
  });

  it('gera iniciais e normaliza texto para busca', () => {
    expect(initials('Gabriel Souza Lima')).toBe('GL');
    expect(initials('  ')).toBe('');
    expect(normalizeText('  Farmácia AÇÚCAR ')).toBe('farmacia acucar');
  });
});
