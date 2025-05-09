import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import type { CookieOptions } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirect = requestUrl.searchParams.get('redirectedFrom') || '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    
    // Create a Supabase client using cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string): string | undefined {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions): void {
            cookieStore.set({
              name,
              value,
              ...options,
              path: '/',
            })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({
              name,
              ...options,
              path: '/',
            })
          },
        },
      }
    )

    try {
      await supabase.auth.exchangeCodeForSession(code)
    } catch (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_error`)
    }
  }

  // Always redirect to the intended page or dashboard
  return NextResponse.redirect(`${requestUrl.origin}${redirect}`)
} 