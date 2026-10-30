import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card, CardHeader } from '@/components/common/Card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { useToast } from '@/components/common/Toast';
import { FormRow, FormStack, TextField } from '@/components/forms/Fields';
import { Page } from '@/components/layout/Page';
import { backupToJson, downloadFile } from '@/services/export';
import { DomainError, useFinanceActions, useFinanceData } from '@/store/FinanceProvider';
import { THEME_LABELS, type ThemeName } from '@/theme/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { todayIso } from '@/utils/dates';
import styles from './Settings.module.css';

const THEME_OPTIONS = (Object.keys(THEME_LABELS) as ThemeName[]).map((value) => ({ value, label: THEME_LABELS[value] }));
const MAX_BACKUP_BYTES = 4 * 1024 * 1024;

type PendingAction = 'restore' | 'clear' | null;

export function SettingsPage() {
  const data = useFinanceData();
  const { settings } = data;
  const actions = useFinanceActions();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(settings.userName);
  const [target, setTarget] = useState(String(settings.savingsTarget));
  const [targetError, setTargetError] = useState<string>();
  const [pending, setPending] = useState<PendingAction>(null);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = Number(target.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
      setTargetError('Informe um percentual entre 0 e 100.');
      return;
    }
    await actions.updateSettings({ userName: name.trim().slice(0, 40), savingsTarget: Math.round(parsed) });
    showToast({ message: 'Preferências salvas.' });
  };

  const exportBackup = () => {
    downloadFile(`money-app_backup_${todayIso()}.json`, backupToJson(data), 'application/json');
    showToast({ message: 'Backup exportado.' });
  };

  const importBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > MAX_BACKUP_BYTES) {
      showToast({ tone: 'error', message: 'Arquivo muito grande para um backup do Money App.' });
      return;
    }
    try {
      await actions.importBackup(await file.text());
      showToast({ message: 'Backup importado com sucesso.' });
    } catch (error) {
      showToast({ tone: 'error', message: error instanceof DomainError ? error.message : 'Não foi possível ler o arquivo.' });
    }
  };

  const confirmPending = async () => {
    if (pending === 'restore') {
      await actions.restoreDemoData();
      showToast({ message: 'Dados de demonstração restaurados.' });
    } else if (pending === 'clear') {
      await actions.clearAllData();
      showToast({ message: 'Dados apagados. As categorias padrão foram recriadas.' });
    }
    setPending(null);
  };

  return (
    <Page title="Ajustes" description="Perfil, aparência e gerenciamento dos seus dados.">
      <Card>
        <CardHeader title="Perfil e metas" />
        <form onSubmit={saveProfile} noValidate>
          <FormStack>
            <FormRow>
              <TextField label="Seu nome" value={name} onChange={setName} maxLength={40} autoComplete="given-name" />
              <TextField
                label="Meta de poupança (%)"
                inputMode="numeric"
                value={target}
                onChange={(v) => {
                  setTarget(v);
                  setTargetError(undefined);
                }}
                error={targetError}
              />
            </FormRow>
            <Button type="submit" icon="check">
              Salvar preferências
            </Button>
          </FormStack>
        </form>
      </Card>

      <Card>
        <CardHeader title="Aparência" subtitle="A preferência fica salva neste dispositivo." />
        <SegmentedControl label="Tema" options={THEME_OPTIONS} value={theme} onChange={setTheme} />
        <label className={styles.switchRow}>
          <span>
            <strong>Ocultar valores</strong>
            <small>Esconde saldos e montantes nas telas.</small>
          </span>
          <input
            type="checkbox"
            role="switch"
            className={styles.switch}
            checked={settings.hideBalances}
            onChange={(event) => actions.updateSettings({ hideBalances: event.target.checked })}
          />
        </label>
      </Card>

      <Card>
        <CardHeader
          title="Seus dados"
          subtitle="Tudo fica salvo apenas neste navegador."
          action={settings.isDemoData ? <Badge tone="warning">Demonstração</Badge> : undefined}
        />
        <p className={styles.stats}>
          {data.transactions.length} lançamentos · {data.categories.length} categorias · {data.goals.length} metas
        </p>
        <div className={styles.buttons}>
          <Button variant="secondary" icon="download" onClick={exportBackup}>
            Exportar backup
          </Button>
          <Button variant="secondary" icon="upload" onClick={() => fileInput.current?.click()}>
            Importar backup
          </Button>
          <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={importBackup} />
          <Button variant="secondary" icon="science" onClick={() => setPending('restore')}>
            Restaurar demonstração
          </Button>
          <Button variant="danger" icon="delete_forever" onClick={() => setPending('clear')}>
            Apagar todos os dados
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        open={pending !== null}
        title={pending === 'clear' ? 'Apagar todos os dados?' : 'Restaurar dados de demonstração?'}
        message={
          pending === 'clear'
            ? 'Lançamentos, metas e categorias personalizadas serão removidos deste dispositivo; as categorias padrão serão recriadas para você começar do zero. Exporte um backup antes, se quiser guardá-los.'
            : 'Os dados atuais serão substituídos pelos dados de demonstração.'
        }
        confirmLabel={pending === 'clear' ? 'Apagar tudo' : 'Restaurar'}
        onConfirm={confirmPending}
        onCancel={() => setPending(null)}
      />
    </Page>
  );
}
