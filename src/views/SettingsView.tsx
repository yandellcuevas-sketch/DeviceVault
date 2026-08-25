import React, { useState, useRef, useEffect } from 'react';
import { Settings, Trash2, Database, AlertTriangle } from 'lucide-react';
import { db } from '../db';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

interface SettingsViewProps {
  deviceCount: number;
  onRefresh: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ deviceCount, onRefresh }) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearedMsg, setClearedMsg] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClearDatabase = async () => {
    await db.devices.clear();
    setClearedMsg(true);
    onRefresh();
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setClearedMsg(false), 4000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <span className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
            <Settings className="w-5 h-5" />
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">Configuracion y Almacenamiento</h2>
        </div>
        <p className="text-xs text-zinc-400">
          Informacion sobre el almacenamiento local de DeviceVault y gestion de datos.
        </p>
      </div>

      {clearedMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs">
          La base de datos local ha sido restablecida completamente.
        </div>
      )}

      {/* Estado del sistema */}
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-zinc-800 pb-3 flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-400" /> Estado de la Boveda Local
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-1">
            <span className="text-zinc-500 font-medium">Motor de Datos:</span>
            <div className="text-sm font-bold text-white font-mono">IndexedDB (Dexie.js)</div>
          </div>
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-1">
            <span className="text-zinc-500 font-medium">Dispositivos Registrados:</span>
            <div className="text-sm font-bold text-white font-mono">{deviceCount} equipos</div>
          </div>
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-1">
            <span className="text-zinc-500 font-medium">Ubicacion:</span>
            <div className="text-sm font-bold text-emerald-400">100% Local Browser Storage</div>
          </div>
        </div>
      </div>

      {/* Zona de peligro */}
      <div className="bg-zinc-900 border border-red-900/40 rounded-2xl p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Zona de Peligro: Restablecer Boveda</h3>
            <p className="text-xs text-zinc-400">Elimina permanentemente todos los registros y fotografias locales.</p>
          </div>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Esta accion vaciara la base de datos IndexedDB local. Exporta un respaldo en formato JSON antes de continuar si deseas conservar tus datos.
        </p>
        <button onClick={() => setShowClearConfirm(true)}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-red-600/20 transition-all flex items-center gap-2 cursor-pointer">
          <Trash2 className="w-4 h-4" />
          <span>Vaciar Todos los Dispositivos</span>
        </button>
      </div>

      <ConfirmDialog
        isOpen={showClearConfirm}
        title="Restablecer Boveda Completa?"
        message={`Estas seguro de que deseas eliminar TODOS los ${deviceCount} dispositivos y sus fotos de este navegador? Te recomendamos exportar un respaldo primero.`}
        confirmText="Si, Vaciar Todo"
        isDangerous={true}
        onConfirm={handleClearDatabase}
        onClose={() => setShowClearConfirm(false)}
      />
    </div>
  );
};