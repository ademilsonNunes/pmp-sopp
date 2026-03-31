import { useState, useMemo } from 'react'
import { AlertTriangle, CheckCircle, XCircle, Package, Search, Truck, RefreshCw } from 'lucide-react'
import { useEmbarque } from '../../hooks/useSopp'
import { formatNumber, fmtDiario } from '../../lib/utils'
import type { EmbarqueParams } from '../../lib/sopp'
import type { EmbarqueItem } from '../../types'

const LINHAS = [
  'Agua Sanitaria', 'Alvejante', 'Amaciante', 'Cloro',
  'Desinfetante', 'Lava Loucas', 'Lava Roupas', 'Limpador', 'Removedor',
]

// ─── helpers ──────────────────────────────────────────────────────────────────

const N = (v: number) => formatNumber(v, 0)

function statusColor(status: EmbarqueItem['status']) {
  if (status === 'RUPTURA') return { bg: 'bg-red-50', badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' }
  if (status === 'ALERTA')  return { bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' }
  return { bg: 'bg-white', badge: 'bg-green-100 text-green-700', dot: 'bg-green-500' }
}

/** Cor do saldo dentro da célula de dia */
function saldoCellStyle(saldo: number, demanda: number): React.CSSProperties {
  if (demanda === 0 && saldo >= 0) return { backgroundColor: '#f9fafb', color: '#9ca3af' }
  if (saldo < 0)    return { backgroundColor: '#fee2e2', color: '#991b1b', fontWeight: 700 }
  if (saldo < demanda) return { backgroundColor: '#fef3c7', color: '#92400e', fontWeight: 600 }
  return { backgroundColor: '#dcfce7', color: '#166534' }
}

function diaSemana(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  return ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d.getDay()]
}

function isHoje(dateStr: string) {
  return dateStr === new Date().toISOString().slice(0, 10)
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string | number; color: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
      <div className="rounded-lg p-2 flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function EmbarquePage() {
  const [params, setParams] = useState<EmbarqueParams>({ dias: 7 })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'RUPTURA' | 'ALERTA' | 'OK'>('TODOS')

  const queryParams: EmbarqueParams = {
    dias: params.dias,
    linha: params.linha,
    search: search.length >= 2 ? search : undefined,
  }
  const { data, isLoading, refetch, isFetching } = useEmbarque(queryParams)

  const items = useMemo(() => {
    if (!data) return []
    if (statusFilter === 'TODOS') return data.items
    return data.items.filter(i => i.status === statusFilter)
  }, [data, statusFilter])

  const datas = data?.datas ?? []

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prog. Embarque — Ruptura por Produto</h1>
          <p className="text-sm text-gray-500 mt-1">
            Demanda por DT_CARREGAMENTO × Estoque disponível × PMP — identifica rupturas nos próximos dias.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
        {/* Horizonte */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Horizonte:</span>
          {[7, 10, 14].map(d => (
            <button
              key={d}
              onClick={() => setParams(p => ({ ...p, dias: d }))}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                params.dias === d
                  ? 'text-white border-transparent'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
              style={params.dias === d ? { backgroundColor: '#D92214', borderColor: '#D92214' } : {}}
            >
              {d}d
            </button>
          ))}
        </div>

        {/* Linha */}
        <select
          value={params.linha ?? ''}
          onChange={e => setParams(p => ({ ...p, linha: e.target.value || undefined }))}
          className="border border-gray-200 rounded-lg text-sm px-3 py-1.5 bg-white text-gray-700"
        >
          <option value="">Todas as linhas</option>
          {LINHAS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>

        {/* Status */}
        <div className="flex items-center gap-1">
          {(['TODOS', 'RUPTURA', 'ALERTA', 'OK'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s
                  ? s === 'RUPTURA' ? 'bg-red-100 text-red-700'
                  : s === 'ALERTA'  ? 'bg-amber-100 text-amber-700'
                  : s === 'OK'      ? 'bg-green-100 text-green-700'
                  : 'bg-gray-200 text-gray-700'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Busca */}
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar SKU ou produto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white"
          />
        </div>
      </div>

      {/* KPIs */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard icon={Package}       label="SKUs com embarque"  value={N(data.kpis.total_prds)}   color="#2563eb" />
          <KpiCard icon={XCircle}       label="Em ruptura"          value={N(data.kpis.em_ruptura)}   color="#dc2626" />
          <KpiCard icon={AlertTriangle} label="Em alerta"           value={N(data.kpis.em_alerta)}    color="#d97706" />
          <KpiCard icon={Truck}         label="Demanda total (cx)"  value={N(data.kpis.demanda_total)} color="#16a34a" />
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-gray-200 rounded-full animate-spin"
            style={{ borderTopColor: '#D92214' }} />
        </div>
      )}

      {/* Tabela */}
      {!isLoading && data && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <CheckCircle size={40} className="text-green-400 mb-2" />
              <p className="font-medium">Nenhuma ruptura ou alerta no horizonte</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {/* Colunas fixas */}
                    <th className="sticky left-0 z-10 bg-gray-50 px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap border-r border-gray-200 min-w-[120px]">
                      SKU
                    </th>
                    <th className="sticky left-[120px] z-10 bg-gray-50 px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-200 min-w-[180px]">
                      Produto
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      Linha
                    </th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      Estoque
                    </th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      Status
                    </th>
                    {/* Colunas de dias */}
                    {datas.map(dt => (
                      <th
                        key={dt}
                        className={`px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide whitespace-nowrap min-w-[100px] ${
                          isHoje(dt) ? 'bg-blue-50 text-blue-700' : 'text-gray-500'
                        }`}
                      >
                        <div>{diaSemana(dt)}</div>
                        <div className="font-bold">{fmtDiario(dt)}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => {
                    const sc = statusColor(item.status)
                    return (
                      <tr key={item.cod_prd} className={`border-b border-gray-100 hover:brightness-95 transition-all ${sc.bg}`}>
                        {/* SKU */}
                        <td className={`sticky left-0 z-10 ${sc.bg} px-3 py-2 font-mono text-xs font-semibold text-gray-800 border-r border-gray-200 whitespace-nowrap`}>
                          {item.cod_prd}
                        </td>
                        {/* Produto */}
                        <td className={`sticky left-[120px] z-10 ${sc.bg} px-3 py-2 text-gray-700 border-r border-gray-200 max-w-[180px]`}>
                          <span className="block truncate text-xs leading-tight">{item.desc_prd}</span>
                        </td>
                        {/* Linha */}
                        <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">{item.linha}</td>
                        {/* Estoque */}
                        <td className="px-3 py-2 text-right font-medium text-gray-800 whitespace-nowrap text-xs">
                          {N(item.estoque_disp)} cx
                        </td>
                        {/* Status badge */}
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${sc.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            {item.status}
                          </span>
                        </td>
                        {/* Dias */}
                        {item.dias.map(dia => (
                          <td key={dia.data} className="px-1 py-1">
                            <div
                              className="rounded-lg px-2 py-1.5 text-center"
                              style={saldoCellStyle(dia.saldo, dia.demanda)}
                            >
                              {dia.demanda > 0 ? (
                                <>
                                  <p className="text-[9px] text-gray-500 leading-none mb-0.5">
                                    dem {N(dia.demanda)}
                                  </p>
                                  {dia.pmp > 0 && (
                                    <p className="text-[9px] text-blue-600 leading-none mb-0.5">
                                      pmp +{N(dia.pmp)}
                                    </p>
                                  )}
                                  <p className="text-xs font-bold leading-none">
                                    {dia.saldo < 0 ? '▼ ' : ''}{N(Math.abs(dia.saldo))}
                                  </p>
                                </>
                              ) : (
                                <p className="text-[10px] text-gray-300 leading-none">—</p>
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
                {/* Footer: totais por dia */}
                <tfoot>
                  <tr className="bg-gray-50 border-t-2 border-gray-300">
                    <td colSpan={4} className="sticky left-0 z-10 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600 border-r border-gray-200">
                      Total demanda do dia (cx)
                    </td>
                    <td className="px-3 py-2 border-r border-gray-200" />
                    {datas.map(dt => {
                      const total = items.reduce((s, item) => {
                        const dia = item.dias.find(d => d.data === dt)
                        return s + (dia?.demanda ?? 0)
                      }, 0)
                      return (
                        <td key={dt} className={`px-2 py-2 text-center text-xs font-bold ${
                          isHoje(dt) ? 'text-blue-700 bg-blue-50' : 'text-gray-700'
                        }`}>
                          {total > 0 ? N(total) : '—'}
                        </td>
                      )
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Legenda */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: '#dcfce7' }} /> Saldo OK (≥ demanda do dia)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: '#fef3c7' }} /> Alerta (saldo &lt; demanda média diária)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: '#fee2e2' }} /> Ruptura (saldo negativo)
        </span>
        <span className="flex items-center gap-1.5 ml-auto text-gray-400">
          <span className="font-medium">dem</span> = demanda do dia ·
          <span className="font-medium text-blue-600">pmp</span> = produção programada ·
          valor em negrito = saldo acumulado
        </span>
      </div>
    </div>
  )
}
