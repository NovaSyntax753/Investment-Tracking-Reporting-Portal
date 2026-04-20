import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const AUTH_LOOKUP_TIMEOUT_MS = 2500

function isDashboardPath(pathname: string) {
  return pathname.startsWith('/dashboard')
}

function isAdminPath(pathname: string) {
  return pathname.startsWith('/admin')
}

function isLoginPath(pathname: string) {
  return pathname === '/login'
}

async function getSessionWithTimeout(request: NextRequest) {
  const timeoutPromise = new Promise<null>((resolve) => {
    setTimeout(() => resolve(null), AUTH_LOOKUP_TIMEOUT_MS)
  })

  return Promise.race([
    updateSession(request).catch(() => null),
    timeoutPromise,
  ])
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const needsAuthCheck = isDashboardPath(pathname) || isAdminPath(pathname) || isLoginPath(pathname)
  if (!needsAuthCheck) {
    return NextResponse.next()
  }

  // If Supabase env vars are missing (e.g. Vercel deployment without env vars set),
  // avoid middleware crashes and treat protected routes as unauthenticated.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (isDashboardPath(pathname) || isAdminPath(pathname)) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  const sessionResult = await getSessionWithTimeout(request)
  if (!sessionResult) {
    if (isDashboardPath(pathname) || isAdminPath(pathname)) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  const { supabaseResponse, user } = sessionResult

  const isAuthenticated = !!user
  const isAdmin = user?.email === process.env.ADMIN_EMAIL

  // ── Protect /dashboard/* ───────────────────────────────────────────────────
  if (isDashboardPath(pathname)) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // ── Protect /admin/* ───────────────────────────────────────────────────────
  if (isAdminPath(pathname)) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // ── Redirect already-logged-in users away from /login ─────────────────────
  if (isLoginPath(pathname) && isAuthenticated) {
    const dest = isAdmin ? '/admin' : '/dashboard'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/login',
  ],
}
