import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // If Supabase env vars are missing (e.g. Vercel deployment without env vars set),
  // skip auth logic gracefully instead of crashing with MIDDLEWARE_INVOCATION_FAILED.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next()
  }

  let supabaseResponse: NextResponse
  let user: { email?: string | null } | null = null

  try {
    const result = await updateSession(request)
    supabaseResponse = result.supabaseResponse
    user = result.user
  } catch {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl

  const isAuthenticated = !!user
  const isAdmin = isAuthenticated && user.email === process.env.ADMIN_EMAIL

  // ── Protect /dashboard/* ───────────────────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // ── Protect /admin/* ───────────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // ── Redirect already-logged-in users away from /login ─────────────────────
  if (pathname === '/login' && isAuthenticated) {
    const dest = isAdmin ? '/admin' : '/dashboard'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Run on all routes except: _next static, _next image, favicon, and
     * external file extensions.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
