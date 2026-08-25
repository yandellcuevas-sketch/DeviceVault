import React from 'react';
import { LayoutDashboard, Smartphone, PlusCircle, Search, Database } from 'lucide-react';
import type { CurrentView } from './Sidebar';

interface MobileNavProps {
  currentView: CurrentView;
  onViewChange: (view: CurrentView) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentView, onViewChange }) => {
  const items = [
    { id: 'dashboard' as CurrentView, label: 'Inicio', icon: LayoutDashboard },
    { id: 'gallery' as CurrentView, label: 'Equipos', icon: Smartphone },
    { id: 'register' as CurrentView, label: '+ Nuevo', icon: PlusCircle },
    { id: 'imei_lookup' as CurrentView, label: 'Buscar', icon: Search },
    { id: 'backup' as CurrentView, label: 'Backup', icon: Database },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-800/80 px-2 flex items-center justify-around z-40">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`flex flex-col items-center justify-center p-2 rounded-xl text-[10px] font-medium transition-colors ${
              isActive ? 'text-blue-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-blue-400' : 'text-zinc-400'}`} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
