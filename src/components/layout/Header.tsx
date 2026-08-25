import React from 'react';
import { Search, Plus, ShieldCheck } from 'lucide-react';
import type { CurrentView } from './Sidebar';

interface HeaderProps {
  onSearchClick: () => void;
  onRegisterClick: () => void;
  currentView: CurrentView;
}

export const Header: React.FC<HeaderProps> = ({
  onSearchClick,
  onRegisterClick,
  currentView,
}) => {
  const getTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Panel Principal';
      case 'gallery':
        return 'Mis Dispositivos';
      case 'register':
        return 'Registrar Dispositivo';
      case 'imei_lookup':
        return 'Búsqueda por IMEI / Serial';
      case 'backup':
        return 'Centro de Respaldo';
      case 'settings':
        return 'Configuración';
      default:
        return 'DeviceVault';
    }
  };

  return (
    <header className="h-16 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 px-6 flex items-center justify-between flex-shrink-0 z-10">
      <div className="flex items-center space-x-3">
        <h2 className="text-lg font-bold text-white tracking-tight">{getTitle()}</h2>
        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <ShieldCheck className="w-3 h-3" /> Local Vault
        </span>
      </div>

      <div className="flex items-center space-x-3">
        {/* Quick Search Shortcut */}
        <button
          onClick={onSearchClick}
          className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Buscar IMEI, Serial, Modelo...</span>
          <kbd className="text-[10px] font-mono bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400 border border-zinc-700">
            Ctrl+K
          </kbd>
        </button>

        {currentView !== 'register' && (
          <button
            onClick={onRegisterClick}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo</span>
          </button>
        )}
      </div>
    </header>
  );
};
