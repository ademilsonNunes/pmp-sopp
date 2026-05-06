import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import SoppLayout from './pages/sopp/SoppLayout'
import SoppDashboard from './pages/sopp/SoppDashboard'
import PedidosPage from './pages/sopp/PedidosPage'
import ProducaoPage from './pages/sopp/ProducaoPage'
import ForecastPage from './pages/sopp/ForecastPage'
import EstoquePage from './pages/sopp/EstoquePage'
import FaturamentoPage from './pages/sopp/FaturamentoPage'
import PmpRealPage from './pages/sopp/PmpRealPage'
import DevBonifPage from './pages/sopp/DevBonifPage'
import EmbarquePage from './pages/sopp/EmbarquePage'
import { useAuthStore } from './hooks/useAuth'
import UsersPage from './pages/UsersPage'
import FirstLoginChangePasswordPage from './pages/FirstLoginChangePasswordPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import FeriadosPage from './pages/FeriadosPage'


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, mustChangePassword } = useAuthStore()

  if (!token) return <Navigate to="/login" replace />
  if (mustChangePassword) {
    return <Navigate to="/first-login-change-password" replace />
  }

  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { token, mustChangePassword } = useAuthStore()

  if (token && mustChangePassword) {
    return <Navigate to="/first-login-change-password" replace />
  }

  if (token) return <Navigate to="/" replace />
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { token, user, mustChangePassword } = useAuthStore()

  if (!token) return <Navigate to="/login" replace />
  if (mustChangePassword) {
    return <Navigate to="/first-login-change-password" replace />
  }
  if (user?.role !== 'ADMIN') return <Navigate to="/" replace />
  return <>{children}</>
}

function ForcePasswordChangeRoute({ children }: { children: React.ReactNode }) {
  const { token, mustChangePassword } = useAuthStore()

  if (!token) return <Navigate to="/login" replace />
  if (!mustChangePassword) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          <Route
            path="/first-login-change-password"
            element={
              <ForcePasswordChangeRoute>
                <FirstLoginChangePasswordPage />
              </ForcePasswordChangeRoute>
            }
          />

          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPasswordPage />
              </PublicRoute>
            }
          />
          
          <Route
            path="/reset-password/:token"
            element={
              <PublicRoute>
                <ResetPasswordPage />
              </PublicRoute>
            }
          />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <AdminRoute>
                <UsersPage />
              </AdminRoute>
            }
          />
        
          <Route
            path="/feriados"
            element={
              <ProtectedRoute>
                <FeriadosPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/sopp"
            element={
              <ProtectedRoute>
                <SoppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<SoppDashboard />} />
            <Route path="pedidos" element={<PedidosPage />} />
            <Route path="embarque" element={<EmbarquePage />} />
            <Route path="producao" element={<ProducaoPage />} />
            <Route path="forecast" element={<ForecastPage />} />
            <Route path="pmp-real" element={<PmpRealPage />} />
            <Route path="estoque" element={<EstoquePage />} />
            <Route path="faturamento" element={<FaturamentoPage />} />
            <Route path="dev-bonif" element={<DevBonifPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>

      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{ style: { fontFamily: 'Montserrat, sans-serif' } }}
      />
    </QueryClientProvider>
  )
}