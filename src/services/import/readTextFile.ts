/** Lê um arquivo escolhido pelo usuário como texto UTF-8 (usa FileReader quando `Blob.text` não existe). */
export function readTextFile(file: Blob): Promise<string> {
  if (typeof file.text === 'function') return file.text();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error ?? new Error('Não foi possível ler o arquivo.'));
    reader.readAsText(file, 'utf-8');
  });
}
