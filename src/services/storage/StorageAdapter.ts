/** Contrato mínimo de armazenamento chave/valor (texto). */
export interface StorageAdapter {
  read(key: string): string | null;
  write(key: string, value: string): void;
  remove(key: string): void;
}

export class StorageError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

export class LocalStorageAdapter implements StorageAdapter {
  constructor(private readonly storage: Storage = window.localStorage) {}

  read(key: string): string | null {
    try {
      return this.storage.getItem(key);
    } catch (error) {
      throw new StorageError('Não foi possível ler os dados salvos.', error);
    }
  }

  write(key: string, value: string): void {
    try {
      this.storage.setItem(key, value);
    } catch (error) {
      throw new StorageError('Não foi possível salvar os dados (armazenamento cheio ou bloqueado).', error);
    }
  }

  remove(key: string): void {
    try {
      this.storage.removeItem(key);
    } catch (error) {
      throw new StorageError('Não foi possível remover os dados salvos.', error);
    }
  }
}

export class MemoryStorageAdapter implements StorageAdapter {
  private readonly items = new Map<string, string>();

  read(key: string): string | null {
    return this.items.get(key) ?? null;
  }

  write(key: string, value: string): void {
    this.items.set(key, value);
  }

  remove(key: string): void {
    this.items.delete(key);
  }
}

/** Usa o localStorage quando disponível; caso contrário, memória (dados não persistem). */
export function createDefaultAdapter(): { adapter: StorageAdapter; persistent: boolean } {
  try {
    const probe = '__money_app_probe__';
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return { adapter: new LocalStorageAdapter(), persistent: true };
  } catch {
    return { adapter: new MemoryStorageAdapter(), persistent: false };
  }
}
