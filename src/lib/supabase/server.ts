'use server'

import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Server-side Supabase client (for server components)
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  
  return createServerClient<Database>(
    supabaseUrl!,
    supabaseAnonKey!,
    {
      cookies: {
        get(name: string) {
          // Get a cookie by name
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Set a cookie by name
          try {
            cookieStore.set({
              name,
              value,
              ...options,
            })
          } catch (error) {
            // This is expected in middleware or server components where cookies can't be modified
            console.error(`Error setting cookie ${name}:`, error)
          }
        },
        remove(name: string, options: CookieOptions) {
          // Remove a cookie by name
          try {
            cookieStore.delete({
              name,
              ...options,
            })
          } catch (error) {
            // This is expected in middleware or server components where cookies can't be modified
            console.error(`Error removing cookie ${name}:`, error)
          }
        },
      },
    }
  )
} 