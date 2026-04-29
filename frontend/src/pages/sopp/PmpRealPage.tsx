import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { usePmpRealFilters, usePmpReal } from '../../hooks/useSopp'
import type { PmpRealItem } from '../../types'

// ─── constants ────────────────────────────────────────────────────────────────

const DAYS = Array.from({ length: 31 }, (_, i) => `d${String(i + 1).padStart(2, '0')}`)
const DAY_LABELS = Array.from({ length: 31 }, (_, i) => String(i + 1))

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (!n) return '—'
  return n >= 1000
    ? n.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
    : n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
}

function cellBg(prog: number, real: number): string {
  if (prog === 0 && real === 0) return ''
  if (prog === 0) return 'bg-blue-50'
  const r = real / prog
  if (r >= 1.0)  return 'bg-green-100'
  if (r >= 0.75) return 'bg-green-50'
  if (r >= 0.5)  return 'bg-amber-50'
  if (r >= 0.25) return 'bg-orange-50'
  return 'bg-red-50'
}

// ─── sub-components ───────────────────────────────────────────────────────────

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      <span className="text-2xl font-bold text-gray-900">{value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  )
}

function DayCell({ prog, real }: { prog: number; real: number }) {
  if (prog === 0 && real === 0) return <td className="border-r border-gray-100 w-12" />
  return (
    <td className={`border-r border-gray-100 w-12 p-0 ${cellBg(prog, real)}`}>
      <div className="flex flex-col items-center leading-tight py-0.5 px-0.5">
        <span className="text-[10px] text-gray-500">{prog > 0 ? fmt(prog) : ''}</span>
        <span className="text-[10px] font-semibold text-blue-700">{real > 0 ? fmt(real) : ''}</span>
      </div>
    </td>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

export default function PmpRealPage() {
  const { data: filters } = usePmpRealFilters()

  const defaultMes = useMemo(() => {
    if (filters?.meses?.length) return filters.meses[0]
    const now = new Date()
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  }, [filters])

  const [mesref, setMesref] = useState<string>('')
  const [linha, setLinha]   = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const [inputVal, setInputVal] = useState('')

  const activeMes = mesref || defaultMes

  const { data, isLoading } = usePmpReal({
    mesref: activeMes || undefined,
    linha: linha || undefined,
    search: search || undefined,
  })

  // footer totals per day
  const footerProg = useMemo(() => {
    if (!data?.items) return {}
    return DAYS.reduce<Record<string, number>>((acc, d) => {
      acc[d] = data.items.reduce((s, it) => s + (it.prog[d] ?? 0), 0)
      return acc
    }, {})
  }, [data])

  const footerReal = useMemo(() => {
    if (!data?.items) return {}
    return DAYS.reduce<Record<string, number>>((acc, d) => {
      acc[d] = data.items.reduce((s, it) => s + (it.real[d] ?? 0), 0)
      return acc
    }, {})
  }, [data])

  // format mesref label e.g. "202603" → "Mar/2026"
  function mesLabel(m: string) {
    const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
    const yr = m.slice(0, 4)
    const mo = parseInt(m.slice(4, 6), 10)
    return `${months[mo - 1]}/${yr}`
  }

  const kpis = data?.kpis
  const items: PmpRealItem[] = data?.items ?? []

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
        {/* Mês */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Mês referência</label>
          <select
            className="h-9 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            value={mesref || activeMes}
            onChange={e => setMesref(e.target.value)}
          >
            {(filters?.meses ?? [activeMes]).map(m => (
              <option key={m} value={m}>{mesLabel(m)}</option>
            ))}
          </select>
        </div>

        {/* Linha */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Linha</label>
          <select
            className="h-9 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            value={linha}
            onChange={e => setLinha(e.target.value)}
          >
            <option value="">Todas</option>
            {(filters?.linhas ?? []).map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-gray-600">Busca</label>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
            <input
              className="w-full h-9 pl-8 pr-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Código ou descrição..."
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setSearch(inputVal)}
            />
          </div>
        </div>

        <button
          className="h-9 px-4 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: '#D92214' }}
          onClick={() => setSearch(inputVal)}
        >
          Buscar
        </button>
        <button
          className="h-9 px-4 rounded-lg text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50"
          onClick={() => { setMesref(''); setLinha(''); setSearch(''); setInputVal('') }}
        >
          Limpar
        </button>
      </div>

      {/* Legenda */}
      <div className="flex gap-4 text-xs justify-center text-gray-500 flex-wrap">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 inline-block" /> ≥ 100%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-50 inline-block" /> 75–99%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-50 inline-block" /> 50–74%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-50 inline-block" /> 25–49%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-50 inline-block" /> &lt; 25%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-50 inline-block" /> Real s/ prog.</span>
        <span className="ml-4 text-gray-400">Linha superior = Programado · Linha inferior = Realizado</span>
      </div>

      {/* KPI cards */}
      {kpis && (
        <div className="grid grid-cols-3 gap-4">
          <KpiCard
            label="Programado"
            value={fmt(kpis.programado)}
            sub={`${items.length} SKUs`}
          />
          <KpiCard
            label="Realizado"
            value={fmt(kpis.realizado)}
          />
          <KpiCard
            label="Atingimento"
            value={`${kpis.atingimento.toFixed(1)}%`}
          />
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Carregando…</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Nenhum dado encontrado</div>
      ) : (
        <div className="overflow-auto rounded-xl border border-gray-200 bg-white">
          <table className="text-xs border-collapse min-w-max">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 sticky top-0 z-20">
                {/* sticky left cols */}
                <th className="sticky left-0 z-30 bg-gray-50 border-r border-gray-200 px-2 py-2 text-left font-semibold w-36 min-w-[144px]">
                  Produto
                </th>
                <th className="sticky left-36 z-30 bg-gray-50 border-r border-gray-200 px-2 py-2 text-left font-semibold w-48 min-w-[192px]">
                  Descrição
                </th>
                <th className="sticky left-[336px] z-30 bg-gray-50 border-r border-gray-300 px-2 py-2 text-left font-semibold w-28 min-w-[112px]">
                  Linha
                </th>
                <th className="border-r border-gray-200 px-2 py-2 text-right font-semibold w-20">
                  Prog. Total
                </th>
                <th className="border-r border-gray-300 px-2 py-2 text-right font-semibold w-20">
                  Real Total
                </th>
                {DAYS.map((d, i) => (
                  <th key={d} className="border-r border-gray-100 px-0 py-1 text-center font-semibold w-12 text-gray-600">
                    {DAY_LABELS[i]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr
                  key={item.cod_prd}
                  className={`border-b border-gray-100 hover:bg-blue-50/30 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}
                >
                  <td className="sticky left-0 z-10 bg-inherit border-r border-gray-200 px-2 py-1 font-mono text-[11px] whitespace-nowrap">
                    {item.cod_prd}
                  </td>
                  <td className="sticky left-36 z-10 bg-inherit border-r border-gray-200 px-2 py-1 whitespace-nowrap max-w-[192px] truncate">
                    {item.desc}
                  </td>
                  <td className="sticky left-[336px] z-10 bg-inherit border-r border-gray-300 px-2 py-1 whitespace-nowrap text-gray-600">
                    {item.linha}
                  </td>
                  <td className="border-r border-gray-200 px-2 py-1 text-right tabular-nums">
                    {item.programado > 0 ? fmt(item.programado) : '—'}
                  </td>
                  <td className={`border-r border-gray-300 px-2 py-1 text-right tabular-nums font-semibold ${
                    item.programado > 0
                      ? item.realizado >= item.programado
                        ? 'text-green-700'
                        : item.realizado >= item.programado * 0.75
                        ? 'text-amber-700'
                        : 'text-red-600'
                      : ''
                  }`}>
                    {item.realizado > 0 ? fmt(item.realizado) : '—'}
                  </td>
                  {DAYS.map(d => (
                    <DayCell key={d} prog={item.prog[d] ?? 0} real={item.real[d] ?? 0} />
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 bg-gray-100 font-semibold sticky bottom-0 z-20">
                <td colSpan={3} className="sticky left-0 z-30 bg-gray-100 border-r border-gray-300 px-2 py-1.5">
                  Total
                </td>
                <td className="border-r border-gray-200 px-2 py-1.5 text-right tabular-nums">
                  {fmt(items.reduce((s, it) => s + it.programado, 0))}
                </td>
                <td className="border-r border-gray-300 px-2 py-1.5 text-right tabular-nums text-blue-700">
                  {fmt(items.reduce((s, it) => s + it.realizado, 0))}
                </td>
                {DAYS.map(d => (
                  <DayCell key={d} prog={footerProg[d] ?? 0} real={footerReal[d] ?? 0} />
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
