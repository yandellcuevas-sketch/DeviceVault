import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Save, PlusCircle, Check, AlertCircle, Smartphone, Laptop, Tablet, Watch, Headphones, Package, Box } from 'lucide-react';
import type { Device, DeviceType, DeviceStatus } from '../../types/device';
import { db, generateUUID } from '../../db';
import { PhotoUploader } from './PhotoUploader';
import { validateImei, normalizeIdentifier } from '../../utils/imeiValidation';

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
  partNumber: '',
  color: '',
  storage: '',
  ram: '',
  os: '',
  imei1: '',
  imei2: '',
  serialNumber: '',
  eid: '',
  iccid: '',
  upc: '',
  fccId: '',
  ic: '',
  country: '',
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

const DEVICE_TYPE_OPTIONS: { id: DeviceType; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'phone', label: 'Telefono', icon: Smartphone },
  { id: 'tablet', label: 'Tablet / iPad', icon: Tablet },
  { id: 'computer', label: 'Computadora', icon: Laptop },
  { id: 'watch', label: 'Smartwatch', icon: Watch },
  { id: 'audio', label: 'Audio', icon: Headphones },
  { id: 'accessory', label: 'Accesorio', icon: Package },
  { id: 'other', label: 'Otro', icon: Box },
];

interface DuplicateInfo {
  field: string;
  device: Device;
}

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
  const [imei1Error, setImei1Error] = useState<string | null>(null);
  const [imei2Error, setImei2Error] = useState<string | null>(null);
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicateInfo | null>(null);

  const brandInputRef = useRef<HTMLInputElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isEditing && brandInputRef.current) {
      brandInputRef.current.focus();
    }
  }, [isEditing]);

  // Limpiar timers al desmontar
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

  const validateImei1 = useCallback((val: string) => {
    if (!val) { setImei1Error(null); return true; }
    const result = validateImei(val);
    setImei1Error(result.valid ? null : (result.error || null));
    return result.valid;
  }, []);

  const validateImei2 = useCallback((val: string) => {
    if (!val) { setImei2Error(null); return true; }
    const result = validateImei(val);
    setImei2Error(result.valid ? null : (result.error || null));
    return result.valid;
  }, []);

  // Verificar duplicados en IndexedDB para un identificador dado
  const checkDuplicate = async (field: 'imei1' | 'imei2' | 'serialNumber' | 'eid', value: string): Promise<Device | null> => {
    if (!value.trim()) return null;
    const normalized = normalizeIdentifier(value);
    const allDevices = await db.devices.toArray();
    return allDevices.find((d) => {
      if (isEditing && d.id === initialDevice?.id) return false;
      const fieldValue = normalizeIdentifier((d[field] as string) || '');
      return fieldValue.length > 0 && fieldValue === normalized;
    }) || null;
  };

  const handleIdentifierBlur = async (field: 'imei1' | 'imei2' | 'serialNumber' | 'eid', value: string) => {
    if (!value.trim()) return;
    const dup = await checkDuplicate(field, value);
    if (dup) {
      setDuplicateInfo({ field, device: dup });
    } else {
      setDuplicateInfo((prev) => (prev?.field === field ? null : prev));
    }
  };

  const handleSave = async (registerAnother = false) => {
    setErrorMsg(null);
    setDuplicateInfo(null);

    if (!formData.brand.trim() || !formData.model.trim()) {
      setErrorMsg('Por favor introduce al menos la Marca y el Modelo del dispositivo.');
      return;
    }

    // Validar IMEI si estan presentes
    const imei1Ok = validateImei1(formData.imei1 || '');
    const imei2Ok = validateImei2(formData.imei2 || '');
    if (!imei1Ok || !imei2Ok) {
      setErrorMsg('Corrige los errores de IMEI antes de guardar.');
      return;
    }

    // Verificar duplicados antes de guardar
    const fieldsToCheck: Array<'imei1' | 'imei2' | 'serialNumber' | 'eid'> = ['imei1', 'imei2', 'serialNumber', 'eid'];
    for (const field of fieldsToCheck) {
      const val = (formData[field] as string) || '';
      if (val.trim()) {
        const dup = await checkDuplicate(field, val);
        if (dup) {
          setDuplicateInfo({ field, device: dup });
          setErrorMsg(`El identificador "${field.toUpperCase().replace('SERIALNUMBER', 'SERIAL').replace('IMEI1','IMEI 1').replace('IMEI2','IMEI 2')}" ya esta registrado en otro dispositivo.`);
          return;
        }
      }
    }

    setIsSaving(true);
    try {
      const now = Date.now();
      const deviceToSave: Device = {
        id: initialDevice?.id || generateUUID(),
        type: formData.type as DeviceType,
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        customName: formData.customName?.trim() || undefined,
        modelNumber: formData.modelNumber?.trim() || undefined,
        partNumber: formData.partNumber?.trim() || undefined,
        color: formData.color?.trim() || undefined,
        storage: formData.storage?.trim() || undefined,
        ram: formData.ram?.trim() || undefined,
        os: formData.os?.trim() || undefined,
        imei1: formData.imei1?.trim() || undefined,
        imei2: formData.imei2?.trim() || undefined,
        serialNumber: formData.serialNumber?.trim() || undefined,
        eid: formData.eid?.trim() || undefined,
        iccid: formData.iccid?.trim() || undefined,
        upc: formData.upc?.trim() || undefined,
        fccId: formData.fccId?.trim() || undefined,
        ic: formData.ic?.trim() || undefined,
        country: formData.country?.trim() || undefined,
        phoneCarrier: formData.phoneCarrier?.trim() || undefined,
        purchaseDate: formData.purchaseDate || undefined,
        purchasePrice: formData.purchasePrice,
        purchaseCurrency: formData.purchaseCurrency || 'USD',
        purchaseLocation: formData.purchaseLocation?.trim() || undefined,
        warrantyExpiration: formData.warrantyExpiration || undefined,
        insuranceInfo: formData.insuranceInfo?.trim() || undefined,
        status: formData.status as DeviceStatus,
        condition: formData.condition?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
        tags: Array.isArray(formData.tags) ? formData.tags : [],
        mainPhoto: formData.mainPhoto || undefined,
        additionalPhotos: formData.additionalPhotos || [],
        createdAt: initialDevice?.createdAt || now,
        updatedAt: now,
      };

      if (isEditing) {
        await db.devices.put(deviceToSave);
      } else {
        await db.devices.add(deviceToSave);
      }

      if (registerAnother) {
        const label = `${deviceToSave.brand} ${deviceToSave.model}`;
        setSuccessToast(`"${label}" guardado correctamente. Listo para el siguiente.`);
        setFormData({ ...INITIAL_STATE, id: generateUUID() } as typeof formData);
        setImei1Error(null);
        setImei2Error(null);
        setDuplicateInfo(null);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setSuccessToast(null), 4500);
        if (brandInputRef.current) {
          brandInputRef.current.focus();
        }
      } else {
        if (onSaved) onSaved(deviceToSave);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar en la base de datos local.';
      setErrorMsg(msg);
    } finally {
      setIsSaving(false);
    }
  };

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
          <div className="flex-1">
            <div>{errorMsg}</div>
            {duplicateInfo && (
              <div className="mt-2 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-200 text-xs">
                <span className="font-bold">DISPOSITIVO YA REGISTRADO:</span>{' '}
                <span className="font-mono">{duplicateInfo.device.brand} {duplicateInfo.device.model}</span>
                <button
                  type="button"
                  className="ml-2 text-blue-400 hover:text-blue-300 underline font-medium"
                  onClick={() => {
                    if (onSaved) onSaved(duplicateInfo.device);
                  }}
                >
                  Ver Dispositivo
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tipo de Dispositivo */}
      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4">
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Tipo de Dispositivo
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DEVICE_TYPE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, type: opt.id }))}
                className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-all text-center flex items-center justify-center gap-2 ${
                  formData.type === opt.id
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

      {/* Datos Principales */}
      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-zinc-800 pb-2">
          1. Informacion del Equipo
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Marca <span className="text-red-400">*</span>
            </label>
            <input type="text" name="brand" ref={brandInputRef} required
              placeholder="Ej. Apple, Samsung, Sony..."
              value={formData.brand} onChange={handleChange}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Modelo <span className="text-red-400">*</span>
            </label>
            <input type="text" name="model" required
              placeholder="Ej. iPhone 16 Pro Max, MacBook Pro 16..."
              value={formData.model} onChange={handleChange}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Part Number (Numero de Pieza)</label>
            <input type="text" name="partNumber" placeholder="Ej. MYW63LL/A, MU673LL/A..."
              value={formData.partNumber || ''} onChange={handleChange}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white font-mono placeholder-zinc-600 focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Numero de Modelo (Caja / Ajustes)</label>
            <input type="text" name="modelNumber" placeholder="Ej. A3084, A2849, SM-S928B..."
              value={formData.modelNumber || ''} onChange={handleChange}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white font-mono placeholder-zinc-600 focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Capacidad de Almacenamiento</label>
            <input type="text" name="storage" placeholder="Ej. 128 GB, 256 GB, 1 TB..."
              value={formData.storage || ''} onChange={handleChange}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Color / Acabado</label>
            <input type="text" name="color" placeholder="Ej. Natural Titanium, White Titanium, Silver..."
              value={formData.color || ''} onChange={handleChange}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Nombre Personalizado (Opcional)</label>
            <input type="text" name="customName" placeholder="Ej. Mi iPhone de trabajo"
              value={formData.customName || ''} onChange={handleChange}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors" />
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
          model={formData.model}
          color={formData.color || ''}
        />
      </div>

      {/* Identificadores y Regulatorio */}
      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4">
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">2. Identificadores y Regulatorio</h4>
          <p className="text-xs text-zinc-500 mt-0.5">Opcionales. Ningun campo es obligatorio para guardar.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* IMEI 1 */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">IMEI 1 (15 digitos)</label>
            <input type="text" name="imei1" maxLength={20}
              placeholder="Ej. 358901234567890"
              value={formData.imei1 || ''} onChange={handleChange}
              onBlur={(e) => {
                validateImei1(e.target.value);
                handleIdentifierBlur('imei1', e.target.value);
              }}
              className={`w-full px-3.5 py-2 bg-zinc-950 border rounded-xl text-sm text-white font-mono placeholder-zinc-600 focus:outline-none transition-colors ${
                imei1Error ? 'border-red-500/60 focus:border-red-500' : 'border-zinc-800 focus:border-blue-500'
              }`} />
            {imei1Error && <p className="text-xs text-red-400 mt-1">{imei1Error}</p>}
          </div>

          {/* IMEI 2 */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">IMEI 2 (Dual SIM / eSIM)</label>
            <input type="text" name="imei2" maxLength={20}
              placeholder="Ej. 358901234567891"
              value={formData.imei2 || ''} onChange={handleChange}
              onBlur={(e) => {
                validateImei2(e.target.value);
                handleIdentifierBlur('imei2', e.target.value);
              }}
              className={`w-full px-3.5 py-2 bg-zinc-950 border rounded-xl text-sm text-white font-mono placeholder-zinc-600 focus:outline-none transition-colors ${
                imei2Error ? 'border-red-500/60 focus:border-red-500' : 'border-zinc-800 focus:border-blue-500'
              }`} />
            {imei2Error && <p className="text-xs text-red-400 mt-1">{imei2Error}</p>}
          </div>

          {/* Serial */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Numero de Serie (Serial)</label>
            <input type="text" name="serialNumber" placeholder="Ej. F2LXXXXXQ6L4"
              value={formData.serialNumber || ''} onChange={handleChange}
              onBlur={(e) => handleIdentifierBlur('serialNumber', e.target.value)}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white font-mono placeholder-zinc-600 focus:outline-none transition-colors" />
          </div>

          {/* EID */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">EID (eSIM Identifier)</label>
            <input type="text" name="eid" placeholder="Ej. 89049032..."
              value={formData.eid || ''} onChange={handleChange}
              onBlur={(e) => handleIdentifierBlur('eid', e.target.value)}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white font-mono placeholder-zinc-600 focus:outline-none transition-colors" />
          </div>

          {/* ICCID */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">ICCID (SIM Fisica)</label>
            <input type="text" name="iccid" placeholder="Ej. 89011201..."
              value={formData.iccid || ''} onChange={handleChange}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white font-mono placeholder-zinc-600 focus:outline-none transition-colors" />
          </div>

          {/* UPC */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Codigo UPC / EAN</label>
            <input type="text" name="upc" placeholder="Ej. 195949805073..."
              value={formData.upc || ''} onChange={handleChange}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white font-mono placeholder-zinc-600 focus:outline-none transition-colors" />
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
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Estado Actual</label>
            <select name="status" value={formData.status} onChange={handleChange}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white focus:outline-none">
              <option value="in_use">En uso</option>
              <option value="stored">Guardado / Coleccion</option>
              <option value="sold">Vendido</option>
              <option value="repair">En reparacion</option>
              <option value="lost">Perdido / Extraviado</option>
              <option value="other">Otro</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Fecha de Compra</label>
            <input type="date" name="purchaseDate" value={formData.purchaseDate || ''} onChange={handleChange}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Precio de Compra (USD)</label>
            <input type="number" step="0.01" name="purchasePrice" placeholder="0.00"
              value={formData.purchasePrice !== undefined ? formData.purchasePrice : ''} onChange={handleChange}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Lugar / Tienda de Compra</label>
            <input type="text" name="purchaseLocation" placeholder="Ej. Apple Store, Best Buy, Amazon..."
              value={formData.purchaseLocation || ''} onChange={handleChange}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Vencimiento de Garantia</label>
            <input type="date" name="warrantyExpiration" value={formData.warrantyExpiration || ''} onChange={handleChange}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white focus:outline-none" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Notas Adicionales</label>
          <textarea name="notes" rows={3}
            placeholder="Anotaciones personales, detalles de la caja, estado estetico..."
            value={formData.notes || ''} onChange={handleChange}
            className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none resize-none" />
        </div>
      </div>

      {/* Botones de Accion */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 rounded-xl transition-colors">
            Cancelar
          </button>
        )}
        {!isEditing && (
          <button type="button" disabled={isSaving} onClick={() => handleSave(true)}
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-emerald-300 hover:text-emerald-200 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/20 disabled:opacity-50">
            <PlusCircle className="w-4 h-4" />
            <span>Guardar y Registrar Otro</span>
          </button>
        )}
        <button type="submit" disabled={isSaving}
          className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
          <Save className="w-4 h-4" />
          <span>{isEditing ? 'Guardar Cambios' : 'Guardar Dispositivo'}</span>
        </button>
      </div>
    </form>
  );
};