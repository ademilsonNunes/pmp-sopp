import type { ZpmRecord } from '../../types'
import { formatNumber } from '../../lib/utils'

interface PmpGridProps {
  data: ZpmRecord[]
  loading: boolean
  mesref?: string
  total: number
  canEdit: boolean
  onEdit?: (record: ZpmRecord) => void
}

function getDaysInMonth(mesref?: string): number {
  if (!mesref || mesref.length !== 6) {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  }
  const year  = parseInt(mesref.slice(0, 4))
  const month = parseInt(mesref.slice(4, 6))
  return new Date(year, month, 0).getDate()
}

function dayKey(d: number): keyof ZpmRecord {
  return `d${String(d).padStart(2, '0')}` as keyof ZpmRecord
}

/** Número compacto para células estreitas — sem separadores de milhar */
function fmtDay(v: number): string {
  if (v === 0) return ''
  if (v >= 10000) return `${Math.round(v / 1000)}k`
  if (v >= 1000)  return `${(v / 1000).toFixed(1)}k`
  return String(v)
}

function cellBg(val: number, maxVal: number): string {
  if (val === 0 || maxVal === 0) return ''
  const r = val / maxVal
  if (r < 0.25) return 'bg-red-50'
  if (r < 0.5)  return 'bg-red-100'
  if (r < 0.75) return 'bg-red-200'
  return 'bg-red-300'
}

// Sticky col widths (px)
const W = { prod: 148, linha: 62 }
const L = { prod: 0, linha: W.prod }
const FIXED_LEFT = W.prod + W.linha  // total sticky width

export default function PmpGrid({ data, loading, mesref, total, canEdit, onEdit }: PmpGridProps) {
  const numDays = getDaysInMonth(mesref)
  const days    = Array.from({ length: numDays }, (_, i) => i + 1)

  if (loading) {
    return (
      <div className="p-6 space-y-2 animate-pulse">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-7 bg-gray-100 rounded" style={{ opacity: 1 - i * 0.06 }} />
        ))}
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <p className="text-sm font-medium">Nenhum registro encontrado</p>
        <p className="text-xs mt-1">Ajuste os filtros para visualizar o grid</p>
      </div>
    )
  }

  return (
    <div>
      {total > data.length && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 text-xs text-amber-700 flex items-center gap-1.5">
          <span className="font-semibold">⚠</span>
          Exibindo {data.length} de {total} registros — filtre por mês para ver todos.
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100 bg-gray-50/70">
        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Intensidade:</span>
        {[
          { bg: 'bg-red-50',  label: 'Baixa' },
          { bg: 'bg-red-100', label: 'Média' },
          { bg: 'bg-red-200', label: 'Alta' },
          { bg: 'bg-red-300', label: 'Máx.' },
        ].map(({ bg, label }) => (
          <span key={label} className="flex items-center gap-1">
            <span className={`inline-block w-3 h-3 rounded-sm ${bg} border border-gray-200`} />
            <span className="text-[10px] text-gray-500">{label}</span>
          </span>
        ))}
        <span className="text-[10px] text-gray-400 ml-2">
          · {canEdit ? 'Clique na linha para editar' : 'Visualização somente leitura'}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="text-[11px] border-collapse w-full">
          <colgroup>
            {/* sticky cols */}
            <col style={{ width: W.prod }} />
            <col style={{ width: W.linha }} />
            {/* day cols — flex to fill available space */}
            {days.map(d => <col key={d} />)}
            {/* totals */}
            <col style={{ width: 58 }} />
            <col style={{ width: 56 }} />
          </colgroup>

          <thead>
            <tr className="bg-gray-100">
              {/* ── Fixed headers ──────────────────────── */}
              <th
                className="sticky z-20 bg-gray-100 border-b-2 border-r border-gray-300 px-2 py-2 text-left font-semibold text-gray-600 whitespace-nowrap"
                style={{ left: L.prod, minWidth: W.prod }}
              >
                Produto / Descrição
              </th>
              <th
                className="sticky z-20 bg-gray-100 border-b-2 border-r-2 border-gray-300 px-2 py-2 text-left font-semibold text-gray-600 whitespace-nowrap"
                style={{ left: L.linha, minWidth: W.linha }}
              >
                Linha
              </th>

              {/* ── Day headers ──────────────────────── */}
              {days.map(d => (
                <th
                  key={d}
                  className="bg-gray-100 border-b-2 border-gray-200 py-2 text-center font-semibold text-gray-500"
                  style={{ minWidth: 0 }}
                >
                  <span className="text-[10px]">D{String(d).padStart(2, '0')}</span>
                </th>
              ))}

              {/* ── Right totals ─────────────────────── */}
              <th
                className="bg-gray-100 border-b-2 border-l-2 border-gray-300 px-1.5 py-2 text-right font-semibold text-gray-700 whitespace-nowrap"
                style={{ minWidth: 58 }}
              >
                Total
              </th>
              <th
                className="bg-gray-100 border-b-2 border-l border-gray-200 px-1.5 py-2 text-right font-semibold text-gray-500 whitespace-nowrap"
                style={{ minWidth: 56 }}
              >
                PMP
              </th>
            </tr>
          </thead>

          <tbody>
            {data.map((row, idx) => {
              const dayVals = days.map(d => (row[dayKey(d)] as number) || 0)
              const maxVal  = Math.max(...dayVals, 1)
              const totpg   = dayVals.reduce((s, v) => s + v, 0)
              const base    = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'

              return (
                <tr
                  key={row.id}
                  className={`group transition-colors ${base} ${
                    canEdit ? 'hover:bg-blue-50/60 cursor-pointer' : 'cursor-default'
                  }`}
                  onClick={() => { if (!canEdit) return
                    onEdit?.(row)
                  }}
                >
                  {/* Produto + Desc (merged) */}
                  <td
                    className={`sticky z-10 border-b border-r border-gray-100 px-2 py-1 group-hover:bg-blue-50/60 ${base}`}
                    style={{ left: L.prod, minWidth: W.prod }}
                  >
                    <span className="block font-mono font-semibold text-gray-800 text-[10px] leading-tight truncate" title={row.prod}>
                      {row.prod}
                    </span>
                    <span className="block text-[9px] text-gray-400 leading-tight truncate" title={row.desc}>
                      {row.desc}
                    </span>
                  </td>

                  {/* Linha */}
                  <td
                    className={`sticky z-10 border-b border-r-2 border-gray-200 px-2 py-1 text-[10px] text-gray-500 whitespace-nowrap group-hover:bg-blue-50/60 ${base}`}
                    style={{ left: L.linha, minWidth: W.linha }}
                  >
                    {row.linha}
                  </td>

                  {/* Day cells */}
                  {dayVals.map((val, di) => (
                    <td
                      key={di}
                      className={`border-b border-gray-100 text-center tabular-nums transition-colors ${cellBg(val, maxVal)}`}
                      title={val > 0 ? formatNumber(val, 0) : undefined}
                    >
                      {val > 0
                        ? <span className="text-[9px] font-medium text-gray-800 leading-none">{fmtDay(val)}</span>
                        : <span className="text-[9px] text-gray-200">·</span>
                      }
                    </td>
                  ))}

                  {/* Total */}
                  <td className="border-b border-l-2 border-gray-200 px-1.5 py-1 text-right tabular-nums whitespace-nowrap font-semibold text-gray-800" style={{ minWidth: 58 }}>
                    {totpg > 0
                      ? <span className="text-[10px]">{formatNumber(totpg, 0)}</span>
                      : <span className="text-gray-200 font-normal text-[10px]">0</span>
                    }
                  </td>

                  {/* PMP Mês */}
                  <td className={`border-b border-l border-gray-100 px-1.5 py-1 text-right tabular-nums whitespace-nowrap text-[10px] ${row.pmpmes > 0 ? 'text-gray-600' : 'text-gray-300'}`} style={{ minWidth: 56 }}>
                    {formatNumber(row.pmpmes, 0)}
                  </td>
                </tr>
              )
            })}
          </tbody>

          {/* Summary footer */}
          {data.length > 1 && (() => {
            const footerDayTotals = days.map(d =>
              data.reduce((s, r) => s + ((r[dayKey(d)] as number) || 0), 0)
            )
            const grandTotal  = footerDayTotals.reduce((s, v) => s + v, 0)
            const totalPmp    = data.reduce((s, r) => s + (r.pmpmes || 0), 0)

            return (
              <tfoot>
                <tr className="bg-gray-100">
                  <td
                    className="sticky z-10 bg-gray-100 border-t-2 border-r border-gray-300 px-2 py-1.5 font-semibold text-gray-700 text-[10px] whitespace-nowrap"
                    style={{ left: L.prod, minWidth: W.prod }}
                  >
                    TOTAL ({data.length} produtos)
                  </td>
                  <td
                    className="sticky z-10 bg-gray-100 border-t-2 border-r-2 border-gray-300"
                    style={{ left: L.linha, minWidth: W.linha }}
                  />
                  {footerDayTotals.map((colTotal, di) => (
                    <td
                      key={di}
                      className="border-t-2 border-gray-300 text-center tabular-nums"
                    >
                      {colTotal > 0
                        ? <span className="text-[9px] font-semibold text-gray-700">{fmtDay(colTotal)}</span>
                        : <span className="text-[9px] text-gray-300">·</span>
                      }
                    </td>
                  ))}
                  <td className="border-t-2 border-l-2 border-gray-300 px-1.5 py-1.5 text-right tabular-nums whitespace-nowrap font-bold text-gray-900 text-[10px]" style={{ minWidth: 58 }}>
                    {formatNumber(grandTotal, 0)}
                  </td>
                  <td className="border-t-2 border-l border-gray-300 px-1.5 py-1.5 text-right tabular-nums whitespace-nowrap font-semibold text-gray-700 text-[10px]" style={{ minWidth: 56 }}>
                    {formatNumber(totalPmp, 0)}
                  </td>
                </tr>
              </tfoot>
            )
          })()}
        </table>
      </div>
    </div>
  )
}
