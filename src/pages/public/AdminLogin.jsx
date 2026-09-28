import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AuthShell from '../../components/AuthShell'
import { Button, Input } from '../../components/ui'
import { useAdminAuth } from '../../context/AuthContext'

export default function AdminLogin() {
  const { admin, login } = useAdminAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  if (admin) return <Navigate to={admin.mustChangePassword ? '/admin/change-password' : location.state?.from || '/admin'} replace />

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const a = await login(email, password)
      navigate(a.mustChangePassword ? '/admin/change-password' : location.state?.from || '/admin', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Staff login" subtitle="Admin panel for shop owners and counter staff." footer={<Link to="/login" className="text-slate-500 hover:text-slate-800">Customer? Log in here</Link>}>
      <form onSubmit={submit} className="space-y-4">
        <Input label="Email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        <Input label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">{error}</p>}
        <Button type="submit" size="lg" className="w-full" loading={loading}>Log in</Button>
      </form>
    </AuthShell>
  )
}
