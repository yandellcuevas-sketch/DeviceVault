import React, { useState, useRef, useEffect } from 'react';
import { Save, PlusCircle, Check, AlertCircle, Package, Zap, Disc, Headphones, Shield, Smartphone } from 'lucide-react';
import type { Accessory, AccessoryCategory, AccessoryStatus } from '../../types/accessory';
import type { Device } from '../../types/device';
import { db, generateUUID } from '../../db';
import { PhotoUploader } from '../devices/PhotoUploader';

interface AccessoryFormProps {
  initialAccessory?: Accessory;
  devices: Device[];
  preselectedDeviceId?: string;
  onSaved?: (accessory: Accessory) => void;
  onCancel?: () => void;
  isEditing?: boolean;
}

const INITIAL_STATE: Omit<Accessory, 'id' | 'createdAt' | 'updatedAt'> = {
  category: 'case',
  brand: 'Apple',
  name: '',
  modelNumber: '',
  partNumber: '',
  serialNumber: '',
  color: '',
  linkedDeviceId: undefined,
  notes: '',
  powerWatts: '',
  upc: '',
  madeIn: '',
  manufacturingYear: '',
  purchaseDate: '',
  purchasePrice: undefined,
  purchaseCurrency: 'USD',
  purchaseLocation: '',
  status: 'active',
  mainPhoto: undefined,
  additionalPhotos: [],
};

const CATEGORY_OPTIONS: { id: AccessoryCategory; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'case', label: 'Case / Cover', icon: Shield },
  { id: 'charger', label: 'Cargador', icon: Zap },
  { id: 'magsafe', label: 'MagSafe', icon: Disc },
  { id: 'audio_accessory', label: 'Audio', icon: Headphones },
  { id: 'other', label: 'Otro', icon: Package },
];

export const AccessoryForm: React.FC<AccessoryFormProps> = ({
  initialAccessory,
  devices,
  preselectedDeviceId,
  onSaved,
  onCancel,
  isEditing = false,
}) => {
  const [formData, setFormData] = useState<Omit<Accessory, 'id' | 'createdAt' | 'updatedAt'> & { id?: string; createdAt?: number }>(
    initialAccessory || {
      ...INITIAL_STATE,
      linkedDeviceId: preselectedDeviceId || undefined,
    }
  );
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isEditing && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'purchasePrice' ? (value ? parseFloat(value) : undefined) : value,
    }));
  };

  const handleSave = async (registerAnother = false) => {
    setErrorMsg(null);

    if (!formData.brand.trim() || !formData.name.trim()) {
      setErrorMsg('Por favor introduce la Marca y el Nombre del accesorio.');
      return;
    }

    setIsSaving(true);
    try {
      const now = Date.now();
      const accessoryToSave: Accessory = {
        id: initialAccessory?.id || generateUUID(),
        category: formData.category as AccessoryCategory,
        brand: formData.brand.trim(),
        name: formData.name.trim(),
        modelNumber: formData.modelNumber?.trim() || undefined,
        partNumber: formData.partNumber?.trim() || undefined,
        serialNumber: formData.serialNumber?.trim() || undefined,
        color: formData.color?.trim() || undefined,
        linkedDeviceId: formData.linkedDeviceId && formData.linkedDeviceId.trim() ? formData.linkedDeviceId.trim() : undefined,
        notes: formData.notes?.trim() || undefined,
        powerWatts: formData.powerWatts ? String(formData.powerWatts).trim() : undefined,
        upc: formData.upc?.trim() || undefined,
        madeIn: formData.madeIn?.trim() || undefined,
        manufacturingYear: formData.manufacturingYear ? String(formData.manufacturingYear).trim() : undefined,
        purchaseDate: formData.purchaseDate || undefined,
        purchasePrice: formData.purchasePrice,
        purchaseCurrency: formData.purchaseCurrency || 'USD',
        purchaseLocation: formData.purchaseLocation?.trim() || undefined,
        status: formData.status as AccessoryStatus,
        mainPhoto: formData.mainPhoto || undefined,
        additionalPhotos: formData.additionalPhotos || [],
        createdAt: initialAccessory?.createdAt || now,
        updatedAt: now,
      };

      if (isEditing) {
        await db.accessories.put(accessoryToSave);
      } else {
        await db.accessories.add(accessoryToSave);
      }

      if (registerAnother) {
        const label = `${accessoryToSave.brand} ${accessoryToSave.name}`;
        setSuccessToast(`"${label}" guardado correctamente.`);
        setFormData({ ...INITIAL_STATE, linkedDeviceId: preselectedDeviceId || undefined });
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setSuccessToast(null), 4500);
        if (nameInputRef.current) nameInputRef.current.focus();
      } else {
        if (onSaved) onSaved(accessoryToSave);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar el accesorio en la base de datos local.';
      setErrorMsg(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const isChargerOrMagSafe = formData.category === 'charger' || formData.category === 'magsafe';

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSave(false); }} className="space-y-6">
      {/* Toast de exito */}
      {successToast && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm flex items-center gap-3 shadow-lg shadow-emerald-950/30">
          <div className="p-1 bg-emerald-500/20 rounded-full flex-shrink-0">
            <Check className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <span className="font-semibold">Guardado: </span>
            {successToast}
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">{errorMsg}</div>
        </div>
      )}

      {/* Categoria de Accesorio */}
      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4">
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Categoria de Accesorio
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {CATEGORY_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = formData.category === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, category: opt.id }))}
                className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-all text-center flex items-center justify-center gap-2 ${
                  isSelected
                    ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/30'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Informacion del Accesorio */}
      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-zinc-800 pb-2">
          1. Informacion del Accesorio
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Marca <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="brand"
              required
              placeholder="Ej. Apple, Anker, Belkin..."
              value={formData.brand}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Nombre / Modelo del Accesorio <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="name"
              ref={nameInputRef}
              required
              placeholder="Ej. iPhone 15 Pro Max Silicone Case, 20W USB-C Adapter..."
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Part Number (Numero de Pieza)</label>
            <input
              type="text"
              name="partNumber"
              placeholder="Ej. MT1Y3ZM/A, MHJ83LL/A..."
              value={formData.partNumber || ''}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white font-mono placeholder-zinc-600 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Model Number (Numero de Modelo)</label>
            <input
              type="text"
              name="modelNumber"
              placeholder="Ej. A3126, A2305, A2140..."
              value={formData.modelNumber || ''}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white font-mono placeholder-zinc-600 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Color / Acabado</label>
            <input
              type="text"
              name="color"
              placeholder="Ej. Winter Blue, Blanco, Midnight..."
              value={formData.color || ''}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors"
            />
          </div>

          {/* Potencia si es cargador */}
          {isChargerOrMagSafe ? (
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Potencia (Watts)</label>
              <input
                type="text"
                name="powerWatts"
                placeholder="Ej. 20W, 30W, 15W..."
                value={formData.powerWatts || ''}
                onChange={handleChange}
                className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white font-mono placeholder-zinc-600 focus:outline-none transition-colors"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Codigo UPC / EAN</label>
              <input
                type="text"
                name="upc"
                placeholder="Ej. 195949045981..."
                value={formData.upc || ''}
                onChange={handleChange}
                className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white font-mono placeholder-zinc-600 focus:outline-none transition-colors"
              />
            </div>
          )}

          {/* Vincular con un Dispositivo */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-blue-400" />
              <span>Vincular con un Dispositivo (Opcional)</span>
            </label>
            <select
              name="linkedDeviceId"
              value={formData.linkedDeviceId || ''}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white focus:outline-none"
            >
              <option value="">(Ninguno / Accesorio independiente)</option>
              {devices.map((dev) => (
                <option key={dev.id} value={dev.id}>
                  {dev.brand} {dev.model} {dev.color ? `(${dev.color})` : ''} {dev.partNumber ? `— ${dev.partNumber}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Identificadores y Origen */}
      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-zinc-800 pb-2">
          2. Identificadores y Fabricacion
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Numero de Serie (Serial)</label>
            <input
              type="text"
              name="serialNumber"
              placeholder="Ej. F160345144NPM69AL..."
              value={formData.serialNumber || ''}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white font-mono placeholder-zinc-600 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Pais de Fabricacion (Made In)</label>
            <input
              type="text"
              name="madeIn"
              placeholder="Ej. China, India, Vietnam..."
              value={formData.madeIn || ''}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Ano de Fabricacion</label>
            <input
              type="text"
              name="manufacturingYear"
              placeholder="Ej. 2023, 2024..."
              value={formData.manufacturingYear || ''}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white font-mono placeholder-zinc-600 focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Fotografia */}
      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
        <PhotoUploader
          mainPhoto={formData.mainPhoto}
          additionalPhotos={formData.additionalPhotos}
          onMainPhotoChange={(photo) => setFormData((prev) => ({ ...prev, mainPhoto: photo }))}
          onAdditionalPhotosChange={(photos) => setFormData((prev) => ({ ...prev, additionalPhotos: photos }))}
          brand={formData.brand}
          model={formData.name}
          color={formData.color || ''}
        />
      </div>

      {/* Compra, Estado y Notas */}
      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-zinc-800 pb-2">
          3. Estado y Compra
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Estado</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white focus:outline-none"
            >
              <option value="active">Activo / En uso</option>
              <option value="stored">Guardado</option>
              <option value="sold">Vendido</option>
              <option value="repair">En reparacion</option>
              <option value="lost">Perdido</option>
              <option value="other">Otro</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Precio de Compra</label>
            <input
              type="number"
              step="0.01"
              name="purchasePrice"
              placeholder="0.00"
              value={formData.purchasePrice !== undefined ? formData.purchasePrice : ''}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Moneda</label>
            <input
              type="text"
              name="purchaseCurrency"
              placeholder="USD"
              value={formData.purchaseCurrency || 'USD'}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Notas</label>
          <textarea
            name="notes"
            rows={2}
            placeholder="Detalles sobre el estado, empaque o procedencia..."
            value={formData.notes || ''}
            onChange={handleChange}
            className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none resize-none"
          />
        </div>
      </div>

      {/* Botones de Accion */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 rounded-xl transition-colors"
          >
            Cancelar
          </button>
        )}
        {!isEditing && (
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave(true)}
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-emerald-300 hover:text-emerald-200 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/20 disabled:opacity-50"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Guardar y Registrar Otro</span>
          </button>
        )}
        <button
          type="submit"
          disabled={isSaving}
          className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isEditing ? 'Guardar Cambios' : 'Guardar Accesorio'}</span>
        </button>
      </div>
    </form>
  );
};