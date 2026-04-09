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
import {isAdmin} from './utils/permissions'
import UsersPage from './pages/UsersPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})


function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RoleRoute({ children, allowedRoles, }: { 
  children: React.ReactNode
  allowedRoles: string[]
}) {
  const { token, user } = useAuthStore()

  if (!token) return <Navigate to="/login" replace />
  if (!user || !allowedRoles.includes(user.role)) return <Navigate to="/" replace />
  return <>{children}</>
  
}


function PublicRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore()
  if (token) return <Navigate to="/" replace />
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  if (user?.role !== 'ADMIN') return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />          
          <Route path="/users" element={<AdminRoute><UsersPage /></AdminRoute>} />
          <Route path="/sopp" element={<ProtectedRoute><SoppLayout /></ProtectedRoute>}></Route>

          {/* PMP */}
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

          {/* S&OP — layout compartilhado com sub-navegação */}
          <Route path="/sopp" element={<ProtectedRoute><SoppLayout /></ProtectedRoute>}>
            <Route index element={<SoppDashboard />} />
            <Route path="pedidos"     element={<PedidosPage />} />
            <Route path="embarque"    element={<EmbarquePage />} />
            <Route path="producao"    element={<ProducaoPage />} />
            <Route path="forecast"    element={<ForecastPage />} />
            <Route path="pmp-real"    element={<PmpRealPage />} />
            <Route path="estoque"     element={<EstoquePage />} />
            <Route path="faturamento" element={<FaturamentoPage />} />
            <Route path="dev-bonif"   element={<DevBonifPage />} />
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
