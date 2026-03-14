function normalizeAbsoluteUrl(value: string | undefined | null) {
  const raw = (value || '').trim().replace(/\/$/, '')
  if (!raw) return null

  try {
    const parsed = new URL(raw)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
    return parsed.origin
  } catch {
    return null
  }
}

export function getAppUrl() {
  const fromEnv =
    normalizeAbsoluteUrl(process.env.NEXT_PUBLIC_APP_URL) ||
    normalizeAbsoluteUrl(process.env.APP_URL) ||
    normalizeAbsoluteUrl(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)

  if (fromEnv) return fromEnv

  if (process.env.NODE_ENV !== 'production') {
    return 'http://localhost:3000'
  }

  return null
}

export function getAuthEmailRedirect(path = '/login') {
  const appUrl = getAppUrl()
  if (!appUrl) return null

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${appUrl}${normalizedPath}`
}
