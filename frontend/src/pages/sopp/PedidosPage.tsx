import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Search, Download, ChevronLeft, ChevronRight, Package, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react'
import { usePedidos, usePedidosCharts } from '../../hooks/useSopp'
import { exportPedidos } from '../../lib/sopp'
import { formatNumber, formatDate } from '../../lib/utils'
import type { PedidosParams } from '../../lib/sopp'

const BRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

const fmtQtde = (v: number) => formatNumber(v, 0) + ' cx'

const LINHAS = [
  'Agua Sanitaria', 'Alvejante', 'Amaciante', 'Cloro',
  'Desinfetante', 'Lava Loucas', 'Lava Roupas', 'Limpador', 'Removedor',
]
const FORMATOS = ['500ml', '1L', '1,5L', '2L', '3L', '5L']

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
          : <p className="text-2xl font-bold mt-0.5" style={{ color }}>{value}</p>
        }
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function PedidosPage() {
  const [filters, setFilters] = useState<Omit<PedidosParams, 'page' | 'page_size'>>({})
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const params: PedidosParams = { ...filters, page, page_size: 50 }
  const { data, isLoading } = usePedidos(params)
  const { data: charts, isLoading: chartsLoading } = usePedidosCharts(filters)

  const applySearch = () => {
    setFilters(f => ({ ...f, search: search || undefined }))
    setPage(1)
  }

  const setFilter = (key: keyof typeof filters, val: string) => {
    setFilters(f => ({ ...f, [key]: val || undefined }))
    setPage(1)
  }

  const kpis = charts?.kpis
  const hasFilters = Object.keys(filters).length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Carteira de Pedidos — S&OP</h1>
          <p className="text-sm text-gray-500">
            {data ? `${data.total.toLocaleString('pt-BR')} pedidos em aberto` : '—'}
            {' · volume em caixas'}
          </p>
        </div>
        <button
          onClick={() => exportPedidos(filters)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-white rounded-lg"
          style={{ backgroundColor: '#D92214' }}
        >
          <Download size={14} />
          Exportar XLSX
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Pedidos em aberto"
          value={kpis ? kpis.total_pedidos.toLocaleString('pt-BR') : '—'}
          color="#2563eb"
          icon={<ShoppingCart size={18} />}
          loading={chartsLoading}
        />
        <KpiCard
          label="Caixas em carteira"
          value={kpis ? fmtQtde(kpis.total_qtde) : '—'}
          sub="volume total"
          color="#D92214"
          icon={<Package size={18} />}
          loading={chartsLoading}
        />
        <KpiCard
          label="Valor total"
          value={kpis ? BRL(kpis.total_valor) : '—'}
          color="#32373c"
          icon={<DollarSign size={18} />}
          loading={chartsLoading}
        />
        <KpiCard
          label="Preço médio / cx"
          value={kpis ? BRL(kpis.preco_medio) : '—'}
          sub="valor ÷ volume"
          color="#16a34a"
          icon={<TrendingUp size={18} />}
          loading={chartsLoading}
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Produto, cliente…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && applySearch()}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg w-44"
            />
            <button onClick={applySearch}
              className="px-3 py-2 rounded-lg text-white"
              style={{ backgroundColor: '#D92214' }}>
              <Search size={15} />
            </button>
          </div>

          <select
            value={filters.linha || ''}
            onChange={e => setFilter('linha', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
          >
            <option value="">Todas as linhas</option>
            {LINHAS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>

          <select
            value={filters.formato || ''}
            onChange={e => setFilter('formato', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
          >
            <option value="">Todos os formatos</option>
            {FORMATOS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>

          <input type="date" placeholder="Entrega de"
            value={filters.date_from || ''}
            onChange={e => setFilter('date_from', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg" />

          <input type="date" placeholder="Entrega até"
            value={filters.date_to || ''}
            onChange={e => setFilter('date_to', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg" />

          {hasFilters && (
            <button onClick={() => { setFilters({}); setSearch(''); setPage(1) }}
              className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Charts — Volume por Linha e por Formato */}
      {charts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Volume por linha de produto */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Volume por linha (caixas)
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={charts.por_linha} layout="vertical"
                margin={{ top: 0, right: 60, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => formatNumber(+v, 0)} />
                <YAxis dataKey="linha" type="category" tick={{ fontSize: 10 }} width={105} />
                <Tooltip formatter={(v) => fmtQtde(v as number)} />
                <Bar dataKey="qtde" name="Caixas" fill="#D92214" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Volume por formato/volume */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Volume por formato (caixas)
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={charts.por_formato} layout="vertical"
                margin={{ top: 0, right: 60, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => formatNumber(+v, 0)} />
                <YAxis dataKey="formato" type="category" tick={{ fontSize: 11 }} width={55} />
                <Tooltip formatter={(v) => fmtQtde(v as number)} />
                <Bar dataKey="qtde" name="Caixas" fill="#2563eb" radius={[0, 4, 4, 0]} />
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
              <tr className="border-b border-gray-100 text-left">
                {['PV', 'Produto', 'Descrição', 'Linha', 'Formato', 'Qtde (cx)', 'Valor Bruto',
                  'Cliente', 'Emissão', 'Entrega'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
                : data?.items.map(row => {
                  const linha = LINHAS.find(l => row.desc_prd?.toUpperCase().startsWith(
                    l === 'Agua Sanitaria' ? 'AGUA SANITARIA'
                    : l === 'Lava Loucas' ? 'LAVA LOUC'
                    : l === 'Lava Roupas' ? 'LAVA ROUPA'
                    : l === 'Amaciante' ? 'AMAC'
                    : l === 'Desinfetante' ? 'DESINF'
                    : l === 'Limpador' ? 'LIMP'
                    : l.toUpperCase()
                  )) || 'Outros'
                  const fmtMatch = row.cod_prd?.match(/X(500|01L|1[,.]5|02L|03L|05L|2L)/i)
                  const fmt = fmtMatch
                    ? fmtMatch[1] === '500' ? '500ml'
                      : fmtMatch[1].toUpperCase() === '01L' ? '1L'
                      : /1[,.]5/i.test(fmtMatch[1]) ? '1,5L'
                      : fmtMatch[1].toUpperCase() === '02L' || fmtMatch[1].toUpperCase() === '2L' ? '2L'
                      : fmtMatch[1].toUpperCase() === '03L' ? '3L'
                      : '5L'
                    : '—'
                  return (
                    <tr key={row.sk_pedido} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-blue-600 whitespace-nowrap font-mono text-xs">{row.num_pv || row.sk_pedido}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-gray-700">{row.cod_prd}</td>
                      <td className="px-4 py-2.5 text-gray-700 max-w-[180px] truncate">{row.desc_prd}</td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 whitespace-nowrap">
                          {linha}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          {fmt}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-gray-900">{formatNumber(row.qtde, 0)}</td>
                      <td className="px-4 py-2.5 text-right text-gray-700 whitespace-nowrap">{BRL(row.vl_bruto)}</td>
                      <td className="px-4 py-2.5 text-gray-600 max-w-[160px] truncate">{row.cliente}</td>
                      <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{formatDate(row.emissao)}</td>
                      <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{formatDate(row.dt_entrega)}</td>
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
