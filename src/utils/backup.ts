import { db } from '../db';
import {
  validateBackupSchema,
  sanitizeDeviceFromBackup,
  sanitizeAccessoryFromBackup,
} from './backupValidation';

export async function exportDatabaseToJSON(): Promise<void> {
  const devices = await db.devices.toArray();
  const accessories = await db.accessories.toArray();

  const backup = {
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    deviceCount: devices.length,
    devices,
    accessoryCount: accessories.length,
    accessories,
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
  accessoryCount?: number;
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

  // Validacion estricta de schema (Version, UUID, Fotos MIME/Base64, Types)
  const validation = validateBackupSchema(rawData);

  if (!validation.valid) {
    const topErrors = validation.errors.slice(0, 3).map((e) => `[${e.field}]: ${e.message}`).join(' | ');
    return {
      success: false,
      count: 0,
      error: `Validacion de respaldo fallida: ${topErrors}${validation.errors.length > 3 ? ` ... y ${validation.errors.length - 3} error(es) mas.` : ''}`,
      warnings: validation.warnings,
    };
  }

  const backup = rawData as {
    devices: Array<Record<string, unknown>>;
    accessories?: Array<Record<string, unknown>>;
  };

  const devicesToImport = backup.devices.map(sanitizeDeviceFromBackup);
  const accessoriesToImport = Array.isArray(backup.accessories)
    ? backup.accessories.map(sanitizeAccessoryFromBackup)
    : [];

  if (mode === 'replace') {
    // TRANSACCION ATOMICA: valida todo antes de tocar la DB
    // Si falla cualquier parte, Dexie revierte devices y accessories automaticamente
    try {
      await db.transaction('rw', [db.devices, db.accessories], async () => {
        await db.devices.clear();
        await db.accessories.clear();
        if (devicesToImport.length > 0) {
          await db.devices.bulkAdd(devicesToImport);
        }
        if (accessoriesToImport.length > 0) {
          await db.accessories.bulkAdd(accessoriesToImport);
        }
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al escribir en la base de datos.';
      return {
        success: false,
        count: 0,
        error: `La importacion fallo durante la escritura atomica. Tus datos anteriores se conservan intactos. Detalle: ${msg}`,
        warnings: validation.warnings,
      };
    }
  } else {
    // Modo Merge: upsert por ID
    try {
      if (devicesToImport.length > 0) {
        await db.devices.bulkPut(devicesToImport);
      }
      if (accessoriesToImport.length > 0) {
        await db.accessories.bulkPut(accessoriesToImport);
      }
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

  return {
    success: true,
    count: devicesToImport.length,
    accessoryCount: accessoriesToImport.length,
    warnings: validation.warnings,
  };
}