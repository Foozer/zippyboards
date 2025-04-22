'use server'

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  try {
    // Create a cookies object
    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            // This is called by the Supabase client when a cookie needs to be set
            response.cookies.set({
              name,
              value,
              ...options,
              path: '/',
            })
          },
          remove(name: string, options: CookieOptions) {
            // This is called by the Supabase client when a cookie needs to be removed
            response.cookies.delete({
              name,
              ...options,
              path: '/',
            })
          },
        },
      }
    )

    // Refresh session if it exists
    const { data: { session } } = await supabase.auth.getSession()
    
    // Define protected routes
    const path = request.nextUrl.pathname
    const isAuthRoute = path === '/login' || path === '/signup'
    const isAppRoute = path === '/app' || path.startsWith('/app/') 
    const isProtectedRoute = path === '/dashboard' || path.startsWith('/dashboard/') || isAppRoute
    const isPublicRoute = path === '/' || isAuthRoute || path.startsWith('/auth/') || path.startsWith('/api/auth/')

    // Detailed logging for debugging
    console.log(`Middleware: Path: ${path} | Authenticated: ${!!session} | Protected: ${isProtectedRoute} | Public: ${isPublicRoute}`)
    if (session) {
      console.log(`User authenticated: ${session.user.id} (${session.user.email})`)
    } else {
      console.log('No session found. Cookies present:', 
        [...request.cookies.getAll()].map(c => c.name).join(', '))
    }

    // Redirect if needed
    if (!session && !isPublicRoute) {
      // Redirect to login if not authenticated and trying to access a protected route
      console.log(`Not authenticated, redirecting to login from ${path}`)
      const encodedRedirect = encodeURIComponent(path)
      return NextResponse.redirect(new URL(`/login?redirectedFrom=${encodedRedirect}`, request.url))
    }

    if (session && isAuthRoute) {
      // Redirect to dashboard if authenticated and trying to access an auth route
      console.log(`Already authenticated, redirecting to dashboard from ${path}`)
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
} 