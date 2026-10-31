import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card, CardHeader } from '@/components/common/Card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { useToast } from '@/components/common/Toast';
import { FormRow, FormStack, MoneyField, TextField } from '@/components/forms/Fields';
import { Page } from '@/components/layout/Page';
import { USER_NAME_MAX } from '@/models';
import { backupToJson, downloadFile } from '@/services/export';
import { DomainError, useFinanceActions, useFinanceData } from '@/store/FinanceProvider';
import { THEME_LABELS, type ThemeName } from '@/theme/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { todayIso } from '@/utils/dates';
import { centsToInput } from '@/utils/money';
import { validateProfileSettings, type FieldErrors, type ProfileSettingsFormValues } from '@/validations';
import { CategoriesSettings } from './CategoriesSettings';
import { InstallAppCard } from './InstallAppCard';
import styles from './Settings.module.css';

const THEME_OPTIONS = (Object.keys(THEME_LABELS) as ThemeName[]).map((value) => ({ value, label: THEME_LABELS[value] }));
const MAX_BACKUP_BYTES = 4 * 1024 * 1024;

type PendingAction = 'demo' | 'clear' | null;

export function SettingsPage() {
  const data = useFinanceData();
  const { settings } = data;
  const actions = useFinanceActions();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<ProfileSettingsFormValues>(() => ({
    name: settings.userName,
    monthlyIncome: settings.monthlyIncome > 0 ? centsToInput(settings.monthlyIncome) : '',
  }));
  const [profileErrors, setProfileErrors] = useState<FieldErrors<keyof ProfileSettingsFormValues>>({});
  const [pending, setPending] = useState<PendingAction>(null);

  const changeProfile = (field: keyof ProfileSettingsFormValues) => (value: string) => {
    setProfile((current) => ({ ...current, [field]: value }));
    setProfileErrors((current) => ({ ...current, [field]: undefined }));
  };

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    const result = validateProfileSettings(profile);
    if (!result.ok) {
      setProfileErrors(result.errors);
      return;
    }
    await actions.updateSettings(result.value);
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
    if (pending === 'demo') {
      await actions.loadDemoData();
      showToast({ message: 'Dados de demonstração carregados.' });
    } else if (pending === 'clear') {
      await actions.clearAllData();
      showToast({ message: 'Dados apagados. As categorias padrão foram recriadas.' });
    }
    setPending(null);
  };

  return (
    <Page title="Ajustes" description="Perfil, aparência e gerenciamento dos seus dados.">
      <Card>
        <CardHeader title="Perfil" subtitle="O que você guarda é acompanhado pelas suas metas." />
        <form onSubmit={saveProfile} noValidate>
          <FormStack>
            <FormRow>
              <TextField
                label="Seu nome"
                value={profile.name}
                onChange={changeProfile('name')}
                error={profileErrors.name}
                maxLength={USER_NAME_MAX}
                autoComplete="given-name"
              />
              <MoneyField
                label="Renda mensal"
                value={profile.monthlyIncome}
                onChange={changeProfile('monthlyIncome')}
                error={profileErrors.monthlyIncome}
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

      <CategoriesSettings />

      <InstallAppCard />

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
          <Button variant="secondary" icon="science" onClick={() => setPending('demo')}>
            Carregar dados de demonstração
          </Button>
          <Button variant="danger" icon="delete_forever" onClick={() => setPending('clear')}>
            Apagar todos os dados
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        open={pending !== null}
        title={pending === 'clear' ? 'Apagar todos os dados?' : 'Carregar dados de demonstração?'}
        message={
          pending === 'clear'
            ? 'Lançamentos, metas, assinaturas e categorias personalizadas serão removidos deste dispositivo; as categorias padrão serão recriadas para você começar do zero. Seu nome e sua renda mensal são mantidos. Exporte um backup antes, se quiser guardá-los.'
            : 'Seus lançamentos, categorias, metas e assinaturas atuais serão substituídos pelos dados de demonstração. Seu nome e preferências são mantidos. Exporte um backup antes, se quiser guardar seus dados.'
        }
        confirmLabel={pending === 'clear' ? 'Apagar tudo' : 'Carregar demonstração'}
        onConfirm={confirmPending}
        onCancel={() => setPending(null)}
      />
    </Page>
  );
}
