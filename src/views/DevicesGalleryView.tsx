import React, { useState, useMemo } from 'react';
import { Search, Filter, Plus, Smartphone, Laptop, Tablet, Watch, Headphones, Box, SlidersHorizontal } from 'lucide-react';
import type { Device, DeviceType, DeviceStatus } from '../types/device';
import { DeviceCard } from '../components/devices/DeviceCard';

interface DevicesGalleryViewProps {
  devices: Device[];
  onSelectDevice: (device: Device) => void;
  onNavigateToRegister: () => void;
  initialSearchQuery?: string;
}

export const DevicesGalleryView: React.FC<DevicesGalleryViewProps> = ({
  devices,
  onSelectDevice,
  onNavigateToRegister,
  initialSearchQuery = '',
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedType, setSelectedType] = useState<DeviceType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<DeviceStatus | 'all'>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'brand' | 'model'>('recent');

  // Obtener lista única de marcas disponibles
  const availableBrands = useMemo(() => {
    const brands = Array.from(new Set(devices.map((d) => d.brand).filter(Boolean)));
    return brands.sort();
  }, [devices]);

  // Filtrado y ordenamiento en tiempo real
  const filteredDevices = useMemo(() => {
    return devices
      .filter((device) => {
        // Filtro por tipo
        if (selectedType !== 'all' && device.type !== selectedType) return false;

        // Filtro por estado
        if (selectedStatus !== 'all' && device.status !== selectedStatus) return false;

        // Filtro por marca
        if (selectedBrand !== 'all' && device.brand.toLowerCase() !== selectedBrand.toLowerCase()) return false;

        // Filtro por búsqueda textual
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchBrand = device.brand.toLowerCase().includes(q);
          const matchModel = device.model.toLowerCase().includes(q);
          const matchCustomName = (device.customName || '').toLowerCase().includes(q);
          const matchModelNumber = (device.modelNumber || '').toLowerCase().includes(q);
          const matchImei1 = (device.imei1 || '').toLowerCase().includes(q);
          const matchImei2 = (device.imei2 || '').toLowerCase().includes(q);
          const matchSerial = (device.serialNumber || '').toLowerCase().includes(q);
          const matchEid = (device.eid || '').toLowerCase().includes(q);
          const matchNotes = (device.notes || '').toLowerCase().includes(q);

          if (
            !matchBrand &&
            !matchModel &&
            !matchCustomName &&
            !matchModelNumber &&
            !matchImei1 &&
            !matchImei2 &&
            !matchSerial &&
            !matchEid &&
            !matchNotes
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'recent') return b.createdAt - a.createdAt;
        if (sortBy === 'oldest') return a.createdAt - b.createdAt;
        if (sortBy === 'brand') return a.brand.localeCompare(b.brand);
        if (sortBy === 'model') return a.model.localeCompare(b.model);
        return 0;
      });
  }, [devices, selectedType, selectedStatus, selectedBrand, searchQuery, sortBy]);

  const typeTabs: { id: DeviceType | 'all'; label: string; icon: any }[] = [
    { id: 'all', label: 'Todos', icon: Box },
    { id: 'phone', label: 'Teléfonos', icon: Smartphone },
    { id: 'computer', label: 'Computadoras', icon: Laptop },
    { id: 'tablet', label: 'Tablets', icon: Tablet },
    { id: 'watch', label: 'Watches', icon: Watch },
    { id: 'audio', label: 'Audio', icon: Headphones },
    { id: 'accessory', label: 'Accesorios', icon: Box },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Barra de Filtros por Categoría */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        {typeTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedType === tab.id;
          const count = tab.id === 'all' ? devices.length : devices.filter((d) => d.type === tab.id).length;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${isActive ? 'bg-blue-800' : 'bg-zinc-800 text-zinc-400'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Controles de Búsqueda y Filtros Secundarios */}
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Input de Búsqueda */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar por marca, modelo, IMEI, número de serie, EID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-white"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Selector de Orden */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full sm:w-auto px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none"
            >
              <option value="recent">Más recientes</option>
              <option value="oldest">Más antiguos</option>
              <option value="brand">Por Marca</option>
              <option value="model">Por Modelo</option>
            </select>
          </div>
        </div>

        {/* Filtros secundarios: Estado y Marca */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800/60 text-xs">
          <div className="flex items-center gap-1.5 text-zinc-500 mr-2">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filtros:</span>
          </div>

          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-300 text-xs focus:outline-none"
          >
            <option value="all">Todas las Marcas</option>
            {availableBrands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-300 text-xs focus:outline-none"
          >
            <option value="all">Todos los Estados</option>
            <option value="in_use">En uso</option>
            <option value="stored">Guardado</option>
            <option value="sold">Vendido</option>
            <option value="repair">En reparación</option>
            <option value="lost">Perdido</option>
          </select>

          {(selectedBrand !== 'all' || selectedStatus !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedBrand('all');
                setSelectedStatus('all');
                setSearchQuery('');
              }}
              className="text-xs text-blue-400 hover:text-blue-300 ml-auto font-medium"
            >
              Restablecer filtros
            </button>
          )}
        </div>
      </div>

      {/* Grid de Dispositivos */}
      {filteredDevices.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 bg-zinc-800 text-zinc-500 rounded-full flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">No se encontraron dispositivos</h4>
            <p className="text-xs text-zinc-400 mt-1">
              {searchQuery || selectedBrand !== 'all' || selectedStatus !== 'all'
                ? 'Prueba ajustando los términos de búsqueda o filtros.'
                : 'Empieza agregando tu primer dispositivo a la bóveda.'}
            </p>
          </div>
          {!searchQuery && devices.length === 0 && (
            <button
              onClick={onNavigateToRegister}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Registrar mi primer equipo
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDevices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              onClick={() => onSelectDevice(device)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
