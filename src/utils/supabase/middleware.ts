import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'

export async function updateSession(request: NextRequest) {
  // Create a response to modify
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create a Supabase client using the request and response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // This is called by the Supabase client when a token needs to be persisted
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          // This is called by the Supabase client when a token needs to be removed
          response.cookies.delete({
            name,
            ...options,
          })
        },
      },
    }
  )

  // Refresh the auth token
  await supabase.auth.getUser()

  return response
} 