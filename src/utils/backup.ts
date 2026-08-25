import { db } from '../db';
import type { Device, BackupData } from '../types/device';

export async function exportDatabaseToJSON(): Promise<void> {
  const devices = await db.devices.toArray();
  const backup: BackupData = {
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

export async function importDatabaseFromJSON(
  file: File,
  mode: 'replace' | 'merge' = 'replace'
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const text = await file.text();
    const data = JSON.parse(text) as Partial<BackupData>;

    if (!data.devices || !Array.isArray(data.devices)) {
      return { success: false, count: 0, error: 'El archivo no contiene un formato de respaldo válido de DeviceVault.' };
    }

    const devicesToImport: Device[] = data.devices.map((d: any) => ({
      id: d.id || crypto.randomUUID(),
      type: d.type || 'other',
      brand: d.brand || 'Desconocido',
      model: d.model || 'Dispositivo',
      customName: d.customName || '',
      modelNumber: d.modelNumber || '',
      color: d.color || '',
      storage: d.storage || '',
      ram: d.ram || '',
      os: d.os || '',
      imei1: d.imei1 || '',
      imei2: d.imei2 || '',
      serialNumber: d.serialNumber || '',
      eid: d.eid || '',
      phoneCarrier: d.phoneCarrier || '',
      purchaseDate: d.purchaseDate || '',
      purchasePrice: typeof d.purchasePrice === 'number' ? d.purchasePrice : undefined,
      purchaseCurrency: d.purchaseCurrency || 'USD',
      purchaseLocation: d.purchaseLocation || '',
      warrantyExpiration: d.warrantyExpiration || '',
      insuranceInfo: d.insuranceInfo || '',
      status: d.status || 'in_use',
      condition: d.condition || '',
      notes: d.notes || '',
      tags: Array.isArray(d.tags) ? d.tags : [],
      mainPhoto: d.mainPhoto || undefined,
      additionalPhotos: Array.isArray(d.additionalPhotos) ? d.additionalPhotos : [],
      createdAt: typeof d.createdAt === 'number' ? d.createdAt : Date.now(),
      updatedAt: typeof d.updatedAt === 'number' ? d.updatedAt : Date.now(),
    }));

    if (mode === 'replace') {
      await db.devices.clear();
      await db.devices.bulkAdd(devicesToImport);
    } else {
      // Modo Merge: upsert por ID
      await db.devices.bulkPut(devicesToImport);
    }

    return { success: true, count: devicesToImport.length };
  } catch (err: any) {
    return { success: false, count: 0, error: err.message || 'Error al procesar el archivo JSON.' };
  }
}
