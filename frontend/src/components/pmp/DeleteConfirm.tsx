import { AlertTriangle, Trash2, X } from 'lucide-react'
import type { ZpmRecord } from '../../types'

interface DeleteConfirmProps {
  record: ZpmRecord | null
  loading: boolean
  onConfirm: () => void
  onClose: () => void
}

export default function DeleteConfirm({
  record,
  loading,
  onConfirm,
  onClose,
}: DeleteConfirmProps) {
  if (!record) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 dialog-overlay"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-card shadow-2xl w-full max-w-md dialog-content p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Icon */}
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mx-auto mb-4">
          <AlertTriangle size={28} className="text-red-600" />
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Confirmar Exclusão
          </h3>
          <p className="text-gray-600 text-sm">
            Tem certeza que deseja excluir o registro do produto:
          </p>
          <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
            <p className="font-bold text-gray-900">{record.prod}</p>
            <p className="text-sm text-gray-600">{record.desc}</p>
            <p className="text-xs text-gray-500 mt-1">
              Mês: {record.mesref} | Filial: {record.filial}
            </p>
          </div>
          <p className="text-sm text-red-600 mt-3 font-medium">
            Esta ação não pode ser desfeita.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 btn-secondary"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 btn-danger flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Excluir
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
