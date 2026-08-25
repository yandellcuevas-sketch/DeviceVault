import React, { useState } from 'react';
import { ArrowLeft, Edit, Trash2, Copy, Check, Calendar, DollarSign, MapPin, ShieldCheck, Box, HardDrive, Cpu, Image as ImageIcon } from 'lucide-react';
import type { Device } from '../types/device';
import { DEVICE_STATUS_CONFIG, formatCurrency, formatDate, DEVICE_TYPE_LABELS } from '../utils/formatters';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Modal } from '../components/common/Modal';

interface DeviceProfileViewProps {
  device: Device;
  onBack: () => void;
  onEdit: (device: Device) => void;
  onDelete: (deviceId: string) => void;
}

export const DeviceProfileView: React.FC<DeviceProfileViewProps> = ({
  device,
  onBack,
  onEdit,
  onDelete,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedPhotoModal, setSelectedPhotoModal] = useState<string | null>(null);

  const statusConfig = DEVICE_STATUS_CONFIG[device.status] || DEVICE_STATUS_CONFIG.other;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const allPhotos = [
    ...(device.mainPhoto ? [device.mainPhoto] : []),
    ...(device.additionalPhotos || []),
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Botón Volver y Acciones de Cabecera */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-xs font-semibold text-zinc-400 hover:text-white px-3 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a la Galería</span>
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

      {/* Tarjeta Principal del Dispositivo */}
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Foto Principal Destacada */}
          <div className="md:col-span-5 bg-zinc-950 rounded-2xl border border-zinc-800 p-4 flex flex-col items-center justify-center min-h-[300px] relative group overflow-hidden">
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
              <div className="flex flex-col items-center justify-center text-zinc-600 py-16">
                <Box className="w-12 h-12 mb-2" />
                <span className="text-xs font-medium">Sin fotografía asignada</span>
              </div>
            )}
          </div>

          {/* Información y Títulos */}
          <div className="md:col-span-7 space-y-5">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
                  {device.brand} &bull; {DEVICE_TYPE_LABELS[device.type]}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-md ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                >
                  {statusConfig.label}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {device.customName || device.model}
              </h1>
              {device.customName && (
                <p className="text-sm text-zinc-400 mt-0.5">{device.model}</p>
              )}
            </div>

            {/* Chips de Especificaciones Rápidas */}
            <div className="flex flex-wrap gap-2 pt-2">
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
            </div>

            {/* Bloque de Identificadores Sensibles con Copia Rápida */}
            <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-400" /> Identificadores Únicos
              </h4>

              <div className="space-y-2 text-xs">
                {device.imei1 && (
                  <div className="flex items-center justify-between p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-850">
                    <span className="text-zinc-400 font-medium">IMEI 1:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-zinc-200 font-semibold">{device.imei1}</span>
                      <button
                        onClick={() => copyToClipboard(device.imei1 || '', 'imei1')}
                        className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
                        title="Copiar IMEI 1"
                      >
                        {copiedField === 'imei1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {device.imei2 && (
                  <div className="flex items-center justify-between p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-850">
                    <span className="text-zinc-400 font-medium">IMEI 2:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-zinc-200 font-semibold">{device.imei2}</span>
                      <button
                        onClick={() => copyToClipboard(device.imei2 || '', 'imei2')}
                        className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
                        title="Copiar IMEI 2"
                      >
                        {copiedField === 'imei2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {device.serialNumber && (
                  <div className="flex items-center justify-between p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-850">
                    <span className="text-zinc-400 font-medium">Número de Serie:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-zinc-200 font-semibold">{device.serialNumber}</span>
                      <button
                        onClick={() => copyToClipboard(device.serialNumber || '', 'serial')}
                        className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
                        title="Copiar Serial"
                      >
                        {copiedField === 'serial' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {device.eid && (
                  <div className="flex items-center justify-between p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-850">
                    <span className="text-zinc-400 font-medium">EID:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-zinc-200 font-semibold">{device.eid}</span>
                      <button
                        onClick={() => copyToClipboard(device.eid || '', 'eid')}
                        className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
                        title="Copiar EID"
                      >
                        {copiedField === 'eid' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {!device.imei1 && !device.serialNumber && !device.eid && (
                  <p className="text-xs text-zinc-500 py-1 italic">Sin identificadores registrados para este equipo.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sección de Compra y Garantía */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-800/80">
          <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/60 space-y-1">
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" /> Fecha de Compra
            </div>
            <div className="text-sm font-bold text-white">
              {formatDate(device.purchaseDate)}
            </div>
          </div>

          <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/60 space-y-1">
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Precio Registrado
            </div>
            <div className="text-sm font-bold text-white">
              {formatCurrency(device.purchasePrice, device.purchaseCurrency)}
            </div>
          </div>

          <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/60 space-y-1">
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" /> Lugar de Compra
            </div>
            <div className="text-sm font-bold text-white truncate">
              {device.purchaseLocation || 'No especificado'}
            </div>
          </div>
        </div>

        {/* Galería de Fotografías y Documentos de Caja / Factura */}
        {allPhotos.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-zinc-800/80">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-400" /> Fotografías y Documentación ({allPhotos.length})
              </h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {allPhotos.map((photo, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedPhotoModal(photo)}
                  className="aspect-square bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-600 cursor-pointer group relative"
                >
                  <img src={photo} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-white font-medium">
                    Ampliar
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notas Adicionales */}
        {device.notes && (
          <div className="space-y-2 pt-4 border-t border-zinc-800/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Notas y Observaciones
            </h4>
            <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/60 text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {device.notes}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Confirmación de Eliminación */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="¿Eliminar Dispositivo?"
        message={`¿Estás seguro de que deseas eliminar permanentemente '${device.brand} ${device.model}' de tu inventario? Esta acción no se puede deshacer.`}
        confirmText="Eliminar Definitivamente"
        isDangerous={true}
        onConfirm={() => onDelete(device.id)}
        onClose={() => setShowDeleteConfirm(false)}
      />

      {/* Modal de Imagen Ampliada */}
      <Modal
        isOpen={!!selectedPhotoModal}
        onClose={() => setSelectedPhotoModal(null)}
        title="Fotografía en Alta Resolución"
        maxWidth="max-w-4xl"
      >
        {selectedPhotoModal && (
          <div className="flex items-center justify-center p-2 bg-zinc-950 rounded-xl">
            <img
              src={selectedPhotoModal}
              alt="Visualización ampliada"
              className="max-h-[75vh] w-auto object-contain rounded-lg"
            />
          </div>
        )}
      </Modal>
    </div>
  );
};
