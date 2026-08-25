/**
 * Comprime una imagen en el cliente usando Canvas API.
 * Valida MIME real mediante magic bytes antes de procesar.
 * Define limites de tamano para proteger contra archivos maliciosos o gigantes.
 */

// Tipos MIME permitidos para almacenamiento
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

// Tamano maximo de entrada (50 MB)
const MAX_INPUT_SIZE_BYTES = 50 * 1024 * 1024;

export interface CompressionResult {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
}

export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageValidationError';
  }
}

/**
 * Detecta el tipo MIME real usando magic bytes (primeros bytes del archivo).
 * No confia solo en file.type ni en la extension.
 */
async function detectRealMime(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const buf = e.target?.result as ArrayBuffer;
      if (!buf) { resolve(null); return; }
      const bytes = new Uint8Array(buf);

      // JPEG: FF D8 FF
      if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
        resolve('image/jpeg'); return;
      }
      // PNG: 89 50 4E 47 0D 0A 1A 0A
      if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
        resolve('image/png'); return;
      }
      // WebP: RIFF....WEBP
      if (
        bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
        bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
      ) {
        resolve('image/webp'); return;
      }
      // GIF: GIF8
      if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
        resolve('image/gif'); return;
      }
      // AVIF: ftyp box (bytes 4-7 = "ftyp", bytes 8-11 = "avif")
      if (
        bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70 &&
        bytes[8] === 0x61 && bytes[9] === 0x76 && bytes[10] === 0x69 && bytes[11] === 0x66
      ) {
        resolve('image/avif'); return;
      }

      resolve(null);
    };
    reader.onerror = () => resolve(null);
    // Solo leer los primeros 16 bytes para identificacion
    reader.readAsArrayBuffer(file.slice(0, 16));
  });
}

/**
 * Comprime una imagen usando Canvas API.
 * Valida MIME real antes de procesar.
 * Lanza ImageValidationError si el archivo no es una imagen valida.
 */
export async function compressImage(
  file: File,
  maxWidth = 1400,
  maxHeight = 1400,
  quality = 0.82
): Promise<CompressionResult> {
  // 1. Validar tamano de entrada
  if (file.size > MAX_INPUT_SIZE_BYTES) {
    throw new ImageValidationError(
      `El archivo es demasiado grande (${(file.size / 1024 / 1024).toFixed(1)} MB). El maximo permitido es ${MAX_INPUT_SIZE_BYTES / 1024 / 1024} MB.`
    );
  }

  // 2. Validar MIME declarado (rapido)
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new ImageValidationError(
      `Tipo de archivo no permitido: "${file.type}". Solo se aceptan imagenes JPEG, PNG, WebP, GIF y AVIF.`
    );
  }

  // 3. Validar MIME real con magic bytes
  const realMime = await detectRealMime(file);
  if (!realMime) {
    throw new ImageValidationError(
      'El archivo no es una imagen valida. No se pudo verificar su tipo real. Asegurate de seleccionar una imagen JPEG, PNG o WebP.'
    );
  }

  const originalSize = file.size;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new ImageValidationError('No se pudo procesar la imagen: canvas context no disponible.'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);

        // Verificar que el resultado sea razonable
        if (!dataUrl.startsWith('data:image/')) {
          reject(new ImageValidationError('Error al comprimir la imagen.'));
          return;
        }

        const compressedSize = Math.round((dataUrl.length * 3) / 4);
        resolve({ dataUrl, originalSize, compressedSize });
      };
      img.onerror = () => reject(new ImageValidationError('No se pudo cargar la imagen. Verifica que el archivo no este corrupto.'));
    };
    reader.onerror = () => reject(new ImageValidationError('Error al leer el archivo de imagen.'));
  });
}