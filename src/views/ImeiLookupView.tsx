import React, { useState, useMemo } from 'react';
import { Search, Smartphone, CheckCircle2, AlertCircle, ShieldAlert, ArrowRight, Copy, Check } from 'lucide-react';
import type { Device } from '../types/device';
import { DeviceCard } from '../components/devices/DeviceCard';

interface ImeiLookupViewProps {
  devices: Device[];
  onSelectDevice: (device: Device) => void;
}

export const ImeiLookupView: React.FC<ImeiLookupViewProps> = ({
  devices,
  onSelectDevice,
}) => {
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState(false);

  // Normalizar consulta eliminando espacios o guiones
  const normalizedQuery = query.replace(/[\s-]/g, '').toLowerCase().trim();

  const matchResults = useMemo(() => {
    if (!normalizedQuery) return [];

    return devices.filter((d) => {
      const imei1 = (d.imei1 || '').replace(/[\s-]/g, '').toLowerCase();
      const imei2 = (d.imei2 || '').replace(/[\s-]/g, '').toLowerCase();
      const serial = (d.serialNumber || '').replace(/[\s-]/g, '').toLowerCase();
      const eid = (d.eid || '').replace(/[\s-]/g, '').toLowerCase();
      const modelNo = (d.modelNumber || '').replace(/[\s-]/g, '').toLowerCase();

      return (
        imei1.includes(normalizedQuery) ||
        imei2.includes(normalizedQuery) ||
        serial.includes(normalizedQuery) ||
        eid.includes(normalizedQuery) ||
        modelNo.includes(normalizedQuery)
      );
    });
  }, [devices, normalizedQuery]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Cabecera */}
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <span className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
            <Search className="w-5 h-5" />
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Buscador de IMEI, Serial y EID
          </h2>
        </div>
        <p className="text-xs text-zinc-400">
          Comprueba inmediatamente si un IMEI de 15 dígitos, número de serie o EID pertenece a tu inventario local.
        </p>
      </div>

      {/* Caja de Búsqueda Principal */}
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 shadow-xl space-y-4">
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Introduce el identificador a comprobar
        </label>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            autoFocus
            placeholder="Ej. 358901234567890 o F2LXXXXXQ6L4..."
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

      {/* Resultados de la búsqueda */}
      {normalizedQuery ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Resultado de Verificación Local ({matchResults.length})
            </h3>
          </div>

          {matchResults.length > 0 ? (
            <div className="space-y-3">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                <div>
                  <span className="font-bold text-sm">¡IDENTIFICADOR ENCONTRADO EN TU BÓVEDA!</span>
                  <p className="mt-0.5 opacity-90">
                    El identificador consultado coincide con {matchResults.length} {matchResults.length === 1 ? 'dispositivo' : 'dispositivos'} en tu inventario.
                  </p>
                </div>
              </div>

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
          ) : (
            <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">No está registrado en tu inventario</h4>
                <p className="text-xs text-zinc-400 mt-1 font-mono">
                  "{query}" no coincide con ningún IMEI, Serial o EID guardado.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl text-zinc-500 text-xs space-y-2">
          <div className="font-semibold text-zinc-400">Privacidad del Buscador:</div>
          <p>
            Esta búsqueda se realiza de forma 100% interna contra la base de datos IndexedDB en tu propio navegador. Ningún dato viaja por Internet.
          </p>
        </div>
      )}
    </div>
  );
};
