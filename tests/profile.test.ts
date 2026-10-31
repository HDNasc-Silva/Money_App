import { describe, expect, it, vi } from 'vitest';
import { savingsTargetAmount } from '@/domain/summary';
import { DEFAULT_SETTINGS, EMPTY_DATA } from '@/models';
import { parseFinanceData } from '@/services/storage/FinanceDocument';
import { canPromptInstall, listenForInstallPrompt, promptInstall, subscribeInstallPrompt } from '@/services/pwa/installPrompt';
import { buildDefaultCategories } from '@/store/defaultCategories';
import { buildDemoData } from '@/store/demoData';
import { buildInitialData } from '@/store/initialData';
import { validateOnboarding, validateProfileSettings } from '@/validations';

describe('validateOnboarding', () => {
  it('exige nome, remove espaços extras e limita a 40 caracteres', () => {
    expect(validateOnboarding({ name: '   ', monthlyIncome: '' })).toEqual({ ok: false, errors: { name: 'Nome é obrigatório.' } });
    expect(validateOnboarding({ name: 'a'.repeat(41), monthlyIncome: '' })).toMatchObject({ ok: false, errors: { name: expect.stringContaining('40') } });
    expect(validateOnboarding({ name: '  Maria   Clara ', monthlyIncome: '' })).toEqual({ ok: true, value: { userName: 'Maria Clara', monthlyIncome: 0 } });
  });

  it('aceita renda opcional em centavos e rejeita valores inválidos', () => {
    expect(validateOnboarding({ name: 'Ana', monthlyIncome: '5.000,00' })).toEqual({ ok: true, value: { userName: 'Ana', monthlyIncome: 500_000 } });
    expect(validateOnboarding({ name: 'Ana', monthlyIncome: 'abc' })).toMatchObject({ ok: false, errors: { monthlyIncome: 'Informe um valor válido.' } });
  });
});

describe('validateProfileSettings', () => {
  it('nome opcional, renda opcional e meta entre 0 e 100', () => {
    expect(validateProfileSettings({ name: '', monthlyIncome: '', savingsTarget: '20' })).toEqual({
      ok: true,
      value: { userName: '', monthlyIncome: 0, savingsTarget: 20 },
    });
    expect(validateProfileSettings({ name: 'Ana', monthlyIncome: '1.234,56', savingsTarget: '12,6' })).toEqual({
      ok: true,
      value: { userName: 'Ana', monthlyIncome: 123_456, savingsTarget: 13 },
    });
    for (const savingsTarget of ['', '-1', '101', 'x']) {
      expect(validateProfileSettings({ name: 'Ana', monthlyIncome: '', savingsTarget })).toMatchObject({
        ok: false,
        errors: { savingsTarget: 'Informe um percentual entre 0 e 100.' },
      });
    }
  });
});

describe('savingsTargetAmount', () => {
  it('calcula o valor mensal da meta sobre a renda', () => {
    expect(savingsTargetAmount(500_000, 20)).toBe(100_000);
    expect(savingsTargetAmount(333_333, 33)).toBe(110_000);
    expect(savingsTargetAmount(500_000, 0)).toBe(0);
    expect(savingsTargetAmount(500_000, 150)).toBe(500_000);
  });

  it('retorna null sem renda informada', () => {
    expect(savingsTargetAmount(0, 20)).toBeNull();
  });
});

describe('dados iniciais e migração das preferências', () => {
  it('primeiro acesso: vazio, com categorias padrão e onboarding pendente', () => {
    const initial = buildInitialData('2026-10-30T00:00:00.000Z');
    expect(initial.transactions).toEqual([]);
    expect(initial.goals).toEqual([]);
    expect(initial.categories.map((c) => c.name)).toEqual(buildDefaultCategories('').map((c) => c.name));
    expect(initial.settings).toEqual({ ...DEFAULT_SETTINGS, onboardingCompleted: false });
  });

  it('demonstração não traz nome fixo', () => {
    expect(buildDemoData('2026-10-30').settings.userName).toBe('');
  });

  it('documentos antigos: onboarding concluído e renda 0; campos inválidos voltam ao padrão', () => {
    const legacy = JSON.stringify({ ...EMPTY_DATA, schemaVersion: 1, settings: { userName: 'Ana', savingsTarget: 30 } });
    expect(parseFinanceData(legacy)?.settings).toEqual({ ...DEFAULT_SETTINGS, userName: 'Ana', savingsTarget: 30, onboardingCompleted: true, monthlyIncome: 0 });

    const invalid = JSON.stringify({
      ...EMPTY_DATA,
      schemaVersion: 1,
      settings: { userName: 42, monthlyIncome: -5, savingsTarget: 900, hideBalances: 'sim', isDemoData: null, onboardingCompleted: 'não' },
    });
    expect(parseFinanceData(invalid)?.settings).toEqual(DEFAULT_SETTINGS);

    const pending = JSON.stringify({ ...EMPTY_DATA, schemaVersion: 1, settings: { ...DEFAULT_SETTINGS, onboardingCompleted: false, monthlyIncome: 12_345 } });
    expect(parseFinanceData(pending)?.settings).toMatchObject({ onboardingCompleted: false, monthlyIncome: 12_345 });
  });
});

describe('instalação do app (beforeinstallprompt)', () => {
  it('guarda o evento, notifica a interface e o usa uma única vez', async () => {
    listenForInstallPrompt();
    const listener = vi.fn();
    const unsubscribe = subscribeInstallPrompt(listener);
    expect(canPromptInstall()).toBe(false);
    expect(await promptInstall()).toBe('unavailable');

    const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'accepted' as const }),
    });
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(canPromptInstall()).toBe(true);
    expect(listener).toHaveBeenCalled();
    expect(await promptInstall()).toBe('accepted');
    expect(event.prompt).toHaveBeenCalledTimes(1);
    expect(canPromptInstall()).toBe(false);
    unsubscribe();
  });
});
