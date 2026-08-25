/**
 * Validacion estricta del schema de un archivo de respaldo DeviceVault.
 * Sin dependencias externas.
 */

import type { Device, DeviceType, DeviceStatus } from '../types/device';
import type { Accessory, AccessoryCategory, AccessoryStatus } from '../types/accessory';

export const VALID_DEVICE_TYPES: DeviceType[] = [
  'phone', 'tablet', 'computer', 'watch', 'audio', 'accessory', 'other',
];

export const VALID_DEVICE_STATUSES: DeviceStatus[] = [
  'in_use', 'stored', 'sold', 'repair', 'lost', 'stolen', 'other',
];

export const VALID_ACCESSORY_CATEGORIES: AccessoryCategory[] = [
  'case', 'charger', 'magsafe', 'audio_accessory', 'other',
];

export const VALID_ACCESSORY_STATUSES: AccessoryStatus[] = [
  'active', 'stored', 'sold', 'lost', 'repair', 'other',
];

export const COMPATIBLE_VERSIONS = ['1.0.0', '2.0.0'];
export const MAX_PHOTO_DATA_URL_LENGTH = 14_000_000;
export const MAX_DEVICES_IN_BACKUP = 10_000;
export const MAX_ACCESSORIES_IN_BACKUP = 10_000;
export const MAX_ADDITIONAL_PHOTOS = 20;

export const ALLOWED_PHOTO_PREFIXES = [
  'data:image/jpeg;base64,',
  'data:image/png;base64,',
  'data:image/webp;base64,',
] as const;

export const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface BackupValidationError {
  field: string;
  message: string;
}

export interface BackupValidationResult {
  valid: boolean;
  errors: BackupValidationError[];
  warnings: string[];
  deviceCount: number;
  accessoryCount: number;
}

export function isValidUUIDv4(val: unknown): boolean {
  if (typeof val !== 'string') return false;
  return UUID_V4_REGEX.test(val.trim());
}

export function validateStrictPhoto(val: unknown, fieldName: string): BackupValidationError[] {
  const errors: BackupValidationError[] = [];
  if (typeof val !== 'string') {
    errors.push({ field: fieldName, message: `${fieldName} debe ser un string en formato Data URL Base64.` });
    return errors;
  }

  const hasAllowedPrefix = ALLOWED_PHOTO_PREFIXES.some((prefix) => val.startsWith(prefix));
  if (!hasAllowedPrefix) {
    errors.push({
      field: fieldName,
      message: `${fieldName} tiene un MIME type no permitido. Solo se aceptan data:image/jpeg;base64,, data:image/png;base64, o data:image/webp;base64,.`,
    });
    return errors;
  }

  if (val.length > MAX_PHOTO_DATA_URL_LENGTH) {
    errors.push({
      field: fieldName,
      message: `${fieldName} excede el tamano maximo permitido (${Math.round(MAX_PHOTO_DATA_URL_LENGTH / 1_000_000)} MB).`,
    });
    return errors;
  }

  const prefix = ALLOWED_PHOTO_PREFIXES.find((p) => val.startsWith(p))!;
  const base64Data = val.slice(prefix.length);
  if (!base64Data || !/^[A-Za-z0-9+/=]+$/.test(base64Data)) {
    errors.push({
      field: fieldName,
      message: `${fieldName} contiene datos Base64 no validos o corruptos.`,
    });
  }

  return errors;
}

export function isStrictValidPhotoDataUrl(val: unknown): val is string {
  if (typeof val !== 'string') return false;
  const hasAllowedPrefix = ALLOWED_PHOTO_PREFIXES.some((prefix) => val.startsWith(prefix));
  if (!hasAllowedPrefix) return false;
  if (val.length > MAX_PHOTO_DATA_URL_LENGTH) return false;
  const prefix = ALLOWED_PHOTO_PREFIXES.find((p) => val.startsWith(p))!;
  const base64Data = val.slice(prefix.length);
  return /^[A-Za-z0-9+/=]+$/.test(base64Data);
}

function isStringOrUndefined(val: unknown): val is string | undefined {
  return val === undefined || val === null || typeof val === 'string';
}

function isNumberOrUndefined(val: unknown): val is number | undefined {
  return val === undefined || val === null || typeof val === 'number';
}

function validateDevice(d: unknown, index: number): BackupValidationError[] {
  const errors: BackupValidationError[] = [];
  const prefix = `devices[${index}]`;

  if (!d || typeof d !== 'object') {
    errors.push({ field: prefix, message: 'El dispositivo no es un objeto valido.' });
    return errors;
  }

  const dev = d as Record<string, unknown>;

  if (typeof dev.id !== 'string' || !isValidUUIDv4(dev.id)) {
    errors.push({ field: `${prefix}.id`, message: `ID no es un UUID v4 valido: "${dev.id}".` });
  }
  if (!VALID_DEVICE_TYPES.includes(dev.type as DeviceType)) {
    errors.push({ field: `${prefix}.type`, message: `Tipo invalido: "${dev.type}". Permitidos: ${VALID_DEVICE_TYPES.join(', ')}.` });
  }
  if (typeof dev.brand !== 'string' || dev.brand.trim().length === 0) {
    errors.push({ field: `${prefix}.brand`, message: 'La marca (brand) es requerida y debe ser un texto.' });
  }
  if (typeof dev.model !== 'string' || dev.model.trim().length === 0) {
    errors.push({ field: `${prefix}.model`, message: 'El modelo (model) es requerido y debe ser un texto.' });
  }
  if (!VALID_DEVICE_STATUSES.includes(dev.status as DeviceStatus)) {
    errors.push({ field: `${prefix}.status`, message: `Estado invalido: "${dev.status}". Permitidos: ${VALID_DEVICE_STATUSES.join(', ')}.` });
  }
  if (typeof dev.createdAt !== 'number' || dev.createdAt <= 0) {
    errors.push({ field: `${prefix}.createdAt`, message: 'createdAt debe ser un timestamp numerico positivo.' });
  }
  if (typeof dev.updatedAt !== 'number' || dev.updatedAt <= 0) {
    errors.push({ field: `${prefix}.updatedAt`, message: 'updatedAt debe ser un timestamp numerico positivo.' });
  }

  const optionalStrings = [
    'customName', 'modelNumber', 'partNumber', 'color', 'storage', 'ram', 'os',
    'imei1', 'imei2', 'serialNumber', 'eid', 'iccid', 'upc', 'fccId', 'ic', 'country', 'phoneCarrier',
    'purchaseDate', 'purchaseCurrency', 'purchaseLocation',
    'warrantyExpiration', 'insuranceInfo', 'condition', 'notes',
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
    } else {
      (dev.tags as unknown[]).forEach((tag, ti) => {
        if (typeof tag !== 'string') {
          errors.push({ field: `${prefix}.tags[${ti}]`, message: 'Cada tag debe ser texto.' });
        }
      });
    }
  }

  // Foto principal
  if (dev.mainPhoto !== undefined && dev.mainPhoto !== null) {
    errors.push(...validateStrictPhoto(dev.mainPhoto, `${prefix}.mainPhoto`));
  }

  // Fotos adicionales
  if (dev.additionalPhotos !== undefined && dev.additionalPhotos !== null) {
    if (!Array.isArray(dev.additionalPhotos)) {
      errors.push({ field: `${prefix}.additionalPhotos`, message: 'additionalPhotos debe ser un array.' });
    } else {
      if (dev.additionalPhotos.length > MAX_ADDITIONAL_PHOTOS) {
        errors.push({
          field: `${prefix}.additionalPhotos`,
          message: `additionalPhotos excede el maximo de ${MAX_ADDITIONAL_PHOTOS} imagenes permitidas.`,
        });
      }
      (dev.additionalPhotos as unknown[]).forEach((photo, pi) => {
        errors.push(...validateStrictPhoto(photo, `${prefix}.additionalPhotos[${pi}]`));
      });
    }
  }

  return errors;
}

function validateAccessory(a: unknown, index: number): BackupValidationError[] {
  const errors: BackupValidationError[] = [];
  const prefix = `accessories[${index}]`;

  if (!a || typeof a !== 'object') {
    errors.push({ field: prefix, message: 'El accesorio no es un objeto valido.' });
    return errors;
  }

  const acc = a as Record<string, unknown>;

  if (typeof acc.id !== 'string' || !isValidUUIDv4(acc.id)) {
    errors.push({ field: `${prefix}.id`, message: `ID de accesorio no es un UUID v4 valido: "${acc.id}".` });
  }
  if (!VALID_ACCESSORY_CATEGORIES.includes(acc.category as AccessoryCategory)) {
    errors.push({ field: `${prefix}.category`, message: `Categoria de accesorio invalida: "${acc.category}". Permitidas: ${VALID_ACCESSORY_CATEGORIES.join(', ')}.` });
  }
  if (typeof acc.brand !== 'string' || acc.brand.trim().length === 0) {
    errors.push({ field: `${prefix}.brand`, message: 'La marca de accesorio es requerida y debe ser texto.' });
  }
  if (typeof acc.name !== 'string' || acc.name.trim().length === 0) {
    errors.push({ field: `${prefix}.name`, message: 'El nombre de accesorio es requerido y debe ser texto.' });
  }
  if (!VALID_ACCESSORY_STATUSES.includes(acc.status as AccessoryStatus)) {
    errors.push({ field: `${prefix}.status`, message: `Estado de accesorio invalido: "${acc.status}".` });
  }
  if (typeof acc.createdAt !== 'number' || acc.createdAt <= 0) {
    errors.push({ field: `${prefix}.createdAt`, message: 'createdAt debe ser timestamp numerico positivo.' });
  }
  if (typeof acc.updatedAt !== 'number' || acc.updatedAt <= 0) {
    errors.push({ field: `${prefix}.updatedAt`, message: 'updatedAt debe ser timestamp numerico positivo.' });
  }

  if (acc.linkedDeviceId !== undefined && acc.linkedDeviceId !== null && acc.linkedDeviceId !== '') {
    if (typeof acc.linkedDeviceId !== 'string' || !isValidUUIDv4(acc.linkedDeviceId)) {
      errors.push({ field: `${prefix}.linkedDeviceId`, message: `linkedDeviceId no es un UUID v4 valido: "${acc.linkedDeviceId}".` });
    }
  }

  const optionalStrings = [
    'modelNumber', 'partNumber', 'serialNumber', 'color', 'notes',
    'purchaseDate', 'purchaseCurrency', 'purchaseLocation', 'upc', 'madeIn',
  ];
  for (const field of optionalStrings) {
    if (!isStringOrUndefined(acc[field])) {
      errors.push({ field: `${prefix}.${field}`, message: `${field} debe ser texto o estar ausente.` });
    }
  }

  if (!isNumberOrUndefined(acc.purchasePrice)) {
    errors.push({ field: `${prefix}.purchasePrice`, message: 'purchasePrice debe ser numero o estar ausente.' });
  }

  if (acc.mainPhoto !== undefined && acc.mainPhoto !== null) {
    errors.push(...validateStrictPhoto(acc.mainPhoto, `${prefix}.mainPhoto`));
  }

  if (acc.additionalPhotos !== undefined && acc.additionalPhotos !== null) {
    if (!Array.isArray(acc.additionalPhotos)) {
      errors.push({ field: `${prefix}.additionalPhotos`, message: 'additionalPhotos debe ser un array.' });
    } else {
      (acc.additionalPhotos as unknown[]).forEach((photo, pi) => {
        errors.push(...validateStrictPhoto(photo, `${prefix}.additionalPhotos[${pi}]`));
      });
    }
  }

  return errors;
}

export function validateBackupSchema(data: unknown): BackupValidationResult {
  const errors: BackupValidationError[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      errors: [{ field: 'root', message: 'El archivo no contiene un JSON valido.' }],
      warnings: [],
      deviceCount: 0,
      accessoryCount: 0,
    };
  }

  const backup = data as Record<string, unknown>;

  // 1. Validacion estricta de Version (REJECT si no compatible)
  if (typeof backup.version !== 'string' || backup.version.trim().length === 0) {
    return {
      valid: false,
      errors: [{ field: 'version', message: 'BACKUP_VERSION_MISSING: El campo "version" es obligatorio en el respaldo.' }],
      warnings: [],
      deviceCount: 0,
      accessoryCount: 0,
    };
  }

  if (!COMPATIBLE_VERSIONS.includes(backup.version)) {
    return {
      valid: false,
      errors: [{
        field: 'version',
        message: `BACKUP_VERSION_UNSUPPORTED: La version "${backup.version}" del respaldo no es compatible con esta aplicacion. Versiones soportadas: ${COMPATIBLE_VERSIONS.join(', ')}. Importacion rechazada.`,
      }],
      warnings: [],
      deviceCount: 0,
      accessoryCount: 0,
    };
  }

  // 2. Devices array
  if (!Array.isArray(backup.devices)) {
    errors.push({ field: 'devices', message: 'El campo "devices" debe ser un array.' });
    return { valid: false, errors, warnings, deviceCount: 0, accessoryCount: 0 };
  }

  if (backup.devices.length > MAX_DEVICES_IN_BACKUP) {
    errors.push({ field: 'devices', message: `Demasiados dispositivos: ${backup.devices.length} (max: ${MAX_DEVICES_IN_BACKUP}).` });
    return { valid: false, errors, warnings, deviceCount: 0, accessoryCount: 0 };
  }

  if (typeof backup.deviceCount === 'number' && backup.deviceCount !== backup.devices.length) {
    warnings.push(`deviceCount (${backup.deviceCount}) no coincide con dispositivos reales (${backup.devices.length}).`);
  }

  backup.devices.forEach((device, index) => {
    errors.push(...validateDevice(device, index));
  });

  // Duplicados en devices
  const seenDeviceIds = new Set<string>();
  backup.devices.forEach((device: unknown, index: number) => {
    if (device && typeof device === 'object') {
      const dev = device as Record<string, unknown>;
      if (typeof dev.id === 'string') {
        if (seenDeviceIds.has(dev.id)) {
          errors.push({ field: `devices[${index}].id`, message: `ID de dispositivo duplicado: "${dev.id}".` });
        }
        seenDeviceIds.add(dev.id);
      }
    }
  });

  // 3. Accessories array (opcional para compatibilidad con v1.0.0)
  let accessoryCount = 0;
  if (backup.accessories !== undefined && backup.accessories !== null) {
    if (!Array.isArray(backup.accessories)) {
      errors.push({ field: 'accessories', message: 'El campo "accessories" debe ser un array.' });
    } else {
      accessoryCount = backup.accessories.length;
      if (accessoryCount > MAX_ACCESSORIES_IN_BACKUP) {
        errors.push({ field: 'accessories', message: `Demasiados accesorios: ${accessoryCount} (max: ${MAX_ACCESSORIES_IN_BACKUP}).` });
      }
      backup.accessories.forEach((acc, index) => {
        errors.push(...validateAccessory(acc, index));
      });

      const seenAccessoryIds = new Set<string>();
      backup.accessories.forEach((acc: unknown, index: number) => {
        if (acc && typeof acc === 'object') {
          const a = acc as Record<string, unknown>;
          if (typeof a.id === 'string') {
            if (seenAccessoryIds.has(a.id)) {
              errors.push({ field: `accessories[${index}].id`, message: `ID de accesorio duplicado: "${a.id}".` });
            }
            seenAccessoryIds.add(a.id);
          }
        }
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    deviceCount: backup.devices.length,
    accessoryCount,
  };
}

export function sanitizeDeviceFromBackup(d: Record<string, unknown>): Device {
  const getString = (val: unknown, fallback = ''): string =>
    typeof val === 'string' ? val.trim().slice(0, 5000) : fallback;
  const getOptionalString = (val: unknown): string | undefined =>
    typeof val === 'string' && val.trim().length > 0 ? val.trim().slice(0, 5000) : undefined;

  const mainPhoto = isStrictValidPhotoDataUrl(d.mainPhoto) ? d.mainPhoto : undefined;
  const additionalPhotos = Array.isArray(d.additionalPhotos)
    ? (d.additionalPhotos as unknown[]).filter(isStrictValidPhotoDataUrl).slice(0, MAX_ADDITIONAL_PHOTOS)
    : [];

  return {
    id: isValidUUIDv4(d.id) ? (d.id as string) : crypto.randomUUID(),
    type: VALID_DEVICE_TYPES.includes(d.type as DeviceType) ? (d.type as DeviceType) : 'other',
    brand: getString(d.brand, 'Desconocido'),
    model: getString(d.model, 'Dispositivo'),
    customName: getOptionalString(d.customName),
    modelNumber: getOptionalString(d.modelNumber),
    partNumber: getOptionalString(d.partNumber),
    color: getOptionalString(d.color),
    storage: getOptionalString(d.storage),
    ram: getOptionalString(d.ram),
    os: getOptionalString(d.os),
    imei1: getOptionalString(d.imei1),
    imei2: getOptionalString(d.imei2),
    serialNumber: getOptionalString(d.serialNumber),
    eid: getOptionalString(d.eid),
    iccid: getOptionalString(d.iccid),
    upc: getOptionalString(d.upc),
    fccId: getOptionalString(d.fccId),
    ic: getOptionalString(d.ic),
    country: getOptionalString(d.country),
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
    mainPhoto,
    additionalPhotos,
    createdAt: typeof d.createdAt === 'number' && d.createdAt > 0 ? d.createdAt : Date.now(),
    updatedAt: typeof d.updatedAt === 'number' && d.updatedAt > 0 ? d.updatedAt : Date.now(),
  };
}

export function sanitizeAccessoryFromBackup(a: Record<string, unknown>): Accessory {
  const getString = (val: unknown, fallback = ''): string =>
    typeof val === 'string' ? val.trim().slice(0, 5000) : fallback;
  const getOptionalString = (val: unknown): string | undefined =>
    typeof val === 'string' && val.trim().length > 0 ? val.trim().slice(0, 5000) : undefined;

  const mainPhoto = isStrictValidPhotoDataUrl(a.mainPhoto) ? a.mainPhoto : undefined;
  const additionalPhotos = Array.isArray(a.additionalPhotos)
    ? (a.additionalPhotos as unknown[]).filter(isStrictValidPhotoDataUrl).slice(0, MAX_ADDITIONAL_PHOTOS)
    : [];

  return {
    id: isValidUUIDv4(a.id) ? (a.id as string) : crypto.randomUUID(),
    category: VALID_ACCESSORY_CATEGORIES.includes(a.category as AccessoryCategory) ? (a.category as AccessoryCategory) : 'other',
    brand: getString(a.brand, 'Apple'),
    name: getString(a.name, 'Accesorio'),
    modelNumber: getOptionalString(a.modelNumber),
    partNumber: getOptionalString(a.partNumber),
    serialNumber: getOptionalString(a.serialNumber),
    color: getOptionalString(a.color),
    linkedDeviceId: isValidUUIDv4(a.linkedDeviceId) ? (a.linkedDeviceId as string) : undefined,
    notes: getOptionalString(a.notes),
    powerWatts: a.powerWatts !== undefined && a.powerWatts !== null ? String(a.powerWatts).slice(0, 50) : undefined,
    upc: getOptionalString(a.upc),
    madeIn: getOptionalString(a.madeIn),
    manufacturingYear: a.manufacturingYear !== undefined && a.manufacturingYear !== null ? String(a.manufacturingYear).slice(0, 20) : undefined,
    purchaseDate: getOptionalString(a.purchaseDate),
    purchasePrice: typeof a.purchasePrice === 'number' && isFinite(a.purchasePrice) ? Math.abs(a.purchasePrice) : undefined,
    purchaseCurrency: getString(a.purchaseCurrency, 'USD'),
    purchaseLocation: getOptionalString(a.purchaseLocation),
    status: VALID_ACCESSORY_STATUSES.includes(a.status as AccessoryStatus) ? (a.status as AccessoryStatus) : 'active',
    mainPhoto,
    additionalPhotos,
    createdAt: typeof a.createdAt === 'number' && a.createdAt > 0 ? a.createdAt : Date.now(),
    updatedAt: typeof a.updatedAt === 'number' && a.updatedAt > 0 ? a.updatedAt : Date.now(),
  };
}