import Brand from '../layouts/Brand'

/** Centered card layout for login / register screens. */
export default function AuthShell({ title, subtitle, children, footer, wide }) {
  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(80%_60%_at_50%_0%,#e0e7ff_0%,#f8fafc_60%)]">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center px-4">
        <Brand />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-8 sm:items-center">
        <div className={`w-full ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
          <div className="card p-6 sm:p-8">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </div>
          {footer && <div className="mt-4 text-center text-sm text-slate-600">{footer}</div>}
        </div>
      </main>
    </div>
  )
}
