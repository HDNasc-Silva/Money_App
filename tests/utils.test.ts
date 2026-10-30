import { describe, expect, it } from 'vitest';
import { addMonths, daysInMonth, formatDayMonth, formatMonthLabel, isValidIso, monthsBetween } from '@/utils/dates';
import { formatPercent, formatSignedPercent, initials, normalizeText } from '@/utils/format';
import { centsToInput, formatCurrency, formatMoneyInput, MAX_AMOUNT, parseMoney } from '@/utils/money';

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

  it('centsToInput gera o formato da máscara, com milhar', () => {
    expect(centsToInput(123456)).toBe('1.234,56');
    expect(centsToInput(1)).toBe('0,01');
    expect(centsToInput(MAX_AMOUNT)).toBe('999.999.999,99');
  });

  it.each([0, 1, 10, 99, 100, 150000, 123456, 100000000, 1234567890, MAX_AMOUNT])(
    'round-trip centsToInput → parseMoney (%i)',
    (cents) => {
      expect(parseMoney(centsToInput(cents))).toBe(cents);
    },
  );
});

describe('formatMoneyInput (máscara pelos centavos)', () => {
  /** Simula a digitação: cada tecla é acrescentada ao texto já formatado. */
  const typeKeys = (keys: string, start = '') => {
    const steps: string[] = [];
    let value = start;
    for (const key of keys) {
      value = formatMoneyInput(value + key);
      steps.push(value);
    }
    return steps;
  };

  /** Simula o backspace: remove o último caractere do texto formatado. */
  const backspace = (value: string) => formatMoneyInput(value.slice(0, -1));

  it('formata a cada dígito digitado', () => {
    expect(typeKeys('15000')).toEqual(['0,01', '0,15', '1,50', '15,00', '150,00']);
    expect(typeKeys('0', '150,00')).toEqual(['1.500,00']);
    expect(typeKeys('1234567')).toEqual(['0,01', '0,12', '1,23', '12,34', '123,45', '1.234,56', '12.345,67']);
  });

  it('backspace remove o último dígito até esvaziar', () => {
    const steps: string[] = [];
    let value = '150,00';
    while (value) {
      value = backspace(value);
      steps.push(value);
    }
    expect(steps).toEqual(['15,00', '1,50', '0,15', '0,01', '']);
  });

  it('campo vazio ou só com zeros continua vazio', () => {
    expect(formatMoneyInput('')).toBe('');
    expect(formatMoneyInput('0')).toBe('');
    expect(formatMoneyInput('0,00')).toBe('');
  });

  it('ignora letras, vírgulas e pontos digitados', () => {
    expect(typeKeys('1a,2.b3')).toEqual(['0,01', '0,01', '0,01', '0,12', '0,12', '0,12', '1,23']);
  });

  it.each(['1.234,56', 'R$ 1234,56', 'R$1.234,56', ' 123456 '])('colar "%s" resulta em 1.234,56', (pasted) => {
    expect(formatMoneyInput(pasted)).toBe('1.234,56');
  });

  it('não aceita mais dígitos que o limite de MAX_AMOUNT', () => {
    const atLimit = formatMoneyInput(String(MAX_AMOUNT));
    expect(atLimit).toBe('999.999.999,99');
    expect(formatMoneyInput(`${atLimit}5`)).toBe(atLimit);
    expect(parseMoney(formatMoneyInput('123456789012345'))).toBeLessThanOrEqual(MAX_AMOUNT);
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
