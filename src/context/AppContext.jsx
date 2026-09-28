import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'
import { api } from '../lib/api'
import { setCurrency } from '../lib/format'

const SettingsCtx = createContext(null)
const ToastCtx = createContext(null)

/** Public shop settings (name, logo, program name, currency, thresholds). */
const FALLBACK_SETTINGS = { shopName: 'Apni Dukaan', programName: 'Apni Dukaan Rewards', currency: 'INR', currencySymbol: '₹', minPurchaseAmount: 500, goldThreshold: 100 }

function fetchPublicSettings() {
  return api.get('/settings/public').then(
    ({ settings }) => {
      setCurrency(settings.currency)
      document.title = settings.programName || FALLBACK_SETTINGS.programName
      return settings
    },
    () => FALLBACK_SETTINGS,
  )
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null)
  const load = useCallback(async () => setSettings(await fetchPublicSettings()), [])
  useEffect(() => {
    fetchPublicSettings().then(setSettings)
  }, [])
  const value = useMemo(() => ({ settings, reload: load }), [settings, load])
  return <SettingsCtx.Provider value={value}>{children}</SettingsCtx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSettings = () => useContext(SettingsCtx)

const TOAST_STYLES = {
  success: ['border-emerald-200 bg-emerald-50 text-emerald-900', CheckCircle2, 'text-emerald-600'],
  error: ['border-red-200 bg-red-50 text-red-900', AlertTriangle, 'text-red-600'],
  info: ['border-slate-200 bg-white text-slate-900', Info, 'text-brand-600'],
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)
  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const push = useCallback(
    (type, message, title) => {
      const id = ++idRef.current
      setToasts((t) => [...t.slice(-3), { id, type, message, title }])
      setTimeout(() => dismiss(id), type === 'error' ? 7000 : 4000)
    },
    [dismiss],
  )
  const toast = useMemo(
    () => ({
      success: (m, t) => push('success', m, t),
      error: (m, t) => push('error', m?.message || m, t),
      info: (m, t) => push('info', m, t),
    }),
    [push],
  )
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:right-4 sm:left-auto sm:items-end" aria-live="polite">
        {toasts.map((t) => {
          const [cls, Icon, iconCls] = TOAST_STYLES[t.type]
          return (
            <div key={t.id} className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${cls}`} role="status">
              <Icon className={`mt-0.5 size-5 shrink-0 ${iconCls}`} aria-hidden />
              <div className="min-w-0 flex-1 text-sm">
                {t.title && <p className="font-semibold">{t.title}</p>}
                <p className="break-words">{t.message}</p>
              </div>
              <button onClick={() => dismiss(t.id)} className="text-current/60 hover:text-current" aria-label="Dismiss">
                <X className="size-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastCtx.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastCtx)
