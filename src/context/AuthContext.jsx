import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { api } from '../lib/api'

const AdminCtx = createContext(null)
const CustomerCtx = createContext(null)

// ───────────────────────────── Admin ─────────────────────────────
export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(undefined) // undefined = loading, null = signed out
  // Only check the admin session inside the admin area
  const inAdmin = useLocation().pathname.startsWith('/admin')

  const fetchAdmin = () => api.get('/auth/admin/me').then((r) => r.admin, () => null)
  const refresh = useCallback(async () => setAdmin(await fetchAdmin()), [])

  useEffect(() => {
    if (inAdmin && admin === undefined) fetchAdmin().then(setAdmin)
  }, [inAdmin, admin])

  // Any admin API returning 401 means the session ended (expired, deactivated, password changed elsewhere)
  useEffect(() => {
    const onAuth = (e) => {
      const { path, status, code } = e.detail
      if (path.startsWith('/me') || path.startsWith('/auth/login') || path.startsWith('/auth/otp') || path.startsWith('/auth/register')) return
      if (status === 401 && !path.startsWith('/auth/admin/login')) setAdmin(null)
      if (code === 'PASSWORD_CHANGE_REQUIRED') setAdmin((a) => (a ? { ...a, mustChangePassword: true } : a))
    }
    window.addEventListener('api:auth', onAuth)
    return () => window.removeEventListener('api:auth', onAuth)
  }, [])

  const login = useCallback(async (email, password) => {
    const { admin } = await api.post('/auth/admin/login', { email, password })
    setAdmin(admin)
    return admin
  }, [])

  const logout = useCallback(async () => {
    await api.post('/auth/admin/logout').catch(() => {})
    setAdmin(null)
  }, [])

  const can = useCallback((perm) => !!admin && (admin.isSuperAdmin || admin.permissions.includes(perm)), [admin])

  const value = useMemo(() => ({ admin, loading: admin === undefined, login, logout, refresh, setAdmin, can }), [admin, login, logout, refresh, can])
  return <AdminCtx.Provider value={value}>{children}</AdminCtx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAdminAuth = () => useContext(AdminCtx)

// ───────────────────────────── Customer ─────────────────────────────
export function CustomerAuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // { customer, journey, stats, settings } | null
  const inCustomerArea = !useLocation().pathname.startsWith('/admin')

  const fetchSession = () => api.get('/me').catch(() => null)
  const refresh = useCallback(async () => setSession(await fetchSession()), [])

  useEffect(() => {
    if (inCustomerArea && session === undefined) fetchSession().then(setSession)
  }, [inCustomerArea, session])

  useEffect(() => {
    const onAuth = (e) => {
      if (e.detail.status === 401 && e.detail.path.startsWith('/me')) setSession(null)
    }
    window.addEventListener('api:auth', onAuth)
    return () => window.removeEventListener('api:auth', onAuth)
  }, [])

  const logout = useCallback(async () => {
    await api.post('/auth/logout').catch(() => {})
    setSession(null)
  }, [])

  const value = useMemo(() => ({ session, loading: session === undefined, refresh, logout }), [session, refresh, logout])
  return <CustomerCtx.Provider value={value}>{children}</CustomerCtx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useCustomerAuth = () => useContext(CustomerCtx)
