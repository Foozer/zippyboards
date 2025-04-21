'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * Server-side login action
 */
export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = formData.get('redirectTo') as string || '/dashboard'

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  try {
    const supabase = await createServerSupabaseClient()
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      console.error('Login error:', error.message)
      return { error: error.message }
    }
    
    // Instead of redirecting, return success
    return { success: true, redirectTo }
  } catch (err) {
    console.error('Server login error:', err)
    return { error: 'An error occurred during login' }
  }
}

/**
 * Server-side signup action
 */
export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  if (!email || !password) {
    return { error: 'Email and password are required' }
  }
  
  try {
    const supabase = await createServerSupabaseClient()
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      }
    })
    
    if (error) {
      console.error('Signup error:', error.message)
      return { error: error.message }
    }
    
    return { success: true }
  } catch (err) {
    console.error('Server signup error:', err)
    return { error: 'An error occurred during signup' }
  }
} 