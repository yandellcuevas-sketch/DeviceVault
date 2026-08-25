import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Edit, Trash2, Copy, Check, Calendar, DollarSign, MapPin, ShieldCheck, Package, Zap, Smartphone, ExternalLink, Eye, EyeOff, Image as ImageIcon } from 'lucide-react';
import type { Accessory } from '../types/accessory';
import type { Device } from '../types/device';
import { ACCESSORY_CATEGORY_LABELS, ACCESSORY_STATUS_CONFIG, formatCurrency, formatDate } from '../utils/formatters';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Modal } from '../components/common/Modal';

interface AccessoryProfileViewProps {
  accessory: Accessory;
  linkedDevice?: Device;
  onBack: () => void;
  onEdit: (accessory: Accessory) => void;
  onDelete: (accessoryId: string) => void;
  onViewDevice?: (device: Device) => void;
}

function maskIdentifier(value: string): string {
  if (value.length <= 4) return '••••';
  return '•'.repeat(Math.min(value.length - 4, 11)) + ' ' + value.slice(-4);
}

export const AccessoryProfileView: React.FC<AccessoryProfileViewProps> = ({
  accessory,
  linkedDevice,
  onBack,
  onEdit,
  onDelete,
  onViewDevice,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedPhotoModal, setSelectedPhotoModal] = useState<string | null>(null);
  const [revealedSerial, setRevealedSerial] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const statusConfig = ACCESSORY_STATUS_CONFIG[accessory.status] || ACCESSORY_STATUS_CONFIG.other;

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldName);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopiedField(null), 2500);
    });
  };

  const allPhotos = [
    ...(accessory.mainPhoto ? [accessory.mainPhoto] : []),
    ...(accessory.additionalPhotos || []),
  ];

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
            onClick={() => onEdit(accessory)}
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
          <div className="md:col-span-5 bg-zinc-950 rounded-2xl border border-zinc-800 p-4 flex flex-col items-center justify-center min-h-[260px] relative group overflow-hidden">
            {accessory.mainPhoto ? (
              <>
                <img
                  src={accessory.mainPhoto}
                  alt={accessory.name}
                  className="w-full h-64 object-contain rounded-xl cursor-zoom-in"
                  onClick={() => setSelectedPhotoModal(accessory.mainPhoto || null)}
                />
                <button
                  onClick={() => setSelectedPhotoModal(accessory.mainPhoto || null)}
                  className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/70 hover:bg-black text-[10px] text-white rounded-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Ver en grande
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-zinc-600 py-12">
                <Package className="w-12 h-12 mb-2" />
                <span className="text-xs font-medium">Sin fotografia asignada</span>
              </div>
            )}
          </div>

          {/* Info y Titulo */}
          <div className="md:col-span-7 space-y-5">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
                  {accessory.brand} &bull; {ACCESSORY_CATEGORY_LABELS[accessory.category]}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-md ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                >
                  {statusConfig.label}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {accessory.name}
              </h1>
            </div>

            {/* Chips de Especificaciones */}
            <div className="flex flex-wrap gap-2 pt-1">
              {accessory.powerWatts && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-300 font-bold font-mono">
                  <Zap className="w-3.5 h-3.5 text-blue-400" />
                  <span>{accessory.powerWatts}</span>
                </div>
              )}
              {accessory.color && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-500 inline-block" />
                  <span>{accessory.color}</span>
                </div>
              )}
              {accessory.modelNumber && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 font-mono">
                  <span className="text-zinc-500">Modelo:</span>
                  <span>{accessory.modelNumber}</span>
                </div>
              )}
              {accessory.partNumber && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 font-mono">
                  <span className="text-zinc-500">Part #:</span>
                  <span>{accessory.partNumber}</span>
                </div>
              )}
            </div>

            {/* Dispositivo Vinculado */}
            {linkedDevice && (
              <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center flex-shrink-0 text-blue-400">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Dispositivo Vinculado
                    </div>
                    <div className="text-xs font-bold text-white truncate">
                      {linkedDevice.brand} {linkedDevice.model}
                    </div>
                    {linkedDevice.color && (
                      <div className="text-[10px] text-zinc-400 truncate">{linkedDevice.color}</div>
                    )}
                  </div>
                </div>

                {onViewDevice && (
                  <button
                    onClick={() => onViewDevice(linkedDevice)}
                    className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 flex-shrink-0"
                  >
                    <span>Ver Dispositivo</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Identificadores y Fabricacion */}
            <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-400" /> Identificacion y Fabricacion
              </h4>
              <div className="space-y-2 text-xs">
                {accessory.serialNumber && (
                  <div className="flex items-center justify-between p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-800/60">
                    <span className="text-zinc-400 font-medium">Numero de Serie</span>
                    <div className="flex items-center space-x-2">
                      <span className={`font-mono font-semibold ${revealedSerial ? 'text-zinc-200' : 'text-zinc-400'}`}>
                        {revealedSerial ? accessory.serialNumber : maskIdentifier(accessory.serialNumber)}
                      </span>
                      <button
                        onClick={() => setRevealedSerial((r) => !r)}
                        className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
                        title={revealedSerial ? 'Ocultar' : 'Revelar'}
                        type="button"
                      >
                        {revealedSerial ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => copyToClipboard(accessory.serialNumber!, 'serial')}
                        className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
                        title="Copiar serial"
                        type="button"
                      >
                        {copiedField === 'serial' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {accessory.upc && (
                  <div className="flex items-center justify-between p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-800/60">
                    <span className="text-zinc-400 font-medium">Codigo UPC / EAN</span>
                    <span className="font-mono text-zinc-200">{accessory.upc}</span>
                  </div>
                )}

                {accessory.madeIn && (
                  <div className="flex items-center justify-between p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-800/60">
                    <span className="text-zinc-400 font-medium">Pais de Fabricacion</span>
                    <span className="text-zinc-200 font-semibold">{accessory.madeIn}</span>
                  </div>
                )}

                {accessory.manufacturingYear && (
                  <div className="flex items-center justify-between p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-800/60">
                    <span className="text-zinc-400 font-medium">Ano de Fabricacion</span>
                    <span className="font-mono text-zinc-200">{accessory.manufacturingYear}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Compra */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-800/80">
          <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/60 space-y-1">
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" /> Fecha de Compra
            </div>
            <div className="text-sm font-bold text-white">{formatDate(accessory.purchaseDate)}</div>
          </div>
          <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/60 space-y-1">
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Precio
            </div>
            <div className="text-sm font-bold text-white">{formatCurrency(accessory.purchasePrice, accessory.purchaseCurrency)}</div>
          </div>
          <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/60 space-y-1">
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" /> Lugar de Compra
            </div>
            <div className="text-sm font-bold text-white truncate">{accessory.purchaseLocation || 'No especificado'}</div>
          </div>
        </div>

        {/* Galeria de Fotos */}
        {allPhotos.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-zinc-800/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-blue-400" /> Fotografias y Empaque ({allPhotos.length})
            </h4>
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

        {/* Notas */}
        {accessory.notes && (
          <div className="space-y-2 pt-4 border-t border-zinc-800/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Notas y Observaciones</h4>
            <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/60 text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {accessory.notes}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Eliminar Accesorio?"
        message={`Estas seguro de que deseas eliminar permanentemente '${accessory.brand} ${accessory.name}' de tu inventario?`}
        confirmText="Eliminar Definitivamente"
        isDangerous={true}
        onConfirm={() => onDelete(accessory.id)}
        onClose={() => setShowDeleteConfirm(false)}
      />

      <Modal
        isOpen={!!selectedPhotoModal}
        onClose={() => setSelectedPhotoModal(null)}
        title="Fotografia en Alta Resolucion"
        maxWidth="max-w-4xl"
      >
        {selectedPhotoModal && (
          <div className="flex items-center justify-center p-2 bg-zinc-950 rounded-xl">
            <img
              src={selectedPhotoModal}
              alt="Visualizacion ampliada"
              className="max-h-[75vh] w-auto object-contain rounded-lg"
            />
          </div>
        )}
      </Modal>
    </div>
  );
};