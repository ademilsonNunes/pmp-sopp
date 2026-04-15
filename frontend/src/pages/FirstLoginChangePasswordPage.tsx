import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import { useAuthStore } from '../hooks/useAuth'
import { getErrorMessage } from '../lib/utils'

const schema = z
  .object({
    current_password: z.string().min(1, 'Informe a senha atual'),
    new_password: z.string().min(6, 'A nova senha deve ter no mínimo 6 caracteres'),
    confirm_password: z.string().min(1, 'Confirme a nova senha'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'A confirmação da senha não confere',
    path: ['confirm_password'],
  })

type FormData = z.infer<typeof schema>

export default function FirstLoginChangePasswordPage() {
  const navigate = useNavigate()
  const { changeFirstLoginPassword, logout } = useAuthStore()

  const [loading, setLoading] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      await changeFirstLoginPassword({
        current_password: data.current_password,
        new_password: data.new_password,
      })

      toast.success('Senha alterada com sucesso!')
      navigate('/', { replace: true })
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
            <KeyRound className="text-red-600" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Troca de senha obrigatória
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            No primeiro acesso, você precisa definir uma nova senha antes de continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Senha atual
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                {...register('current_password')}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-11 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Digite a senha atual"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400"
              >
                {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.current_password && (
              <p className="text-sm text-red-600 mt-1">{errors.current_password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nova senha
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                {...register('new_password')}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-11 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Digite a nova senha"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400"
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.new_password && (
              <p className="text-sm text-red-600 mt-1">{errors.new_password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Confirmar nova senha
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                {...register('confirm_password')}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-11 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Confirme a nova senha"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirm_password && (
              <p className="text-sm text-red-600 mt-1">{errors.confirm_password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-semibold py-3 transition"
          >
            {loading ? 'Salvando...' : 'Alterar senha'}
          </button>

          <button
            type="button"
            onClick={logout}
            className="w-full rounded-xl border border-gray-300 text-gray-700 font-semibold py-3 hover:bg-gray-50 transition"
          >
            Sair
          </button>
        </form>
      </div>
    </div>
  )
}