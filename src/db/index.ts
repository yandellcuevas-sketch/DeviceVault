import Dexie, { type Table } from 'dexie';
import type { Device } from '../types/device';
import type { Accessory } from '../types/accessory';

export class DeviceVaultDatabase extends Dexie {
  devices!: Table<Device, string>;
  accessories!: Table<Accessory, string>;

  constructor() {
    super('DeviceVaultDB');
    this.version(1).stores({
      devices: 'id, type, brand, model, imei1, imei2, serialNumber, eid, status, createdAt, updatedAt',
    });
    this.version(2).stores({
      devices: 'id, type, brand, model, imei1, imei2, serialNumber, eid, status, createdAt, updatedAt',
      accessories: 'id, category, brand, name, serialNumber, linkedDeviceId, status, createdAt, updatedAt',
    });
  }
}

export const db = new DeviceVaultDatabase();

/**
 * Genera un UUID v4 criptograficamente seguro.
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}