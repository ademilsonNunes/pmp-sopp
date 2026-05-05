import api from './api'
import type {
  SoppDashboard,
  PaginatedResponse,
  PvAberto,
  MovProducao,
  ForecastResponse,
  ForecastSummaryItem,
  EstoqueResponse,
  Faturamento,
  PedidosCharts,
  ProducaoCharts,
  FaturamentoCharts,
  SoppFilters,
  DevolucaoStats,
  DevolucaoData,
  BonificacaoData,
  PmpRealFilters,
  PmpRealResponse,
  EmbarqueResponse,
} from '../types'

// ─── Filters ──────────────────────────────────────────────────────────────────

export const fetchSoppFilters = (): Promise<SoppFilters> =>
  api.get('/sopp/filters').then(r => r.data)

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardParams {
  date_from?: string
  date_to?: string
  empresa?: string
}

export const fetchDashboard = (params?: DashboardParams): Promise<SoppDashboard> =>
  api.get('/sopp/dashboard', { params }).then(r => r.data)

// ─── Pedidos ──────────────────────────────────────────────────────────────────

export interface PedidosParams {
  page?: number
  page_size?: number
  linha?: string
  formato?: string
  search?: string
  date_from?: string
  date_to?: string
}

export const fetchPedidos = (params: PedidosParams): Promise<PaginatedResponse<PvAberto>> =>
  api.get('/sopp/pedidos', { params }).then(r => r.data)

export const fetchPedidosCharts = (params: Omit<PedidosParams, 'page' | 'page_size'>): Promise<PedidosCharts> =>
  api.get('/sopp/pedidos/charts', { params }).then(r => r.data)

export const exportPedidos = (params: Omit<PedidosParams, 'page' | 'page_size'>) => {
  const qs = new URLSearchParams(params as Record<string, string>).toString()
  window.open(`/api/sopp/pedidos/export?${qs}`)
}

// ─── Produção ─────────────────────────────────────────────────────────────────

export interface ProducaoParams {
  page?: number
  page_size?: number
  tipo?: string
  cod_prd?: string
  date_from?: string
  date_to?: string
  filial?: string
}

export const fetchProducao = (params: ProducaoParams): Promise<PaginatedResponse<MovProducao>> =>
  api.get('/sopp/producao', { params }).then(r => r.data)

export const fetchProducaoCharts = (params: Omit<ProducaoParams, 'page' | 'page_size'>): Promise<ProducaoCharts> =>
  api.get('/sopp/producao/charts', { params }).then(r => r.data)

export const exportProducao = (params: Omit<ProducaoParams, 'page' | 'page_size'>) => {
  const qs = new URLSearchParams(params as Record<string, string>).toString()
  window.open(`/api/sopp/producao/export?${qs}`)
}

// ─── Forecast ─────────────────────────────────────────────────────────────────

export interface ForecastParams {
  linha?: string
  search?: string
}

export const fetchForecast = (params: ForecastParams): Promise<ForecastResponse> =>
  api.get('/sopp/forecast', { params }).then(r => r.data)

export const fetchForecastSummary = (): Promise<ForecastSummaryItem[]> =>
  api.get('/sopp/forecast/summary').then(r => r.data)

export const exportForecast = (params: ForecastParams) => {
  const qs = new URLSearchParams(params as Record<string, string>).toString()
  window.open(`/api/sopp/forecast/export?${qs}`)
}

// ─── Estoque ──────────────────────────────────────────────────────────────────

export interface EstoqueParams {
  empresa?: string
  linha?: string
  local?: string
  filial?: string
  familia?: string
  search?: string
}

export const fetchEstoque = (params: EstoqueParams): Promise<EstoqueResponse> =>
  api.get('/sopp/estoque', { params }).then(r => r.data)

export const exportEstoque = (params: EstoqueParams) => {
  const qs = new URLSearchParams(params as Record<string, string>).toString()
  window.open(`/api/sopp/estoque/export?${qs}`)
}

// ─── Faturamento ──────────────────────────────────────────────────────────────

export interface FaturamentoParams {
  page?: number
  page_size?: number
  linha?: string
  vendedor?: string
  uf?: string
  search?: string
  date_from?: string
  date_to?: string
  excluir_dev?: boolean
}

export const fetchFaturamento = (params: FaturamentoParams): Promise<PaginatedResponse<Faturamento>> =>
  api.get('/sopp/faturamento', { params }).then(r => r.data)

export const fetchFaturamentoCharts = (params: Omit<FaturamentoParams, 'page' | 'page_size'>): Promise<FaturamentoCharts> =>
  api.get('/sopp/faturamento/charts', { params }).then(r => r.data)

export const exportFaturamento = (params: Omit<FaturamentoParams, 'page' | 'page_size'>) => {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]))
  ).toString()
  window.open(`/api/sopp/faturamento/export?${qs}`)
}

// ─── Devoluções ───────────────────────────────────────────────────────────────

export interface DevolucaoParams {
  date_from?: string
  date_to?: string
}

export const fetchDevolucoes = (params: DevolucaoParams): Promise<DevolucaoStats> =>
  api.get('/sopp/faturamento/devolucoes', { params }).then(r => r.data)

// ─── Devoluções dedicadas ─────────────────────────────────────────────────────

export interface DevBonifParams {
  date_from?: string
  date_to?: string
  linha?: string
  supervisor?: string
  uf?: string
}

export const fetchDevolucaoData = (params: DevBonifParams): Promise<DevolucaoData> =>
  api.get('/sopp/devolucoes', { params }).then(r => r.data)

export const fetchBonificacaoData = (params: DevBonifParams): Promise<BonificacaoData> =>
  api.get('/sopp/bonificacoes', { params }).then(r => r.data)

// ─── PMP vs Real ──────────────────────────────────────────────────────────────

export interface PmpRealParams {
  mesref?: string
  linha?: string
  search?: string
}

export const fetchPmpRealFilters = (): Promise<PmpRealFilters> =>
  api.get('/sopp/pmp-real/meses').then(r => r.data)

export const fetchPmpReal = (params: PmpRealParams): Promise<PmpRealResponse> =>
  api.get('/sopp/pmp-real', { params }).then(r => r.data)

// ─── Prog. Embarque ───────────────────────────────────────────────────────────

export interface EmbarqueParams {
  dias?: number
  linha?: string
  search?: string
}

export const fetchEmbarque = (params: EmbarqueParams): Promise<EmbarqueResponse> =>
  api.get('/sopp/embarque', { params }).then(r => r.data)
