import type { DeviceType, DeviceStatus } from '../types/device';

export const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  phone: 'Teléfono',
  tablet: 'Tablet / iPad',
  computer: 'Computadora / Laptop',
  watch: 'Smartwatch',
  audio: 'Audio / Audífonos',
  accessory: 'Accesorio',
  other: 'Otro Dispositivo',
};

export const DEVICE_STATUS_CONFIG: Record<DeviceStatus, { label: string; bg: string; text: string; border: string }> = {
  in_use: {
    label: 'En uso',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
  },
  stored: {
    label: 'Guardado',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
  },
  sold: {
    label: 'Vendido',
    bg: 'bg-zinc-500/10',
    text: 'text-zinc-400',
    border: 'border-zinc-500/30',
  },
  repair: {
    label: 'En reparación',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
  },
  lost: {
    label: 'Perdido',
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/30',
  },
  other: {
    label: 'Otro',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
  },
};

export function formatCurrency(amount?: number, currency = 'USD'): string {
  if (amount === undefined || amount === null || isNaN(amount)) return 'No especificado';
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount);
}

export function formatDate(dateString?: string): string {
  if (!dateString) return 'No especificada';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}
