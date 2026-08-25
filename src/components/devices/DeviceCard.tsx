import React from 'react';
import { Smartphone, Laptop, Tablet, Watch, Headphones, Box, HardDrive, Calendar } from 'lucide-react';
import type { Device, DeviceType } from '../../types/device';
import { DEVICE_STATUS_CONFIG } from '../../utils/formatters';

interface DeviceCardProps {
  device: Device;
  onClick: () => void;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({ device, onClick }) => {
  const statusConfig = DEVICE_STATUS_CONFIG[device.status] || DEVICE_STATUS_CONFIG.other;

  const getTypeIcon = (type: DeviceType) => {
    switch (type) {
      case 'phone':
        return <Smartphone className="w-4 h-4" />;
      case 'computer':
        return <Laptop className="w-4 h-4" />;
      case 'tablet':
        return <Tablet className="w-4 h-4" />;
      case 'watch':
        return <Watch className="w-4 h-4" />;
      case 'audio':
        return <Headphones className="w-4 h-4" />;
      default:
        return <Box className="w-4 h-4" />;
    }
  };

  return (
    <div
      onClick={onClick}
      className="group relative bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex flex-col justify-between"
    >
      {/* Imagen Principal */}
      <div className="relative w-full h-44 bg-zinc-950/80 rounded-xl overflow-hidden mb-3.5 flex items-center justify-center border border-zinc-800/60 group-hover:border-zinc-700/80 transition-colors">
        {device.mainPhoto ? (
          <img
            src={device.mainPhoto}
            alt={device.model}
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-zinc-600 group-hover:text-zinc-500 transition-colors">
            {getTypeIcon(device.type)}
            <span className="text-xs mt-1.5 font-medium tracking-tight">Sin fotografía</span>
          </div>
        )}

        {/* Badge de Estado flotante */}
        <div className="absolute top-2.5 right-2.5">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border backdrop-blur-md ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
          >
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Info Principal */}
      <div className="space-y-1.5 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
            {device.brand}
          </span>
          {device.storage && (
            <span className="inline-flex items-center text-[11px] font-medium text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-md">
              <HardDrive className="w-3 h-3 mr-1 text-zinc-500" />
              {device.storage}
            </span>
          )}
        </div>

        <h3 className="text-base font-bold text-white tracking-tight group-hover:text-blue-300 transition-colors line-clamp-1">
          {device.customName || device.model}
        </h3>

        {device.customName && (
          <p className="text-xs text-zinc-400 line-clamp-1">{device.model}</p>
        )}

        {device.color && (
          <p className="text-xs text-zinc-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-zinc-600 inline-block" />
            {device.color}
          </p>
        )}
      </div>

      {/* Footer / Identificador rápido */}
      <div className="mt-3.5 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
        <span className="flex items-center gap-1">
          {getTypeIcon(device.type)}
          <span className="capitalize">{device.type}</span>
        </span>
        {device.imei1 ? (
          <span className="font-mono text-zinc-400">IMEI: ••••{device.imei1.slice(-4)}</span>
        ) : device.serialNumber ? (
          <span className="font-mono text-zinc-400">S/N: ••••{device.serialNumber.slice(-4)}</span>
        ) : device.purchaseDate ? (
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {device.purchaseDate.split('-')[0]}
          </span>
        ) : (
          <span className="text-zinc-600">Ver ficha</span>
        )}
      </div>
    </div>
  );
};
