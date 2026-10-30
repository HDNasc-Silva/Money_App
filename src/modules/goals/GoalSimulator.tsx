import { useMemo, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Icon } from '@/components/common/Icon';
import { useToast } from '@/components/common/Toast';
import { SelectField } from '@/components/forms/Fields';
import { goalForecast, goalProgress, simulationScenarios } from '@/domain/goals';
import type { Goal } from '@/models';
import { useFinanceActions } from '@/store/FinanceProvider';
import { formatMonthLabel, todayIso } from '@/utils/dates';
import { pluralize } from '@/utils/format';
import { formatCurrency } from '@/utils/money';
import styles from './Goals.module.css';

const STEP = 5_000; // R$ 50
const SHORTCUTS = [50_000, 80_000, 120_000];

export function GoalSimulator({ goals }: { goals: readonly Goal[] }) {
  const active = goals.filter((g) => !goalProgress(g).completed);
  const [goalId, setGoalId] = useState(active[0]?.id ?? '');
  const goal = active.find((g) => g.id === goalId) ?? active[0];
  const [monthly, setMonthly] = useState(() => goal?.monthlyContribution || 50_000);
  const { saveGoal } = useFinanceActions();
  const { showToast } = useToast();
  const today = todayIso();

  const remaining = goal ? goalProgress(goal).remaining : 0;
  const max = Math.max(200_000, Math.ceil(remaining / 2 / STEP) * STEP);
  const forecast = useMemo(() => (goal ? goalForecast(goal, today, monthly) : null), [goal, today, monthly]);
  const scenarios = useMemo(() => simulationScenarios(remaining, monthly), [remaining, monthly]);

  if (!goal || !forecast) {
    return (
      <Card>
        <p className={styles.muted}>Crie uma meta ativa para usar o simulador de aportes.</p>
      </Card>
    );
  }

  const selectGoal = (id: string) => {
    setGoalId(id);
    const next = active.find((g) => g.id === id);
    if (next?.monthlyContribution) setMonthly(next.monthlyContribution);
  };

  const applyPlan = async () => {
    // Campos fora do rascunho editável são descartados.
    const { id, contributions: _contributions, createdAt: _createdAt, ...draft } = goal;
    await saveGoal({ ...draft, monthlyContribution: monthly }, id);
    showToast({ message: `Aporte planejado de ${goal.name} atualizado para ${formatCurrency(monthly)}/mês.` });
  };

  const late = forecast.pace === 'late';

  return (
    <Card aria-labelledby="simulator-title">
      <div className={styles.simHeader}>
        <h2 id="simulator-title" className={styles.simTitle}>
          <span className={styles.simIcon}>
            <Icon name="calculate" size={18} />
          </span>
          Simulador de Aportes
        </h2>
        <Badge tone="income">Tempo real</Badge>
      </div>

      <SelectField
        label="Selecione a meta para simular"
        value={goal.id}
        onChange={selectGoal}
        options={active.map((g) => ({ value: g.id, label: `${g.name} (resta ${formatCurrency(goalProgress(g).remaining)})` }))}
      />

      <div className={styles.slider}>
        <div className={styles.sliderTop}>
          <label htmlFor="monthly-slider">Aporte mensal estimado</label>
          <output htmlFor="monthly-slider" className="money">
            {formatCurrency(monthly, { compact: true })}
          </output>
        </div>
        <input
          id="monthly-slider"
          type="range"
          min={STEP}
          max={max}
          step={STEP}
          value={Math.min(monthly, max)}
          onChange={(event) => setMonthly(Number(event.target.value))}
          style={{ ['--fill' as string]: `${(Math.min(monthly, max) / max) * 100}%` }}
        />
        <div className={styles.shortcuts}>
          {SHORTCUTS.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={monthly === value}
              className={[styles.shortcut, monthly === value && styles.shortcutActive].filter(Boolean).join(' ')}
              onClick={() => setMonthly(value)}
            >
              {formatCurrency(value, { compact: true })}/mês
            </button>
          ))}
        </div>
      </div>

      <div className={[styles.result, late && styles.resultLate].filter(Boolean).join(' ')} aria-live="polite">
        <strong>
          <Icon name={late ? 'schedule' : 'verified'} size={18} />
          {forecast.months === null
            ? 'Defina um aporte maior que zero.'
            : `Em ${pluralize(forecast.months, 'mês', 'meses')} você conclui sua meta!`}
        </strong>
        {forecast.month && (
          <span>
            Previsão de conclusão: <b>{formatMonthLabel(forecast.month)}</b>
          </span>
        )}
        {goal.deadline && forecast.requiredMonthly !== null && (
          <span>
            {late ? 'Após o prazo. ' : 'Dentro do prazo. '}
            Para concluir até {formatMonthLabel(goal.deadline.slice(0, 7))}: <b className="money">{formatCurrency(forecast.requiredMonthly)}/mês</b>
          </span>
        )}
      </div>

      <div className={styles.scenarios}>
        <span className={styles.overline}>Cenários comparativos</span>
        {scenarios.map((s) => (
          <div key={s.key} className={styles.scenario}>
            <span className={[styles.scenarioDot, styles[s.key]].join(' ')} aria-hidden="true" />
            <span className={styles.scenarioName}>{s.label}</span>
            <span className={styles.muted}>{formatCurrency(s.monthly, { compact: true })}/mês</span>
            <strong className="money">{s.months === null ? '—' : pluralize(s.months, 'mês', 'meses')}</strong>
          </div>
        ))}
      </div>

      {monthly !== goal.monthlyContribution && (
        <Button variant="secondary" icon="event_available" fullWidth onClick={applyPlan}>
          Usar {formatCurrency(monthly, { compact: true })}/mês como aporte planejado
        </Button>
      )}
    </Card>
  );
}
