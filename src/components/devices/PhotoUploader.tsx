import React, { useRef, useState } from 'react';
import { Upload, X, Plus, Search, Loader2, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { compressImage, ImageValidationError } from '../../utils/imageCompression';
import {
  searchDeviceImage,
  fetchAndValidateRemoteImage,
  type DeviceImageResult,
} from '../../utils/deviceImageProvider';

interface PhotoUploaderProps {
  mainPhoto?: string;
  additionalPhotos?: string[];
  onMainPhotoChange: (photo: string | undefined) => void;
  onAdditionalPhotosChange: (photos: string[]) => void;
  // Para la busqueda automatica de imagen
  brand?: string;
  model?: string;
  color?: string;
}

type ImageSearchState = 'idle' | 'searching' | 'results' | 'downloading' | 'error';

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  mainPhoto,
  additionalPhotos = [],
  onMainPhotoChange,
  onAdditionalPhotosChange,
  brand = '',
  model = '',
  color = '',
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Estados de busqueda automatica de imagen
  const [imageSearchState, setImageSearchState] = useState<ImageSearchState>('idle');
  const [searchResults, setSearchResults] = useState<DeviceImageResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [downloadingIdx, setDownloadingIdx] = useState<number | null>(null);

  const mainInputRef = useRef<HTMLInputElement>(null);
  const extraInputRef = useRef<HTMLInputElement>(null);

  const canSearch = brand.trim().length > 0 && model.trim().length > 0;

  const handleMainPhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setIsProcessing(true);
    try {
      const result = await compressImage(file, 1600, 1600, 0.85);
      onMainPhotoChange(result.dataUrl);
    } catch (err) {
      if (err instanceof ImageValidationError) {
        setUploadError(err.message);
      } else {
        setUploadError('Error inesperado al procesar la imagen.');
      }
    } finally {
      setIsProcessing(false);
      if (mainInputRef.current) mainInputRef.current.value = '';
    }
  };

  const handleExtraPhotosSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadError(null);
    setIsProcessing(true);
    const errors: string[] = [];
    try {
      const compressedList: string[] = [];
      for (let i = 0; i < files.length; i++) {
        try {
          const result = await compressImage(files[i], 1600, 1600, 0.82);
          compressedList.push(result.dataUrl);
        } catch (err) {
          if (err instanceof ImageValidationError) {
            errors.push(`"${files[i].name}": ${err.message}`);
          }
        }
      }
      if (compressedList.length > 0) {
        onAdditionalPhotosChange([...additionalPhotos, ...compressedList]);
      }
      if (errors.length > 0) {
        setUploadError(errors[0]);
      }
    } finally {
      setIsProcessing(false);
      if (extraInputRef.current) extraInputRef.current.value = '';
    }
  };

  const removeAdditionalPhoto = (index: number) => {
    onAdditionalPhotosChange(additionalPhotos.filter((_, idx) => idx !== index));
  };

  const handleSearchImage = async () => {
    if (!canSearch) return;
    setImageSearchState('searching');
    setSearchResults([]);
    setSearchError(null);
    try {
      const results = await searchDeviceImage({ brand: brand.trim(), model: model.trim(), color: color.trim() || undefined });
      if (results.length === 0) {
        setImageSearchState('error');
        setSearchError('No se encontro ninguna imagen para este modelo. Intenta subir una manualmente.');
      } else {
        setSearchResults(results);
        setImageSearchState('results');
      }
    } catch (err) {
      setImageSearchState('error');
      setSearchError(err instanceof Error ? err.message : 'Error al buscar imagen. Verifica tu conexion.');
    }
  };

  const handleSelectSearchResult = async (result: DeviceImageResult, idx: number) => {
    setDownloadingIdx(idx);
    try {
      const dataUrl = await fetchAndValidateRemoteImage(result.imageUrl);
      onMainPhotoChange(dataUrl);
      setImageSearchState('idle');
      setSearchResults([]);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Error al descargar la imagen seleccionada.');
    } finally {
      setDownloadingIdx(null);
    }
  };

  const confidenceLabel = (c: number) => {
    if (c >= 0.90) return { text: 'Alta', color: 'text-emerald-400' };
    if (c >= 0.70) return { text: 'Media', color: 'text-amber-400' };
    return { text: 'Baja', color: 'text-zinc-500' };
  };

  return (
    <div className="space-y-4">
      {/* Error de subida */}
      {uploadError && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Foto Principal */}
      <div>
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Foto Principal del Dispositivo
        </label>
        <input type="file" ref={mainInputRef} accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="hidden" onChange={handleMainPhotoSelect} />

        {mainPhoto ? (
          <div className="relative group w-full h-52 bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 flex items-center justify-center">
            <img src={mainPhoto} alt="Foto Principal" className="w-full h-full object-contain p-2" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
              <button type="button" onClick={() => mainInputRef.current?.click()}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white rounded-lg shadow">
                Cambiar
              </button>
              <button type="button" onClick={() => onMainPhotoChange(undefined)}
                className="p-1.5 bg-red-600/80 hover:bg-red-500 text-white rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => !isProcessing && mainInputRef.current?.click()}
            className="w-full h-36 border-2 border-dashed border-zinc-700/80 hover:border-blue-500/80 bg-zinc-900/50 hover:bg-zinc-800/30 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all group"
          >
            <div className="p-3 bg-zinc-800 group-hover:bg-blue-500/20 text-zinc-400 group-hover:text-blue-400 rounded-full mb-2 transition-colors">
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            </div>
            <p className="text-sm font-medium text-zinc-300 group-hover:text-white">
              {isProcessing ? 'Procesando imagen...' : 'Seleccionar foto principal'}
            </p>
            <p className="text-xs text-zinc-500 mt-1">JPEG, PNG, WebP (max 50 MB, se optimiza localmente)</p>
          </div>
        )}
      </div>

      {/* Busqueda automatica de imagen por modelo */}
      {canSearch && !mainPhoto && (
        <div className="border border-zinc-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/80">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Search className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-medium">Buscar imagen: <span className="text-zinc-200">{brand} {model}{color ? ` ${color}` : ''}</span></span>
            </div>
            <button
              type="button"
              onClick={handleSearchImage}
              disabled={imageSearchState === 'searching'}
              className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/40 text-blue-300 hover:text-blue-200 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {imageSearchState === 'searching'
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Buscando...</>
                : <><Search className="w-3.5 h-3.5" /> Buscar Imagen</>
              }
            </button>
          </div>

          {/* Resultados */}
          {imageSearchState === 'results' && searchResults.length > 0 && (
            <div className="p-4 bg-zinc-950 space-y-3">
              <p className="text-[11px] text-zinc-500">
                Selecciona una imagen. Se descargara y guardara localmente en tu bóveda.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-72 overflow-y-auto">
                {searchResults.map((result, idx) => {
                  const cl = confidenceLabel(result.confidence);
                  const isDownloading = downloadingIdx === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSearchResult(result, idx)}
                      disabled={downloadingIdx !== null}
                      className="group relative bg-zinc-900 border border-zinc-800 hover:border-blue-500/60 rounded-xl overflow-hidden transition-all disabled:opacity-50 text-left"
                    >
                      <div className="aspect-square bg-zinc-950 flex items-center justify-center overflow-hidden">
                        {isDownloading ? (
                          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                        ) : (
                          <img
                            src={result.thumbnailUrl || result.imageUrl}
                            alt={result.modelMatched}
                            className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                      <div className="p-2 space-y-0.5">
                        <div className={`text-[10px] font-semibold ${cl.color}`}>
                          Confianza: {cl.text} ({Math.round(result.confidence * 100)}%)
                          {result.variantMatched && <span className="ml-1 text-emerald-400">+ Color</span>}
                        </div>
                        <div className="text-[10px] text-zinc-500 truncate">{result.sourceDomain}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {searchResults.every((r) => r.confidence < 0.70) && (
                <p className="text-[11px] text-amber-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Ninguna imagen tiene alta confianza de coincidir exactamente. Revisa antes de seleccionar.
                </p>
              )}
            </div>
          )}

          {/* Error de busqueda */}
          {(imageSearchState === 'error' || searchError) && (
            <div className="p-4 bg-zinc-950 space-y-2">
              <p className="text-xs text-zinc-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                {searchError || 'No se encontro imagen exacta para este modelo.'}
              </p>
              <div className="flex gap-2 flex-wrap">
                <button type="button" onClick={handleSearchImage}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1">
                  <Search className="w-3.5 h-3.5" /> Intentar de nuevo
                </button>
                <button type="button" onClick={() => mainInputRef.current?.click()}
                  className="text-xs text-zinc-400 hover:text-zinc-200 font-medium flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" /> Subir manualmente
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fotos Adicionales */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Fotos de Cajas, Accesorios o Facturas ({additionalPhotos.length})
          </label>
          <button type="button" onClick={() => extraInputRef.current?.click()}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Agregar
          </button>
        </div>

        <input type="file" ref={extraInputRef} accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          multiple className="hidden" onChange={handleExtraPhotosSelect} />

        {additionalPhotos.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {additionalPhotos.map((photo, idx) => (
              <div key={idx} className="relative group aspect-square bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800">
                <img src={photo} alt={`Foto extra ${idx + 1}`} className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeAdditionalPhoto(idx)}
                  className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => extraInputRef.current?.click()}
              className="aspect-square border border-dashed border-zinc-700 hover:border-zinc-500 rounded-lg flex flex-col items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors bg-zinc-900/30">
              <Plus className="w-5 h-5 mb-1" />
              <span className="text-[10px]">Anadir</span>
            </button>
          </div>
        ) : (
          <div onClick={() => extraInputRef.current?.click()}
            className="p-3 border border-dashed border-zinc-800 hover:border-zinc-700 rounded-lg flex items-center justify-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors">
            <ExternalLink className="w-4 h-4" />
            <span>Opcional: fotos de la caja, seriales o recibos</span>
          </div>
        )}
      </div>
    </div>
  );
};