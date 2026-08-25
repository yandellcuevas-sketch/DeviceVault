import React, { useState, useMemo } from 'react';
import { Search, PlusCircle, Package, Zap, Disc, Headphones, Shield, Filter } from 'lucide-react';
import type { Accessory, AccessoryCategory } from '../types/accessory';
import type { Device } from '../types/device';
import { AccessoryCard } from '../components/accessories/AccessoryCard';

interface AccessoriesViewProps {
  accessories: Accessory[];
  devices: Device[];
  onSelectAccessory: (accessory: Accessory) => void;
  onNavigateToRegister: () => void;
  initialCategory?: AccessoryCategory | 'all';
}

export const AccessoriesView: React.FC<AccessoriesViewProps> = ({
  accessories,
  devices,
  onSelectAccessory,
  onNavigateToRegister,
  initialCategory = 'all',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<AccessoryCategory | 'all'>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');

  const deviceMap = useMemo(() => {
    const map = new Map<string, Device>();
    devices.forEach((d) => map.set(d.id, d));
    return map;
  }, [devices]);

  const categoryTabs: { id: AccessoryCategory | 'all'; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'all', label: 'Todos', icon: Package },
    { id: 'case', label: 'Cases / Covers', icon: Shield },
    { id: 'charger', label: 'Cargadores', icon: Zap },
    { id: 'magsafe', label: 'MagSafe', icon: Disc },
    { id: 'audio_accessory', label: 'Audio', icon: Headphones },
    { id: 'other', label: 'Otros', icon: Package },
  ];

  const filteredAccessories = useMemo(() => {
    return accessories.filter((acc) => {
      // Filtro de categoria
      if (selectedCategory !== 'all' && acc.category !== selectedCategory) {
        return false;
      }

      // Filtro de busqueda
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = acc.name.toLowerCase().includes(q);
        const matchesBrand = acc.brand.toLowerCase().includes(q);
        const matchesModel = (acc.modelNumber || '').toLowerCase().includes(q);
        const matchesPart = (acc.partNumber || '').toLowerCase().includes(q);
        const matchesSerial = (acc.serialNumber || '').toLowerCase().includes(q);
        const matchesColor = (acc.color || '').toLowerCase().includes(q);
        const matchesNotes = (acc.notes || '').toLowerCase().includes(q);
        const matchesPower = (acc.powerWatts ? String(acc.powerWatts) : '').toLowerCase().includes(q);

        // Tambien buscar si el dispositivo vinculado coincide
        const linkedDev = acc.linkedDeviceId ? deviceMap.get(acc.linkedDeviceId) : undefined;
        const matchesLinked = linkedDev
          ? `${linkedDev.brand} ${linkedDev.model}`.toLowerCase().includes(q)
          : false;

        return (
          matchesName ||
          matchesBrand ||
          matchesModel ||
          matchesPart ||
          matchesSerial ||
          matchesColor ||
          matchesNotes ||
          matchesPower ||
          matchesLinked
        );
      }

      return true;
    });
  }, [accessories, selectedCategory, searchQuery, deviceMap]);

  const countsByCategory = useMemo(() => {
    const counts: Record<string, number> = { all: accessories.length };
    accessories.forEach((a) => {
      counts[a.category] = (counts[a.category] || 0) + 1;
    });
    return counts;
  }, [accessories]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
              <Package className="w-5 h-5" />
            </span>
            <span>Inventario de Accesorios</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Cases, cargadores, cables y accesorios oficiales organizados y vinculados a tus equipos.
          </p>
        </div>

        <button
          onClick={onNavigateToRegister}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Registrar Accesorio</span>
        </button>
      </div>

      {/* Barra de Filtros y Busqueda */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Tabs de Categoria */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {categoryTabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = selectedCategory === tab.id;
            const count = countsByCategory[tab.id] || 0;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 font-semibold'
                    : 'bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                    isSelected ? 'bg-blue-800 text-white' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Buscador */}
        <div className="relative min-w-[240px] md:w-72">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, part #, serial..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 focus:border-blue-500 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Grid de Accesorios */}
      {filteredAccessories.length === 0 ? (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-zinc-800/80 text-zinc-500 rounded-full flex items-center justify-center mx-auto">
            <Package className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white">No se encontraron accesorios</h4>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              {searchQuery
                ? 'No hay resultados que coincidan con los terminos de busqueda.'
                : 'Aun no tienes accesorios registrados en esta categoria.'}
            </p>
          </div>
          {!searchQuery && (
            <button
              onClick={onNavigateToRegister}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all mt-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Registrar el primero</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAccessories.map((accessory) => (
            <AccessoryCard
              key={accessory.id}
              accessory={accessory}
              linkedDevice={accessory.linkedDeviceId ? deviceMap.get(accessory.linkedDeviceId) : undefined}
              onClick={() => onSelectAccessory(accessory)}
            />
          ))}
        </div>
      )}
    </div>
  );
};