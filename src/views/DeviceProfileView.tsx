import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Edit, Trash2, Copy, Check, Calendar, DollarSign, MapPin, ShieldCheck, Box, HardDrive, Eye, EyeOff, Image as ImageIcon, Package, Plus, Zap, ExternalLink } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Device } from '../types/device';
import type { Accessory } from '../types/accessory';
import { DEVICE_STATUS_CONFIG, formatCurrency, formatDate, DEVICE_TYPE_LABELS, ACCESSORY_CATEGORY_LABELS, ACCESSORY_STATUS_CONFIG } from '../utils/formatters';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Modal } from '../components/common/Modal';

interface DeviceProfileViewProps {
  device: Device;
  onBack: () => void;
  onEdit: (device: Device) => void;
  onDelete: (deviceId: string) => void;
  onSelectAccessory?: (accessory: Accessory) => void;
  onAddAccessoryForDevice?: (deviceId: string) => void;
}

function maskIdentifier(value: string): string {
  if (value.length <= 4) return '••••';
  return '•'.repeat(Math.min(value.length - 4, 11)) + ' ' + value.slice(-4);
}

interface SecureFieldProps {
  label: string;
  value: string;
  fieldName: string;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
  copyError: string | null;
}

const SecureField: React.FC<SecureFieldProps> = ({ label, value, fieldName, copiedField, onCopy, copyError }) => {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="flex items-center justify-between p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-800/60">
      <span className="text-zinc-400 font-medium text-xs">{label}</span>
      <div className="flex items-center space-x-2">
        <span className={`font-mono text-xs font-semibold ${revealed ? 'text-zinc-200' : 'text-zinc-400'}`}>
          {revealed ? value : maskIdentifier(value)}
        </span>
        <button
          onClick={() => setRevealed((r) => !r)}
          className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
          title={revealed ? 'Ocultar' : 'Revelar'}
          type="button"
        >
          {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={() => onCopy(value, fieldName)}
          className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
          title={`Copiar ${label}`}
          type="button"
        >
          {copiedField === fieldName ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      {copyError && copiedField === fieldName && (
        <span className="text-xs text-red-400 ml-1">{copyError}</span>
      )}
    </div>
  );
};

export const DeviceProfileView: React.FC<DeviceProfileViewProps> = ({
  device,
  onBack,
  onEdit,
  onDelete,
  onSelectAccessory,
  onAddAccessoryForDevice,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedPhotoModal, setSelectedPhotoModal] = useState<string | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const linkedAccessories = useLiveQuery(
    () => db.accessories.where('linkedDeviceId').equals(device.id).toArray(),
    [device.id]
  ) || [];

  const statusConfig = DEVICE_STATUS_CONFIG[device.status] || DEVICE_STATUS_CONFIG.other;

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const copyToClipboard = (text: string, fieldName: string) => {
    setCopyError(null);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldName);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopiedField(null), 2500);
    }).catch(() => {
      setCopyError('No se pudo copiar al portapapeles.');
      setCopiedField(fieldName);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => { setCopiedField(null); setCopyError(null); }, 3000);
    });
  };

  const allPhotos = [
    ...(device.mainPhoto ? [device.mainPhoto] : []),
    ...(device.additionalPhotos || []),
  ];

  const hasIdentifiers = !!(device.imei1 || device.imei2 || device.serialNumber || device.eid || device.iccid || device.upc || device.fccId || device.ic);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-xs font-semibold text-zinc-400 hover:text-white px-3 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </button>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(device)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs font-semibold transition-colors"
          >
            <Edit className="w-4 h-4" />
            <span>Editar</span>
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Eliminar</span>
          </button>
        </div>
      </div>

      {/* Tarjeta Principal */}
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Foto Principal */}
          <div className="md:col-span-5 bg-zinc-950 rounded-2xl border border-zinc-800 p-4 flex flex-col items-center justify-center min-h-[280px] relative group overflow-hidden">
            {device.mainPhoto ? (
              <>
                <img
                  src={device.mainPhoto}
                  alt={device.model}
                  className="w-full h-72 object-contain rounded-xl cursor-zoom-in"
                  onClick={() => setSelectedPhotoModal(device.mainPhoto || null)}
                />
                <button
                  onClick={() => setSelectedPhotoModal(device.mainPhoto || null)}
                  className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/70 hover:bg-black text-[10px] text-white rounded-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Ver en grande
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-zinc-600 py-12">
                <Box className="w-12 h-12 mb-2" />
                <span className="text-xs font-medium">Sin fotografia asignada</span>
              </div>
            )}
          </div>

          {/* Info y Titulo */}
          <div className="md:col-span-7 space-y-5">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
                  {device.brand} &bull; {DEVICE_TYPE_LABELS[device.type]}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-md ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                  {statusConfig.label}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {device.customName || device.model}
              </h1>
              {device.customName && <p className="text-sm text-zinc-400 mt-0.5">{device.model}</p>}
            </div>

            {/* Chips de especificaciones */}
            <div className="flex flex-wrap gap-2 pt-1">
              {device.storage && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300">
                  <HardDrive className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="font-semibold">{device.storage}</span>
                </div>
              )}
              {device.color && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-500 inline-block" />
                  <span>{device.color}</span>
                </div>
              )}
              {device.modelNumber && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 font-mono">
                  <span className="text-zinc-500">Modelo:</span>
                  <span>{device.modelNumber}</span>
                </div>
              )}
              {device.partNumber && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 font-mono">
                  <span className="text-zinc-500">Part #:</span>
                  <span>{device.partNumber}</span>
                </div>
              )}
            </div>

            {/* Identificadores con mascara y Reveal */}
            <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-400" /> Identificadores y Regulatorio
              </h4>
              <div className="space-y-2">
                {device.imei1 && (
                  <SecureField label="IMEI 1" value={device.imei1} fieldName="imei1"
                    copiedField={copiedField} onCopy={copyToClipboard} copyError={copyError} />
                )}
                {device.imei2 && (
                  <SecureField label="IMEI 2" value={device.imei2} fieldName="imei2"
                    copiedField={copiedField} onCopy={copyToClipboard} copyError={copyError} />
                )}
                {device.serialNumber && (
                  <SecureField label="Numero de Serie" value={device.serialNumber} fieldName="serial"
                    copiedField={copiedField} onCopy={copyToClipboard} copyError={copyError} />
                )}
                {device.eid && (
                  <SecureField label="EID (eSIM)" value={device.eid} fieldName="eid"
                    copiedField={copiedField} onCopy={copyToClipboard} copyError={copyError} />
                )}
                {device.iccid && (
                  <SecureField label="ICCID (SIM)" value={device.iccid} fieldName="iccid"
                    copiedField={copiedField} onCopy={copyToClipboard} copyError={copyError} />
                )}
                {device.upc && (
                  <div className="flex items-center justify-between p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-800/60 text-xs">
                    <span className="text-zinc-400 font-medium">UPC</span>
                    <span className="font-mono text-zinc-300">{device.upc}</span>
                  </div>
                )}
                {device.fccId && (
                  <div className="flex items-center justify-between p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-800/60 text-xs">
                    <span className="text-zinc-400 font-medium">FCC ID</span>
                    <span className="font-mono text-zinc-300">{device.fccId}</span>
                  </div>
                )}
                {!hasIdentifiers && (
                  <p className="text-xs text-zinc-500 py-1 italic">Sin identificadores registrados para este equipo.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Accesorios para este Dispositivo */}
        <div className="pt-4 border-t border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-blue-400" />
              <span>Accesorios para este Dispositivo ({linkedAccessories.length})</span>
            </h4>
            {onAddAccessoryForDevice && (
              <button
                onClick={() => onAddAccessoryForDevice(device.id)}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Vincular Accesorio</span>
              </button>
            )}
          </div>

          {linkedAccessories.length === 0 ? (
            <div className="p-4 bg-zinc-950/40 rounded-2xl border border-zinc-800/60 text-center text-xs text-zinc-500">
              No hay accesorios vinculados a este equipo. Puedes vincular covers, cables o cargadores.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {linkedAccessories.map((acc) => {
                const accStatus = ACCESSORY_STATUS_CONFIG[acc.status] || ACCESSORY_STATUS_CONFIG.other;
                return (
                  <div
                    key={acc.id}
                    onClick={() => onSelectAccessory && onSelectAccessory(acc)}
                    className="p-3 bg-zinc-950/80 hover:bg-zinc-850/80 border border-zinc-800 hover:border-zinc-700 rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0">
                        {acc.mainPhoto ? (
                          <img src={acc.mainPhoto} alt={acc.name} className="w-full h-full object-contain p-1" />
                        ) : acc.category === 'charger' ? (
                          <Zap className="w-5 h-5 text-zinc-500" />
                        ) : (
                          <Package className="w-5 h-5 text-zinc-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                          {acc.name}
                        </div>
                        <div className="text-[10px] text-zinc-500 truncate">
                          {acc.color ? `${acc.color} • ` : ''}
                          {ACCESSORY_CATEGORY_LABELS[acc.category]}
                          {acc.powerWatts ? ` • ${acc.powerWatts}` : ''}
                        </div>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border flex-shrink-0 ${accStatus.bg} ${accStatus.text} ${accStatus.border}`}>
                      {accStatus.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Compra y Garantia */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-800/80">
          <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/60 space-y-1">
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" /> Fecha de Compra
            </div>
            <div className="text-sm font-bold text-white">{formatDate(device.purchaseDate)}</div>
          </div>
          <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/60 space-y-1">
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Precio Registrado
            </div>
            <div className="text-sm font-bold text-white">{formatCurrency(device.purchasePrice, device.purchaseCurrency)}</div>
          </div>
          <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/60 space-y-1">
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" /> Lugar de Compra
            </div>
            <div className="text-sm font-bold text-white truncate">{device.purchaseLocation || 'No especificado'}</div>
          </div>
        </div>

        {/* Galeria de fotos */}
        {allPhotos.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-zinc-800/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-blue-400" /> Fotografias y Documentacion ({allPhotos.length})
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {allPhotos.map((photo, idx) => (
                <div key={idx} onClick={() => setSelectedPhotoModal(photo)}
                  className="aspect-square bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-600 cursor-pointer group relative">
                  <img src={photo} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-white font-medium">
                    Ampliar
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notas */}
        {device.notes && (
          <div className="space-y-2 pt-4 border-t border-zinc-800/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Notas y Observaciones</h4>
            <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/60 text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {device.notes}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Eliminar Dispositivo?"
        message={`Estas seguro de que deseas eliminar permanentemente '${device.brand} ${device.model}' de tu inventario? Esta accion no se puede deshacer.`}
        confirmText="Eliminar Definitivamente"
        isDangerous={true}
        onConfirm={() => onDelete(device.id)}
        onClose={() => setShowDeleteConfirm(false)}
      />

      <Modal isOpen={!!selectedPhotoModal} onClose={() => setSelectedPhotoModal(null)}
        title="Fotografia en Alta Resolucion" maxWidth="max-w-4xl">
        {selectedPhotoModal && (
          <div className="flex items-center justify-center p-2 bg-zinc-950 rounded-xl">
            <img src={selectedPhotoModal} alt="Visualizacion ampliada"
              className="max-h-[75vh] w-auto object-contain rounded-lg" />
          </div>
        )}
      </Modal>
    </div>
  );
};