import { useState } from 'react'
import { X, ChevronDown, ChevronUp, FileText, Clock, User, Hash } from 'lucide-react'
import { cn, formatDateTime, formatMesRef } from '../../lib/utils'
import { useImportLogs, useImportLog } from '../../hooks/usePmp'
import type { ImportLog, ImportDetailItem } from '../../types'
import { IMPORT_SKIP, IMPORT_UPDATE, IMPORT_FORCE } from '../../types'

interface LogViewerProps {
  onClose: () => void
}

const MODE_LABELS: Record<number, { label: string; color: string }> = {
  [IMPORT_SKIP]: { label: 'SKIP', color: 'badge-blue' },
  [IMPORT_UPDATE]: { label: 'UPDATE', color: 'badge-yellow' },
  [IMPORT_FORCE]: { label: 'FORCE', color: 'badge-red' },
}

function StatusBadge({ status }: { status: ImportDetailItem['status'] }) {
  const colors: Record<string, string> = {
    ok: 'badge-green',
    skip: 'badge-yellow',
    error: 'badge-red',
  }
  const labels: Record<string, string> = {
    ok: 'OK',
    skip: 'Ignorado',
    error: 'Erro',
  }
  return <span className={cn('badge', colors[status])}>{labels[status]}</span>
}

function LogDetail({ logId }: { logId: number }) {
  const { data, isLoading } = useImportLog(logId)

  if (isLoading) {
    return (
      <div className="py-6 text-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-primary rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  if (!data?.details || data.details.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-4">Sem detalhes disponíveis</p>
  }

  return (
    <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto max-h-64">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-3 py-2 text-left font-semibold text-gray-500">Linha</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-500">Status</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-500">Produto</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-500">Observação</th>
            </tr>
          </thead>
          <tbody>
            {data.details.map((d, i) => (
              <tr
                key={i}
                className={cn(
                  'border-b border-gray-100 last:border-0',
                  d.status === 'error' && 'bg-red-50',
                  d.status === 'skip' && 'bg-amber-50',
                )}
              >
                <td className="px-3 py-2 font-mono text-gray-500">{d.row}</td>
                <td className="px-3 py-2"><StatusBadge status={d.status} /></td>
                <td className="px-3 py-2 font-semibold text-gray-800">{d.prod}</td>
                <td className="px-3 py-2 text-gray-600">{d.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LogItem({ log }: { log: ImportLog }) {
  const [expanded, setExpanded] = useState(false)
  const modeInfo = MODE_LABELS[log.mode] || { label: String(log.mode), color: 'badge-gray' }

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="font-bold text-gray-900 text-sm">{log.filename}</span>
              <span className={cn('badge', modeInfo.color)}>{modeInfo.label}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {formatDateTime(log.created_at)}
              </span>
              <span className="flex items-center gap-1">
                <FileText size={12} />
                {formatMesRef(log.mesref)} ({log.mesref})
              </span>
              <span className="flex items-center gap-1">
                <User size={12} />
                {log.username}
              </span>
              <span className="flex items-center gap-1">
                <Hash size={12} />
                #{log.id}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded font-bold">{log.ok}</span>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded font-bold">{log.skip}</span>
              <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded font-bold">{log.error}</span>
            </div>
            {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </div>
        </div>

        {/* Summary bar */}
        {log.total > 0 && (
          <div className="mt-3 flex rounded-full overflow-hidden h-1.5 gap-0.5">
            {log.ok > 0 && (
              <div
                className="bg-green-400 h-full rounded-full"
                style={{ width: `${(log.ok / log.total) * 100}%` }}
              />
            )}
            {log.skip > 0 && (
              <div
                className="bg-amber-400 h-full rounded-full"
                style={{ width: `${(log.skip / log.total) * 100}%` }}
              />
            )}
            {log.error > 0 && (
              <div
                className="bg-red-400 h-full rounded-full"
                style={{ width: `${(log.error / log.total) * 100}%` }}
              />
            )}
          </div>
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-4 text-xs text-gray-500 py-3">
            <span>Total: <strong className="text-gray-700">{log.total}</strong></span>
            <span className="text-green-600">Inseridos: <strong>{log.ok}</strong></span>
            <span className="text-amber-600">Ignorados: <strong>{log.skip}</strong></span>
            <span className="text-red-600">Erros: <strong>{log.error}</strong></span>
          </div>
          <LogDetail logId={log.id} />
        </div>
      )}
    </div>
  )
}

export default function LogViewer({ onClose }: LogViewerProps) {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useImportLogs(page, 10)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end">
      <div className="absolute inset-0 bg-black/40 dialog-overlay" onClick={onClose} />

      <div className="relative bg-white w-full sm:w-[600px] h-full sm:h-auto sm:max-h-[85vh] shadow-2xl flex flex-col sheet-content sm:rounded-l-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0" style={{ backgroundColor: '#32373c' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <FileText size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold">Logs de Importação</h2>
              <p className="text-gray-400 text-xs">Histórico de importações CSV</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 transition-colors">
            <X size={22} />
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 flex-shrink-0">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-400 inline-block" /> Inseridos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /> Ignorados
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-400 inline-block" /> Erros
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton h-20 rounded-xl" />
              ))}
            </div>
          ) : !data?.items.length ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <FileText size={28} className="text-gray-300" />
              </div>
              <p className="text-gray-500 font-semibold">Nenhuma importação registrada</p>
              <p className="text-gray-400 text-sm mt-1">Importe um CSV para ver o histórico aqui</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.items.map((log) => (
                <LogItem key={log.id} log={log} />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 flex-shrink-0">
            <p className="text-sm text-gray-500">
              {data.total} importações
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-600 font-medium">
                {page} / {data.total_pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                disabled={page >= data.total_pages}
                className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-40"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
