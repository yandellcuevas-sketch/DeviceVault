export type AccessoryCategory =
  | 'case'
  | 'charger'
  | 'magsafe'
  | 'audio_accessory'
  | 'other';

export type AccessoryStatus =
  | 'active'
  | 'stored'
  | 'sold'
  | 'lost'
  | 'repair'
  | 'other';

export interface Accessory {
  id: string; // UUID v4
  category: AccessoryCategory;
  brand: string;
  name: string;
  modelNumber?: string;
  partNumber?: string;
  serialNumber?: string;
  color?: string;
  linkedDeviceId?: string; // Reference to Device.id
  notes?: string;
  mainPhoto?: string;
  additionalPhotos?: string[];
  
  // Specific to chargers & accessories
  powerWatts?: string | number; // e.g. "20W" or 20
  upc?: string;
  madeIn?: string;
  manufacturingYear?: string | number;
  
  // Purchase info
  purchaseDate?: string;
  purchasePrice?: number;
  purchaseCurrency?: string;
  purchaseLocation?: string;
  
  status: AccessoryStatus;
  createdAt: number;
  updatedAt: number;
}