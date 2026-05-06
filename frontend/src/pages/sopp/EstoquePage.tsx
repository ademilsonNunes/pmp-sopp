import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Search, Download, Warehouse, Package, XCircle, AlertTriangle, Layers } from 'lucide-react'
import { useEstoque } from '../../hooks/useSopp'
import { exportEstoque } from '../../lib/sopp'
import { formatNumber } from '../../lib/utils'
import type { EstoqueParams } from '../../lib/sopp'
import type { EstoqueFilial, EstoqueKpis } from '../../types'

const LINHAS = [
  'Agua Sanitaria', 'Alvejante', 'Amaciante', 'Cloro',
  'Desinfetante', 'Lava Loucas', 'Lava Roupas', 'Limpador', 'Removedor',
]

const FILIAIS: { filial: string; label: string; color: string }[] = [
  { filial: '01', label: 'Matriz (01)',  color: '#2563eb' },
  { filial: '06', label: 'Atibaia (06)', color: '#9333ea' },
]

const N = (v: number) => formatNumber(v, 0)

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon, label, value, sub, color, small,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  color: string
  small?: boolean
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-start gap-3">
      <div className="rounded-lg p-2 flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide leading-tight">
          {label}
        </p>
        <p
          className={`font-bold text-gray-900 mt-0.5 leading-tight ${small ? 'text-xl' : 'text-2xl'}`}
        >
          {value}
        </p>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Card de filial ────────────────────────────────────────────────────────────

function FilialCard({
  filial,
  selected,
  onClick,
}: {
  filial: EstoqueFilial
  selected: boolean
  onClick: () => void
}) {
  const cfg = FILIAIS.find(f => f.filial === filial.filial)
  const color = cfg?.color ?? '#6b7280'
  const pctDisp = filial.atu > 0 ? (filial.disp / filial.atu) * 100 : 0

  return (
    <button
      onClick={onClick}
      className={`text-left w-full rounded-xl border-2 p-4 transition-all shadow-sm bg-white ${
        selected ? 'shadow-md' : 'border-gray-100 hover:border-gray-300'
      }`}
      style={selected ? { borderColor: color } : {}}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg p-1.5" style={{ backgroundColor: `${color}18` }}>
            <Warehouse size={15} style={{ color }} />
          </div>
          <span className="text-xs font-bold text-gray-700">{filial.label}</span>
        </div>
        {selected && (
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
            style={{ backgroundColor: color }}
          >
            ATIVO
          </span>
        )}
      </div>

      {/* Valor principal */}
      <p className="text-3xl font-bold leading-none" style={{ color }}>
        {N(filial.disp)}
        <span className="text-sm font-normal text-gray-400 ml-1">cx</span>
      </p>
      <p className="text-[10px] text-gray-400 mt-0.5">Disponível</p>

      {/* Barra de progresso disp/atu */}
      <div className="mt-2.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(pctDisp, 100)}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-[9px] text-gray-400 mt-0.5">{pctDisp.toFixed(0)}% do estoque atual</p>

      {/* Métricas secundárias */}
      <div className="mt-3 grid grid-cols-2 gap-1 text-[10px]">
        <div className="text-center">
          <p className="font-semibold text-gray-700">{N(filial.atu)}</p>
          <p className="text-gray-400">Atual</p>
        </div>
        <div className="text-center">
          <p className="font-semibold text-red-500">{N(filial.reserva)}</p>
          <p className="text-gray-400">Reservado</p>
        </div>
      </div>

      {/* Rodapé */}
      <div className="mt-2.5 pt-2 border-t border-gray-100 flex justify-between text-[10px] text-gray-400">
        <span className="flex items-center gap-1">
          <Package size={9} /> {filial.produtos} SKUs
        </span>
        <span className="flex items-center gap-1 text-red-400">
          <XCircle size={9} /> {filial.zerados} zerados
        </span>
      </div>
    </button>
  )
}

// ─── Card Consolidado ──────────────────────────────────────────────────────────

function ConsolidadoCard({
  porFilial,
  selected,
  onClick,
}: {
  porFilial: EstoqueFilial[]
  selected: boolean
  onClick: () => void
}) {
  const totalDisp = porFilial.reduce((s, f) => s + f.disp, 0)
  const totalAtu  = porFilial.reduce((s, f) => s + f.atu, 0)
  const totalRes  = porFilial.reduce((s, f) => s + f.reserva, 0)
  const pctDisp   = totalAtu > 0 ? (totalDisp / totalAtu) * 100 : 0
  const color = '#0891b2'

  return (
    <button
      onClick={onClick}
      className={`text-left w-full rounded-xl border-2 p-4 transition-all shadow-sm bg-white ${
        selected ? 'shadow-md' : 'border-gray-100 hover:border-gray-300'
      }`}
      style={selected ? { borderColor: color } : {}}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg p-1.5" style={{ backgroundColor: `${color}18` }}>
            <Layers size={15} style={{ color }} />
          </div>
          <span className="text-xs font-bold text-gray-700">Consolidado</span>
        </div>
        {selected && (
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
            style={{ backgroundColor: color }}
          >
            ATIVO
          </span>
        )}
      </div>

      <p className="text-3xl font-bold leading-none" style={{ color }}>
        {N(totalDisp)}
        <span className="text-sm font-normal text-gray-400 ml-1">cx</span>
      </p>
      <p className="text-[10px] text-gray-400 mt-0.5">Disponível — todas as filiais</p>

      <div className="mt-2.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(pctDisp, 100)}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-[9px] text-gray-400 mt-0.5">{pctDisp.toFixed(0)}% do estoque atual</p>

      <div className="mt-3 grid grid-cols-2 gap-1 text-[10px]">
        <div className="text-center">
          <p className="font-semibold text-gray-700">{N(totalAtu)}</p>
          <p className="text-gray-400">Atual</p>
        </div>
        <div className="text-center">
          <p className="font-semibold text-red-500">{N(totalRes)}</p>
          <p className="text-gray-400">Reservado</p>
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-gray-100 text-[10px] text-gray-400 text-center">
        {porFilial.map(f => FILIAIS.find(x => x.filial === f.filial)?.label ?? f.filial).join(' + ')}
      </div>
    </button>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type StatusFilter = 'todos' | 'ativos' | 'zerados'

// null = consolidado (todas as filiais)
type FilialMode = null | '01' | '06'

export default function EstoquePage() {
  const [filters, setFilters] = useState<EstoqueParams>({
    empresa: '010',
    local: '50',
  })
  const [search, setSearch] = useState('')
  const [filialMode, setFilialMode] = useState<FilialMode>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos')

  const { data, isLoading } = useEstoque(filters)

  const applySearch = () =>
    setFilters(f => ({ ...f, search: search || undefined }))

  const setFilter = (key: keyof EstoqueParams, val: string) =>
    setFilters(f => ({ ...f, [key]: val || undefined }))

  const selectFilial = (cod: FilialMode) => {
    setFilialMode(cod)
    setFilters(f => ({ ...f, filial: cod ?? undefined }))
  }

  const clearAll = () => {
    setFilters({ empresa: '010', local: '50' })
    setSearch('')
    setFilialMode(null)
    setStatusFilter('todos')
  }

  // Filtro client-side por status de disponibilidade
  const filteredItems = useMemo(() => {
    const items = data?.items ?? []
    if (statusFilter === 'ativos')  return items.filter(r => (r.qtde_disp ?? 0) > 0)
    if (statusFilter === 'zerados') return items.filter(r => (r.qtde_disp ?? 0) <= 0)
    return items
  }, [data, statusFilter])

  const kpis: EstoqueKpis | undefined = data?.kpis
  const porFilial = data?.por_filial ?? []

  const hasFilters =
    !!filters.linha || !!filters.search ||
    filialMode !== null || statusFilter !== 'todos'

  return (
    <div className="space-y-5">
      {/* Header */}
        <div>
        {/* Filtros */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex flex-wrap gap-3 items-center">

            {/* Busca */}
            <div className="flex flex-1 min-w-0 gap-2">
              <input
                type="text"
                placeholder="SKU ou descrição…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && applySearch()}
                className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-200 rounded-lg w-44"
              />
              <button
                onClick={applySearch}
                className="px-3 py-2 rounded-lg text-white"
                style={{ backgroundColor: '#D92214' }}
              >
                <Search size={15} />
              </button>
            </div>

            {/* Linha */}
            <select
              value={filters.linha || ''}
              onChange={e => setFilter('linha', e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
            >
              <option value="">Todas as linhas</option>
              {LINHAS.map(l => <option key={l}>{l}</option>)}
            </select>

            {/* Status */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
              {(['todos', 'ativos', 'zerados'] as StatusFilter[]).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-2 transition-colors capitalize ${
                    statusFilter === s
                      ? 'text-white'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                  style={statusFilter === s ? {
                    backgroundColor:
                      s === 'zerados' ? '#dc2626' :
                      s === 'ativos'  ? '#16a34a' : '#374151',
                  } : {}}
                >
                  {s === 'todos' ? 'Todos' : s === 'ativos' ? 'Com estoque' : 'Zerados'}
                </button>
              ))}
            </div>
                {hasFilters && (
                  <button
                    onClick={clearAll}
                    className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                  >
                    Limpar
                  </button>
                )}

                <span className="ml-auto text-sm font-semibold text-black">
                  {filteredItems.length} posições
                </span>
                <button
                  onClick={() => exportEstoque(filters)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-white rounded-lg"
                  style={{ backgroundColor: '#D92214' }}
                  >
                  <Download size={14} /> Exportar XLSX
                </button>
              </div>
        </div>
      </div>

      {/* Cards de filial */}
      {porFilial.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ConsolidadoCard
            porFilial={porFilial}
            selected={filialMode === null}
            onClick={() => selectFilial(null)}
          />
          {porFilial.map(f => (
            <FilialCard
              key={f.filial}
              filial={f}
              selected={filialMode === f.filial}
              onClick={() => selectFilial(filialMode === f.filial ? null : f.filial as FilialMode)}
            />
          ))}
        </div>
      )}

      {/* KPIs da seleção atual */}
      {kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          <KpiCard
            icon={Package}
            label="Disponível"
            value={N(kpis.total_disp) + ' cx'}
            color="#16a34a"
          />
          <KpiCard
            icon={Warehouse}
            label="Estoque atual"
            value={N(kpis.total_atu) + ' cx'}
            color="#2563eb"
          />
          <KpiCard
            icon={AlertTriangle}
            label="Reservado"
            value={N(kpis.total_reserva) + ' cx'}
            sub="Comprometido com pedidos"
            color="#D92214"
            small
          />
          <KpiCard
            icon={Package}
            label="SKUs com estoque"
            value={N(kpis.skus_ativos)}
            sub={`de ${N(kpis.skus_total)} posições`}
            color="#0891b2"
            small
          />
          <KpiCard
            icon={XCircle}
            label="SKUs zerados"
            value={N(kpis.skus_zerados)}
            sub={`${kpis.skus_total > 0 ? ((kpis.skus_zerados / kpis.skus_total) * 100).toFixed(0) : 0}% do portfólio`}
            color="#dc2626"
            small
          />
        </div>
      )}


      {/* Gráfico por linha */}
      {data && data.por_linha.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Estoque por linha de produto (cx)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={data.por_linha}
              layout="vertical"
              margin={{ top: 0, right: 60, left: 4, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={v => N(+v)} />
              <YAxis dataKey="linha" type="category" tick={{ fontSize: 9 }} width={100} interval={0} />
              <Tooltip formatter={v => N(v as number) + ' cx'} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="disp"    name="Disponível" fill="#16a34a" radius={[0, 4, 4, 0]} stackId="a" />
              <Bar dataKey="reserva" name="Reservado"  fill="#D92214" radius={[0, 4, 4, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['SKU', 'Descrição', 'Qtde Atual', 'Reservado', 'Disponível'].map(h => (
                  <th
                    key={h}
                    className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-left whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
                : filteredItems.map(row => {
                  const isZero = (row.qtde_disp ?? 0) <= 0
                  return (
                    <tr
                      key={row.sk_estoque}
                      className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                        isZero ? 'bg-red-50/40' : ''
                      }`}
                    >
                      <td className="px-4 py-2.5 font-mono text-xs font-medium text-gray-700 whitespace-nowrap">
                        {row.cod_prd}
                      </td>
                      <td className="px-4 py-2.5 text-gray-700 max-w-[260px] truncate text-xs">
                        {row.desc_prd}
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-700">{N(row.qtde_atu)}</td>
                      <td className={`px-4 py-2.5 text-right ${(row.qtde_reserva ?? 0) > 0 ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                        {N(row.qtde_reserva)}
                      </td>
                      <td className={`px-4 py-2.5 text-right font-semibold ${isZero ? 'text-red-600' : 'text-green-700'}`}>
                        {N(row.qtde_disp)}
                      </td>
                    </tr>
                  )
                })
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
