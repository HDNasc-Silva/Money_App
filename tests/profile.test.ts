import { describe, expect, it, vi } from 'vitest';
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
  it('nome e renda opcionais; sem meta de poupança em %', () => {
    expect(validateProfileSettings({ name: '', monthlyIncome: '' })).toEqual({ ok: true, value: { userName: '', monthlyIncome: 0 } });
    expect(validateProfileSettings({ name: ' Ana ', monthlyIncome: '1.234,56' })).toEqual({
      ok: true,
      value: { userName: 'Ana', monthlyIncome: 123_456 },
    });
    expect(validateProfileSettings({ name: 'a'.repeat(41), monthlyIncome: 'abc' })).toMatchObject({
      ok: false,
      errors: { name: expect.stringContaining('40'), monthlyIncome: 'Informe um valor válido.' },
    });
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
    // Documento anterior à v1.5.0 com a antiga meta de poupança (%): carrega normalmente e o campo é descartado.
    const legacy = JSON.stringify({ ...EMPTY_DATA, schemaVersion: 1, settings: { userName: 'Ana', savingsTarget: 30 } });
    const settings = parseFinanceData(legacy)?.settings;
    expect(settings).toEqual({ ...DEFAULT_SETTINGS, userName: 'Ana', onboardingCompleted: true, monthlyIncome: 0 });
    expect(settings).not.toHaveProperty('savingsTarget');

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
