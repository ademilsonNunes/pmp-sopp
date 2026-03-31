import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Eye, EyeOff, LogIn, Factory, BarChart3, TrendingUp } from 'lucide-react'
import { useAuthStore } from '../hooks/useAuth'
import { getErrorMessage } from '../lib/utils'

const loginSchema = z.object({
  username: z.string().min(1, 'Informe o usuário'),
  password: z.string().min(1, 'Informe a senha'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { login } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    try {
      await login(data)
      toast.success('Login realizado com sucesso!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Brand */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #D92214 0%, #8B0E0A 100%)' }}
      >
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-white/5 rounded-full" />
          <div className="absolute top-1/3 -right-16 w-56 h-56 bg-white/5 rounded-full" />
          <div className="absolute -bottom-10 left-1/4 w-48 h-48 bg-white/5 rounded-full" />
          <div className="absolute bottom-1/4 -left-8 w-32 h-32 bg-white/8 rounded-full" />
        </div>

        <div className="relative z-10 flex flex-col items-center px-12 text-center animate-fade-in">
          {/* Logo */}
          <div className="mb-8 bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-2xl">
            <img
              src="https://sobelsuprema.site/wp-content/uploads/2023/07/Logo-Suprema-Slogan-Alta-ai-1.png"
              alt="Sobel Suprema"
              className="h-24 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>

          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            PMP Sistema
          </h1>
          <p className="text-white/80 text-lg font-medium mb-2">
            Plano Mestre de Produção
          </p>
          <p className="text-white/60 text-sm mb-12">
            Sobel Suprema Indústria e Comércio
          </p>

          {/* Feature highlights */}
          <div className="space-y-4 w-full max-w-xs">
            {[
              { icon: Factory, label: 'Gestão de Produção', desc: 'Planeje e controle sua produção diária' },
              { icon: BarChart3, label: 'Análise Completa', desc: 'Visualize dados por produto e período' },
              { icon: TrendingUp, label: 'Importação CSV', desc: 'Importe planos em massa com facilidade' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3 text-left bg-white/10 rounded-xl p-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{label}</p>
                  <p className="text-white/60 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
              style={{ background: 'linear-gradient(135deg, #D92214 0%, #8B0E0A 100%)' }}
            >
              <span className="text-white text-2xl font-bold">P</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">PMP Sistema</h1>
            <p className="text-gray-500 text-sm mt-1">Plano Mestre de Produção</p>
          </div>

          {/* Form card */}
          <div className="card p-8 shadow-xl">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Bem-vindo!</h2>
              <p className="text-gray-500 text-sm">Entre com suas credenciais para acessar o sistema</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Username */}
              <div>
                <label className="label">Usuário</label>
                <input
                  {...register('username')}
                  type="text"
                  placeholder="Digite seu usuário"
                  autoComplete="username"
                  className={`input-field ${errors.username ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : ''}`}
                  disabled={loading}
                />
                {errors.username && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{errors.username.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="label">Senha</label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Digite sua senha"
                    autoComplete="current-password"
                    className={`input-field pr-10 ${errors.password ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : ''}`}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{errors.password.message}</p>
                )}
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-base mt-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Entrando...
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    Entrar
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-6">
            © {new Date().getFullYear()} Sobel Suprema. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}
