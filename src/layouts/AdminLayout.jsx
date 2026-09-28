import { useState } from 'react'
import {
  BarChart3, FileClock, Gift, History, KeyRound, LayoutDashboard, LogOut, Menu, PackageCheck, Plus, Settings, ShieldCheck,
  ShoppingBag, Users, X,
} from 'lucide-react'
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Avatar, Button, PageLoader } from '../components/ui'
import { cx } from '../lib/cx'
import { useAdminAuth } from '../context/AuthContext'
import Brand from './Brand'

const NAV = [
  { section: 'Overview' },
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, perm: 'dashboard.view', end: true },
  { section: 'Operations' },
  { to: '/admin/customers', label: 'Customers', icon: Users, perm: 'customers.view' },
  { to: '/admin/purchases', label: 'Purchases', icon: ShoppingBag, perm: 'purchases.view' },
  { to: '/admin/claims', label: 'Reward claims', icon: PackageCheck, perm: 'rewards.view' },
  { to: '/admin/loyalty', label: 'Loyalty history', icon: History, perm: 'loyalty.view' },
  { section: 'Program' },
  { to: '/admin/rewards', label: 'Rewards', icon: Gift, perm: 'rewards.view' },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3, perm: 'reports.view' },
  { to: '/admin/settings', label: 'Settings', icon: Settings, perm: 'settings.manage' },
  { section: 'Administration' },
  { to: '/admin/staff', label: 'Staff & roles', icon: ShieldCheck, perm: 'staff.manage' },
  { to: '/admin/audit', label: 'Audit log', icon: FileClock, perm: 'audit.view' },
]

function SideNav({ can }) {
  const items = NAV.filter((n, i) => {
    if (!n.section) return can(n.perm)
    // Hide section headings with no visible items below them
    for (let j = i + 1; j < NAV.length && !NAV[j].section; j++) if (can(NAV[j].perm)) return true
    return false
  })
  return (
    <nav className="space-y-0.5 px-3" aria-label="Admin">
      {items.map((n) =>
        n.section ? (
          <p key={n.section} className="px-3 pt-5 pb-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">{n.section}</p>
        ) : (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              cx('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors', isActive ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
            }
          >
            <n.icon className="size-4.5" aria-hidden />
            {n.label}
          </NavLink>
        ),
      )}
    </nav>
  )
}

export default function AdminLayout() {
  const { admin, loading, logout, can } = useAdminAuth()
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  if (loading) return <PageLoader />
  if (!admin) return <Navigate to="/admin/login" replace state={{ from: location.pathname + location.search }} />
  if (admin.mustChangePassword && location.pathname !== '/admin/change-password') return <Navigate to="/admin/change-password" replace />

  const doLogout = async () => {
    await logout()
    navigate('/admin/login')
  }

  const sidebar = (
    <div className="flex h-full flex-col" onClick={(e) => e.target.closest('a') && setOpen(false)}>
      <div className="flex h-16 items-center border-b border-slate-100 px-5">
        <Brand to="/admin" subtitle="Admin panel" />
      </div>
      <div className="flex-1 overflow-y-auto pb-4">
        {can('purchases.create') && (
          <div className="px-3 pt-4">
            <Button to="/admin/purchases/new" icon={Plus} className="w-full">Add purchase</Button>
          </div>
        )}
        <SideNav can={can} />
      </div>
      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar name={admin.name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">{admin.name}</p>
            <p className="truncate text-xs text-slate-500">{admin.role.name}</p>
          </div>
        </div>
        <div className="mt-1 grid grid-cols-2 gap-1">
          <NavLink to="/admin/change-password" className="flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-100">
            <KeyRound className="size-3.5" /> Password
          </NavLink>
          <button onClick={doLogout} className="flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-100">
            <LogOut className="size-3.5" /> Log out
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-white lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl">
            <button onClick={() => setOpen(false)} className="absolute top-4 right-3 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Close menu">
              <X className="size-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100" aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <Brand to="/admin" subtitle="Admin panel" />
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

/** Route-level permission gate. */
export function RequirePermission({ perm, children }) {
  const { can } = useAdminAuth()
  if (!can(perm)) {
    return (
      <div className="card mx-auto mt-10 max-w-md p-8 text-center">
        <ShieldCheck className="mx-auto size-10 text-slate-300" />
        <h1 className="mt-3 text-lg font-semibold text-slate-900">Access restricted</h1>
        <p className="mt-1 text-sm text-slate-500">Your role doesn't include access to this page. Ask a Super Admin if you need it.</p>
      </div>
    )
  }
  return children
}
