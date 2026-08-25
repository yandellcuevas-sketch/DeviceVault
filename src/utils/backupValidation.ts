/**
 * Validacion estricta del schema de un archivo de respaldo DeviceVault.
 * Sin dependencias externas.
 */

import type { Device, DeviceType, DeviceStatus } from '../types/device';

const VALID_DEVICE_TYPES: DeviceType[] = [
  'phone', 'tablet', 'computer', 'watch', 'audio', 'accessory', 'other',
];

const VALID_DEVICE_STATUSES: DeviceStatus[] = [
  'in_use', 'stored', 'sold', 'repair', 'lost', 'other',
];

const COMPATIBLE_VERSIONS = ['1.0.0'];
const MAX_PHOTO_DATA_URL_LENGTH = 14_000_000;
const MAX_DEVICES_IN_BACKUP = 10_000;

export interface BackupValidationError {
  field: string;
  message: string;
}

export interface BackupValidationResult {
  valid: boolean;
  errors: BackupValidationError[];
  warnings: string[];
  deviceCount: number;
}

function isStringOrUndefined(val: unknown): val is string | undefined {
  return val === undefined || val === null || typeof val === 'string';
}

function isNumberOrUndefined(val: unknown): val is number | undefined {
  return val === undefined || val === null || typeof val === 'number';
}

function isValidDataUrl(val: string): boolean {
  return (
    val.startsWith('data:image/jpeg;base64,') ||
    val.startsWith('data:image/png;base64,') ||
    val.startsWith('data:image/webp;base64,') ||
    val.startsWith('data:image/gif;base64,') ||
    val.startsWith('data:image/avif;base64,')
  );
}

function isUuidLike(val: string): boolean {
  return /^[0-9a-f-]{8,64}$/i.test(val);
}

function validateDevice(d: unknown, index: number): BackupValidationError[] {
  const errors: BackupValidationError[] = [];
  const prefix = `devices[${index}]`;

  if (!d || typeof d !== 'object') {
    errors.push({ field: prefix, message: 'El dispositivo no es un objeto valido.' });
    return errors;
  }

  const dev = d as Record<string, unknown>;

  if (typeof dev.id !== 'string' || !isUuidLike(dev.id)) {
    errors.push({ field: `${prefix}.id`, message: `ID invalido: "${dev.id}"` });
  }
  if (!VALID_DEVICE_TYPES.includes(dev.type as DeviceType)) {
    errors.push({ field: `${prefix}.type`, message: `Tipo invalido: "${dev.type}"` });
  }
  if (typeof dev.brand !== 'string' || dev.brand.trim().length === 0) {
    errors.push({ field: `${prefix}.brand`, message: 'La marca es requerida.' });
  }
  if (typeof dev.model !== 'string' || dev.model.trim().length === 0) {
    errors.push({ field: `${prefix}.model`, message: 'El modelo es requerido.' });
  }
  if (!VALID_DEVICE_STATUSES.includes(dev.status as DeviceStatus)) {
    errors.push({ field: `${prefix}.status`, message: `Estado invalido: "${dev.status}"` });
  }
  if (typeof dev.createdAt !== 'number' || dev.createdAt <= 0) {
    errors.push({ field: `${prefix}.createdAt`, message: 'createdAt debe ser timestamp numerico.' });
  }
  if (typeof dev.updatedAt !== 'number' || dev.updatedAt <= 0) {
    errors.push({ field: `${prefix}.updatedAt`, message: 'updatedAt debe ser timestamp numerico.' });
  }

  const optionalStrings = [
    'customName','modelNumber','color','storage','ram','os',
    'imei1','imei2','serialNumber','eid','phoneCarrier',
    'purchaseDate','purchaseCurrency','purchaseLocation',
    'warrantyExpiration','insuranceInfo','condition','notes',
  ];
  for (const field of optionalStrings) {
    if (!isStringOrUndefined(dev[field])) {
      errors.push({ field: `${prefix}.${field}`, message: `${field} debe ser texto o estar ausente.` });
    }
  }

  if (!isNumberOrUndefined(dev.purchasePrice)) {
    errors.push({ field: `${prefix}.purchasePrice`, message: 'purchasePrice debe ser numero o estar ausente.' });
  }

  if (dev.tags !== undefined && dev.tags !== null) {
    if (!Array.isArray(dev.tags)) {
      errors.push({ field: `${prefix}.tags`, message: 'tags debe ser un array.' });
    }
  }

  if (dev.mainPhoto !== undefined && dev.mainPhoto !== null) {
    if (typeof dev.mainPhoto !== 'string') {
      errors.push({ field: `${prefix}.mainPhoto`, message: 'mainPhoto debe ser texto (Data URL).' });
    } else if (!isValidDataUrl(dev.mainPhoto)) {
      errors.push({ field: `${prefix}.mainPhoto`, message: 'mainPhoto no es un Data URL de imagen valido.' });
    } else if (dev.mainPhoto.length > MAX_PHOTO_DATA_URL_LENGTH) {
      errors.push({ field: `${prefix}.mainPhoto`, message: 'mainPhoto excede el tamano maximo permitido.' });
    }
  }

  if (dev.additionalPhotos !== undefined && dev.additionalPhotos !== null) {
    if (!Array.isArray(dev.additionalPhotos)) {
      errors.push({ field: `${prefix}.additionalPhotos`, message: 'additionalPhotos debe ser array.' });
    }
  }

  return errors;
}

export function validateBackupSchema(data: unknown): BackupValidationResult {
  const errors: BackupValidationError[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: [{ field: 'root', message: 'El archivo no contiene un JSON valido.' }], warnings: [], deviceCount: 0 };
  }

  const backup = data as Record<string, unknown>;

  if (typeof backup.version !== 'string') {
    warnings.push('El campo "version" esta ausente.');
  } else if (!COMPATIBLE_VERSIONS.includes(backup.version)) {
    warnings.push(`Version del backup "${backup.version}" no reconocida. Se intentara importar.`);
  }

  if (!Array.isArray(backup.devices)) {
    errors.push({ field: 'devices', message: 'El campo "devices" debe ser un array.' });
    return { valid: false, errors, warnings, deviceCount: 0 };
  }

  if (backup.devices.length > MAX_DEVICES_IN_BACKUP) {
    errors.push({ field: 'devices', message: `Demasiados dispositivos: ${backup.devices.length} (max: ${MAX_DEVICES_IN_BACKUP}).` });
    return { valid: false, errors, warnings, deviceCount: 0 };
  }

  if (typeof backup.deviceCount === 'number' && backup.deviceCount !== backup.devices.length) {
    warnings.push(`deviceCount (${backup.deviceCount}) no coincide con dispositivos reales (${backup.devices.length}).`);
  }

  backup.devices.forEach((device, index) => {
    errors.push(...validateDevice(device, index));
  });

  const seenIds = new Set<string>();
  backup.devices.forEach((device: unknown, index: number) => {
    if (device && typeof device === 'object') {
      const dev = device as Record<string, unknown>;
      if (typeof dev.id === 'string') {
        if (seenIds.has(dev.id)) {
          errors.push({ field: `devices[${index}].id`, message: `ID duplicado: "${dev.id}"` });
        }
        seenIds.add(dev.id);
      }
    }
  });

  return { valid: errors.length === 0, errors, warnings, deviceCount: backup.devices.length };
}

export function sanitizeDeviceFromBackup(d: Record<string, unknown>): Device {
  const getString = (val: unknown, fallback = ''): string =>
    typeof val === 'string' ? val.trim().slice(0, 5000) : fallback;
  const getOptionalString = (val: unknown): string | undefined =>
    typeof val === 'string' && val.trim().length > 0 ? val.trim().slice(0, 5000) : undefined;

  return {
    id: typeof d.id === 'string' ? d.id : crypto.randomUUID(),
    type: VALID_DEVICE_TYPES.includes(d.type as DeviceType) ? (d.type as DeviceType) : 'other',
    brand: getString(d.brand, 'Desconocido'),
    model: getString(d.model, 'Dispositivo'),
    customName: getOptionalString(d.customName),
    modelNumber: getOptionalString(d.modelNumber),
    color: getOptionalString(d.color),
    storage: getOptionalString(d.storage),
    ram: getOptionalString(d.ram),
    os: getOptionalString(d.os),
    imei1: getOptionalString(d.imei1),
    imei2: getOptionalString(d.imei2),
    serialNumber: getOptionalString(d.serialNumber),
    eid: getOptionalString(d.eid),
    phoneCarrier: getOptionalString(d.phoneCarrier),
    purchaseDate: getOptionalString(d.purchaseDate),
    purchasePrice: typeof d.purchasePrice === 'number' && isFinite(d.purchasePrice) ? Math.abs(d.purchasePrice) : undefined,
    purchaseCurrency: getString(d.purchaseCurrency, 'USD'),
    purchaseLocation: getOptionalString(d.purchaseLocation),
    warrantyExpiration: getOptionalString(d.warrantyExpiration),
    insuranceInfo: getOptionalString(d.insuranceInfo),
    status: VALID_DEVICE_STATUSES.includes(d.status as DeviceStatus) ? (d.status as DeviceStatus) : 'in_use',
    condition: getOptionalString(d.condition),
    notes: getOptionalString(d.notes),
    tags: Array.isArray(d.tags)
      ? (d.tags as unknown[]).filter((t) => typeof t === 'string').map((t) => (t as string).slice(0, 100)).slice(0, 50)
      : [],
    mainPhoto: typeof d.mainPhoto === 'string' && d.mainPhoto.startsWith('data:image/') ? d.mainPhoto : undefined,
    additionalPhotos: Array.isArray(d.additionalPhotos)
      ? (d.additionalPhotos as unknown[]).filter((p) => typeof p === 'string' && (p as string).startsWith('data:image/')).slice(0, 20) as string[]
      : [],
    createdAt: typeof d.createdAt === 'number' && d.createdAt > 0 ? d.createdAt : Date.now(),
    updatedAt: typeof d.updatedAt === 'number' && d.updatedAt > 0 ? d.updatedAt : Date.now(),
  };
}