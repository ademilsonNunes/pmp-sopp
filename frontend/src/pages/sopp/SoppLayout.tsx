import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, ShoppingCart, Factory, TrendingUp, Boxes, Receipt, GitCompare, RotateCcw, Truck } from 'lucide-react'
import Navbar from '../../components/layout/Navbar'

const NAV = [
  { to: '/sopp',             label: 'Dashboard',      Icon: LayoutDashboard, end: true },
  { to: '/sopp/pedidos',     label: 'Carteira',       Icon: ShoppingCart },
  { to: '/sopp/embarque',    label: 'Prog. Embarque', Icon: Truck },
  { to: '/sopp/producao',    label: 'Produção',       Icon: Factory },
  { to: '/sopp/forecast',    label: 'Forecast',       Icon: TrendingUp },
  { to: '/sopp/pmp-real',    label: 'Prog. vs Real',  Icon: GitCompare },
  { to: '/sopp/estoque',     label: 'Estoque PA',     Icon: Boxes },
  { to: '/sopp/faturamento', label: 'Faturamento',    Icon: Receipt },
  { to: '/sopp/dev-bonif',   label: 'Dev. & Bonif.',  Icon: RotateCcw },
]

export default function SoppLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {/* Sub-nav */}
      <div
        className="fixed top-16 left-0 right-0 z-40 border-b border-gray-200 shadow-sm"
        style={{ backgroundColor: '#fff' }}
      >
        <div className="max-w-screen-2xl mx-auto px-4">
          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
            {NAV.map(({ to, label, Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
                style={({ isActive }) =>
                  isActive ? { backgroundColor: '#D92214' } : {}
                }
              >
                <Icon size={15} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Page content (below navbar 64px + sub-nav ~44px) */}
      <div className="pt-[108px] max-w-screen-2xl mx-auto px-4 py-6">
        <Outlet />
      </div>
    </div>
  )
}
