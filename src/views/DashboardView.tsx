import React from 'react';
import { Smartphone, Laptop, Tablet, Watch, Headphones, Box, PlusCircle, ArrowRight, Shield, Layers } from 'lucide-react';
import type { Device, DeviceType } from '../types/device';
import { DEVICE_STATUS_CONFIG, formatDate } from '../utils/formatters';

interface DashboardViewProps {
  devices: Device[];
  onNavigate: (view: any) => void;
  onSelectDevice: (device: Device) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  devices,
  onNavigate,
  onSelectDevice,
}) => {
  const countByType = (type: DeviceType) => devices.filter((d) => d.type === type).length;

  const totalCount = devices.length;
  const phonesCount = countByType('phone');
  const computersCount = countByType('computer');
  const tabletsCount = countByType('tablet');
  const watchesCount = countByType('watch');
  const audioCount = countByType('audio');
  const othersCount = totalCount - (phonesCount + computersCount + tabletsCount + watchesCount + audioCount);

  // Marcas más frecuentes
  const brandCounts = devices.reduce((acc, d) => {
    acc[d.brand] = (acc[d.brand] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topBrands = Object.entries(brandCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Recientes
  const recentlyAdded = [...devices]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Hero Welcome */}
      <div className="relative bg-gradient-to-r from-blue-950/40 via-zinc-900 to-zinc-900 border border-zinc-800/80 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 bg-blue-500/20 text-blue-400 rounded-md">
              <Shield className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">Mi Bóveda de Dispositivos</h2>
          </div>
          <p className="text-xs text-zinc-400">
            Tienes <span className="font-semibold text-white">{totalCount}</span> equipos registrados de forma 100% privada y local.
          </p>
        </div>

        <button
          onClick={() => onNavigate('register')}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer flex-shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Registrar Dispositivo</span>
        </button>
      </div>

      {/* Grid de Métricas Rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Equipos', count: totalCount, icon: Layers, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Teléfonos', count: phonesCount, icon: Smartphone, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Computadoras', count: computersCount, icon: Laptop, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
          { label: 'Tablets / iPads', count: tabletsCount, icon: Tablet, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { label: 'Watches', count: watchesCount, icon: Watch, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Audio / Otros', count: audioCount + othersCount, icon: Headphones, color: 'text-rose-400', bg: 'bg-rose-500/10' },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 flex flex-col justify-between space-y-2 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">{stat.label}</span>
                <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-white tracking-tight font-mono">{stat.count}</div>
            </div>
          );
        })}
      </div>

      {/* Secciones: Recientes y Marcas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recientes (2 cols) */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Últimos Registrados</h3>
            <button
              onClick={() => onNavigate('gallery')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
            >
              Ver todos ({totalCount}) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentlyAdded.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              Aún no tienes dispositivos registrados. Haz clic en "Registrar Dispositivo" para comenzar.
            </div>
          ) : (
            <div className="space-y-2">
              {recentlyAdded.map((device) => {
                const statusConfig = DEVICE_STATUS_CONFIG[device.status] || DEVICE_STATUS_CONFIG.other;
                return (
                  <div
                    key={device.id}
                    onClick={() => onSelectDevice(device)}
                    className="flex items-center justify-between p-3 bg-zinc-950/60 hover:bg-zinc-850 border border-zinc-800/60 hover:border-zinc-700 rounded-xl cursor-pointer transition-all group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-zinc-900 rounded-lg overflow-hidden flex items-center justify-center border border-zinc-800 flex-shrink-0">
                        {device.mainPhoto ? (
                          <img src={device.mainPhoto} alt={device.model} className="w-full h-full object-contain p-1" />
                        ) : (
                          <Box className="w-5 h-5 text-zinc-600" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                          {device.brand} {device.model}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          {device.storage ? `${device.storage} • ` : ''}
                          {device.color ? `${device.color} • ` : ''}
                          Registrado {formatDate(new Date(device.createdAt).toISOString().split('T')[0])}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Marcas & Resumen */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-zinc-800 pb-3">
            Marcas en tu Inventario
          </h3>

          {topBrands.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              Sin datos de marcas aún.
            </div>
          ) : (
            <div className="space-y-3">
              {topBrands.map(([brand, count], idx) => {
                const pct = Math.round((count / totalCount) * 100);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">{brand}</span>
                      <span className="text-zinc-400 font-mono">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
