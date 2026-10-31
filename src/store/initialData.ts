import { DEFAULT_SETTINGS, EMPTY_DATA, type FinanceData } from '@/models';
import { buildDefaultCategories } from './defaultCategories';

/**
 * Dados do primeiro acesso: nenhum lançamento ou meta, apenas as categorias padrão (para que
 * seja possível lançar de imediato) e o onboarding pendente. Os dados de demonstração só são
 * carregados quando o usuário pede, em Ajustes (ver DT-014).
 */
export function buildInitialData(createdAt: string): FinanceData {
  return {
    ...EMPTY_DATA,
    categories: buildDefaultCategories(createdAt),
    settings: { ...DEFAULT_SETTINGS, onboardingCompleted: false },
  };
}
