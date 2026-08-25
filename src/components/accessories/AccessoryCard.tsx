import React from 'react';
import { Package, Zap, Shield, Smartphone } from 'lucide-react';
import type { Accessory } from '../../types/accessory';
import type { Device } from '../../types/device';
import { ACCESSORY_CATEGORY_LABELS, ACCESSORY_STATUS_CONFIG } from '../../utils/formatters';

interface AccessoryCardProps {
  accessory: Accessory;
  linkedDevice?: Device;
  onClick: () => void;
}

export const AccessoryCard: React.FC<AccessoryCardProps> = ({
  accessory,
  linkedDevice,
  onClick,
}) => {
  const statusConfig = ACCESSORY_STATUS_CONFIG[accessory.status] || ACCESSORY_STATUS_CONFIG.other;
  const isCharger = accessory.category === 'charger' || accessory.category === 'magsafe';

  return (
    <div
      onClick={onClick}
      className="group bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-4 transition-all duration-200 hover:shadow-xl hover:shadow-black/40 cursor-pointer flex flex-col justify-between space-y-4"
    >
      <div className="space-y-3">
        {/* Imagen del accesorio */}
        <div className="aspect-[4/3] bg-zinc-950 rounded-xl overflow-hidden flex items-center justify-center border border-zinc-800/60 group-hover:border-zinc-700/80 transition-colors relative">
          {accessory.mainPhoto ? (
            <img
              src={accessory.mainPhoto}
              alt={accessory.name}
              className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-zinc-600">
              {isCharger ? <Zap className="w-8 h-8 mb-1 text-zinc-600" /> : <Package className="w-8 h-8 mb-1 text-zinc-600" />}
              <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-600">
                {ACCESSORY_CATEGORY_LABELS[accessory.category] || 'Accesorio'}
              </span>
            </div>
          )}

          {/* Badge de Potencia para Cargadores */}
          {accessory.powerWatts && (
            <div className="absolute top-2 left-2 px-2 py-0.5 bg-blue-600/90 text-white font-mono text-[10px] font-bold rounded-md shadow-md backdrop-blur-sm flex items-center gap-1">
              <Zap className="w-3 h-3" />
              <span>{accessory.powerWatts}</span>
            </div>
          )}

          {/* Badge de Estado */}
          <div className="absolute top-2 right-2">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border backdrop-blur-md ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
            >
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Informacion principal */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
            {accessory.brand} &bull; {ACCESSORY_CATEGORY_LABELS[accessory.category]}
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
            {accessory.name}
          </h3>

          {/* Subtitulo / Especificaciones rapidas */}
          <div className="text-[11px] text-zinc-400 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {accessory.modelNumber && (
              <span className="font-mono text-zinc-300">Mod: {accessory.modelNumber}</span>
            )}
            {accessory.partNumber && (
              <span className="font-mono text-zinc-400">{accessory.partNumber}</span>
            )}
            {accessory.color && (
              <span className="text-zinc-400">&bull; {accessory.color}</span>
            )}
          </div>
        </div>
      </div>

      {/* Footer: Serial masked y Linked Device */}
      <div className="pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
        {linkedDevice ? (
          <div className="flex items-center gap-1 text-emerald-400/90 truncate font-medium">
            <Smartphone className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{linkedDevice.brand} {linkedDevice.model}</span>
          </div>
        ) : (
          <span className="text-zinc-600 italic">No vinculado</span>
        )}

        {accessory.serialNumber ? (
          <span className="font-mono text-[10px] text-zinc-400">
            S/N: ••••{accessory.serialNumber.slice(-4)}
          </span>
        ) : (
          <span></span>
        )}
      </div>
    </div>
  );
};