// Thin fetch wrapper. Auth is carried by httpOnly cookies set by the API, so no token
// is ever stored in JavaScript-accessible storage.
const BASE = import.meta.env.VITE_API_URL || '/api'

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error?.message || `Request failed (${status})`)
    this.status = status
    this.code = body?.error?.code
    this.details = body?.error?.details || []
  }

  /** { fieldName: message } for inline form errors */
  get fieldErrors() {
    return Object.fromEntries(this.details.map((d) => [d.field, d.message]))
  }
}

function buildUrl(path, query) {
  const url = `${BASE}${path}`
  if (!query) return url
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== '') params.set(k, v)
  }
  const qs = params.toString()
  return qs ? `${url}?${qs}` : url
}

export async function api(path, { method = 'GET', body, query, signal } = {}) {
  const isForm = body instanceof FormData
  const res = await fetch(buildUrl(path, query), {
    method,
    credentials: 'include',
    signal,
    headers: body && !isForm ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  })
  const text = await res.text()
  const data = text ? safeJson(text) : null
  if (!res.ok) {
    const err = new ApiError(res.status, data)
    if (res.status === 401 || err.code === 'PASSWORD_CHANGE_REQUIRED') {
      window.dispatchEvent(new CustomEvent('api:auth', { detail: { path, status: res.status, code: err.code } }))
    }
    throw err
  }
  return data
}

function safeJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

api.get = (path, query, opts) => api(path, { ...opts, query })
api.post = (path, body) => api(path, { method: 'POST', body })
api.put = (path, body) => api(path, { method: 'PUT', body })
api.patch = (path, body) => api(path, { method: 'PATCH', body })
api.del = (path, body) => api(path, { method: 'DELETE', body })

/** Opens a file download (reports) using the session cookie. */
export async function download(path, query, fallbackName) {
  const res = await fetch(buildUrl(path, query), { credentials: 'include' })
  if (!res.ok) throw new ApiError(res.status, safeJson(await res.text()))
  const blob = await res.blob()
  const cd = res.headers.get('content-disposition') || ''
  const name = /filename="?([^";]+)"?/.exec(cd)?.[1] || fallbackName
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
