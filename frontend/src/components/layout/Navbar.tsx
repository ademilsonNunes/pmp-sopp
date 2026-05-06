import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LogOut, ChevronDown, Factory, BarChart2, Users, CalendarDays } from 'lucide-react'
import { useAuthStore } from '../../hooks/useAuth'


export default function Navbar() {
  const { user, logout } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 shadow-lg" style={{ backgroundColor: '#32373c' }}>
      <div className="flex items-center justify-between h-full px-4 sm:px-6">
        {/* Logo / Brand + Nav */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-12 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#D92214' }}
            >
              <img src="/Logo-Suprema-ss.png" alt="Logo Sobel Suprema" className="w-10 h-7" />
              {/*<Factory size={18} className="text-white" />*/}
            </div>
            <div className="hidden sm:block">
              <span className="text-white font-bold text-lg tracking-tight">SOBEL SUPREMA</span>
              <span className="text-gray-400 text-xs block leading-none">PMP & S&OP</span>
            </div>
          </div>
          
         
          {/* Module nav */}
          <nav className="hidden md:flex items-center gap-1 ml-6 pl-6 border-l border-gray-600">
            {user?.role === 'ADMIN' && (
              <NavLink
                to="/users"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                <Users size={16} /> Usuários
              </NavLink>
            )}

            <NavLink
              to="/feriados"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`
              }
            >
              <CalendarDays size={14} /> Feriados
            </NavLink>

            <NavLink to="/" end
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`
              }>
              <Factory size={16} /> PMP
            </NavLink>

            <NavLink to="/sopp"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`
              }>
              <BarChart2 size={16} /> S&amp;OP
            </NavLink>
          </nav>
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ backgroundColor: '#D92214' }}
            >
              {user?.full_name?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-white text-sm font-semibold leading-tight">
                {user?.full_name || user?.username || 'Usuário'}
              </p>
              <p className="text-gray-400 text-xs">
                {user?.username} {user?.role ? `· ${user.role}` : ''}
              </p>
            </div>
            <ChevronDown
              size={16}
              className={`text-gray-400 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden animate-fade-in">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.full_name || user?.username}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.username} {user?.role ? `· ${user.role}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    logout()
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                >
                  <LogOut size={16} />
                  Sair do sistema
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
