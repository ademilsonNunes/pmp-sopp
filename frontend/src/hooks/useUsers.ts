import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import type {
  User,
  CreateUserPayload,
  UpdateUserPayload,
  ChangePasswordRequest,
} from '../types'

export function useUsersList() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get<User[]>('/auth/users')
      return data
    },
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateUserPayload) => {
      const { data } = await api.post<User>('/auth/register', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, payload }: { userId: number; payload: UpdateUserPayload }) => {
      const { data } = await api.put<User>(`/auth/users/${userId}`, payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useDeactivateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: number) => {
      const { data } = await api.patch<User>(`/auth/users/${userId}/inactive`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useActivateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: number) => {
      const { data } = await api.patch<User>(`/auth/users/${userId}/active`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: async ({
      userId,
      payload,
    }: {
      userId: number
      payload: ChangePasswordRequest
    }) => {
      const { data } = await api.patch(`/auth/users/${userId}/password`, payload)
      return data
    },
  })
}