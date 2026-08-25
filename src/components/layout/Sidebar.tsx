import React from 'react';
import { LayoutDashboard, Smartphone, PlusCircle, Search, Database, Settings, Shield } from 'lucide-react';

export type CurrentView = 
  | 'dashboard' 
  | 'gallery' 
  | 'register' 
  | 'imei_lookup' 
  | 'backup' 
  | 'settings';

interface SidebarProps {
  currentView: CurrentView;
  onViewChange: (view: CurrentView) => void;
  deviceCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  deviceCount,
}) => {
  const navItems = [
    { id: 'dashboard' as CurrentView, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'gallery' as CurrentView, label: 'Mis Dispositivos', icon: Smartphone, badge: deviceCount },
    { id: 'register' as CurrentView, label: 'Registrar Dispositivo', icon: PlusCircle },
    { id: 'imei_lookup' as CurrentView, label: 'IMEI / Serial Lookup', icon: Search },
    { id: 'backup' as CurrentView, label: 'Respaldo / Backup', icon: Database },
    { id: 'settings' as CurrentView, label: 'Configuración', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-zinc-950/90 border-r border-zinc-800/80 flex flex-col justify-between p-5 select-none hidden md:flex flex-shrink-0">
      <div className="space-y-6">
        {/* Logo & Brand */}
        <div className="flex items-center space-x-3 px-2 py-1">
          <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30 shadow-lg shadow-blue-600/10">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              DEVICEVAULT
            </h1>
            <p className="text-[11px] text-zinc-500 font-medium">Bóveda Local Personal</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 border border-blue-500/40'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                      isActive ? 'bg-blue-800/80 text-white' : 'bg-zinc-850 text-zinc-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-zinc-800/80 px-2 space-y-1 text-[11px] text-zinc-500 font-medium">
        <div className="flex items-center justify-between text-zinc-400">
          <span>Almacenamiento:</span>
          <span className="font-mono text-emerald-400 font-bold">IndexedDB Local</span>
        </div>
        <p className="text-[10px] text-zinc-600">100% Privado &bull; Cero Telemetría</p>
      </div>
    </aside>
  );
};
