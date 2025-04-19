import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Helper function to handle Supabase errors
export function handleSupabaseError(error: any) {
  console.error('Supabase error:', error)
  throw new Error(error.message || 'An error occurred with the database')
}

// Helper function to get the current user's session
export async function getCurrentUser() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session?.user
}

// Helper function to check if user is authenticated
export async function isAuthenticated() {
  const user = await getCurrentUser()
  return !!user
}

// Helper function to get user's projects
export async function getUserProjects() {
  const user = await getCurrentUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('project_members')
    .select(`
      project_id,
      projects:projects (
        id,
        name,
        description,
        created_at,
        updated_at,
        created_by,
        is_archived
      )
    `)
    .eq('user_id', user.id)

  if (error) handleSupabaseError(error)
  return data?.map(item => item.projects) || []
} 