import React from 'react';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import type { Accessory } from '../types/accessory';
import type { Device } from '../types/device';
import { AccessoryForm } from '../components/accessories/AccessoryForm';

interface RegisterAccessoryViewProps {
  devices: Device[];
  editingAccessory?: Accessory;
  preselectedDeviceId?: string;
  onSaved: (accessory: Accessory) => void;
  onCancel: () => void;
}

export const RegisterAccessoryView: React.FC<RegisterAccessoryViewProps> = ({
  devices,
  editingAccessory,
  preselectedDeviceId,
  onSaved,
  onCancel,
}) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
              <PlusCircle className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {editingAccessory ? 'Editar Accesorio' : 'Registrar Nuevo Accesorio'}
            </h2>
          </div>
          <p className="text-xs text-zinc-400">
            Registra covers, cargadores, MagSafe o audifonos y asocialos a tus dispositivos.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="flex items-center space-x-1.5 text-xs font-semibold text-zinc-400 hover:text-white px-3 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </button>
      </div>

      <AccessoryForm
        devices={devices}
        initialAccessory={editingAccessory}
        preselectedDeviceId={preselectedDeviceId}
        onSaved={onSaved}
        onCancel={onCancel}
        isEditing={!!editingAccessory}
      />
    </div>
  );
};