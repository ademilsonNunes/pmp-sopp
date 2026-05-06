import React, { useMemo, useState, type ReactNode } from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts'
import {
  CalendarDays,
  Target,
  Receipt,
  ArrowDownLeft,
  Wallet,
  Calculator,
  TrendingUp,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { useDashboard, useForecastSummary } from '../../hooks/useSopp'
import { useFeriadosList } from '../../hooks/useFeriados'
import { formatNumber, fmtMes, fmtDiario } from '../../lib/utils'

function KpiCard({
  icon: Icon, label, value, sub, pct, pctColor, color, className = '',
}: {
  icon: React.ElementType
  label: string
  value: ReactNode
  sub?: ReactNode
  pct?: string        // ex: "2,2% do fat."
  pctColor?: string   // ex: "#ea580c"
  color: string
  className?: string
}) {
  const valueText = typeof value === 'string' ? value : ''
  const fontSize = valueText.length > 13 ? 'text-base' : valueText.length > 9 ? 'text-lg' : 'text-xl'
  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm p-2 flex items-start gap-2 min-h-[110px] ${className}`}>
      <div className="rounded-lg p-2 flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide leading-tight">{label}</p>
        <p className={`${fontSize} font-bold text-gray-900 mt-0.5 leading-tight break-words`}>{value}</p>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
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

type DevolucaoPorDia = {
  data: string
  faturamento_bruto_caixas: number
  devolucao_caixas: number
  pct_dev: number
  faturamento_liquido_caixas: number
}

function formatDateBR(value: string) {
  if (!value) return ''

  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

function DevolucoesPorDiaCard({ rows }: { rows: DevolucaoPorDia[] }) {
  const totais = rows.reduce(
    (acc, row) => ({
      bruto: acc.bruto + Number(row.faturamento_bruto_caixas || 0),
      devolucao: acc.devolucao + Number(row.devolucao_caixas || 0),
      liquido: acc.liquido + Number(row.faturamento_liquido_caixas || 0),
    }),
    { bruto: 0, devolucao: 0, liquido: 0 },
  )

  const pctTotal = totais.bruto > 0 ? (totais.devolucao / totais.bruto) * 100 : 0

  const colunas = 'grid-cols-[1.2fr_1fr_1fr_1fr_1.2fr]'

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden h-[475px] flex flex-col">
      <div className="px-5 py-3 border-b border-gray-100">
        <SectionTitle>Devoluções por dia — caixas</SectionTitle>
      </div>

      <div className="overflow-x-auto px-2 flex-1 min-h-420">
        <div className="min-w-[370px] h-full flex flex-col">
          {/* Cabeçalho */}
          <div className={`grid ${colunas} bg-red-700 text-white rounded-xl overflow-hidden text-[11px]`}>
            <div className="px-4 py-3 text-center font-semibold uppercase tracking-wide flex items-center justify-center">
              Data
            </div>

            <div className="px-4 py-3 text-center font-semibold uppercase tracking-wide flex items-center justify-center">
              Fat.
            </div>

            <div className="px-4 py-3 text-center font-semibold uppercase tracking-wide flex items-center justify-center">
              Dev
            </div>

            <div className="px-4 py-3 text-center font-semibold uppercase tracking-wide flex items-center justify-center">
              Dev %
            </div>

            <div className="px-4 py-3 text-center font-semibold uppercase tracking-wide flex items-center justify-center">
              Fat. Liq.
            </div>
          </div>

          {/* Corpo com rolagem vertical */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {rows.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400 text-sm">
                Sem devoluções no período filtrado
              </div>
            ) : (
              <div>
                {rows.map((row) => (
                  <div
                    key={row.data}
                    className={`grid ${colunas} border-b border-gray-100 text-sm`}
                  >
                    <div className="px-2 py-3 text-gray-700">
                      {formatDateBR(row.data)}
                    </div>
                
                    <div className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatNumber(row.faturamento_bruto_caixas, 0)}
                    </div>
                
                    <div className="px-4 py-3 text-right font-medium text-orange-600">
                      {row.devolucao_caixas > 0 ? `-${formatNumber(row.devolucao_caixas, 0)}` : '0'}
                    </div>
                
                    <div className="px-4 py-3 text-right text-gray-700">
                      {formatNumber(row.pct_dev, 2)}%
                    </div>
                
                    <div className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatNumber(row.faturamento_liquido_caixas, 0)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rodapé fixo no final do card */}
      {rows.length > 0 && (
        <div className="mt-auto px-2 pb-4 overflow-x-auto">
          <div className={`grid ${colunas} min-w-[370px] bg-gray-50 border-t border-gray-200 rounded-b-xl text-sm`}>
            <div className="px-4 py-4 font-bold text-gray-900">
              Total
            </div>

            <div className="px-4 py-4 text-right font-bold text-gray-900">
              {formatNumber(totais.bruto, 0)}
            </div>

            <div className="px-4 py-4 text-right font-bold text-orange-600">
              {totais.devolucao > 0 ? `-${formatNumber(totais.devolucao, 0)}` : '0'}
            </div>

            <div className="px-4 py-4 text-right font-bold text-gray-900">
              {formatNumber(pctTotal, 2)}%
            </div>

            <div className="px-4 py-4 text-right font-bold text-gray-900">
              {formatNumber(totais.liquido, 0)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const BRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

const MESES_PT = [
  'JANEIRO',
  'FEVEREIRO',
  'MARÇO',
  'ABRIL',
  'MAIO',
  'JUNHO',
  'JULHO',
  'AGOSTO',
  'SETEMBRO',
  'OUTUBRO',
  'NOVEMBRO',
  'DEZEMBRO',
]

const FC_MES_KEYS = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set_m',
  'out_m',
  'nov',
  'dez',
]

function toIsoDateLocal(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isDiaUtil(date: Date, feriadosSet: Set<string>) {
  const diaSemana = date.getDay()
  const isSabado = diaSemana === 6
  const isDomingo = diaSemana === 0
  const isFeriado = feriadosSet.has(toIsoDateLocal(date))

  return !isSabado && !isDomingo && !isFeriado
}

function contarDiasUteisMes(ano: number, mesIndex: number, feriados: string[]) {
  const feriadosSet = new Set(feriados)
  const ultimoDia = new Date(ano, mesIndex + 1, 0).getDate()
  let total = 0

  for (let dia = 1; dia <= ultimoDia; dia++) {
    const data = new Date(ano, mesIndex, dia)
    if (isDiaUtil(data, feriadosSet)) total++
  }

  return total
}

function contarDiasRealizadosMes(ano: number, mesIndex: number, feriados: string[]) {
  const hoje = new Date()

  if (hoje.getFullYear() !== ano || hoje.getMonth() !== mesIndex) {
    return contarDiasUteisMes(ano, mesIndex, feriados)
  }

  const feriadosSet = new Set(feriados)
  let total = 0

  for (let dia = 1; dia <= hoje.getDate(); dia++) {
    const data = new Date(ano, mesIndex, dia)
    if (isDiaUtil(data, feriadosSet)) total++
  }

  return total
}

function contarDiasUteisPeriodo(
  ano: number,
  mesIndex: number,
  diaInicio: number,
  diaFim: number,
  feriados: string[],
) {
  const feriadosSet = new Set(feriados)
  let total = 0

  for (let dia = diaInicio; dia <= diaFim; dia++) {
    const data = new Date(ano, mesIndex, dia)

    if (isDiaUtil(data, feriadosSet)) {
      total++
    }
  }

  return total
}

export default function SoppDashboard() {
  const hoje = new Date()

  const [diaInicio, setDiaInicio] = useState(1)
  const [diaTermino, setDiaTermino] = useState(hoje.getDate())

  const [diaInicioInput, setDiaInicioInput] = useState('1')
  const [diaTerminoInput, setDiaTerminoInput] = useState(String(hoje.getDate()))

  const [mesFiltro, setMesFiltro] = useState(hoje.getMonth() + 1)
  const [anoFiltro, setAnoFiltro] = useState(hoje.getFullYear())
  const [empresaFiltro, setEmpresaFiltro] = useState('consolidado')

  const ultimoDiaMes = new Date(anoFiltro, mesFiltro, 0).getDate()

  const aplicarDiaInicio = () => {
    const valor = Number(diaInicioInput)

    if (!Number.isFinite(valor) || diaInicioInput.trim() === '') {
      setDiaInicio(1)
      setDiaInicioInput('1')
      return
    }

    const valorAjustado = Math.min(Math.max(Math.trunc(valor), 1), ultimoDiaMes)

    setDiaInicio(valorAjustado)
    setDiaInicioInput(String(valorAjustado))
  }

  const aplicarDiaTermino = () => {
    const valor = Number(diaTerminoInput)

    if (!Number.isFinite(valor) || diaTerminoInput.trim() === '') {
      setDiaTermino(ultimoDiaMes)
      setDiaTerminoInput(String(ultimoDiaMes))
      return
    }

    const valorAjustado = Math.min(Math.max(Math.trunc(valor), 1), ultimoDiaMes)

    setDiaTermino(valorAjustado)
    setDiaTerminoInput(String(valorAjustado))
  }

  const aplicarComEnter = (
    event: React.KeyboardEvent<HTMLInputElement>,
    aplicar: () => void,
  ) => {
    if (event.key === 'Enter') {
      aplicar()
      event.currentTarget.blur()
    }
  }


  const diaInicioSeguro = Math.min(Math.max(diaInicio, 1), ultimoDiaMes)
  const diaTerminoSeguro = Math.min(Math.max(diaTermino, diaInicioSeguro), ultimoDiaMes)

  const dateFrom = `${anoFiltro}-${String(mesFiltro).padStart(2, '0')}-${String(diaInicioSeguro).padStart(2, '0')}`
  const dateTo = `${anoFiltro}-${String(mesFiltro).padStart(2, '0')}-${String(diaTerminoSeguro).padStart(2, '0')}`

  const dashboardParams = {
    date_from: dateFrom,
    date_to: dateTo,
    empresa: empresaFiltro === 'consolidado' ? undefined : empresaFiltro,
  }

  const { data, isLoading } = useDashboard(dashboardParams)
  const { data: forecastSummary = [] } = useForecastSummary()
  const [carteiraView, setCarteiraView] = useState<'qtde' | 'valor'>('qtde')

  const anoAtual = anoFiltro
  const mesAtual = mesFiltro
  const mesIndexAtual = mesFiltro - 1

  const { data: feriados = [] } = useFeriadosList({
    ano: anoAtual,
    mes: mesAtual,
    somente_ativos: true,
  })

  const feriadosDatas = useMemo(
    () => feriados.map((f) => f.data_feriado),
    [feriados],
  )

  const diasDisponiveis = useMemo(
    () => contarDiasUteisMes(anoAtual, mesIndexAtual, feriadosDatas),
    [anoAtual, mesIndexAtual, feriadosDatas],
  )

  const diasRealizados = useMemo(
    () =>
      contarDiasUteisPeriodo(
        anoAtual,
        mesIndexAtual,
        diaInicioSeguro,
        diaTerminoSeguro,
        feriadosDatas,
      ),
    [anoAtual, mesIndexAtual, diaInicioSeguro, diaTerminoSeguro, feriadosDatas],
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-gray-200 rounded-full animate-spin"
          style={{ borderTopColor: '#D92214' }} />
      </div>
    )
  }

  if (!data) return null

  const { kpis, fat_mensal, carteira_por_linha, faturamento_por_familia, top_clientes_faturamento, producao_diaria, estoque_top10, devolucoes_por_dia } = data

  const toGo = Math.max(diasDisponiveis - diasRealizados, 0)

  const mesTitulo = `${MESES_PT[mesIndexAtual]} - ${anoAtual}`

  const metaDoMes = forecastSummary.reduce((acc, item) => {
    const key = FC_MES_KEYS[mesIndexAtual]
    return acc + Number(item.fc_mes?.[key] || 0)
  }, 0)

  const faturamentoBruto = Number(kpis.fat_mes_atual || 0)
  const devolucoes = Number(kpis.fat_devol_mes || 0)
  const bonificacoes = Number(kpis.fat_bonif_mes || 0)

  const faturamentoLiquido = faturamentoBruto - devolucoes - bonificacoes

  const caixasFaturadas = Number(kpis.qtde_fat_mes || 0)
  const caixasDevolvidas = Number(kpis.qtde_devol_mes || 0)
  const caixasBonificadas = Number(kpis.qtde_bonif_mes || 0)

  const caixasLiquidas = caixasFaturadas - caixasDevolvidas - caixasBonificadas

  const mediaRealizada = diasRealizados > 0
    ? caixasFaturadas / diasRealizados
    : 0

  const mediaFixa = diasDisponiveis > 0
    ? metaDoMes / diasDisponiveis
    : 0

  const mediaRealizadaAtingiuMeta = mediaRealizada >= mediaFixa

  const previsaoFechamentoLiquida = Math.max(
    mediaRealizada * diasDisponiveis - caixasDevolvidas - caixasBonificadas,
    0,
  ) 

  const kpisCifFob = kpis as typeof kpis & {
    fat_cif?: number
    fat_fob?: number
  }

  const cifFobFaturados = [
    {
      name: 'CIF',
      value: Number(kpisCifFob.fat_cif || 0),
    },
    {
      name: 'FOB',
      value: Number(kpisCifFob.fat_fob || 0),
    },
  ].filter(item => item.value > 0)

  const cifFobColors: Record<string, string> = {
    CIF: '#2563eb',
    FOB: '#f97316',
  }

  const ClientYAxisTick = (props: any) => {
    const { x, y, payload } = props

    const text = String(payload.value ?? '').replace(/\s+/g, ' ').trim()
    const maxLineLength = 28

    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''

    words.forEach((word) => {
      if (lines.length >= 2) return

      const nextLine = currentLine ? `${currentLine} ${word}` : word

      if (nextLine.length <= maxLineLength) {
        currentLine = nextLine
      } else {
        lines.push(currentLine)
        currentLine = word
      }
    })

    if (currentLine && lines.length < 2) {
      lines.push(currentLine)
    }

    if (words.join(' ').length > lines.join(' ').length && lines.length > 0) {
      lines[lines.length - 1] = `${lines[lines.length - 1].slice(0, 25)}...`
    }

    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={-8}
          y={0}
          textAnchor="end"
          fill="#6B7280"
          fontSize={10}
        >
          {lines.map((line, index) => (
            <tspan
              key={index}
              x={-8}
              dy={index === 0 ? -(lines.length - 1) * 5 : 11}
            >
              {line}
            </tspan>
          ))}
        </text>
      </g>
    )
  }

  const percentualFaturamentoMeta =
    metaDoMes > 0
      ? Math.min((caixasFaturadas / metaDoMes) * 100, 100)
      : 0

  const renderCifFobLabel = (props: any) => {
    const {
      cx = 0,
      cy = 0,
      midAngle = 0,
      outerRadius = 0,
      percent = 0,
      name,
    } = props

    const RADIAN = Math.PI / 180

    // ponto de saída da linha na borda da fatia
    const sx = cx + (outerRadius + 4) * Math.cos(-midAngle * RADIAN)
    const sy = cy + (outerRadius + 4) * Math.sin(-midAngle * RADIAN)

    const positions: Record<
      string,
      { tx: number; ty: number; anchor: 'start' | 'end'; color: string }
    > = {
      CIF: {
        tx: cx - 95,
        ty: cy - 55,
        anchor: 'end',
        color: cifFobColors.CIF,
      },
      FOB: {
        tx: cx + 95,
        ty: cy + 55,
        anchor: 'start',
        color: cifFobColors.FOB,
      },
    }

    const pos = positions[name] ?? {
      tx: cx,
      ty: cy,
      anchor: 'start' as const,
      color: '#374151',
    }

    // pequeno "cotovelo" da linha antes do texto
    const bendX = pos.anchor === 'start' ? pos.tx - 10 : pos.tx + 10
    const bendY = pos.ty

    return (
      <g>
        <path
          d={`M ${sx} ${sy} L ${bendX} ${bendY} L ${pos.tx} ${pos.ty}`}
          stroke={pos.color}
          fill="none"
          strokeWidth={1.5}
        />
        <text
          x={pos.tx}
          y={pos.ty}
          textAnchor={pos.anchor}
          dominantBaseline="central"
          fill={pos.color}
          fontSize={14}
        >
          {`${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
        </text>
      </g>
    )
  }   
  
  return (
    <div className="space-y-2">
      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
              Dia início
            </label>
            <input
              type="number"
              min={1}
              max={ultimoDiaMes}
              value={diaInicioInput}
              onChange={(e) => setDiaInicioInput(e.target.value)}
              onBlur={aplicarDiaInicio}
              onKeyDown={(e) => aplicarComEnter(e, aplicarDiaInicio)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
              Dia término
            </label>
            <input
              type="number"
              min={1}
              max={ultimoDiaMes}
              value={diaTerminoInput}
              onChange={(e) => setDiaTerminoInput(e.target.value)}
              onBlur={aplicarDiaTermino}
              onKeyDown={(e) => aplicarComEnter(e, aplicarDiaTermino)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
              Mês
            </label>
            <select
              value={mesFiltro}
              onChange={(e) => setMesFiltro(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            >
              {MESES_PT.map((mes, index) => (
                <option key={mes} value={index + 1}>
                  {mes}
                </option>
              ))}
            </select>
          </div>
            
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
              Ano
            </label>
            <select
              value={anoFiltro}
              onChange={(e) => setAnoFiltro(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>
            
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
              Empresa
            </label>
            <select
              value={empresaFiltro}
              onChange={(e) => setEmpresaFiltro(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            >
              <option value="consolidado">Consolidado</option>
              <option value="jacana">Jaçanã</option>
              <option value="atibaia">Atibaia</option>
            </select>
          </div>
        </div>
            
      </div>
      {/* KPIs */}
      {(() => {
        const pctFat = (v: number) =>
          faturamentoBruto > 0
            ? formatNumber((v / faturamentoBruto) * 100, 1) + '% do fat.'
            : '—'

        return (
          <div className="overflow-x-auto mt-0.5 ">
            <div className="grid grid-cols-7 gap-1 min-w-[1320px]">
              <KpiCard
                icon={Target}
                label="Meta do mês"
                value={formatNumber(metaDoMes, 0) + ' cx'}
                sub="Total do Forecast"
                color="#9333ea"
              />

              <KpiCard
                icon={CalendarDays}
                label={mesTitulo}
                value={`${formatNumber(diasDisponiveis, 1)} dias`}
                sub={
                  <>
                    <div>Realizados: {formatNumber(diasRealizados, 1)}</div>
                    <div>TO GO: {formatNumber(toGo, 1)}</div>
                  </>
                }
                color="#D92214"
              />

              <KpiCard
                icon={Receipt}
                label="Fat. bruto"
                value={formatNumber(caixasFaturadas, 0) + ' cx'}
                sub={BRL(faturamentoBruto)}
                color="#2563eb"
              />

              <KpiCard
                icon={ArrowDownLeft}
                label="Devoluções"
                value={formatNumber(caixasDevolvidas, 0) + ' cx'}
                sub={BRL(devolucoes)}
                pct={pctFat(devolucoes)}
                pctColor="#ea580c"
                color="#ea580c"
              />

              <KpiCard
                icon={Wallet}
                label="Fat. líquido"
                value={formatNumber(caixasLiquidas, 0) + ' cx'}
                sub={BRL(faturamentoLiquido)}
                color="#16a34a"
              />

              <KpiCard
                icon={Calculator}
                label="Média realizada"
                value={
                  <span
                    className={`inline-flex items-center gap-1 text-lg ${
                      mediaRealizadaAtingiuMeta ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    <span className="text-sm">
                      {mediaRealizadaAtingiuMeta ? '▲' : '▼'}
                    </span>
                    {formatNumber(mediaRealizada, 0)} cx
                  </span>
                }
                sub={`Meta: ${formatNumber(mediaFixa, 0)} cx/dia`}
                color="#0891b2"
              />

              <KpiCard
                icon={TrendingUp}
                label="Previsão líq."
                value={formatNumber(previsaoFechamentoLiquida, 0) + ' cx'}
                sub="Média × dias disponíveis - dev/bonif"
                color="#0f766e"
              />
            </div>
          </div>
        )
      })()}

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
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
          <ResponsiveContainer width="100%" minHeight={220} height={220}>
            <BarChart data={carteira_por_linha} layout="vertical"
              margin={{ top: 4, right: 50, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }}
                tickFormatter={v => carteiraView === 'qtde'
                  ? formatNumber(v, 0)
                  : `${(v/1e3).toFixed(0)}k`
                }
              />
              <YAxis dataKey="linha" type="category" tick={{ fontSize: 10 }} width={120} interval={0} />
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
        {/* CIF x FOB faturados */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <SectionTitle>CIF x FOB faturados</SectionTitle>
                    
          <ResponsiveContainer width="100%" height={220}>
            {cifFobFaturados.length > 0 ? (
              <PieChart>
                <Pie
                  data={cifFobFaturados}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  labelLine={false}
                  label={renderCifFobLabel}
                >
                  {cifFobFaturados.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={cifFobColors[entry.name]}
                    />
                  ))}
                </Pie>
                
                <Tooltip formatter={(v) => BRL(v as number)} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">
                Sem dados de CIF/FOB
              </div>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
      
        {/* Faturamento por família */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <SectionTitle>Faturamento por familia (Bruto)</SectionTitle>

          <ResponsiveContainer width="100%" height="90%" minHeight={220}>
            {faturamento_por_familia.length > 0 ? (
              <BarChart
                data={faturamento_por_familia}
                layout="vertical"
                margin={{ top: 4, right: 45, left: 4, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f0f0f0"
                  horizontal={false}
                />

                <XAxis
                  type="number"
                  tick={{ fontSize: 10 }}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${formatNumber(v, 0)}%`}
                />

                <YAxis
                  dataKey="familia"
                  type="category"
                  tick={{ fontSize: 10 }}
                  width={105}
                  interval={0}
                />

                <Tooltip
                  formatter={(v, _name, props) => {
                    const item = props.payload
                    return [
                      `${formatNumber(v as number, 2)}% — ${BRL(item.valor)}`,
                      'Participação',
                    ]
                  }}
                />

                <Bar
                  dataKey="pct"
                  name="Participação"
                  fill="#D92214"
                  radius={[0, 4, 4, 0]}
                  label={{
                    position: 'right',
                    formatter: (value) => {
                      const pct = Number(value ?? 0)
                      return `${formatNumber(pct, 2)}%`
                    },
                    fontSize: 11,
                    fill: '#374151',
                  }}
                />
              </BarChart>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">
                Sem dados de faturamento por família
              </div>
            )}
          </ResponsiveContainer>
        </div>

        {/* Faturamento bruto x Meta */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <SectionTitle>Faturamento x Meta</SectionTitle>

          <div className="relative h-[210px] flex items-center justify-center">
            <svg
              viewBox="0 0 220 130"
              className="w-full max-w-[320px]"
            >
              <path
                d="M 25 105 A 85 85 0 0 1 195 105"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="24"
                strokeLinecap="butt"
                pathLength={100}
              />

              <path
                d="M 25 105 A 85 85 0 0 1 195 105"
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="24"
                strokeLinecap="butt"
                pathLength={100}
                strokeDasharray={`${percentualFaturamentoMeta} 100`}
              />
            </svg>

            <div className="absolute top-[86px] text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formatNumber(caixasFaturadas, 0)}
              </div>
              <div className="text-[11px] text-gray-500 mt-1">
                caixas faturadas
              </div>
            </div>

            <div className="absolute bottom-4 left-3 text-sm text-gray-700">
              0
            </div>

            <div className="absolute bottom-4 right-3 text-sm text-gray-700">
              {formatNumber(metaDoMes, 0)}
            </div>
          </div>

          <div className="mt-1 text-center text-xs text-gray-500">
            {formatNumber(percentualFaturamentoMeta, 1)}% da meta atingida
          </div>
        </div>

        {/* Produção diária */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <SectionTitle>Produção PA</SectionTitle>
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
      </div>

      {/* Charts row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">

        {/* Top 10 estoque disponível */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <SectionTitle>Top 10 produtos — estoque disponível</SectionTitle>
          <div className="space-y-1 mt-2">
            {estoque_top10.map((item, i) => {
              const max = estoque_top10[0]?.disp || 1
              return (
                <div key={item.cod_prd} className="flex items-center gap-1">
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
        {/* Top 10 clientes */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <SectionTitle>Top 10 clientes</SectionTitle>

          <ResponsiveContainer width="100%" height="95%" minWidth={450}>
            {top_clientes_faturamento.length > 0 ? (
              <BarChart
                data={top_clientes_faturamento}
                layout="vertical"
                margin={{ top: 4, right: 65, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f0f0f0"
                  horizontal={false}
                />

                <XAxis
                  type="number"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => `${formatNumber(Number(v ?? 0), 0)}%`}
                />

                <YAxis
                  dataKey="cliente"
                  type="category"
                  tick={<ClientYAxisTick />}
                  width={205}
                  interval={0}
                />

                <Tooltip
                  formatter={(value, _name, props) => {
                    const pct = Number(value ?? 0)
                    const item = props.payload as {
                      valor?: number
                      caixas?: number
                    }
                  
                    return [
                      `${formatNumber(pct, 2)}% — ${BRL(item.valor ?? 0)} — ${formatNumber(item.caixas ?? 0, 0)} cx`,
                      'Participação',
                    ]
                  }}
                />

                <Bar
                  dataKey="pct"
                  name="Participação"
                  fill="#B91C1C"
                  radius={[0, 4, 4, 0]}
                  label={{
                    position: 'right',
                    formatter: (value) => {
                      const pct = Number(value ?? 0)
                      return `${formatNumber(pct, 2)}%`
                    },
                    fontSize: 11,
                    fill: '#374151',
                  }}
                />
              </BarChart>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">
                Sem dados de clientes
              </div>
            )}
          </ResponsiveContainer>
        </div>
        {/* Devoluções por dia */}
        <DevolucoesPorDiaCard rows={devolucoes_por_dia} />
      </div>
    </div>
  )
}
