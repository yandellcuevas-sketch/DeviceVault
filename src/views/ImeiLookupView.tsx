import React, { useState, useMemo } from 'react';
import { Search, CheckCircle2, AlertCircle, Package } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Device } from '../types/device';
import type { Accessory } from '../types/accessory';
import { DeviceCard } from '../components/devices/DeviceCard';
import { AccessoryCard } from '../components/accessories/AccessoryCard';

interface ImeiLookupViewProps {
  devices: Device[];
  onSelectDevice: (device: Device) => void;
  onSelectAccessory?: (accessory: Accessory) => void;
}

export const ImeiLookupView: React.FC<ImeiLookupViewProps> = ({
  devices,
  onSelectDevice,
  onSelectAccessory,
}) => {
  const [query, setQuery] = useState('');
  const accessories = useLiveQuery(() => db.accessories.toArray(), []) || [];

  const deviceMap = useMemo(() => {
    const map = new Map<string, Device>();
    devices.forEach((d) => map.set(d.id, d));
    return map;
  }, [devices]);

  // Normalizar consulta eliminando espacios o guiones
  const normalizedQuery = query.replace(/[\s-]/g, '').toLowerCase().trim();

  const matchResults = useMemo(() => {
    if (!normalizedQuery) return [];

    return devices.filter((d) => {
      const imei1 = (d.imei1 || '').replace(/[\s-]/g, '').toLowerCase();
      const imei2 = (d.imei2 || '').replace(/[\s-]/g, '').toLowerCase();
      const serial = (d.serialNumber || '').replace(/[\s-]/g, '').toLowerCase();
      const eid = (d.eid || '').replace(/[\s-]/g, '').toLowerCase();
      const iccid = (d.iccid || '').replace(/[\s-]/g, '').toLowerCase();
      const upc = (d.upc || '').replace(/[\s-]/g, '').toLowerCase();
      const partNo = (d.partNumber || '').replace(/[\s-]/g, '').toLowerCase();
      const modelNo = (d.modelNumber || '').replace(/[\s-]/g, '').toLowerCase();

      return (
        imei1.includes(normalizedQuery) ||
        imei2.includes(normalizedQuery) ||
        serial.includes(normalizedQuery) ||
        eid.includes(normalizedQuery) ||
        iccid.includes(normalizedQuery) ||
        upc.includes(normalizedQuery) ||
        partNo.includes(normalizedQuery) ||
        modelNo.includes(normalizedQuery)
      );
    });
  }, [devices, normalizedQuery]);

  const matchAccessories = useMemo(() => {
    if (!normalizedQuery) return [];

    return accessories.filter((a) => {
      const serial = (a.serialNumber || '').replace(/[\s-]/g, '').toLowerCase();
      const partNo = (a.partNumber || '').replace(/[\s-]/g, '').toLowerCase();
      const modelNo = (a.modelNumber || '').replace(/[\s-]/g, '').toLowerCase();
      const upc = (a.upc || '').replace(/[\s-]/g, '').toLowerCase();

      return (
        serial.includes(normalizedQuery) ||
        partNo.includes(normalizedQuery) ||
        modelNo.includes(normalizedQuery) ||
        upc.includes(normalizedQuery)
      );
    });
  }, [accessories, normalizedQuery]);

  const totalMatches = matchResults.length + matchAccessories.length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Cabecera */}
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <span className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
            <Search className="w-5 h-5" />
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Buscador de IMEI, Serial, Part # y EID
          </h2>
        </div>
        <p className="text-xs text-zinc-400">
          Comprueba inmediatamente si un IMEI de 15 digitos, numero de serie, Part Number o EID pertenece a tu inventario local.
        </p>
      </div>

      {/* Caja de Busqueda Principal */}
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 shadow-xl space-y-4">
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Introduce el identificador a comprobar
        </label>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            autoFocus
            placeholder="Ej. 358901234567890, F2LXXXXXQ6L4 o A3296..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-base text-white font-mono placeholder-zinc-600 focus:outline-none transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-white"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Resultados de la busqueda */}
      {normalizedQuery ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Resultado de Verificacion Local ({totalMatches})
            </h3>
          </div>

          {totalMatches > 0 ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                <div>
                  <span className="font-bold text-sm">IDENTIFICADOR ENCONTRADO EN TU BOVEDA</span>
                  <p className="mt-0.5 opacity-90">
                    El identificador consultado coincide con {totalMatches} registro{totalMatches === 1 ? '' : 's'} en tu inventario.
                  </p>
                </div>
              </div>

              {/* Coincidencias en Dispositivos */}
              {matchResults.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Dispositivos Coincidentes ({matchResults.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {matchResults.map((dev) => (
                      <DeviceCard
                        key={dev.id}
                        device={dev}
                        onClick={() => onSelectDevice(dev)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Coincidencias en Accesorios */}
              {matchAccessories.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-blue-400" />
                    <span>Accesorios Coincidentes ({matchAccessories.length})</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {matchAccessories.map((acc) => (
                      <AccessoryCard
                        key={acc.id}
                        accessory={acc}
                        linkedDevice={acc.linkedDeviceId ? deviceMap.get(acc.linkedDeviceId) : undefined}
                        onClick={() => onSelectAccessory && onSelectAccessory(acc)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">No esta registrado en tu inventario</h4>
                <p className="text-xs text-zinc-400 mt-1 font-mono">
                  "{query}" no coincide con ningun IMEI, Serial, Part # o EID guardado.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl text-zinc-500 text-xs space-y-2">
          <div className="font-semibold text-zinc-400">Privacidad del Buscador:</div>
          <p>
            Esta busqueda se realiza de forma 100% interna contra la base de datos IndexedDB en tu propio navegador. Ningun dato viaja por Internet.
          </p>
        </div>
      )}
    </div>
  );
};