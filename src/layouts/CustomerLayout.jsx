import { Gift, History, LayoutDashboard, LogOut, UserRound } from 'lucide-react'
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Avatar, PageLoader } from '../components/ui'
import { cx } from '../lib/cx'
import { useCustomerAuth } from '../context/AuthContext'
import Brand from './Brand'

const NAV = [
  { to: '/me', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/me/rewards', label: 'Rewards', icon: Gift },
  { to: '/me/purchases', label: 'Purchases', icon: History },
  { to: '/me/profile', label: 'Profile', icon: UserRound },
]

export default function CustomerLayout() {
  const { session, loading, logout } = useCustomerAuth()
  const location = useLocation()
  const navigate = useNavigate()

  if (loading) return <PageLoader />
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  const { customer } = session

  return (
    <div className="min-h-screen pb-20 sm:pb-0">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
          <Brand to="/me" />
          <nav className="hidden items-center gap-1 sm:flex" aria-label="Main">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) => cx('rounded-lg px-3 py-2 text-sm font-medium', isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100')}
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Avatar name={customer.fullName} src={customer.profilePhoto} size="sm" />
            <button
              onClick={async () => {
                await logout()
                navigate('/login')
              }}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="size-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-slate-200 bg-white sm:hidden" aria-label="Main">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => cx('flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium', isActive ? 'text-brand-700' : 'text-slate-500')}>
            <n.icon className="size-5" />
            {n.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
