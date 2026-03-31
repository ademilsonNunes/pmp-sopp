import { useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import {
  Search, Download, ChevronLeft, ChevronRight,
  Package, Calendar, TrendingUp, Activity, Layers, Factory,
} from 'lucide-react'
import { useProducao, useProducaoCharts } from '../../hooks/useSopp'
import { exportProducao } from '../../lib/sopp'
import { formatNumber, fmtDiario, formatDate } from '../../lib/utils'
import type { ProducaoParams } from '../../lib/sopp'
import type { ProducaoFilial } from '../../types'

// ─── Config filiais ────────────────────────────────────────────────────────────

const FILIAIS_PROD: { filial: string; label: string; color: string }[] = [
  { filial: '01', label: 'Jaçanã (01)',  color: '#D92214' },
  { filial: '06', label: 'Atibaia (06)', color: '#9333ea' },
]

type FilialMode = null | '01' | '06'

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string
  value: string
  sub?: string
  color: string
  icon: React.ReactNode
  loading?: boolean
}

function KpiCard({ label, value, sub, color, icon, loading }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ backgroundColor: `${color}18` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        {loading
          ? <div className="h-7 w-28 bg-gray-100 rounded animate-pulse mt-1" />
          : <p className="text-2xl font-bold mt-0.5 leading-tight" style={{ color }}>{value}</p>
        }
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Filial Card ───────────────────────────────────────────────────────────────

function FilialCard({
  filial, selected, onClick,
}: {
  filial: ProducaoFilial
  selected: boolean
  onClick: () => void
}) {
  const cfg = FILIAIS_PROD.find(f => f.filial === filial.filial)
  const color = cfg?.color ?? '#6b7280'

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
            <Factory size={15} style={{ color }} />
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

      <p className="text-3xl font-bold leading-none" style={{ color }}>
        {formatNumber(filial.total_qtde, 0)}
        <span className="text-sm font-normal text-gray-400 ml-1">cx</span>
      </p>
      <p className="text-[10px] text-gray-400 mt-0.5">Produzidas no período</p>

      <div className="mt-3 grid grid-cols-3 gap-1 text-[10px]">
        <div className="text-center">
          <p className="font-semibold text-gray-700">{formatNumber(filial.media_dia, 0)}</p>
          <p className="text-gray-400">cx/dia</p>
        </div>
        <div className="text-center">
          <p className="font-semibold text-gray-700">{filial.dias_produtivos}</p>
          <p className="text-gray-400">dias prod.</p>
        </div>
        <div className="text-center">
          <p className="font-semibold text-gray-700">{filial.total_movtos.toLocaleString('pt-BR')}</p>
          <p className="text-gray-400">movtos</p>
        </div>
      </div>
    </button>
  )
}

// ─── Consolidado Card ──────────────────────────────────────────────────────────

function ConsolidadoCard({
  porFilial, selected, onClick,
}: {
  porFilial: ProducaoFilial[]
  selected: boolean
  onClick: () => void
}) {
  const totalQtde  = porFilial.reduce((s, f) => s + f.total_qtde, 0)
  const totalDias  = Math.max(...porFilial.map(f => f.dias_produtivos), 0)
  const totalMovtos = porFilial.reduce((s, f) => s + f.total_movtos, 0)
  const mediaDia   = totalDias > 0 ? totalQtde / totalDias : 0
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
        {formatNumber(totalQtde, 0)}
        <span className="text-sm font-normal text-gray-400 ml-1">cx</span>
      </p>
      <p className="text-[10px] text-gray-400 mt-0.5">Todas as filiais</p>

      <div className="mt-3 grid grid-cols-3 gap-1 text-[10px]">
        <div className="text-center">
          <p className="font-semibold text-gray-700">{formatNumber(mediaDia, 0)}</p>
          <p className="text-gray-400">cx/dia</p>
        </div>
        <div className="text-center">
          <p className="font-semibold text-gray-700">{totalDias}</p>
          <p className="text-gray-400">dias prod.</p>
        </div>
        <div className="text-center">
          <p className="font-semibold text-gray-700">{totalMovtos.toLocaleString('pt-BR')}</p>
          <p className="text-gray-400">movtos</p>
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-gray-100 text-[10px] text-gray-400 text-center">
        {porFilial.map(f => FILIAIS_PROD.find(x => x.filial === f.filial)?.label ?? f.filial).join(' + ')}
      </div>
    </button>
  )
}

// ─── Tooltip diário ────────────────────────────────────────────────────────────

const DayTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700">{label}</p>
      <p className="text-red-600 font-bold">{formatNumber(payload[0].value, 0)} cx</p>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ProducaoPage() {
  const [filters, setFilters] = useState<Omit<ProducaoParams, 'page' | 'page_size'>>({ tipo: 'PA' })
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filialMode, setFilialMode] = useState<FilialMode>(null)

  const params: ProducaoParams = { ...filters, page, page_size: 50 }
  const { data, isLoading } = useProducao(params)
  const { data: charts, isLoading: chartsLoading } = useProducaoCharts(filters)

  const applySearch = () => {
    setFilters(f => ({ ...f, cod_prd: search || undefined }))
    setPage(1)
  }

  const setFilter = (key: keyof typeof filters, val: string) => {
    setFilters(f => ({ ...f, [key]: val || undefined }))
    setPage(1)
  }

  const selectFilial = (cod: FilialMode) => {
    setFilialMode(cod)
    setFilters(f => ({ ...f, filial: cod ?? undefined }))
    setPage(1)
  }

  const clearAll = () => {
    setFilters({ tipo: 'PA' })
    setSearch('')
    setFilialMode(null)
    setPage(1)
  }

  const kpis = charts?.kpis
  const porFilial = charts?.por_filial ?? []
  const hasDateFilter = !!filters.date_from || !!filters.date_to
  const mediaDiaRef = kpis ? kpis.media_dia : 0
  const hasFilters = !!filters.date_from || !!filters.date_to || !!filters.cod_prd || filialMode !== null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">Produção — Produto Acabado</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700">PA</span>
            {filialMode && (
              <span
                className="px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: FILIAIS_PROD.find(f => f.filial === filialMode)?.color }}
              >
                {FILIAIS_PROD.find(f => f.filial === filialMode)?.label}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {data ? `${data.total.toLocaleString('pt-BR')} movimentos` : '—'}
            {!hasDateFilter && ' · mês corrente'}
          </p>
        </div>
        <button
          onClick={() => exportProducao(filters)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-white rounded-lg"
          style={{ backgroundColor: '#D92214' }}
        >
          <Download size={14} /> Exportar XLSX
        </button>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Caixas produzidas PA"
          value={kpis ? formatNumber(kpis.total_qtde, 0) : '—'}
          sub={hasDateFilter ? 'no período' : 'no mês'}
          color="#D92214"
          icon={<Package size={18} />}
          loading={chartsLoading}
        />
        <KpiCard
          label="Média diária"
          value={kpis ? formatNumber(kpis.media_dia, 0) + ' cx' : '—'}
          sub="caixas / dia produtivo"
          color="#2563eb"
          icon={<TrendingUp size={18} />}
          loading={chartsLoading}
        />
        <KpiCard
          label="Dias produtivos"
          value={kpis ? String(kpis.dias_produtivos) : '—'}
          sub="dias com apontamento"
          color="#16a34a"
          icon={<Calendar size={18} />}
          loading={chartsLoading}
        />
        <KpiCard
          label="Movimentos"
          value={kpis ? kpis.total_movtos.toLocaleString('pt-BR') : '—'}
          sub={kpis?.top_produto ? `Top: ${kpis.top_produto.cod_prd}` : 'apontamentos PA'}
          color="#32373c"
          icon={<Activity size={18} />}
          loading={chartsLoading}
        />
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Produto ou código…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && applySearch()}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg w-48"
            />
            <button onClick={applySearch}
              className="px-3 py-2 rounded-lg text-white"
              style={{ backgroundColor: '#D92214' }}>
              <Search size={15} />
            </button>
          </div>

          <input type="date"
            value={filters.date_from || ''}
            onChange={e => { setFilter('date_from', e.target.value); setPage(1) }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg" />

          <input type="date"
            value={filters.date_to || ''}
            onChange={e => { setFilter('date_to', e.target.value); setPage(1) }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg" />

          <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg"
            style={{ backgroundColor: '#D9221418', color: '#D92214' }}>
            <Package size={13} /> Tipo: PA
          </div>

          {hasFilters && (
            <button onClick={clearAll}
              className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Charts */}
      {charts && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Produção diária AreaChart */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Produção diária PA (caixas)
            </h3>
            <p className="text-xs text-gray-400 mb-3">
              Linha azul = média &nbsp;
              <span className="font-semibold text-gray-600">{formatNumber(mediaDiaRef, 0)} cx/dia</span>
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={charts.por_dia} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradPA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D92214" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#D92214" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="data" tick={{ fontSize: 9 }}
                  tickFormatter={d => d ? fmtDiario(d) : ''} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => formatNumber(+v, 0)} />
                <Tooltip content={<DayTooltip />} />
                {mediaDiaRef > 0 && (
                  <ReferenceLine y={mediaDiaRef} stroke="#2563eb" strokeDasharray="4 3"
                    label={{ value: 'Média', position: 'right', fontSize: 10, fill: '#2563eb' }} />
                )}
                <Area type="monotone" dataKey="qtde" name="Caixas PA"
                  stroke="#D92214" strokeWidth={2}
                  fill="url(#gradPA)" dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Volume por linha (família S&OP) */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Volume por linha (caixas)
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={charts.por_linha} layout="vertical"
                margin={{ top: 0, right: 50, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={v => formatNumber(+v, 0)} />
                <YAxis dataKey="linha" type="category" tick={{ fontSize: 9 }} width={90} />
                <Tooltip formatter={(v) => formatNumber(v as number, 0) + ' cx'} />
                <Bar dataKey="qtde" name="Caixas" fill="#D92214" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Data', 'OP', 'Lote', 'Produto', 'Descrição', 'Operação', 'Qtde (cx)', 'Armazém', 'Filial'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-left whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
                : data?.items.map(row => {
                  const filialCfg = FILIAIS_PROD.find(f => f.filial === row.tb_filial)
                  return (
                    <tr key={row.sk_movto} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{formatDate(row.emissao)}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-gray-700">{row.op}</td>
                      <td className="px-4 py-2.5 text-gray-600 font-mono text-xs">{row.lote}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-gray-700">{row.cod_prd}</td>
                      <td className="px-4 py-2.5 text-gray-700 max-w-[180px] truncate">{row.produto}</td>
                      <td className="px-4 py-2.5 text-gray-600 font-mono text-xs">{row.operacao}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-gray-900">{formatNumber(row.qtde, 0)}</td>
                      <td className="px-4 py-2.5 text-gray-600">{row.armazem}</td>
                      <td className="px-4 py-2.5">
                        {filialCfg ? (
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-white"
                            style={{ backgroundColor: filialCfg.color }}
                          >
                            {filialCfg.label}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">{row.tb_filial}</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              }
            </tbody>
          </table>
        </div>

        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              {((page - 1) * 50 + 1).toLocaleString('pt-BR')}–{Math.min(page * 50, data.total).toLocaleString('pt-BR')} de {data.total.toLocaleString('pt-BR')}
            </span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                <ChevronLeft size={14} />
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-700">{page} / {data.total_pages}</span>
              <button onClick={() => setPage(p => Math.min(data.total_pages, p + 1))} disabled={page === data.total_pages}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
