'use server'

import { createServerSupabaseClient } from '../supabase/server'
import { redirect } from 'next/navigation'

/**
 * Server-side login action
 */
export async function loginAction(formData: FormData) {
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
    
    // Successful login
    return { success: true, redirectTo }
  } catch (err) {
    console.error('Server login error:', err)
    return { error: 'An error occurred during login' }
  }
}

/**
 * Server-side signup action
 */
export async function signupAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  if (!email || !password) {
    return { error: 'Email and password are required' }
  }
  
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data, error } = await supabase.auth.signUp({
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
    
    return { 
      success: true, 
      message: 'Check your email for the confirmation link!',
      emailConfirmed: !data?.user?.identities?.[0]?.identity_data?.email_verified
    }
  } catch (err) {
    console.error('Server signup error:', err)
    return { error: 'An error occurred during signup' }
  }
}

/**
 * Server-side logout action
 */
export async function logoutAction() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect('/login')
} 