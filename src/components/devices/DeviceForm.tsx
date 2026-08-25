import React, { useState, useRef, useEffect } from 'react';
import { Save, PlusCircle, Check, AlertCircle } from 'lucide-react';
import type { Device, DeviceType, DeviceStatus } from '../../types/device';
import { db, generateUUID } from '../../db';
import { PhotoUploader } from './PhotoUploader';

interface DeviceFormProps {
  initialDevice?: Device;
  onSaved?: (device: Device) => void;
  onCancel?: () => void;
  isEditing?: boolean;
}

const INITIAL_STATE: Omit<Device, 'id' | 'createdAt' | 'updatedAt'> = {
  type: 'phone',
  brand: '',
  model: '',
  customName: '',
  modelNumber: '',
  color: '',
  storage: '',
  ram: '',
  os: '',
  imei1: '',
  imei2: '',
  serialNumber: '',
  eid: '',
  phoneCarrier: '',
  purchaseDate: '',
  purchasePrice: undefined,
  purchaseCurrency: 'USD',
  purchaseLocation: '',
  warrantyExpiration: '',
  insuranceInfo: '',
  status: 'in_use',
  condition: 'Excelente',
  notes: '',
  tags: [],
  mainPhoto: undefined,
  additionalPhotos: [],
};

export const DeviceForm: React.FC<DeviceFormProps> = ({
  initialDevice,
  onSaved,
  onCancel,
  isEditing = false,
}) => {
  const [formData, setFormData] = useState(initialDevice || INITIAL_STATE);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const brandInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing && brandInputRef.current) {
      brandInputRef.current.focus();
    }
  }, [isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'purchasePrice' ? (value ? parseFloat(value) : undefined) : value,
    }));
  };

  const handleSave = async (registerAnother = false) => {
    setErrorMsg(null);
    if (!formData.brand.trim() || !formData.model.trim()) {
      setErrorMsg('Por favor introduce al menos la Marca y el Modelo del dispositivo.');
      return;
    }

    setIsSaving(true);
    try {
      const now = Date.now();
      const deviceToSave: Device = {
        ...(formData as any),
        id: initialDevice?.id || generateUUID(),
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        createdAt: initialDevice?.createdAt || now,
        updatedAt: now,
      };

      if (isEditing) {
        await db.devices.put(deviceToSave);
      } else {
        await db.devices.add(deviceToSave);
      }

      if (registerAnother) {
        setSuccessToast(`¡${deviceToSave.brand} ${deviceToSave.model} guardado con éxito! Listo para el siguiente.`);
        setFormData(INITIAL_STATE);
        if (brandInputRef.current) {
          brandInputRef.current.focus();
        }
        setTimeout(() => setSuccessToast(null), 4000);
      } else {
        if (onSaved) onSaved(deviceToSave);
      }
    } catch (err: any) {
      console.error('Error al guardar en IndexedDB:', err);
      setErrorMsg(err.message || 'Error al guardar en la base de datos local.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSave(false);
      }}
      className="space-y-6"
    >
      {/* Toast de éxito para Guardar y Registrar Otro */}
      {successToast && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm flex items-center gap-3 animate-fade-in shadow-lg shadow-emerald-950/30">
          <div className="p-1 bg-emerald-500/20 rounded-full">
            <Check className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <span className="font-semibold">Guardado Correctamente: </span>
            {successToast}
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>{errorMsg}</div>
        </div>
      )}

      {/* Tipo de Dispositivo */}
      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4">
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Tipo de Dispositivo
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(['phone', 'tablet', 'computer', 'watch', 'audio', 'accessory', 'other'] as DeviceType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, type: t }))}
              className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-all text-center capitalize ${
                formData.type === t
                  ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/30'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              {t === 'phone' ? '📱 Teléfono' :
               t === 'computer' ? '💻 Computadora' :
               t === 'tablet' ? '📟 Tablet / iPad' :
               t === 'watch' ? '⌚ Smartwatch' :
               t === 'audio' ? '🎧 Audio' :
               t === 'accessory' ? '🔌 Accesorio' : '📦 Otro'}
            </button>
          ))}
        </div>
      </div>

      {/* Fotografía */}
      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
        <PhotoUploader
          mainPhoto={formData.mainPhoto}
          additionalPhotos={formData.additionalPhotos}
          onMainPhotoChange={(photo) => setFormData((prev) => ({ ...prev, mainPhoto: photo }))}
          onAdditionalPhotosChange={(photos) => setFormData((prev) => ({ ...prev, additionalPhotos: photos }))}
        />
      </div>

      {/* Datos Principales */}
      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-zinc-800 pb-2">
          1. Información del Equipo
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Marca <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="brand"
              ref={brandInputRef}
              required
              placeholder="Ej. Apple, Samsung, Sony..."
              value={formData.brand}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Modelo <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="model"
              required
              placeholder="Ej. iPhone 16 Pro Max, MacBook Pro 16..."
              value={formData.model}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Nombre Personalizado (Opcional)
            </label>
            <input
              type="text"
              name="customName"
              placeholder="Ej. Mi iPhone de trabajo"
              value={formData.customName}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Número de Modelo (Caja / Ajustes)
            </label>
            <input
              type="text"
              name="modelNumber"
              placeholder="Ej. A3296, SM-S928B..."
              value={formData.modelNumber}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Capacidad de Almacenamiento
            </label>
            <input
              type="text"
              name="storage"
              placeholder="Ej. 128 GB, 256 GB, 1 TB..."
              value={formData.storage}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Color / Acabado
            </label>
            <input
              type="text"
              name="color"
              placeholder="Ej. Black Titanium, Space Gray, Blanco..."
              value={formData.color}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Identificadores (Opcionales) */}
      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4">
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
            2. Identificadores Únicos
          </h4>
          <p className="text-xs text-zinc-500 mt-0.5">
            Opcionales según el tipo de dispositivo (Ninguno es obligatorio para guardar).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              IMEI 1 (15 dígitos)
            </label>
            <input
              type="text"
              name="imei1"
              maxLength={20}
              placeholder="Ej. 358901234567890"
              value={formData.imei1}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white font-mono placeholder-zinc-600 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              IMEI 2 (Opcional Dual SIM / eSIM)
            </label>
            <input
              type="text"
              name="imei2"
              maxLength={20}
              placeholder="Ej. 358901234567891"
              value={formData.imei2}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white font-mono placeholder-zinc-600 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Número de Serie (Serial Number)
            </label>
            <input
              type="text"
              name="serialNumber"
              placeholder="Ej. F2LXXXXXQ6L4"
              value={formData.serialNumber}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white font-mono placeholder-zinc-600 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              EID (eSIM Identifier)
            </label>
            <input
              type="text"
              name="eid"
              placeholder="Ej. 89049032..."
              value={formData.eid}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white font-mono placeholder-zinc-600 focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Compra y Estado */}
      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-zinc-800 pb-2">
          3. Datos de Compra y Estado
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Estado Actual
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white focus:outline-none"
            >
              <option value="in_use">En uso</option>
              <option value="stored">Guardado / Colección</option>
              <option value="sold">Vendido</option>
              <option value="repair">En reparación</option>
              <option value="lost">Perdido / Extraviado</option>
              <option value="other">Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Fecha de Compra
            </label>
            <input
              type="date"
              name="purchaseDate"
              value={formData.purchaseDate}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Precio de Compra (USD)
            </label>
            <input
              type="number"
              step="0.01"
              name="purchasePrice"
              placeholder="0.00"
              value={formData.purchasePrice || ''}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Lugar / Tienda de Compra
            </label>
            <input
              type="text"
              name="purchaseLocation"
              placeholder="Ej. Apple Store Fifth Ave, Best Buy, Amazon..."
              value={formData.purchaseLocation}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Vencimiento de Garantía
            </label>
            <input
              type="date"
              name="warrantyExpiration"
              value={formData.warrantyExpiration}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            Notas Adicionales
          </label>
          <textarea
            name="notes"
            rows={3}
            placeholder="Anotaciones personales, detalles de la caja, estado estético..."
            value={formData.notes}
            onChange={handleChange}
            className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none resize-none"
          />
        </div>
      </div>

      {/* Botones de Acción */}
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
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-emerald-300 hover:text-emerald-200 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Guardar y Registrar Otro</span>
          </button>
        )}

        <button
          type="submit"
          disabled={isSaving}
          className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{isEditing ? 'Guardar Cambios' : 'Guardar Dispositivo'}</span>
        </button>
      </div>
    </form>
  );
};
