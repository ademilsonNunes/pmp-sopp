import { useState } from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { ShoppingCart, Boxes, Receipt, Factory, TrendingUp, ArrowDownLeft, Gift, ToggleLeft, ToggleRight } from 'lucide-react'
import { useDashboard } from '../../hooks/useSopp'
import { formatNumber, fmtMes, fmtDiario } from '../../lib/utils'

function KpiCard({
  icon: Icon, label, value, sub, pct, pctColor, color,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  pct?: string        // ex: "2,2% do fat."
  pctColor?: string   // ex: "#ea580c"
  color: string
}) {
  const fontSize = value.length > 12 ? 'text-lg' : value.length > 9 ? 'text-xl' : 'text-2xl'
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
      <div className="rounded-lg p-2.5 flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide leading-tight">{label}</p>
        <p className={`${fontSize} font-bold text-gray-900 mt-0.5 leading-tight break-words`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        {pct && (
          <p className="text-xs font-semibold mt-1" style={{ color: pctColor ?? color }}>
            {pct}
          </p>
        )}
      </div>
    </div>
  )
}

function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
        {children}
      </h2>
      {action}
    </div>
  )
}

const BRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

export default function SoppDashboard() {
  const { data, isLoading } = useDashboard()
  const [carteiraView, setCarteiraView] = useState<'qtde' | 'valor'>('qtde')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-gray-200 rounded-full animate-spin"
          style={{ borderTopColor: '#D92214' }} />
      </div>
    )
  }

  if (!data) return null

  const { kpis, fat_mensal, carteira_por_linha, producao_diaria, estoque_top10 } = data

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">S&OP — Visão Gerencial</h1>
        <p className="text-sm text-gray-500 mt-1">
          Dados consolidados de carteira, produção, estoque e faturamento.
        </p>
      </div>

      {/* KPIs */}
      {(() => {
        const pctFat = (v: number) =>
          kpis.fat_mes_atual > 0
            ? formatNumber((v / kpis.fat_mes_atual) * 100, 1) + '% do fat.'
            : '—'
        return (
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            <KpiCard icon={ShoppingCart}  label="Carteira em aberto"
              value={formatNumber(kpis.qtde_carteira, 0) + ' cx'}
              sub={BRL(kpis.valor_carteira)}
              color="#D92214" />
            <KpiCard icon={Receipt}       label="Faturamento do mês"
              value={formatNumber(kpis.qtde_fat_mes, 0) + ' cx'}
              sub={BRL(kpis.fat_mes_atual)}
              color="#2563eb" />
            <KpiCard icon={ArrowDownLeft} label="Devoluções do mês"
              value={formatNumber(kpis.qtde_devol_mes, 0) + ' cx'}
              sub={BRL(kpis.fat_devol_mes)}
              pct={pctFat(kpis.fat_devol_mes)}
              pctColor="#ea580c"
              color="#ea580c" />
            <KpiCard icon={Gift}          label="Bonificações do mês"
              value={formatNumber(kpis.qtde_bonif_mes, 0) + ' cx'}
              sub={BRL(kpis.fat_bonif_mes)}
              pct={pctFat(kpis.fat_bonif_mes)}
              pctColor="#d97706"
              color="#d97706" />
            <KpiCard icon={Factory}       label="Produção do mês (PA)"
              value={formatNumber(kpis.prod_mes_atual, 0) + ' cx'}
              color="#16a34a" />
            <KpiCard icon={Boxes}         label="Estoque disponível"
              value={formatNumber(kpis.estoque_disponivel, 0) + ' cx'}
              sub="Sobel (010)"
              color="#9333ea" />
            <KpiCard icon={TrendingUp}    label="Ticket médio (cx)"
              value={BRL(kpis.fat_mes_atual / Math.max(kpis.qtde_fat_mes, 1))}
              sub="Fat. líq. ÷ cx faturadas"
              color="#0891b2" />
          </div>
        )
      })()}

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Faturamento mensal — líquido + devoluções */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <SectionTitle>Faturamento mensal (líquido)</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={fat_mensal.map(d => ({ ...d, mes: fmtMes(d.mes) }))}
              margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1e6).toFixed(1)}M`} />
              <Tooltip formatter={(v) => BRL(v as number)} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="liquido" name="Líquido"     fill="#2563eb" radius={[4,4,0,0]} />
              <Bar dataKey="devol"   name="Devoluções"  fill="#ea580c" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Carteira por linha S&OP — qtde (caixas) ou valor, com toggle */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <SectionTitle
            action={
              <button
                onClick={() => setCarteiraView(v => v === 'qtde' ? 'valor' : 'qtde')}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800"
              >
                {carteiraView === 'qtde'
                  ? <><ToggleLeft size={16} /> Caixas</>
                  : <><ToggleRight size={16} /> Valor</>
                }
              </button>
            }
          >
            Carteira por linha ({carteiraView === 'qtde' ? 'caixas' : 'R$'})
          </SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={carteira_por_linha} layout="vertical"
              margin={{ top: 4, right: 50, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }}
                tickFormatter={v => carteiraView === 'qtde'
                  ? formatNumber(v, 0)
                  : `${(v/1e3).toFixed(0)}k`
                }
              />
              <YAxis dataKey="linha" type="category" tick={{ fontSize: 10 }} width={100} />
              <Tooltip formatter={(v) =>
                carteiraView === 'qtde'
                  ? formatNumber(v as number, 0) + ' cx'
                  : BRL(v as number)
              } />
              <Bar
                dataKey={carteiraView}
                name={carteiraView === 'qtde' ? 'Caixas' : 'Valor'}
                fill="#D92214"
                radius={[0,4,4,0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produção diária */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <SectionTitle>Produção PA — últimos 30 dias</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={producao_diaria}
              margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="data" tick={{ fontSize: 10 }}
                tickFormatter={d => d ? fmtDiario(d) : ''} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => formatNumber(v, 0)} />
              <Tooltip formatter={(v) => formatNumber(v as number, 0) + ' un'} />
              <Line type="monotone" dataKey="qtde" name="Qtde PA" stroke="#16a34a"
                strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top 10 estoque disponível */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <SectionTitle>Top 10 produtos — estoque disponível</SectionTitle>
          <div className="space-y-2 mt-2">
            {estoque_top10.map((item, i) => {
              const max = estoque_top10[0]?.disp || 1
              return (
                <div key={item.cod_prd} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-4 text-right flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-xs mb-0.5 gap-2">
                      <div className="min-w-0">
                        <span className="font-medium text-gray-800 block truncate">{item.cod_prd}</span>
                        <span className="text-gray-400 block truncate text-[10px] leading-tight">{item.desc_prd}</span>
                      </div>
                      <span className="text-gray-600 font-medium flex-shrink-0 self-center">
                        {formatNumber(item.disp, 0)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(item.disp / max) * 100}%`, backgroundColor: '#9333ea' }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
