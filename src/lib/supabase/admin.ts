import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Singleton instance of the admin client
let adminSupabaseClient: SupabaseClient | null = null

export function getSupabaseAdminClient(): SupabaseClient {
  // Moved checks inside to ensure env vars are validated when function is called
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
  }
  if (!supabaseServiceRoleKey) {
    throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY')
  }

  if (!adminSupabaseClient) {
    // Now TypeScript knows supabaseUrl and supabaseServiceRoleKey are strings here
    adminSupabaseClient = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          // Important: Disable auto-refreshing tokens for the admin client
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  }
  return adminSupabaseClient
} 