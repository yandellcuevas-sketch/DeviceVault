import { db } from '../db';
import { validateBackupSchema, sanitizeDeviceFromBackup } from './backupValidation';

export async function exportDatabaseToJSON(): Promise<void> {
  const devices = await db.devices.toArray();
  const backup = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    deviceCount: devices.length,
    devices,
  };

  const jsonString = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().split('T')[0];
  const link = document.createElement('a');
  link.href = url;
  link.download = `devicevault-backup-${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface ImportResult {
  success: boolean;
  count: number;
  error?: string;
  warnings?: string[];
}

export async function importDatabaseFromJSON(
  file: File,
  mode: 'replace' | 'merge' = 'replace'
): Promise<ImportResult> {
  // Limite de tamano de archivo: 500 MB
  const MAX_FILE_SIZE = 500 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, count: 0, error: 'El archivo es demasiado grande (maximo 500 MB).' };
  }

  let rawData: unknown;
  try {
    const text = await file.text();
    rawData = JSON.parse(text);
  } catch {
    return { success: false, count: 0, error: 'El archivo no es un JSON valido. Verifica que no este corrupto.' };
  }

  // Validacion estricta de schema
  const validation = validateBackupSchema(rawData);

  if (!validation.valid) {
    const topErrors = validation.errors.slice(0, 3).map((e) => `[${e.field}]: ${e.message}`).join(' | ');
    return {
      success: false,
      count: 0,
      error: `El archivo no pasa la validacion de formato DeviceVault. ${topErrors}${validation.errors.length > 3 ? ` ... y ${validation.errors.length - 3} error(es) mas.` : ''}`,
      warnings: validation.warnings,
    };
  }

  // Sanitizar todos los dispositivos antes de persistir
  const backup = rawData as { devices: Array<Record<string, unknown>> };
  const devicesToImport = backup.devices.map(sanitizeDeviceFromBackup);

  if (mode === 'replace') {
    // TRANSACCION ATOMICA: validar, preparar, y solo entonces reemplazar.
    // Si cualquier parte falla, Dexie hace rollback automatico.
    try {
      await db.transaction('rw', db.devices, async () => {
        await db.devices.clear();
        await db.devices.bulkAdd(devicesToImport);
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al escribir en la base de datos.';
      return {
        success: false,
        count: 0,
        error: `La importacion fallo durante la escritura. Tus datos anteriores se conservan intactos. Detalle: ${msg}`,
        warnings: validation.warnings,
      };
    }
  } else {
    // Modo Merge: upsert por ID (no borra datos previos)
    try {
      await db.devices.bulkPut(devicesToImport);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al combinar datos.';
      return {
        success: false,
        count: 0,
        error: `Error en modo Combinar: ${msg}`,
        warnings: validation.warnings,
      };
    }
  }

  return { success: true, count: devicesToImport.length, warnings: validation.warnings };
}