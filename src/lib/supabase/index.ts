// Central export for supabase utilities
// This allows importing from '@/lib/supabase' throughout the app

import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

// Re-export supabase client
export { supabase, getCurrentUser, isAuthenticated } from './client'

// Create a client with the browser client - for easy imports in components
export const createClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
} 