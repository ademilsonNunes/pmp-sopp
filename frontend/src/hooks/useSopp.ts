import { useQuery } from '@tanstack/react-query'
import {
  fetchSoppFilters,
  fetchDashboard,
  fetchPedidos,
  fetchPedidosCharts,
  fetchProducao,
  fetchProducaoCharts,
  fetchForecast,
  fetchForecastSummary,
  fetchEstoque,
  fetchFaturamento,
  fetchFaturamentoCharts,
  fetchDevolucoes,
  fetchDevolucaoData,
  fetchBonificacaoData,
  fetchPmpRealFilters,
  fetchPmpReal,
  fetchEmbarque,
  type PedidosParams,
  type ProducaoParams,
  type ForecastParams,
  type EstoqueParams,
  type FaturamentoParams,
  type DevolucaoParams,
  type DevBonifParams,
  type PmpRealParams,
  type EmbarqueParams,
  type DashboardParams,
} from '../lib/sopp'

const STALE = 5 * 60_000 // 5 min

export function useSoppFilters() {
  return useQuery({
    queryKey: ['sopp', 'filters'],
    queryFn: fetchSoppFilters,
    staleTime: 10 * 60_000,
  })
}

export function useDashboard(params?: DashboardParams) {
  return useQuery({
    queryKey: ['sopp', 'dashboard', params],
    queryFn: () => fetchDashboard(params),
    staleTime: STALE,
  })
}

export function usePedidos(params: PedidosParams) {
  return useQuery({
    queryKey: ['sopp', 'pedidos', params],
    queryFn: () => fetchPedidos(params),
    staleTime: STALE,
  })
}

export function usePedidosCharts(params: Omit<PedidosParams, 'page' | 'page_size'>) {
  return useQuery({
    queryKey: ['sopp', 'pedidos-charts', params],
    queryFn: () => fetchPedidosCharts(params),
    staleTime: STALE,
  })
}

export function useProducao(params: ProducaoParams) {
  return useQuery({
    queryKey: ['sopp', 'producao', params],
    queryFn: () => fetchProducao(params),
    staleTime: STALE,
  })
}

export function useProducaoCharts(params: Omit<ProducaoParams, 'page' | 'page_size'>) {
  return useQuery({
    queryKey: ['sopp', 'producao-charts', params],
    queryFn: () => fetchProducaoCharts(params),
    staleTime: STALE,
  })
}

export function useForecast(params: ForecastParams) {
  return useQuery({
    queryKey: ['sopp', 'forecast', params],
    queryFn: () => fetchForecast(params),
    staleTime: STALE,
  })
}

export function useForecastSummary() {
  return useQuery({
    queryKey: ['sopp', 'forecast-summary'],
    queryFn: fetchForecastSummary,
    staleTime: STALE,
  })
}

export function useEstoque(params: EstoqueParams) {
  return useQuery({
    queryKey: ['sopp', 'estoque', params],
    queryFn: () => fetchEstoque(params),
    staleTime: STALE,
  })
}

export function useFaturamento(params: FaturamentoParams) {
  return useQuery({
    queryKey: ['sopp', 'faturamento', params],
    queryFn: () => fetchFaturamento(params),
    staleTime: STALE,
  })
}

export function useFaturamentoCharts(params: Omit<FaturamentoParams, 'page' | 'page_size'>) {
  return useQuery({
    queryKey: ['sopp', 'faturamento-charts', params],
    queryFn: () => fetchFaturamentoCharts(params),
    staleTime: STALE,
  })
}

export function useDevolucoes(params: DevolucaoParams) {
  return useQuery({
    queryKey: ['sopp', 'devolucoes', params],
    queryFn: () => fetchDevolucoes(params),
    staleTime: STALE,
  })
}

export function useDevolucaoData(params: DevBonifParams) {
  return useQuery({
    queryKey: ['sopp', 'devolucoes-data', params],
    queryFn: () => fetchDevolucaoData(params),
    staleTime: STALE,
  })
}

export function useBonificacaoData(params: DevBonifParams) {
  return useQuery({
    queryKey: ['sopp', 'bonificacoes-data', params],
    queryFn: () => fetchBonificacaoData(params),
    staleTime: STALE,
  })
}

export function usePmpRealFilters() {
  return useQuery({
    queryKey: ['sopp', 'pmp-real-filters'],
    queryFn: fetchPmpRealFilters,
    staleTime: 10 * 60_000,
  })
}

export function usePmpReal(params: PmpRealParams) {
  return useQuery({
    queryKey: ['sopp', 'pmp-real', params],
    queryFn: () => fetchPmpReal(params),
    staleTime: STALE,
  })
}

export function useEmbarque(params: EmbarqueParams) {
  return useQuery({
    queryKey: ['sopp', 'embarque', params],
    queryFn: () => fetchEmbarque(params),
    staleTime: 60_000, // 1 min — dado operacional, mais fresco
  })
}
