import type { Accessory } from './accessory';

export type DeviceType = 
  | 'phone' 
  | 'tablet' 
  | 'computer' 
  | 'watch' 
  | 'audio' 
  | 'accessory' 
  | 'other';

export type DeviceStatus = 
  | 'in_use' 
  | 'stored' 
  | 'sold' 
  | 'repair' 
  | 'lost' 
  | 'other';

export interface Device {
  id: string; // UUID v4
  type: DeviceType;
  brand: string;
  model: string;
  customName?: string;
  modelNumber?: string;
  partNumber?: string;
  color?: string;
  storage?: string;
  ram?: string;
  os?: string;
  
  // Identificadores y Regulatorio
  imei1?: string;
  imei2?: string;
  serialNumber?: string;
  eid?: string;
  iccid?: string;
  upc?: string;
  fccId?: string;
  ic?: string;
  country?: string;
  phoneCarrier?: string;
  
  // Compra y Garantia
  purchaseDate?: string;
  purchasePrice?: number;
  purchaseCurrency?: string;
  purchaseLocation?: string;
  warrantyExpiration?: string;
  insuranceInfo?: string;
  
  // Estado y Notas
  status: DeviceStatus;
  condition?: string;
  notes?: string;
  tags?: string[];
  
  // Multimedia (Data URLs en cliente)
  mainPhoto?: string;
  additionalPhotos?: string[];
  
  createdAt: number;
  updatedAt: number;
}

export interface BackupData {
  version: string;
  exportedAt: string;
  deviceCount: number;
  devices: Device[];
  accessoryCount?: number;
  accessories?: Accessory[];
}