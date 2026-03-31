import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const MONTHS_PT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]

export function formatMesRef(mesref: string): string {
  if (!mesref || mesref.length !== 6) return mesref
  const year = mesref.slice(0, 4)
  const month = parseInt(mesref.slice(4, 6), 10)
  if (month < 1 || month > 12) return mesref
  return `${MONTHS_PT[month - 1]}/${year}`
}

/** "AAAA-MM" → "Abr/25" — para eixos de gráficos mensais */
export function fmtMes(s: string): string {
  if (!s) return s
  const [y, m] = s.split('-')
  const idx = parseInt(m, 10) - 1
  if (idx < 0 || idx > 11) return s
  return `${MONTHS_PT[idx]}/${y.slice(2)}`
}

/** "AAAA-MM-DD" → "DD/MM" — para eixos de gráficos diários */
export function fmtDiario(s: string): string {
  if (!s || s.length < 10) return s
  return `${s.slice(8, 10)}/${s.slice(5, 7)}`
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  try {
    const parsed = parseISO(dateStr)
    return format(parsed, 'dd/MM/yyyy', { locale: ptBR })
  } catch {
    return dateStr
  }
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  try {
    const parsed = parseISO(dateStr)
    return format(parsed, 'dd/MM/yyyy HH:mm', { locale: ptBR })
  } catch {
    return dateStr
  }
}

export function formatNumber(value: number | null | undefined, decimals = 0): string {
  if (value === null || value === undefined) return '-'
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function getCurrentMesRef(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}${month}`
}

export function getErrorMessage(error: unknown): string {
  if (!error) return 'Erro desconhecido'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const err = error as any
  if (err.response?.data?.detail) {
    const detail = err.response.data.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      return detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join('; ')
    }
    return JSON.stringify(detail)
  }
  if (err.message) return err.message
  return 'Erro desconhecido'
}

export function calcTotpg(record: Record<string, number>): number {
  let total = 0
  for (let i = 1; i <= 31; i++) {
    const key = `d${String(i).padStart(2, '0')}`
    total += record[key] || 0
  }
  return total
}
