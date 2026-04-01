import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Plus, Upload, List, Search, X, Filter,
  Calendar, BarChart3, TrendingUp, RefreshCw,
  LayoutList, LayoutGrid,
} from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import PmpTable from '../components/pmp/PmpTable'
import PmpGrid from '../components/pmp/PmpGrid'
import PmpForm from '../components/pmp/PmpForm'
import DeleteConfirm from '../components/pmp/DeleteConfirm'
import ImportModal from '../components/import/ImportModal'
import LogViewer from '../components/import/LogViewer'
import {
  usePmpList,
  useCreatePmp,
  useUpdatePmp,
  useDeletePmp,
} from '../hooks/usePmp'
import { formatMesRef, getCurrentMesRef, getErrorMessage, formatNumber } from '../lib/utils'
import type { ZpmRecord, ZpmFilter, ZpmCreate, ZpmUpdate } from '../types'
import { useAuthStore } from '../hooks/useAuth'
import { canEditPmp } from '../utils/permissions'

type ModalState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'view'; record: ZpmRecord }
  | { type: 'edit'; record: ZpmRecord }
  | { type: 'delete'; record: ZpmRecord }
  | { type: 'import' }
  | { type: 'logs' }

export default function DashboardPage() {
  const { user } = useAuthStore()
  const canEdit = canEditPmp(user?.role)
  const [modal, setModal] = useState<ModalState>({ type: 'none' })
  const [filters, setFilters] = useState<ZpmFilter>({})
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const PAGE_SIZE = 20

  const currentMesRef = getCurrentMesRef()

  // Build active filters
  const activeFilters: ZpmFilter = {
    ...filters,
    search: search || undefined,
  }

  // In grid mode: load up to 500 at once (page 1); in list mode: paginate normally
  const effectivePage     = viewMode === 'grid' ? 1 : page
  const effectivePageSize = viewMode === 'grid' ? 500 : PAGE_SIZE

  const { data, isLoading, refetch } = usePmpList(activeFilters, effectivePage, effectivePageSize)
  const createMutation = useCreatePmp()
  const updateMutation = useUpdatePmp()
  const deleteMutation = useDeletePmp()

  // Also fetch current month stats
  const { data: currentMonthData } = usePmpList({ mesref: currentMesRef }, 1, 1)

  const handleFilterChange = useCallback((key: keyof ZpmFilter, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }))
    setPage(1)
  }, [])

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    setPage(1)
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
    setSearch('')
    setPage(1)
  }, [])

  const hasFilters = !!(filters.filial || filters.mesref || search)

  const handleCreate = async (data: ZpmCreate) => {
    try {
      await createMutation.mutateAsync(data)
      toast.success('Registro criado com sucesso!')
      setModal({ type: 'none' })
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const handleUpdate = async (data: ZpmUpdate) => {
    if (modal.type !== 'edit') return
    try {
      await updateMutation.mutateAsync({ id: modal.record.id, data })
      toast.success('Registro atualizado com sucesso!')
      setModal({ type: 'none' })
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const handleDelete = async () => {
    if (modal.type !== 'delete') return
    try {
      await deleteMutation.mutateAsync(modal.record.id)
      toast.success('Registro excluído com sucesso!')
      setModal({ type: 'none' })
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="pt-16">
        {/* Header area */}
        <div className="px-4 sm:px-6 py-6" style={{ background: 'linear-gradient(135deg, #32373c 0%, #1a1d20 100%)' }}>
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                  Plano Mestre de Produção
                </h1>
                <p className="text-gray-400 text-sm">
                  Gerencie os planos de produção por produto e período
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => refetch()}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Atualizar"
                >
                  <RefreshCw size={18} />
                </button>
              </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <BarChart3 size={20} className="text-primary-light" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">Total de Registros</p>
                    <p className="text-white text-2xl font-bold">
                      {isLoading ? (
                        <span className="skeleton inline-block w-16 h-7 rounded" />
                      ) : (
                        formatNumber(data?.total || 0)
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Calendar size={20} className="text-green-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">
                      {formatMesRef(currentMesRef)}
                    </p>
                    <p className="text-white text-2xl font-bold">
                      {formatNumber(currentMonthData?.total || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hidden sm:block">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <TrendingUp size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">Página atual</p>
                    <p className="text-white text-2xl font-bold">
                      {data ? `${page}/${data.total_pages}` : '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content — full-width in grid mode for max column visibility */}
        <div className={`${viewMode === 'grid' ? 'w-full' : 'max-w-7xl mx-auto'} px-4 sm:px-6 py-6`}>
          {/* Filter & Action bar */}
          <div className="card p-4 mb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar produto, descrição ou linha..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="input-field pl-9 pr-4"
                />
                {search && (
                  <button
                    onClick={() => handleSearchChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filial filter */}
              <div className="w-full sm:w-32">
                <input
                  type="text"
                  placeholder="Filial"
                  value={filters.filial || ''}
                  onChange={(e) => handleFilterChange('filial', e.target.value.toUpperCase().slice(0, 2))}
                  maxLength={2}
                  className="input-field text-center"
                />
              </div>

              {/* Mesref filter */}
              <div className="w-full sm:w-40">
                <input
                  type="text"
                  placeholder="Mês (AAAAMM)"
                  value={filters.mesref || ''}
                  onChange={(e) => handleFilterChange('mesref', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="input-field"
                />
              </div>

              {/* Clear filters */}
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap"
                >
                  <Filter size={14} />
                  Limpar
                </button>
              )}
            </div>

            {/* Active filter tags */}
            {hasFilters && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="text-xs text-gray-500 font-medium">Filtros ativos:</span>
                {search && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                    Busca: "{search}"
                    <button onClick={() => handleSearchChange('')}><X size={10} /></button>
                  </span>
                )}
                {filters.filial && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                    Filial: {filters.filial}
                    <button onClick={() => handleFilterChange('filial', '')}><X size={10} /></button>
                  </span>
                )}
                {filters.mesref && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                    Mês: {formatMesRef(filters.mesref)}
                    <button onClick={() => handleFilterChange('mesref', '')}><X size={10} /></button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* View mode toggle */}
              <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5 gap-0.5">
                <button
                  onClick={() => setViewMode('list')}
                  title="Visualização em lista"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <LayoutList size={15} />
                  <span className="hidden sm:inline">Lista</span>
                </button>
                <button
                  onClick={() => { setViewMode('grid'); setPage(1) }}
                  title="Visualização em grade (D01–D31)"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <LayoutGrid size={15} />
                  <span className="hidden sm:inline">Grade</span>
                </button>
              </div>

              <div className="text-sm text-gray-500">
                {!isLoading && data && (
                  <span>
                    {data.total > 0
                      ? viewMode === 'grid'
                        ? `${Math.min(data.items.length, data.total)} de ${data.total} registros`
                        : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, data.total)} de ${data.total}`
                      : 'Nenhum registro encontrado'
                    }
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {canEdit && (                
                <button
                  onClick={() => setModal({ type: 'logs' })}
                  className="btn-secondary flex items-center gap-2 py-2 text-sm"
                >
                  <List size={15} />
                  <span className="hidden sm:inline">Ver Logs</span>
                </button>
              )}

              {canEdit && (
                <button
                  onClick={() => setModal({ type: 'import' })}
                  className="btn-secondary flex items-center gap-2 py-2 text-sm"
                >
                  <Upload size={15} />
                  <span className="hidden sm:inline">Importar CSV</span>
                </button>
              )}

              {canEdit && (
                <button
                  onClick={() => setModal({ type: 'create' })}
                  className="btn-primary flex items-center gap-2 py-2 text-sm"
                >
                  <Plus size={15} />
                  <span className="hidden sm:inline">Incluir</span>
                </button>
              )}
            </div>
          </div>

          {/* Table / Grid */}
          <div className="card overflow-hidden">
            {viewMode === 'grid' ? (
              <PmpGrid
                data={data?.items || []}
                loading={isLoading}
                total={data?.total || 0}
                mesref={filters.mesref || currentMesRef}
                canEdit={canEdit}
                onEdit={(record) => { if (!canEdit) return; setModal({ type: 'edit', record }) }}
              />
            ) : (
            <PmpTable
              data={data?.items || []}
              loading={isLoading}
              canEdit={canEdit}
              onView={(record) => setModal({ type: 'view', record })}
              onEdit={(record) => { if (!canEdit) return; setModal({ type: 'edit', record })}}
              onDelete={(record) =>  { if (!canEdit) return; setModal({ type: 'delete', record })}}
            />
            )}

            {/* Pagination — only in list mode */}
            {viewMode === 'list' && data && data.total_pages > 1 && (
              <div className="flex items-center justify-between px-4 py-4 border-t border-gray-100 bg-gray-50">
                <p className="text-sm text-gray-500">
                  Página {page} de {data.total_pages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-40"
                  >
                    «
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-40"
                  >
                    Anterior
                  </button>

                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, data.total_pages) }, (_, i) => {
                      let pageNum: number
                      if (data.total_pages <= 5) {
                        pageNum = i + 1
                      } else if (page <= 3) {
                        pageNum = i + 1
                      } else if (page >= data.total_pages - 2) {
                        pageNum = data.total_pages - 4 + i
                      } else {
                        pageNum = page - 2 + i
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`w-8 h-8 text-sm font-medium rounded-lg transition-colors ${
                            pageNum === page
                              ? 'bg-primary text-white'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>

                  <button
                    onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                    disabled={page >= data.total_pages}
                    className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-40"
                  >
                    Próxima
                  </button>
                  <button
                    onClick={() => setPage(data.total_pages)}
                    disabled={page === data.total_pages}
                    className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-40"
                  >
                    »
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      {canEdit && modal.type === 'create' && (
        <PmpForm
          mode="create"
          loading={createMutation.isPending}
          defaultMesref={filters.mesref || currentMesRef}
          defaultFilial={filters.filial || ''}
          onSubmit={(data) => handleCreate(data as ZpmCreate)}
          onClose={() => setModal({ type: 'none' })}
        />
      )}

      {modal.type === 'view' && (
        <PmpForm
          mode="view"
          record={modal.record}
          onSubmit={() => {}}
          onClose={() => setModal({ type: 'none' })}
        />
      )}

      {canEdit && modal.type === 'edit' && (
        <PmpForm
          mode="edit"
          record={modal.record}
          loading={updateMutation.isPending}
          onSubmit={(data) => handleUpdate(data as ZpmUpdate)}
          onClose={() => setModal({ type: 'none' })}
        />
      )}

      {canEdit && modal.type === 'delete' && (
        <DeleteConfirm
          record={modal.record}
          loading={deleteMutation.isPending}
          onConfirm={handleDelete}
          onClose={() => setModal({ type: 'none' })}
        />
      )}

      {canEdit && modal.type === 'import' && (
        <ImportModal
          defaultMesref={filters.mesref || currentMesRef}
          onClose={() => setModal({ type: 'none' })}
        />
      )}

      {canEdit && modal.type === 'logs' && (
        <LogViewer onClose={() => setModal({ type: 'none' })} />
      )}
    </div>
  )
}
