import React, { useState, useRef } from 'react';
import { Database, Download, Upload, CheckCircle2, AlertTriangle, ShieldCheck, FileJson, Info } from 'lucide-react';
import { exportDatabaseToJSON, importDatabaseFromJSON, type ImportResult } from '../utils/backup';

interface BackupViewProps {
  deviceCount: number;
  accessoryCount?: number;
  onRefresh: () => void;
}

export const BackupView: React.FC<BackupViewProps> = ({ deviceCount, accessoryCount = 0, onRefresh }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setExportError(null);
    try {
      await exportDatabaseToJSON();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al generar el archivo de respaldo.';
      setExportError(msg);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);
    try {
      const res = await importDatabaseFromJSON(file, importMode);
      setImportResult(res);
      if (res.success) {
        onRefresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado al procesar el archivo.';
      setImportResult({ success: false, count: 0, error: msg });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <span className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
            <Database className="w-5 h-5" />
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">Centro de Respaldo y Restauracion</h2>
        </div>
        <p className="text-xs text-zinc-400">
          Exporta todos tus dispositivos, accesorios y fotos a un archivo JSON local o restaura una copia anterior.
        </p>
      </div>

      {/* Resultado de importacion */}
      {importResult && (
        <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
          importResult.success
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-red-500/10 border-red-500/30 text-red-300'
        }`}>
          {importResult.success
            ? <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
            : <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />}
          <div className="space-y-1 flex-1">
            <div className="font-bold text-sm">
              {importResult.success ? 'RESTAURACION COMPLETADA' : 'ERROR AL RESTAURAR'}
            </div>
            <p>
              {importResult.success
                ? `Se importaron ${importResult.count} dispositivos y ${importResult.accessoryCount || 0} accesorios correctamente.`
                : importResult.error}
            </p>
            {importResult.warnings && importResult.warnings.length > 0 && (
              <div className="mt-2 space-y-1">
                {importResult.warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-amber-300/80">
                    <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error de exportacion */}
      {exportError && (
        <div className="p-4 rounded-2xl border bg-red-500/10 border-red-500/30 text-red-300 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <div className="font-bold">Error al exportar</div>
            <p>{exportError}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Exportar */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Exportar Respaldo</h3>
                <p className="text-xs text-zinc-400">Descarga un archivo .json completo</p>
              </div>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              El archivo contiene los metadatos, identificadores, fechas, precios y todas las fotografias de tus{' '}
              <span className="text-white font-semibold">{deviceCount} dispositivos</span> y{' '}
              <span className="text-white font-semibold">{accessoryCount} accesorios</span>.
            </p>
          </div>
          <button onClick={handleExport} disabled={isExporting}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer">
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Generando archivo...' : 'Descargar Backup (.json)'}</span>
          </button>
        </div>

        {/* Importar */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Restaurar Respaldo</h3>
                <p className="text-xs text-zinc-400">Importa un archivo .json previo</p>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <label className="block text-zinc-400 font-medium">Modo de importacion:</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setImportMode('replace')}
                  className={`p-2 rounded-lg border text-center font-medium transition-all ${
                    importMode === 'replace' ? 'bg-zinc-800 border-blue-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                  }`}>
                  Reemplazar todo
                </button>
                <button type="button" onClick={() => setImportMode('merge')}
                  className={`p-2 rounded-lg border text-center font-medium transition-all ${
                    importMode === 'merge' ? 'bg-zinc-800 border-blue-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                  }`}>
                  Combinar / Unir
                </button>
              </div>
              {importMode === 'replace' && (
                <p className="text-[11px] text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Reemplazar eliminara todos los dispositivos y accesorios actuales y los sustituira con el respaldo. Transaccion 100% atomica con rollback seguro.
                </p>
              )}
            </div>
          </div>

          <input type="file" ref={fileInputRef} accept=".json,application/json"
            className="hidden" onChange={handleFileSelect} />

          <button onClick={() => fileInputRef.current?.click()} disabled={isImporting}
            className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50">
            <FileJson className="w-4 h-4 text-blue-400" />
            <span>{isImporting ? 'Procesando archivo...' : 'Seleccionar Archivo JSON'}</span>
          </button>
        </div>
      </div>

      {/* Nota de Privacidad */}
      <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center gap-3 text-xs text-zinc-400">
        <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
        <p>
          Tus respaldos son archivos JSON legibles que puedes guardar en una memoria USB o disco externo. Contienen todas tus fotos y datos sin cifrados propietarios bloqueados.
        </p>
      </div>
    </div>
  );
};