import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import type { CreateFeriadoPayload, Feriado, UpdateFeriadoPayload } from '../types'

export function useFeriadosList(params?: {
  ano?: number
  mes?: number
  somente_ativos?: boolean
}) {
  return useQuery({
    queryKey: ['feriados', params],
    queryFn: async () => {
      const { data } = await api.get<Feriado[]>('/feriados', { params })
      return data
    },
  })
}

export function useCreateFeriado() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateFeriadoPayload) => {
      const { data } = await api.post<Feriado>('/feriados', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feriados'] })
    },
  })
}

export function useUpdateFeriado() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      feriadoId,
      payload,
    }: {
      feriadoId: number
      payload: UpdateFeriadoPayload
    }) => {
      const { data } = await api.put<Feriado>(`/feriados/${feriadoId}`, payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feriados'] })
    },
  })
}

export function useDeactivateFeriado() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (feriadoId: number) => {
      const { data } = await api.patch<Feriado>(`/feriados/${feriadoId}/inactive`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feriados'] })
    },
  })
}

export function useActivateFeriado() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (feriadoId: number) => {
      const { data } = await api.patch<Feriado>(`/feriados/${feriadoId}/active`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feriados'] })
    },
  })
}