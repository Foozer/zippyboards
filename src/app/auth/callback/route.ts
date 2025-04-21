import { createClient } from '@/utils/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'
  const redirectUrl = new URL(next, requestUrl.origin)

  if (!code) {
    // If no code is provided, redirect to login with an error
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('error', 'Missing authentication code')
    return NextResponse.redirect(redirectUrl)
  }

  try {
    const supabase = await createClient()
    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      // If there's an error, redirect to login with error message
      console.error('Auth callback error:', error.message)
      redirectUrl.pathname = '/login'
      redirectUrl.searchParams.set('error', error.message)
      return NextResponse.redirect(redirectUrl)
    }

    // Successful authentication - redirect to dashboard or specified page
    return NextResponse.redirect(redirectUrl)
  } catch (err) {
    console.error('Unexpected auth callback error:', err)
    // Handle any unexpected errors
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('error', 'An unexpected error occurred')
    return NextResponse.redirect(redirectUrl)
  }
} 