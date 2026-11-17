/** Convierte el Base64 del backend en una descarga real, byte a byte. */
export function descargarBase64(contenido: string, nombreArchivo: string): void {
  const binario = atob(contenido);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) {
    bytes[i] = binario.charCodeAt(i);
  }
  descargarBlob(new Blob([bytes], { type: 'text/plain;charset=windows-1252' }), nombreArchivo);
}

export function descargarBlob(blob: Blob, nombreArchivo: string): void {
  const url = URL.createObjectURL(blob);
  const ancla = document.createElement('a');
  ancla.href = url;
  ancla.download = nombreArchivo;
  document.body.appendChild(ancla);
  ancla.click();
  ancla.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function descargarCsv(filas: string[][], nombreArchivo: string): void {
  const contenido = filas
    .map((fila) => fila.map((valor) => `"${(valor ?? '').replace(/"/g, '""')}"`).join(';'))
    .join('\r\n');
  descargarBlob(new Blob(['\ufeff' + contenido], { type: 'text/csv;charset=utf-8' }), nombreArchivo);
}
