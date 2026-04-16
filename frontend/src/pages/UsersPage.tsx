import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Users, Shield, UserX, KeyRound, RefreshCw } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import {
  useUsersList,
  useCreateUser,
  useDeactivateUser,
  useActivateUser,
  useUnlockUser,
  useResetUserPassword,
} from '../hooks/useUsers'
import { getErrorMessage } from '../lib/utils'
import { useAuthStore } from '../hooks/useAuth'
import type { CreateUserPayload, User } from '../types'

const createUserSchema = z.object({
  username: z.string().min(3, 'Mínimo 3 caracteres'),
  email: z
    .string()
    .trim()
    .email('Informe um e-mail válido')
    .or(z.literal('')),
  full_name: z.string().min(1, 'Informe o nome completo'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  role: z.enum(['ADMIN', 'PCP', 'VIEWER']),
})

type CreateUserForm = z.infer<typeof createUserSchema>

export default function UsersPage() {
  const { user: currentUser } = useAuthStore()
  const { data: users = [], isLoading, refetch, isFetching } = useUsersList()
  const createUser = useCreateUser()
  const deactivateUser = useDeactivateUser()
  const activateUser = useActivateUser()
  const unlockUser = useUnlockUser()
  const resetPassword = useResetUserPassword()

  const [search, setSearch] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: '',
      email: '',
      full_name: '',
      password: '',
      role: 'VIEWER',
    },
  })

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) =>
      [u.username, u.email, u.full_name, u.role].some((value) =>
        String(value || '').toLowerCase().includes(q),
      ),
    )
  }, [users, search])

  const onSubmit = async (data: CreateUserPayload) => {
    try {
      await createUser.mutateAsync({
        ...data,
        email: data.email?.trim() ? data.email.trim() : null,
      })
      toast.success('Usuário criado com sucesso!')
      reset()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const handleDeactivate = async (u: User) => {
    if (u.id === currentUser?.id) {
      toast.error('Você não pode inativar seu próprio usuário')
      return
    }

    try {
      await deactivateUser.mutateAsync(u.id)
      toast.success('Usuário inativado com sucesso!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const handleActivate = async (u: User) => {
    try {
      await activateUser.mutateAsync(u.id)
      toast.success('Usuário reativado com sucesso!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const handleUnlock = async (u: User) => {
    try {
      await unlockUser.mutateAsync(u.id)
      toast.success('Usuário desbloqueado com sucesso!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }


  const handleResetPassword = async (u: User) => {
    const newPassword = window.prompt(`Nova senha para ${u.username}:`)
    if (!newPassword) return
    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      return
    }

    try {
      await resetPassword.mutateAsync({
        userId: u.id,
        payload: { password: newPassword },
      })
      toast.success('Senha redefinida com sucesso!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const isUserBlocked = (u: User) => {
    if (!u.blocked_until) return false
    return new Date(u.blocked_until).getTime() > Date.now()
  }

  const formatBlockedUntil = (value?: string | null) => {
    if (!value) return ''
    return new Date(value).toLocaleString('pt-BR')
  }



  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="pt-16">
        <div
          className="px-4 sm:px-6 py-6"
          style={{ background: 'linear-gradient(135deg, #32373c 0%, #1a1d20 100%)' }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                  Gestão de Usuários
                </h1>
                <p className="text-gray-400 text-sm">
                  Cadastre, ative, inative e redefina senhas de usuários do sistema
                </p>
              </div>

              <button
                onClick={() => refetch()}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Atualizar"
              >
                <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Users size={20} className="text-primary-light" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">
                      Total de usuários
                    </p>
                    <p className="text-white text-2xl font-bold">{users.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Shield size={20} className="text-green-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">
                      Ativos
                    </p>
                    <p className="text-white text-2xl font-bold">
                      {users.filter((u) => u.is_active).length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <UserX size={20} className="text-red-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">
                      Inativos
                    </p>
                    <p className="text-white text-2xl font-bold">
                      {users.filter((u) => !u.is_active).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1">
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Plus size={18} className="text-primary" />
                <h2 className="text-lg font-bold text-gray-900">Novo usuário</h2>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="label">Nome completo</label>
                  <input
                    {...register('full_name')}
                    className={`input-field ${errors.full_name ? 'border-red-400' : ''}`}
                    placeholder="Ex.: João da Silva"
                  />
                  {errors.full_name && (
                    <p className="mt-1 text-xs text-red-500 font-medium">{errors.full_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">Usuário</label>
                  <input
                    {...register('username')}
                    className={`input-field ${errors.username ? 'border-red-400' : ''}`}
                    placeholder="Ex.: joao"
                  />
                  {errors.username && (
                    <p className="mt-1 text-xs text-red-500 font-medium">{errors.username.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">E-mail</label>
                  <input
                    {...register('email')}
                    type="email"
                    className={`input-field ${errors.email ? 'border-red-400' : ''}`}
                    placeholder="Ex.: joao@empresa.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500 font-medium">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">Senha inicial</label>
                  <input
                    {...register('password')}
                    type="password"
                    className={`input-field ${errors.password ? 'border-red-400' : ''}`}
                    placeholder="Mínimo 6 caracteres"
                  />
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-500 font-medium">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">Perfil</label>
                  <select
                    {...register('role')}
                    className={`input-field ${errors.role ? 'border-red-400' : ''}`}
                  >
                    <option value="VIEWER">VIEWER</option>
                    <option value="PCP">PCP</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || createUser.isPending}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  {createUser.isPending ? 'Criando...' : 'Criar usuário'}
                </button>
              </form>
            </div>
          </div>

          <div className="xl:col-span-2">
            <div className="card p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h2 className="text-lg font-bold text-gray-900">Usuários cadastrados</h2>

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nome, usuário ou perfil..."
                  className="input-field sm:max-w-sm"
                />
              </div>

              {isLoading ? (
                <div className="py-10 text-center text-gray-500">Carregando usuários...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-10 text-center text-gray-500">Nenhum usuário encontrado.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 pr-3 font-semibold text-gray-700">Nome</th>
                        <th className="text-left py-3 pr-3 font-semibold text-gray-700">Usuário</th>
                        <th className="text-left py-3 pr-3 font-semibold text-gray-700">E-mail</th>
                        <th className="text-left py-3 pr-3 font-semibold text-gray-700">Perfil</th>
                        <th className="text-left py-3 pr-3 font-semibold text-gray-700">Status</th>
                        <th className="text-left py-3 font-semibold text-gray-700">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="border-b border-gray-100">
                          <td className="py-3 pr-3">
                            <div className="font-medium text-gray-900">{u.full_name}</div>
                          </td>
                          <td className="py-3 pr-3 text-gray-600">@{u.username}</td>
                          <td className="py-3 pr-3 text-gray-600">{u.email || '-'}</td>
                          <td className="py-3 pr-3">
                            <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 pr-3">
                            <div className="flex flex-col gap-1">
                              <span
                                className={`inline-flex w-fit px-2 py-1 rounded-full text-xs font-semibold ${
                                  u.is_active
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {u.is_active ? 'Ativo' : 'Inativo'}
                              </span>
                              
                              {isUserBlocked(u) && (
                                <span className="inline-flex w-fit px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                                  Bloqueado até {formatBlockedUntil(u.blocked_until)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => handleResetPassword(u)}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                              >
                                <span className="inline-flex items-center gap-1">
                                  <KeyRound size={14} />
                                  Senha
                                </span>
                              </button>

                              {isUserBlocked(u) && (
                                <button
                                  onClick={() => handleUnlock(u)}
                                  disabled={unlockUser.isPending}
                                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50"
                                >
                                  Desbloquear
                                </button>
                              )}

                              {u.is_active ? (
                                <button
                                  onClick={() => handleDeactivate(u)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                                >
                                  Inativar
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleActivate(u)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                                >
                                  Ativar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}