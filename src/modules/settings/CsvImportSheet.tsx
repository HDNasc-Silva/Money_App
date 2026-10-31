import { useRef, useState, type ChangeEvent } from 'react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Icon } from '@/components/common/Icon';
import { Money } from '@/components/common/Money';
import { Sheet } from '@/components/common/Sheet';
import { useToast } from '@/components/common/Toast';
import { readTextFile } from '@/services/import/readTextFile';
import { buildImportPreview, MAX_IMPORT_BYTES, type ImportPreview } from '@/services/import/spreadsheetCsv';
import { useFinanceActions, useFinanceData } from '@/store/FinanceProvider';
import { formatDateBr, todayIso } from '@/utils/dates';
import { pluralize } from '@/utils/format';
import styles from './Settings.module.css';

/** Quantidade de linhas exibidas na prévia (todas as válidas são importadas). */
const PREVIEW_LIMIT = 30;

/** Importação de lançamentos de uma planilha (CSV) com prévia antes de gravar (DT-020). */
export function CsvImportSheet({ open, onClose }: { open: boolean; onClose(): void }) {
  const { categories, transactions } = useFinanceData();
  const { importTransactions } = useFinanceActions();
  const { showToast } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importing, setImporting] = useState(false);

  const readFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) {
      setFileName(file.name);
      setPreview({ error: 'Arquivo muito grande (máximo de 2 MB).', rows: [], ready: [] });
      return;
    }
    setFileName(file.name);
    try {
      setPreview(buildImportPreview(await readTextFile(file), categories, transactions, todayIso()));
    } catch {
      setPreview({ error: 'Não foi possível ler o arquivo.', rows: [], ready: [] });
    }
  };

  const confirm = async () => {
    if (!preview || preview.ready.length === 0) return;
    setImporting(true);
    const count = await importTransactions(preview.ready);
    setImporting(false);
    showToast({ message: `${pluralize(count, 'lançamento importado', 'lançamentos importados')}.` });
    setPreview(null);
    setFileName('');
    onClose();
  };

  const invalid = preview?.rows.filter((r) => !r.ok).length ?? 0;
  const duplicates = preview?.rows.filter((r) => r.ok && r.duplicate).length ?? 0;

  return (
    <Sheet open={open} title="Importar de planilha" subtitle="Traga o histórico que você já tem em CSV" onClose={onClose}>
      <div className={styles.importBody}>
        <div className={styles.importHelp}>
          <p>
            Na sua planilha (Excel, Google Planilhas, LibreOffice), use <strong>Arquivo → Baixar/Salvar como → CSV</strong>. A primeira linha
            precisa ter as colunas:
          </p>
          <p className={styles.importColumns}>
            <code>Data</code> <code>Descrição</code> <code>Valor</code> <code>Categoria</code>
          </p>
          <p>
            Datas como 31/10/2026. Valores negativos viram <strong>despesas</strong> e positivos, <strong>receitas</strong> (ou inclua uma coluna{' '}
            <code>Tipo</code> com Receita/Despesa). Categorias com o mesmo nome das suas são reconhecidas; as demais vão para "Outros".
          </p>
        </div>

        <Button variant="secondary" icon="upload_file" fullWidth onClick={() => fileInput.current?.click()}>
          {fileName ? 'Escolher outro arquivo' : 'Escolher arquivo CSV'}
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept=".csv,text/csv"
          hidden
          aria-label="Arquivo CSV da planilha"
          data-testid="csv-file-input"
          onChange={readFile}
        />

        {preview?.error && (
          <p className={styles.importError} role="alert">
            <Icon name="error" size={18} />
            {preview.error}
          </p>
        )}

        {preview && !preview.error && (
          <section aria-label="Prévia da importação" className={styles.importPreview}>
            <p className={styles.importSummary}>
              <strong>{fileName}</strong>: {pluralize(preview.ready.length, 'lançamento pronto', 'lançamentos prontos')} para importar
              {invalid > 0 && ` · ${pluralize(invalid, 'linha com problema', 'linhas com problema')}`}
              {duplicates > 0 && ` · ${pluralize(duplicates, 'já existente (ignorado)', 'já existentes (ignorados)')}`}
            </p>
            <ul className={styles.importList}>
              {preview.rows.slice(0, PREVIEW_LIMIT).map((row) =>
                row.ok ? (
                  <li key={row.line} className={row.duplicate ? styles.importSkipped : undefined}>
                    <span className={styles.importDate}>{formatDateBr(row.draft.date)}</span>
                    <span className={styles.importText}>
                      <strong>{row.draft.description}</strong>
                      <small>
                        {row.categoryName}
                        {!row.categoryMatched && ' (categoria não encontrada)'}
                        {row.duplicate && ' · já existe'}
                      </small>
                    </span>
                    <Money
                      value={row.draft.type === 'income' ? row.draft.amount : -row.draft.amount}
                      signed
                      alwaysVisible
                      className={row.draft.type === 'income' ? styles.importIncome : undefined}
                    />
                  </li>
                ) : (
                  <li key={row.line} className={styles.importInvalid}>
                    <span className={styles.importDate}>Linha {row.line}</span>
                    <span className={styles.importText}>
                      <small>{row.error}</small>
                    </span>
                    <Badge tone="expense">Ignorada</Badge>
                  </li>
                ),
              )}
            </ul>
            {preview.rows.length > PREVIEW_LIMIT && (
              <p className={styles.importMore}>e mais {preview.rows.length - PREVIEW_LIMIT} linha(s)…</p>
            )}
            <Button icon="download_done" fullWidth disabled={preview.ready.length === 0 || importing} onClick={confirm}>
              {preview.ready.length === 0 ? 'Nada para importar' : `Importar ${pluralize(preview.ready.length, 'lançamento', 'lançamentos')}`}
            </Button>
          </section>
        )}
      </div>
    </Sheet>
  );
}
