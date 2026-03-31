import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { Search, Download } from 'lucide-react'
import { useForecast, useForecastSummary } from '../../hooks/useSopp'
import { exportForecast } from '../../lib/sopp'
import { formatNumber } from '../../lib/utils'
import type { ForecastParams } from '../../lib/sopp'

const LINHAS = [
  'Agua Sanitaria', 'Alvejante', 'Amaciante', 'Cloro',
  'Desinfetante', 'Lava Loucas', 'Lava Roupas', 'Limpador', 'Removedor',
]

const MONTHS      = ['jan','fev','mar','abr','mai','jun','jul','ago','set_m','out','nov','dez'] as const
const MONTH_KEYS  = ['jan','fev','mar','abr','mai','jun','jul','ago','set_m','out_m','nov','dez'] as const
const MONTH_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

// Heatmap com base no atingimento (real / fc)
function cellBg(fc: number, real: number): string {
  if (fc === 0 && real === 0) return ''
  if (fc === 0) return 'bg-blue-50'
  const r = real / fc
  if (r >= 1.0)  return 'bg-green-100'
  if (r >= 0.75) return 'bg-green-50'
  if (r >= 0.5)  return 'bg-amber-50'
  if (r >= 0.25) return 'bg-orange-50'
  if (fc > 0)    return 'bg-red-50'
  return ''
}

function fmtN(v: number): string {
  if (v === 0) return ''
  if (v >= 10000) return `${Math.round(v / 1000)}k`
  if (v >= 1000)  return `${(v / 1000).toFixed(1)}k`
  return formatNumber(v, 0)
}

// Sticky col widths
const W = { prod: 150, linha: 90 }
const L = { prod: 0, linha: W.prod }

export default function ForecastPage() {
  const [filters, setFilters] = useState<ForecastParams>({})
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'grid' | 'resumo'>('grid')

  const { data, isLoading } = useForecast(filters)
  const { data: summary } = useForecastSummary()

  const applySearch = () => setFilters(f => ({ ...f, search: search || undefined }))

  const totalSkus = data?.items.length ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Forecast de Demanda</h1>
          <p className="text-sm text-gray-500">
            {totalSkus > 0 ? `${totalSkus} SKUs` : '—'}
            {' · '}Forecast vs Realizado por mês
          </p>
        </div>
        <button onClick={() => exportForecast(filters)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-white rounded-lg"
          style={{ backgroundColor: '#D92214' }}>
          <Download size={14} /> Exportar XLSX
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(['grid', 'resumo'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
            }`}>
            {t === 'grid' ? 'Grid SKU' : 'Resumo por Linha'}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex gap-2">
            <input type="text" placeholder="Produto ou descrição…"
              value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && applySearch()}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg w-48" />
            <button onClick={applySearch}
              className="px-3 py-2 rounded-lg text-white" style={{ backgroundColor: '#D92214' }}>
              <Search size={15} />
            </button>
          </div>
          <select value={filters.linha || ''} onChange={e => setFilters(f => ({ ...f, linha: e.target.value || undefined }))}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white">
            <option value="">Todas as linhas</option>
            {LINHAS.map(l => <option key={l}>{l}</option>)}
          </select>
          {(filters.linha || filters.search) && (
            <button onClick={() => { setFilters({}); setSearch('') }}
              className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">
              Limpar
            </button>
          )}
        </div>
        {/* Legend */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Atingimento:</span>
          {[
            { bg: 'bg-green-100',  label: '≥100%' },
            { bg: 'bg-green-50',   label: '75–99%' },
            { bg: 'bg-amber-50',   label: '50–74%' },
            { bg: 'bg-orange-50',  label: '25–49%' },
            { bg: 'bg-red-50',     label: '<25%' },
            { bg: 'bg-blue-50',    label: 'S/ FC' },
          ].map(({ bg, label }) => (
            <span key={label} className="flex items-center gap-1">
              <span className={`inline-block w-3 h-3 rounded-sm ${bg} border border-gray-200`} />
              <span className="text-[10px] text-gray-500">{label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Tab: Grid SKU ──────────────────────────────────────────────────── */}
      {activeTab === 'grid' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-2 animate-pulse">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-7 bg-gray-100 rounded" style={{ opacity: 1 - i * 0.07 }} />
              ))}
            </div>
          ) : !data?.items.length ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <p className="text-sm font-medium">Nenhum SKU encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="text-[11px] border-collapse w-full">
                <colgroup>
                  <col style={{ width: W.prod }} />
                  <col style={{ width: W.linha }} />
                  {MONTH_LABEL.map((_, i) => <col key={i} />)}
                  <col style={{ width: 64 }} />
                  <col style={{ width: 64 }} />
                  <col style={{ width: 56 }} />
                </colgroup>

                <thead>
                  <tr className="bg-gray-100">
                    <th className="sticky z-20 bg-gray-100 border-b-2 border-r border-gray-300 px-2 py-2 text-left font-semibold text-gray-600 whitespace-nowrap"
                      style={{ left: L.prod, minWidth: W.prod }}>
                      Produto / Descrição
                    </th>
                    <th className="sticky z-20 bg-gray-100 border-b-2 border-r-2 border-gray-300 px-2 py-2 text-left font-semibold text-gray-600"
                      style={{ left: L.linha, minWidth: W.linha }}>
                      Linha S&OP
                    </th>
                    {MONTH_LABEL.map(m => (
                      <th key={m} className="bg-gray-100 border-b-2 border-gray-200 px-1 py-2 text-center font-semibold text-gray-500 whitespace-nowrap"
                        style={{ minWidth: 0 }}>
                        <span className="text-[10px]">{m}</span>
                      </th>
                    ))}
                    <th className="bg-gray-100 border-b-2 border-l-2 border-gray-300 px-1.5 py-2 text-right font-semibold text-gray-700 whitespace-nowrap"
                      style={{ minWidth: 64 }}>Total FC</th>
                    <th className="bg-gray-100 border-b-2 border-l border-gray-200 px-1.5 py-2 text-right font-semibold text-blue-600 whitespace-nowrap"
                      style={{ minWidth: 64 }}>Real</th>
                    <th className="bg-gray-100 border-b-2 border-l border-gray-200 px-1.5 py-2 text-center font-semibold text-gray-600 whitespace-nowrap"
                      style={{ minWidth: 56 }}>Ating.</th>
                  </tr>
                </thead>

                <tbody>
                  {data.items.map((row, idx) => {
                    const real = data.fat_real[row.cod_prd]
                    const ating = row.total > 0 ? (real?.total ?? 0) / row.total * 100 : null
                    const base = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'

                    // Classificação S&OP pelo DESC_PRD
                    const desc = (row.desc_prd || '').toUpperCase()
                    let linhaLabel = 'Outros'
                    if (desc.startsWith('AGUA SANITARIA'))  linhaLabel = 'Agua Sanitaria'
                    else if (desc.startsWith('ALVEJANTE'))   linhaLabel = 'Alvejante'
                    else if (desc.startsWith('AMAC'))        linhaLabel = 'Amaciante'
                    else if (desc.startsWith('CLORO'))       linhaLabel = 'Cloro'
                    else if (desc.startsWith('DESINF'))      linhaLabel = 'Desinfetante'
                    else if (desc.startsWith('LAVA LOUC'))   linhaLabel = 'Lava Loucas'
                    else if (desc.startsWith('LAVA ROUPA'))  linhaLabel = 'Lava Roupas'
                    else if (desc.startsWith('LIMP') || desc.startsWith('DESENGORDURANTE')) linhaLabel = 'Limpador'
                    else if (desc.startsWith('REMOVEDOR'))   linhaLabel = 'Removedor'

                    return (
                      <tr key={row.sk_forecast}
                        className={`group transition-colors ${base} hover:bg-blue-50/40`}>
                        {/* Produto */}
                        <td className={`sticky z-10 border-b border-r border-gray-100 px-2 py-1 group-hover:bg-blue-50/40 ${base}`}
                          style={{ left: L.prod, minWidth: W.prod }}>
                          <span className="block font-mono font-semibold text-gray-800 text-[10px] leading-tight truncate">
                            {row.cod_prd}
                          </span>
                          <span className="block text-[9px] text-gray-400 leading-tight truncate" title={row.desc_prd}>
                            {row.desc_prd}
                          </span>
                        </td>
                        {/* Linha S&OP */}
                        <td className={`sticky z-10 border-b border-r-2 border-gray-200 px-2 py-1 text-[10px] text-gray-500 whitespace-nowrap group-hover:bg-blue-50/40 ${base}`}
                          style={{ left: L.linha, minWidth: W.linha }}>
                          {linhaLabel}
                        </td>
                        {/* Meses */}
                        {MONTH_KEYS.map((mk, mi) => {
                          const fcVal   = (row[MONTHS[mi] as keyof typeof row] as number) ?? 0
                          const realVal = real ? (real[mk as keyof typeof real] as number ?? 0) : 0
                          return (
                            <td key={mi}
                              className={`border-b border-gray-100 px-0.5 py-0.5 text-center align-top ${cellBg(fcVal, realVal)}`}
                              title={`FC: ${formatNumber(fcVal,0)} | Real: ${formatNumber(realVal,0)}`}>
                              {(fcVal > 0 || realVal > 0) ? (
                                <div className="leading-none">
                                  <div className="text-[9px] font-medium text-gray-700">{fmtN(fcVal)}</div>
                                  <div className="text-[9px] text-blue-600">{realVal > 0 ? fmtN(realVal) : ''}</div>
                                </div>
                              ) : (
                                <span className="text-[9px] text-gray-200">·</span>
                              )}
                            </td>
                          )
                        })}
                        {/* Total FC */}
                        <td className="border-b border-l-2 border-gray-200 px-1.5 py-1 text-right tabular-nums whitespace-nowrap font-semibold text-gray-800"
                          style={{ minWidth: 64 }}>
                          <span className="text-[10px]">{fmtN(row.total)}</span>
                        </td>
                        {/* Real */}
                        <td className="border-b border-l border-gray-100 px-1.5 py-1 text-right tabular-nums whitespace-nowrap font-semibold text-blue-700"
                          style={{ minWidth: 64 }}>
                          <span className="text-[10px]">{real ? fmtN(real.total) : '—'}</span>
                        </td>
                        {/* Atingimento */}
                        <td className="border-b border-l border-gray-100 px-1.5 py-1 text-center" style={{ minWidth: 56 }}>
                          {ating !== null ? (
                            <span className={`text-[10px] font-semibold ${
                              ating >= 100 ? 'text-green-600' : ating >= 75 ? 'text-green-500' :
                              ating >= 50 ? 'text-amber-600' : ating >= 25 ? 'text-orange-600' : 'text-red-600'
                            }`}>
                              {ating.toFixed(0)}%
                            </span>
                          ) : <span className="text-gray-300 text-[10px]">—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>

                {/* Footer totals */}
                {data.items.length > 1 && (() => {
                  const footerFC   = MONTH_KEYS.map((_, mi) =>
                    data.items.reduce((s, r) => s + ((r[MONTHS[mi] as keyof typeof r] as number) || 0), 0)
                  )
                  const footerReal = MONTH_KEYS.map(mk =>
                    Object.values(data.fat_real).reduce((s, r) => s + ((r[mk as keyof typeof r] as number) || 0), 0)
                  )
                  const grandFC   = data.items.reduce((s, r) => s + (r.total || 0), 0)
                  const grandReal = Object.values(data.fat_real).reduce((s, r) => s + (r.total || 0), 0)
                  return (
                    <tfoot>
                      <tr className="bg-gray-100">
                        <td className="sticky z-10 bg-gray-100 border-t-2 border-r border-gray-300 px-2 py-1.5 font-semibold text-gray-700 text-[10px] whitespace-nowrap"
                          style={{ left: L.prod, minWidth: W.prod }}>
                          TOTAL ({data.items.length} SKUs)
                        </td>
                        <td className="sticky z-10 bg-gray-100 border-t-2 border-r-2 border-gray-300"
                          style={{ left: L.linha, minWidth: W.linha }} />
                        {footerFC.map((fc, mi) => (
                          <td key={mi} className={`border-t-2 border-gray-300 px-0.5 py-0.5 text-center align-top ${cellBg(fc, footerReal[mi])}`}>
                            <div className="leading-none">
                              {fc > 0 && <div className="text-[9px] font-semibold text-gray-700">{fmtN(fc)}</div>}
                              {footerReal[mi] > 0 && <div className="text-[9px] text-blue-600">{fmtN(footerReal[mi])}</div>}
                            </div>
                          </td>
                        ))}
                        <td className="border-t-2 border-l-2 border-gray-300 px-1.5 py-1.5 text-right tabular-nums whitespace-nowrap font-bold text-gray-900 text-[10px]"
                          style={{ minWidth: 64 }}>{fmtN(grandFC)}</td>
                        <td className="border-t-2 border-l border-gray-300 px-1.5 py-1.5 text-right tabular-nums whitespace-nowrap font-bold text-blue-700 text-[10px]"
                          style={{ minWidth: 64 }}>{fmtN(grandReal)}</td>
                        <td className="border-t-2 border-l border-gray-300 px-1.5 py-1.5 text-center text-[10px] font-semibold"
                          style={{ minWidth: 56 }}>
                          <span className={grandFC > 0
                            ? (grandReal / grandFC >= 1 ? 'text-green-600' : grandReal / grandFC >= 0.5 ? 'text-amber-600' : 'text-red-600')
                            : 'text-gray-400'}>
                            {grandFC > 0 ? `${(grandReal / grandFC * 100).toFixed(0)}%` : '—'}
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  )
                })()}
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Resumo por Linha ──────────────────────────────────────────── */}
      {activeTab === 'resumo' && summary && (
        <div className="space-y-6">
          {/* Atingimento chart */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Forecast vs Realizado por linha S&OP
            </h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={summary} margin={{ top: 4, right: 8, left: 8, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="linha" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v/1e3).toFixed(0)}k`} />
                <Tooltip formatter={(v) => formatNumber(v as number, 0) + ' un'} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="forecast" name="Forecast" fill="#32373c" radius={[4,4,0,0]} />
                <Bar dataKey="real"     name="Realizado" fill="#2563eb" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tabela resumo com meses */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="text-[11px] border-collapse w-full">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="px-3 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">Linha S&OP</th>
                    {MONTH_LABEL.map(m => (
                      <th key={m} className="px-1 py-2.5 text-center font-semibold text-gray-500 whitespace-nowrap w-14">{m}</th>
                    ))}
                    <th className="px-3 py-2.5 text-right font-semibold text-gray-700 whitespace-nowrap border-l-2 border-gray-300">Total FC</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-blue-600 whitespace-nowrap">Real</th>
                    <th className="px-3 py-2.5 text-center font-semibold text-gray-600 whitespace-nowrap w-40">Atingimento</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((row, idx) => {
                    const base = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    const at = row.atingimento
                    return (
                      <tr key={row.linha} className={`border-b border-gray-50 hover:bg-gray-50 ${base}`}>
                        <td className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap">{row.linha}</td>
                        {MONTH_KEYS.map((mk, mi) => {
                          const fc   = row.fc_mes?.[mk] ?? 0
                          const real = row.real_mes?.[mk] ?? 0
                          return (
                            <td key={mi} className={`px-0.5 py-1 text-center align-top ${cellBg(fc, real)}`}
                              title={`FC: ${formatNumber(fc,0)} | Real: ${formatNumber(real,0)}`}>
                              <div className="leading-none">
                                {fc > 0   && <div className="text-[9px] font-medium text-gray-700">{fmtN(fc)}</div>}
                                {real > 0 && <div className="text-[9px] text-blue-600">{fmtN(real)}</div>}
                                {fc === 0 && real === 0 && <span className="text-gray-200">·</span>}
                              </div>
                            </td>
                          )
                        })}
                        <td className="px-3 py-2 text-right tabular-nums font-semibold text-gray-900 border-l-2 border-gray-200">
                          {formatNumber(row.forecast, 0)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums font-semibold text-blue-700">
                          {formatNumber(row.real, 0)}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all"
                                style={{
                                  width: `${Math.min(at, 100)}%`,
                                  backgroundColor: at >= 100 ? '#16a34a' : at >= 75 ? '#22c55e' : at >= 50 ? '#d97706' : '#D92214'
                                }} />
                            </div>
                            <span className={`text-xs font-semibold w-12 text-right ${
                              at >= 100 ? 'text-green-600' : at >= 75 ? 'text-green-500' :
                              at >= 50 ? 'text-amber-600' : 'text-red-600'
                            }`}>{at.toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
