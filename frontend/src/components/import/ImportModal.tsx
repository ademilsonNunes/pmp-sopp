import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import {
  X, Upload, FileText, AlertTriangle, CheckCircle,
  SkipForward, RefreshCw, Zap, ChevronRight
} from 'lucide-react'
import { cn, getCurrentMesRef, getErrorMessage } from '../../lib/utils'
import { useImportCsv } from '../../hooks/usePmp'
import type { ImportLog, ImportMode } from '../../types'
import { IMPORT_SKIP, IMPORT_UPDATE, IMPORT_FORCE } from '../../types'

interface ImportModalProps {
  onClose: () => void
  defaultMesref?: string
}

type Step = 'upload' | 'settings' | 'loading' | 'result'

const MODE_OPTIONS = [
  {
    mode: IMPORT_SKIP as ImportMode,
    icon: SkipForward,
    label: 'SKIP - Seguro',
    desc: 'Não sobrescreve registros existentes. Apenas insere novos.',
    color: 'blue',
    className: 'border-blue-200 bg-blue-50 hover:border-blue-400',
    activeClass: 'border-blue-500 bg-blue-100 ring-2 ring-blue-300',
    iconColor: 'text-blue-600',
  },
  {
    mode: IMPORT_UPDATE as ImportMode,
    icon: RefreshCw,
    label: 'UPDATE - Atualizar',
    desc: 'Atualiza registros importados (I), preserva manuais (M).',
    color: 'amber',
    className: 'border-amber-200 bg-amber-50 hover:border-amber-400',
    activeClass: 'border-amber-500 bg-amber-100 ring-2 ring-amber-300',
    iconColor: 'text-amber-600',
  },
  {
    mode: IMPORT_FORCE as ImportMode,
    icon: Zap,
    label: 'FORCE - Forçar',
    desc: 'Atualiza todos os registros, independente da origem.',
    color: 'red',
    className: 'border-red-200 bg-red-50 hover:border-red-400',
    activeClass: 'border-red-500 bg-red-100 ring-2 ring-red-300',
    iconColor: 'text-red-600',
  },
]

export default function ImportModal({ onClose, defaultMesref }: ImportModalProps) {
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [mesref, setMesref] = useState(defaultMesref || getCurrentMesRef())
  const [mode, setMode] = useState<ImportMode>(IMPORT_SKIP)
  const [result, setResult] = useState<ImportLog | null>(null)

  const importMutation = useImportCsv()

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length > 0) {
      setFile(accepted[0])
      setStep('settings')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'text/plain': ['.csv', '.txt'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    onDropRejected: () => toast.error('Arquivo inválido. Use um CSV até 10MB.'),
  })

  const handleImport = async () => {
    if (!file || !mesref) return

    if (!/^\d{6}$/.test(mesref)) {
      toast.error('Mês referência inválido. Use o formato AAAAMM (ex: 202603)')
      return
    }

    setStep('loading')
    try {
      const log = await importMutation.mutateAsync({ file, mesref, mode })
      setResult(log)
      setStep('result')
      toast.success(`Importação concluída: ${log.ok} inseridos/atualizados`)
    } catch (err) {
      toast.error(getErrorMessage(err))
      setStep('settings')
    }
  }

  const handleClose = () => {
    if (step === 'loading') return
    onClose()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 dialog-overlay" onClick={handleClose} />

      <div className="relative bg-white rounded-card shadow-2xl w-full max-w-2xl dialog-content overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100" style={{ backgroundColor: '#32373c' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Upload size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold">Importar CSV</h2>
              <p className="text-gray-400 text-xs">Plano Mestre de Produção</p>
            </div>
          </div>
          {step !== 'loading' && (
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-200 transition-colors">
              <X size={22} />
            </button>
          )}
        </div>

        {/* Step indicators */}
        {step !== 'result' && (
          <div className="flex items-center px-6 py-3 bg-gray-50 border-b border-gray-100">
            {['upload', 'settings', 'loading'].map((s, i) => {
              const labels = ['Arquivo', 'Configurações', 'Importando']
              const stepOrder = ['upload', 'settings', 'loading']
              const currentIdx = stepOrder.indexOf(step)
              const isActive = i === currentIdx
              const isDone = i < currentIdx
              return (
                <div key={s} className="flex items-center">
                  <div className={cn(
                    'flex items-center gap-2',
                    isActive ? 'text-primary font-semibold' : isDone ? 'text-green-600' : 'text-gray-400'
                  )}>
                    <div className={cn(
                      'w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold',
                      isActive ? 'bg-primary text-white' : isDone ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                    )}>
                      {isDone ? '✓' : i + 1}
                    </div>
                    <span className="text-sm hidden sm:block">{labels[i]}</span>
                  </div>
                  {i < 2 && <ChevronRight size={14} className="text-gray-300 mx-2" />}
                </div>
              )
            })}
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Step: Upload */}
          {step === 'upload' && (
            <div>
              <div
                {...getRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200',
                  isDragActive
                    ? 'border-primary bg-primary/5 scale-[1.01]'
                    : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                )}
              >
                <input {...getInputProps()} />
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Upload size={28} className={isDragActive ? 'text-primary' : 'text-gray-400'} />
                </div>
                <p className="font-bold text-gray-700 mb-1">
                  {isDragActive ? 'Solte o arquivo aqui!' : 'Arraste o CSV ou clique para selecionar'}
                </p>
                <p className="text-sm text-gray-400">
                  Formato: CSV com separador ponto e vírgula (;) · Máx. 10MB
                </p>
                <p className="text-xs text-gray-300 mt-2">
                  Colunas: FILIAL;LINHA;PRODUTO;DESCRICAO;D01...D31;TOTPG;PMPMES
                </p>
              </div>
            </div>
          )}

          {/* Step: Settings */}
          {step === 'settings' && (
            <div className="space-y-5">
              {/* File info */}
              {file && (
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <FileText size={20} className="text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-green-800 text-sm truncate">{file.name}</p>
                    <p className="text-xs text-green-600">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    onClick={() => { setFile(null); setStep('upload') }}
                    className="text-green-500 hover:text-green-700 transition-colors flex-shrink-0"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}

              {/* Mes ref */}
              <div>
                <label className="label">Mês Referência <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={mesref}
                  onChange={(e) => setMesref(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="202603"
                  maxLength={6}
                  className="input-field w-48"
                />
                <p className="text-xs text-gray-400 mt-1">Formato: AAAAMM (ex: 202603 para Março/2026)</p>
              </div>

              {/* Mode */}
              <div>
                <label className="label">Modo de Importação <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                  {MODE_OPTIONS.map(({ mode: m, icon: Icon, label, desc, className, activeClass, iconColor }) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={cn(
                        'p-4 rounded-xl border-2 text-left transition-all duration-200',
                        mode === m ? activeClass : className
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Icon size={18} className={iconColor} />
                        <span className="font-bold text-sm text-gray-800">{label}</span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Force warning */}
              {mode === IMPORT_FORCE && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-700">Atenção - Modo FORCE</p>
                    <p className="text-xs text-red-600 mt-0.5">
                      Este modo sobrescreverá <strong>todos</strong> os registros existentes, incluindo os inseridos manualmente.
                      Esta ação não pode ser desfeita.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step: Loading */}
          {step === 'loading' && (
            <div className="text-center py-10">
              <div className="w-20 h-20 rounded-full border-4 border-gray-100 border-t-primary animate-spin mx-auto mb-6" />
              <p className="font-bold text-gray-700 text-lg mb-2">Processando importação...</p>
              <p className="text-gray-400 text-sm">Aguarde, isso pode levar alguns segundos</p>
            </div>
          )}

          {/* Step: Result */}
          {step === 'result' && result && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle size={32} className="text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Importação Concluída!</h3>
                <p className="text-gray-500 text-sm">{result.filename} · {result.mesref}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-4 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-3xl font-bold text-green-600">{result.ok}</p>
                  <p className="text-xs font-semibold text-green-700 mt-1 uppercase tracking-wide">Inseridos/Atualizados</p>
                </div>
                <div className="text-center p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-3xl font-bold text-amber-600">{result.skip}</p>
                  <p className="text-xs font-semibold text-amber-700 mt-1 uppercase tracking-wide">Ignorados</p>
                </div>
                <div className="text-center p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-3xl font-bold text-red-600">{result.error}</p>
                  <p className="text-xs font-semibold text-red-700 mt-1 uppercase tracking-wide">Erros</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 bg-gray-50 rounded-lg px-4 py-3">
                <span>Total processado: <strong className="text-gray-700">{result.total} linhas</strong></span>
                <span>Log ID: <strong className="text-gray-700">#{result.id}</strong></span>
              </div>

              {/* Error details */}
              {result.details && result.details.filter((d) => d.status === 'error').length > 0 && (
                <div className="border border-red-200 rounded-xl overflow-hidden">
                  <div className="bg-red-50 px-4 py-2 border-b border-red-200">
                    <p className="text-xs font-bold text-red-700 uppercase tracking-wide">
                      Erros encontrados ({result.details.filter((d) => d.status === 'error').length})
                    </p>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {result.details
                      .filter((d) => d.status === 'error')
                      .map((d) => (
                        <div key={d.row} className="flex items-center gap-2 px-4 py-2 text-xs border-b border-red-50 last:border-0">
                          <span className="text-red-400 font-mono">Linha {d.row}</span>
                          <span className="font-semibold text-gray-700">{d.prod}</span>
                          <span className="text-gray-500">{d.message}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          {step === 'upload' && (
            <button onClick={handleClose} className="btn-secondary">Cancelar</button>
          )}
          {step === 'settings' && (
            <>
              <button onClick={() => setStep('upload')} className="btn-secondary">Voltar</button>
              <button
                onClick={handleImport}
                disabled={!file || !mesref}
                className="btn-primary flex items-center gap-2"
              >
                <Upload size={16} />
                Importar
              </button>
            </>
          )}
          {step === 'result' && (
            <button onClick={onClose} className="btn-primary">
              Concluir
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
