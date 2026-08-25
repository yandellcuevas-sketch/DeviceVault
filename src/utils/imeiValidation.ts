/**
 * Validacion de IMEI (Luhn algorithm) y utilitarios de normalizacion
 * de identificadores de dispositivos (IMEI, Serial, EID).
 */

/**
 * Normaliza un identificador eliminando espacios, guiones y convirtiendo a mayusculas.
 */
export function normalizeIdentifier(value: string): string {
  return value.replace(/[\s\-]/g, '').toUpperCase();
}

/**
 * Valida un IMEI con el algoritmo de Luhn.
 * Un IMEI valido tiene 15 digitos numericos y pasa el checksum de Luhn.
 * Retorna { valid: true } o { valid: false, error: string }
 */
export function validateImei(value: string): { valid: boolean; error?: string } {
  if (!value || value.trim().length === 0) {
    return { valid: true }; // Vacio es permitido
  }

  const normalized = value.replace(/[\s\-]/g, '');

  if (!/^\d+$/.test(normalized)) {
    return { valid: false, error: 'El IMEI solo debe contener numeros (sin letras ni simbolos).' };
  }

  if (normalized.length !== 15) {
    return {
      valid: false,
      error: `El IMEI debe tener exactamente 15 digitos. Ingresaste ${normalized.length} digito${normalized.length === 1 ? '' : 's'}.`,
    };
  }

  // Luhn algorithm
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let digit = parseInt(normalized[i], 10);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }

  if (sum % 10 !== 0) {
    return { valid: false, error: 'El IMEI no supera la verificacion de integridad (checksum Luhn invalido). Verifica que lo hayas escrito correctamente.' };
  }

  return { valid: true };
}

/**
 * Genera un IMEI ficticio valido para pruebas.
 * NO usar con datos reales.
 */
export function generateTestImei(): string {
  const digits: number[] = [];
  // TAC ficticio conocido para pruebas: 490154
  const tac = [4, 9, 0, 1, 5, 4, 2, 0];
  digits.push(...tac);
  // SNR aleatorio (6 digitos)
  for (let i = 0; i < 6; i++) {
    digits.push(Math.floor(Math.random() * 10));
  }
  // Calcular check digit con Luhn
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let d = digits[i];
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  digits.push(checkDigit);
  return digits.join('');
}