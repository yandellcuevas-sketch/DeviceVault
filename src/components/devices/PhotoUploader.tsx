import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Plus } from 'lucide-react';
import { compressImage } from '../../utils/imageCompression';

interface PhotoUploaderProps {
  mainPhoto?: string;
  additionalPhotos?: string[];
  onMainPhotoChange: (photo: string | undefined) => void;
  onAdditionalPhotosChange: (photos: string[]) => void;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  mainPhoto,
  additionalPhotos = [],
  onMainPhotoChange,
  onAdditionalPhotosChange,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const mainInputRef = useRef<HTMLInputElement>(null);
  const extraInputRef = useRef<HTMLInputElement>(null);

  const handleMainPhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    try {
      const compressed = await compressImage(file, 1600, 1600, 0.85);
      onMainPhotoChange(compressed);
    } catch (err) {
      console.error('Error al comprimir foto principal:', err);
    } finally {
      setIsProcessing(false);
      if (mainInputRef.current) mainInputRef.current.value = '';
    }
  };

  const handleExtraPhotosSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    try {
      const compressedList: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const compressed = await compressImage(files[i], 1600, 1600, 0.82);
        compressedList.push(compressed);
      }
      onAdditionalPhotosChange([...additionalPhotos, ...compressedList]);
    } catch (err) {
      console.error('Error al procesar fotos adicionales:', err);
    } finally {
      setIsProcessing(false);
      if (extraInputRef.current) extraInputRef.current.value = '';
    }
  };

  const removeAdditionalPhoto = (index: number) => {
    const updated = additionalPhotos.filter((_, idx) => idx !== index);
    onAdditionalPhotosChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Foto Principal */}
      <div>
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Foto Principal del Dispositivo
        </label>
        <input
          type="file"
          ref={mainInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleMainPhotoSelect}
        />

        {mainPhoto ? (
          <div className="relative group w-full h-52 bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 flex items-center justify-center">
            <img
              src={mainPhoto}
              alt="Foto Principal"
              className="w-full h-full object-contain p-2"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
              <button
                type="button"
                onClick={() => mainInputRef.current?.click()}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white rounded-lg shadow"
              >
                Cambiar
              </button>
              <button
                type="button"
                onClick={() => onMainPhotoChange(undefined)}
                className="p-1.5 bg-red-600/80 hover:bg-red-500 text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => mainInputRef.current?.click()}
            className="w-full h-36 border-2 border-dashed border-zinc-700/80 hover:border-blue-500/80 bg-zinc-900/50 hover:bg-zinc-800/30 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all group"
          >
            <div className="p-3 bg-zinc-800 group-hover:bg-blue-500/20 text-zinc-400 group-hover:text-blue-400 rounded-full mb-2 transition-colors">
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-zinc-300 group-hover:text-white">
              {isProcessing ? 'Procesando imagen...' : 'Seleccionar foto principal'}
            </p>
            <p className="text-xs text-zinc-500 mt-1">PNG, JPG, WebP (Se optimiza localmente)</p>
          </div>
        )}
      </div>

      {/* Fotos Adicionales / Documentos */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Fotos de Cajas, Accesorios o Facturas ({additionalPhotos.length})
          </label>
          <button
            type="button"
            onClick={() => extraInputRef.current?.click()}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Agregar más
          </button>
        </div>

        <input
          type="file"
          ref={extraInputRef}
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleExtraPhotosSelect}
        />

        {additionalPhotos.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {additionalPhotos.map((photo, idx) => (
              <div
                key={idx}
                className="relative group aspect-square bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800"
              >
                <img
                  src={photo}
                  alt={`Foto extra ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeAdditionalPhoto(idx)}
                  className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => extraInputRef.current?.click()}
              className="aspect-square border border-dashed border-zinc-700 hover:border-zinc-500 rounded-lg flex flex-col items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors bg-zinc-900/30"
            >
              <Plus className="w-5 h-5 mb-1" />
              <span className="text-[10px]">Añadir</span>
            </button>
          </div>
        ) : (
          <div
            onClick={() => extraInputRef.current?.click()}
            className="p-3 border border-dashed border-zinc-800 hover:border-zinc-700 rounded-lg flex items-center justify-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Opcional: Subir fotos de la caja, seriales o recibos</span>
          </div>
        )}
      </div>
    </div>
  );
};
