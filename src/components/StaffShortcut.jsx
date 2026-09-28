import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

// Secret word that opens the staff login when typed anywhere on the public site.
// Change it in .env (VITE_STAFF_SECRET) — letters/digits only, case-insensitive.
const SECRET = (import.meta.env.VITE_STAFF_SECRET || 'apnistaff').toLowerCase()
const RESET_AFTER_MS = 3000

/**
 * Hides the staff login from customers: there is no visible link, the page opens only when the
 * secret word is typed on the keyboard (outside of form fields).
 * Note: this only hides the entrance. Security still comes from the admin password,
 * rate limiting and the server-side permission checks.
 */
export default function StaffShortcut() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const inAdmin = pathname.startsWith('/admin')

  useEffect(() => {
    if (inAdmin || !SECRET) return
    let typed = ''
    let timer = null

    const onKey = (e) => {
      const el = e.target
      // Ignore typing inside inputs so customers filling forms never trigger it
      if (el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))) return
      if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return

      typed = (typed + e.key.toLowerCase()).slice(-SECRET.length)
      clearTimeout(timer)
      timer = setTimeout(() => (typed = ''), RESET_AFTER_MS)

      if (typed === SECRET) {
        typed = ''
        navigate('/admin/login')
      }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      clearTimeout(timer)
    }
  }, [inAdmin, navigate])

  return null
}
