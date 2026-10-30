import { Button } from './Button';
import { Sheet } from './Sheet';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm(): void;
  onCancel(): void;
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Excluir', onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Sheet
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="danger" icon="delete" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p>{message}</p>
    </Sheet>
  );
}
