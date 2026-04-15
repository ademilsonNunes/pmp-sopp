import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Eye, EyeOff, LogIn, Factory, BarChart3, TrendingUp } from 'lucide-react'
import { useAuthStore } from '../hooks/useAuth'
import { getErrorMessage } from '../lib/utils'
import { Link } from 'react-router-dom'

const loginSchema = z.object({
  username: z.string().min(1, 'Informe o usuário'),
  password: z.string().min(1, 'Informe a senha'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const navigate = useNavigate()
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
      const result = await login(data)

      if (result.force_password_change) {
        toast.warning('Você precisa alterar a senha antes de continuar.')
        navigate('/first-login-change-password', { replace: true })
        return
      }

      toast.success('Login realizado com sucesso!')
      navigate('/', { replace: true })
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #D92214 0%, #8B0E0A 100%)' }}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-white/5 rounded-full" />
          <div className="absolute top-1/3 -right-16 w-56 h-56 bg-white/5 rounded-full" />
          <div className="absolute -bottom-10 left-1/4 w-48 h-48 bg-white/5 rounded-full" />
          <div className="absolute bottom-1/4 -left-8 w-32 h-32 bg-white/8 rounded-full" />
        </div>

        <div className="relative z-10 flex flex-col items-center px-12 text-center animate-fade-in">
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
                  <p className="text-white/70 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-10 border border-gray-100">
            <div className="text-center mb-8">
              <div className="lg:hidden mb-6">
                <img
                  src="https://sobelsuprema.site/wp-content/uploads/2023/07/Logo-Suprema-Slogan-Alta-ai-1.png"
                  alt="Sobel Suprema"
                  className="h-16 w-auto object-contain mx-auto"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>

              <h2 className="text-3xl font-bold text-gray-900 mb-2">Bem-vindo</h2>
              <p className="text-gray-500">
                Entre com suas credenciais para acessar o sistema
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Usuário
                </label>
                <input
                  type="text"
                  {...register('username')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  placeholder="Digite seu usuário"
                />
                {errors.username && (
                  <p className="text-sm text-red-600 mt-1">{errors.username.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    placeholder="Digite sua senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold py-3.5 px-4 rounded-xl hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0 mt-2"
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
              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm text-red-700 hover:text-red-800 font-medium"
                >
                  Esqueci minha senha
                </Link>
              </div>
            </form>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            © {new Date().getFullYear()} Sobel Suprema. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}