import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { Search, Download, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { useFaturamento, useFaturamentoCharts, useSoppFilters, useDevolucoes } from '../../hooks/useSopp'
import { exportFaturamento } from '../../lib/sopp'
import { formatNumber, fmtMes, formatDate } from '../../lib/utils'
import type { FaturamentoParams, DevolucaoParams } from '../../lib/sopp'

const LINHAS = [
  'Agua Sanitaria', 'Alvejante', 'Amaciante', 'Cloro',
  'Desinfetante', 'Lava Loucas', 'Lava Roupas', 'Limpador', 'Removedor',
]

const BRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)


export default function FaturamentoPage() {
  const [filters, setFilters] = useState<Omit<FaturamentoParams, 'page' | 'page_size'>>({
    excluir_dev: true,
  })
  const [page, setPage] = useState(1)
  const [showCharts, setShowCharts] = useState(true)
  const [showDevol, setShowDevol] = useState(false)
  const [search, setSearch] = useState('')
  const [devolPeriod, setDevolPeriod] = useState<DevolucaoParams>({})

  const params: FaturamentoParams = { ...filters, page, page_size: 50 }
  const { data, isLoading } = useFaturamento(params)
  const { data: charts } = useFaturamentoCharts(filters)
  const { data: filterOpts } = useSoppFilters()
  const { data: devol } = useDevolucoes(devolPeriod)

  const applySearch = () => {
    setFilters(f => ({ ...f, search: search || undefined }))
    setPage(1)
  }

  const setFilter = (key: keyof typeof filters, val: string | boolean) => {
    setFilters(f => ({ ...f, [key]: val || undefined }))
    setPage(1)
  }

  const totalLiquido = charts?.por_mes.reduce((s, r) => s + r.liquido, 0) ?? 0

  return (
    <div className="space-y-2.5">
      {/* Header */}
      <div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        {/* Linha 1 */}
        <div className="flex flex-1 min-w-0 gap-3">
          <select value={filters.linha || ''} onChange={e => setFilter('linha', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white w-48">
            <option value="">Todas as linhas</option>
            {LINHAS.map(l => <option key={l}>{l}</option>)}
          </select>
          
          <div className="flex flex-1 min-w-0 gap-2">
            <select value={filters.vendedor || ''} onChange={e => setFilter('vendedor', e.target.value)}
              className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white">
              <option value="">Todos os vendedores</option>
              {filterOpts?.vendedores_faturamento.map(v => <option key={v}>{v}</option>)}
            </select>
          </div>

          <select value={filters.uf || ''} onChange={e => setFilter('uf', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white">
            <option value="">Todos os estados</option>
            {filterOpts?.ufs.map(u => <option key={u}>{u}</option>)}
          </select>

          <input type="date" value={filters.date_from || ''}
            onChange={e => setFilter('date_from', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg" />
          <input type="date" value={filters.date_to || ''}
            onChange={e => setFilter('date_to', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg" />
        </div>

        {/* Linha 2 */}
        <div className="flex items-center gap-3 mt-3">
          <label className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <input type="checkbox" checked={!!filters.excluir_dev}
              onChange={e => setFilter('excluir_dev', e.target.checked)}
              className="accent-red-600" />
            Excluir devoluções
          </label>
          <div className="flex flex-1 min-w-0 gap-2">
              <button onClick={() => setShowCharts(s => !s)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                <Filter size={14} /> {showCharts ? 'Ocultar' : 'Mostrar'} gráficos
              </button>
            <div className="flex flex-1 min-w-0 gap-2">
              <input type="text" placeholder="Produto, cliente, NF…"
                value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && applySearch()}
                className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-200 rounded-lg" />
              <button onClick={applySearch}
                className="px-3 py-2 rounded-lg text-white" style={{ backgroundColor: '#D92214' }}>
                <Search size={15} />
              </button>
              {Object.keys({ ...filters, excluir_dev: undefined }).filter(k => !!(filters as Record<string, unknown>)[k]).length > 0 && (
                <button onClick={() => { setFilters({ excluir_dev: true }); setSearch(''); setPage(1) }}
                  className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">
                  Limpar
                </button>
              )}
            </div>
              <button onClick={() => exportFaturamento(filters)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-white rounded-lg"
                style={{ backgroundColor: '#D92214' }}>
                <Download size={14} /> Exportar XLSX
              </button>
          </div>
        </div>
      </div>

      {/* KPI cards — liquid metrics */}
      {charts && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Vl. Líquido total', value: BRL(totalLiquido), color: '#2563eb' },
            { label: 'Meses exibidos',    value: String(charts.por_mes.length), color: '#32373c' },
            { label: 'Top linha',         value: charts.por_linha[0]?.linha ?? '—', color: '#D92214' },
            { label: 'Top vendedor',      value: charts.por_vendedor[0]?.vendedor?.split(' ')[0] ?? '—', color: '#16a34a' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
              <p className="text-xl font-bold mt-1 truncate" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      {showCharts && charts && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mensal */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Faturamento mensal (líquido)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={charts.por_mes.map(d => ({ ...d, mes: fmtMes(d.mes) }))}
                margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v/1e6).toFixed(1)}M`} />
                <Tooltip formatter={(v) => BRL(v as number)} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="liquido" name="Vl. Líquido" fill="#2563eb" radius={[4,4,0,0]} />
                <Bar dataKey="bruto"   name="Vl. Bruto"   fill="#D92214" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Por linha */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Volume por linha</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={charts.por_linha} layout="vertical"
                margin={{ top: 0, right: 60, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={v => `${(v/1e6).toFixed(1)}M`} />
                <YAxis dataKey="linha" type="category" tick={{ fontSize: 9 }} width={90} interval={0} />
                <Tooltip formatter={(v) => BRL(v as number)} />
                <Bar dataKey="valor" name="Faturamento" fill="#D92214" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top vendedores */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Top 10 vendedores</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={charts.por_vendedor.slice(0, 10)} layout="vertical"
                margin={{ top: 0, right: 70, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${(v/1e6).toFixed(1)}M`} />
                <YAxis dataKey="vendedor" type="category" tick={{ fontSize: 10 }} width={180} />
                <Tooltip formatter={(v) => BRL(v as number)} />
                <Bar dataKey="valor" name="Faturamento" fill="#2563eb" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Devoluções section */}
      {showDevol && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-base font-bold text-amber-700">Análise de Devoluções</h2>
            <div className="flex gap-2 items-center">
              <input type="date" value={devolPeriod.date_from || ''}
                onChange={e => setDevolPeriod(p => ({ ...p, date_from: e.target.value || undefined }))}
                className="px-3 py-2 text-sm border border-amber-200 rounded-lg" />
              <input type="date" value={devolPeriod.date_to || ''}
                onChange={e => setDevolPeriod(p => ({ ...p, date_to: e.target.value || undefined }))}
                className="px-3 py-2 text-sm border border-amber-200 rounded-lg" />
            </div>
          </div>

          {devol && (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Qtde de notas',   value: devol.kpis.qtde_notas.toLocaleString('pt-BR') },
                  { label: 'Qtde de itens',   value: formatNumber(devol.kpis.qtde_itens, 0) },
                  { label: 'Valor devolvido', value: BRL(devol.kpis.valor_total) },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-amber-50 rounded-xl border border-amber-100 shadow-sm p-4">
                    <p className="text-xs font-medium text-amber-700 uppercase tracking-wide">{label}</p>
                    <p className="text-2xl font-bold text-amber-900 mt-1">{value}</p>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Por período */}
                <div className="bg-white rounded-xl border border-amber-100 shadow-sm p-5">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Devoluções por período</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={devol.por_periodo.map(d => ({ ...d, mes: fmtMes(d.mes) }))}
                      margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v/1e3).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => BRL(v as number)} />
                      <Bar dataKey="valor" name="Devolvido" fill="#ea580c" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Por supervisor */}
                <div className="bg-white rounded-xl border border-amber-100 shadow-sm p-5">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Por supervisor / área</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={devol.por_supervisor} layout="vertical"
                      margin={{ top: 0, right: 60, left: 4, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={v => `${(v/1e3).toFixed(0)}k`} />
                      <YAxis dataKey="supervisor" type="category" tick={{ fontSize: 9 }} width={130} />
                      <Tooltip formatter={(v) => BRL(v as number)} />
                      <Bar dataKey="valor" name="Devolvido" fill="#ea580c" radius={[0,4,4,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Por UF */}
                <div className="bg-white rounded-xl border border-amber-100 shadow-sm p-5">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Por estado (UF)</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={devol.por_uf.slice(0, 15)} layout="vertical"
                      margin={{ top: 0, right: 60, left: 4, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={v => `${(v/1e3).toFixed(0)}k`} />
                      <YAxis dataKey="uf" type="category" tick={{ fontSize: 9 }} width={35} />
                      <Tooltip formatter={(v) => BRL(v as number)} />
                      <Bar dataKey="valor" name="Devolvido" fill="#dc2626" radius={[0,4,4,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Por linha S&OP */}
                <div className="bg-white rounded-xl border border-amber-100 shadow-sm p-5">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Por linha de produto</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={devol.por_linha} layout="vertical"
                      margin={{ top: 0, right: 60, left: 4, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={v => `${(v/1e3).toFixed(0)}k`} />
                      <YAxis dataKey="linha" type="category" tick={{ fontSize: 9 }} width={90} />
                      <Tooltip formatter={(v) => BRL(v as number)} />
                      <Bar dataKey="valor" name="Devolvido" fill="#b91c1c" radius={[0,4,4,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Emissão','NF','Tipo','Produto','Descrição','Qtde','Cliente','UF','Vendedor','Vl. Bruto','Vl. Líquido'].map(h => (
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
                    {Array.from({ length: 11 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
                : data?.items.map(row => (
                  <tr key={row.sk_fat} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{formatDate(row.emissao)}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-700">{row.nf}</td>
                    <td className="px-4 py-2.5">
                      {row.tp && (
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          row.tp.includes('DEV') ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-600'
                        }`}>{row.tp}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-700">{row.cod_prd}</td>
                    <td className="px-4 py-2.5 text-gray-700 max-w-[160px] truncate">{row.descricao}</td>
                    <td className="px-4 py-2.5 text-right text-gray-700">{formatNumber(row.quantidade, 2)}</td>
                    <td className="px-4 py-2.5 text-gray-600 max-w-[140px] truncate">{row.cliente}</td>
                    <td className="px-4 py-2.5 text-center text-gray-500">{row.uf}</td>
                    <td className="px-4 py-2.5 text-gray-600 max-w-[120px] truncate">{row.nome_vend}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-gray-900 whitespace-nowrap">{BRL(row.vl_bruto)}</td>
                    <td className="px-4 py-2.5 text-right text-gray-700 whitespace-nowrap">{BRL(row.vl_liquido)}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              {((page-1)*50+1).toLocaleString('pt-BR')}–{Math.min(page*50,data.total).toLocaleString('pt-BR')} de {data.total.toLocaleString('pt-BR')}
            </span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                <ChevronLeft size={14} />
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-700">{page}/{data.total_pages}</span>
              <button onClick={() => setPage(p => Math.min(data.total_pages,p+1))} disabled={page===data.total_pages}
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
