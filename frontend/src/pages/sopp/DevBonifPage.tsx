import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts'
import { useDevolucaoData, useBonificacaoData, useSoppFilters } from '../../hooks/useSopp'
import type { DevBonifParams } from '../../lib/sopp'
import { fmtMes } from '../../lib/utils'

// ─── helpers ──────────────────────────────────────────────────────────────────

const BRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

const N = (v: number) =>
  v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })

const COLORS = ['#D92214','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#14b8a6']

// ─── sub-components ───────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color = 'text-gray-900' }: {
  label: string; value: string; sub?: string; color?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  )
}

function FilterBar({
  params, onChange, linhas, supervisores, ufs,
}: {
  params: DevBonifParams
  onChange: (p: DevBonifParams) => void
  linhas: string[]
  supervisores: string[]
  ufs: string[]
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">De</label>
        <input type="date" className="h-9 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          value={params.date_from ?? ''}
          onChange={e => onChange({ ...params, date_from: e.target.value || undefined })} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">Até</label>
        <input type="date" className="h-9 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          value={params.date_to ?? ''}
          onChange={e => onChange({ ...params, date_to: e.target.value || undefined })} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">Linha</label>
        <select className="h-9 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          value={params.linha ?? ''}
          onChange={e => onChange({ ...params, linha: e.target.value || undefined })}>
          <option value="">Todas</option>
          {linhas.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">Supervisor</label>
        <select className="h-9 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 max-w-[200px]"
          value={params.supervisor ?? ''}
          onChange={e => onChange({ ...params, supervisor: e.target.value || undefined })}>
          <option value="">Todos</option>
          {supervisores.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">UF</label>
        <select className="h-9 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          value={params.uf ?? ''}
          onChange={e => onChange({ ...params, uf: e.target.value || undefined })}>
          <option value="">Todas</option>
          {ufs.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>
      <button className="h-9 px-4 rounded-lg text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50"
        onClick={() => onChange({})}>
        Limpar
      </button>
    </div>
  )
}

function HBarChart({ data, dataKey = 'valor', labelKey = 'area', fmt = BRL }: {
  data: Record<string, unknown>[]
  dataKey?: string
  labelKey?: string
  fmt?: (v: number) => string
}) {
  const top = data.slice(0, 12)
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, top.length * 38)}>
      <BarChart data={top} layout="vertical" margin={{ left: 8, right: 60, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tickFormatter={v => BRL(v)} tick={{ fontSize: 10 }} />
        <YAxis type="category" dataKey={labelKey} width={160} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v) => fmt(v as number)} />
        <Bar dataKey={dataKey} radius={[0, 4, 4, 0]}>
          {top.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function LineChart12({ data }: { data: { mes: string; valor: number; qtde: number; cnt: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="mes" tick={{ fontSize: 10 }} tickFormatter={fmtMes} />
        <YAxis tickFormatter={v => BRL(v)} tick={{ fontSize: 10 }} width={70} />
        <Tooltip formatter={(v) => BRL(v as number)} />
        <Bar dataKey="valor" name="Valor" fill="#D92214" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function MiniPie({ data, dataKey = 'valor', nameKey = 'area' }: {
  data: Record<string, unknown>[]
  dataKey?: string
  nameKey?: string
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey={dataKey} nameKey={nameKey} cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip formatter={(v) => BRL(v as number)} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

function RankTable({ rows, valueKey = 'valor', nameKey, title }: {
  rows: Record<string, unknown>[]
  valueKey?: string
  nameKey: string
  title: string
}) {
  const total = rows.reduce((s, r) => s + (r[valueKey] as number), 0)
  return (
    <div className="overflow-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-3 py-2 text-left font-semibold text-gray-700">{title}</th>
            <th className="px-3 py-2 text-right font-semibold text-gray-700">Valor (R$)</th>
            <th className="px-3 py-2 text-right font-semibold text-gray-700">%</th>
            {'cnt' in (rows[0] ?? {}) && <th className="px-3 py-2 text-right font-semibold text-gray-700">NFs</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const val = r[valueKey] as number
            const pct = total > 0 ? (val / total) * 100 : 0
            return (
              <tr key={i} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                <td className="px-3 py-1.5 text-gray-800">{r[nameKey] as string}</td>
                <td className="px-3 py-1.5 text-right tabular-nums font-medium">{BRL(val)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums text-gray-500">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 bg-gray-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-red-400" style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                    {pct.toFixed(1)}%
                  </div>
                </td>
                {'cnt' in r && <td className="px-3 py-1.5 text-right tabular-nums text-gray-500">{N(r.cnt as number)}</td>}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── tab: Devoluções ──────────────────────────────────────────────────────────

function DevolucaoTab({ params }: { params: DevBonifParams }) {
  const { data, isLoading } = useDevolucaoData(params)

  if (isLoading) return <div className="text-center py-12 text-gray-400">Carregando…</div>
  if (!data) return null

  const { kpis, por_area, por_motivo, por_linha, por_supervisor, por_uf, por_periodo } = data

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Valor Total" value={BRL(kpis.valor_total)} color="text-red-600" />
        <KpiCard label="Qtde. Itens" value={N(kpis.total_qtde)} />
        <KpiCard label="Nº Notas" value={N(kpis.total_nfs)} />
      </div>

      {/* Evolução mensal */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Evolução Mensal</h3>
        <LineChart12 data={por_periodo} />
      </div>

      {/* Área + Motivo */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Por Área Responsável</h3>
          <MiniPie data={por_area} nameKey="area" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Por Motivo</h3>
          <HBarChart data={por_motivo} labelKey="motivo" />
        </div>
      </div>

      {/* Tabelas: Área e Motivo */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Ranking — Área</h3>
          {por_area.length > 0 && <RankTable rows={por_area} nameKey="area" title="Área" />}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Ranking — Motivo</h3>
          {por_motivo.length > 0 && <RankTable rows={por_motivo} nameKey="motivo" title="Motivo" />}
        </div>
      </div>

      {/* Linha + Supervisor */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Por Linha S&OP</h3>
          {por_linha.length > 0 && <RankTable rows={por_linha} nameKey="linha" title="Linha" />}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Por Supervisor</h3>
          {por_supervisor.length > 0 && <RankTable rows={por_supervisor} nameKey="supervisor" title="Supervisor" />}
        </div>
      </div>

      {/* UF */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Por UF — Top 15</h3>
        <HBarChart data={por_uf.slice(0, 15)} labelKey="uf" />
      </div>
    </div>
  )
}

// ─── tab: Bonificações ────────────────────────────────────────────────────────

function BonificacaoTab({ params }: { params: DevBonifParams }) {
  const { data, isLoading } = useBonificacaoData(params)

  if (isLoading) return <div className="text-center py-12 text-gray-400">Carregando…</div>
  if (!data) return null

  const { kpis, por_subtipo, por_linha, por_supervisor, por_uf, por_periodo, por_cliente } = data

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Bonificações" value={BRL(kpis.valor_total)} color="text-blue-700" />
        <KpiCard label="Bonificação" value={BRL(kpis.vl_bonific)} sub="Tipo: Bonific" />
        <KpiCard label="Verba" value={BRL(kpis.vl_verba)} sub="Tipo: Verba" />
        <KpiCard label="Qtde. Itens" value={N(kpis.total_qtde)} sub={`${N(kpis.total_nfs)} notas`} />
      </div>

      {/* Evolução + Subtipo */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Evolução Mensal</h3>
          <LineChart12 data={por_periodo} />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Bonific. vs Verba</h3>
          <MiniPie data={por_subtipo} nameKey="subtipo" />
        </div>
      </div>

      {/* Linha + Supervisor */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Por Linha S&OP</h3>
          {por_linha.length > 0 && <RankTable rows={por_linha} nameKey="linha" title="Linha" />}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Por Supervisor</h3>
          {por_supervisor.length > 0 && <RankTable rows={por_supervisor} nameKey="supervisor" title="Supervisor" />}
        </div>
      </div>

      {/* Top Clientes */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Top 20 Clientes</h3>
        <HBarChart data={por_cliente} labelKey="cliente" />
      </div>

      {/* UF */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Por UF</h3>
        <HBarChart data={por_uf.slice(0, 15)} labelKey="uf" />
      </div>
    </div>
  )
}

// ─── main page ────────────────────────────────────────────────────────────────

const TABS = ['Devoluções', 'Bonificações'] as const
type Tab = typeof TABS[number]

export default function DevBonifPage() {
  const [tab, setTab] = useState<Tab>('Devoluções')
  const [params, setParams] = useState<DevBonifParams>({})
  const { data: filters } = useSoppFilters()

  const linhas = filters?.linhas_pv ?? []
  const ufs = filters?.ufs ?? []
  const supervisores = filters?.vendedores_faturamento ?? []

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Devoluções & Bonificações</h1>
          <p className="text-sm text-gray-500">Análise detalhada por área, motivo e período</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Filters */}
      <FilterBar
        params={params}
        onChange={setParams}
        linhas={linhas}
        supervisores={supervisores}
        ufs={ufs}
      />

      {/* Content */}
      {tab === 'Devoluções'  && <DevolucaoTab  params={params} />}
      {tab === 'Bonificações' && <BonificacaoTab params={params} />}
    </div>
  )
}
