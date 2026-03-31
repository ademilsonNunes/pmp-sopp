import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import type {
  ZpmRecord,
  ZpmCreate,
  ZpmUpdate,
  ZpmFilter,
  PaginatedResponse,
  ImportLog,
} from '../types'

// ─── PMP Queries ─────────────────────────────────────────────────────────────

export function usePmpList(filters: ZpmFilter, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['pmp', 'list', filters, page, pageSize],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, page_size: pageSize }
      if (filters.filial) params.filial = filters.filial
      if (filters.mesref) params.mesref = filters.mesref
      if (filters.search) params.search = filters.search
      const { data } = await api.get<PaginatedResponse<ZpmRecord>>('/pmp', { params })
      return data
    },
  })
}

export function usePmpRecord(id: number | null) {
  return useQuery({
    queryKey: ['pmp', 'record', id],
    queryFn: async () => {
      const { data } = await api.get<ZpmRecord>(`/pmp/${id}`)
      return data
    },
    enabled: id !== null,
  })
}

export function useCreatePmp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: ZpmCreate) => {
      const { data: created } = await api.post<ZpmRecord>('/pmp', data)
      return created
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pmp'] })
    },
  })
}

export function useUpdatePmp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ZpmUpdate }) => {
      const { data: updated } = await api.put<ZpmRecord>(`/pmp/${id}`, data)
      return updated
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pmp'] })
    },
  })
}

export function useDeletePmp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/pmp/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pmp'] })
    },
  })
}

// ─── Import ───────────────────────────────────────────────────────────────────

export function useImportCsv() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      file,
      mesref,
      mode,
    }: {
      file: File
      mesref: string
      mode: number
    }) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mesref', mesref)
      formData.append('mode', String(mode))
      const { data } = await api.post<ImportLog>('/imports/csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pmp'] })
      qc.invalidateQueries({ queryKey: ['import-logs'] })
    },
  })
}

// ─── Import Logs ─────────────────────────────────────────────────────────────

export function useImportLogs(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['import-logs', page, pageSize],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<ImportLog>>('/imports/logs', {
        params: { page, page_size: pageSize },
      })
      return data
    },
  })
}

export function useImportLog(id: number | null) {
  return useQuery({
    queryKey: ['import-log', id],
    queryFn: async () => {
      const { data } = await api.get<ImportLog>(`/imports/logs/${id}`)
      return data
    },
    enabled: id !== null,
  })
}
