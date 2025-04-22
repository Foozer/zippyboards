import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create a plain Supabase client for API routes where cookie handling isn't needed
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST() {
  try {
    // Validate the session with direct API call
    const { data, error } = await supabase.auth.getSession()
    
    if (error || !data.session) {
      console.error('Session validation error:', error || 'No session found')
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    // Session is valid, return success response with user info
    return NextResponse.json({
      user: {
        id: data.session.user.id,
        email: data.session.user.email,
      },
      authenticated: true,
    })
  } catch (error) {
    console.error('Server error during validation:', error)
    return NextResponse.json(
      { error: 'Server error during validation' },
      { status: 500 }
    )
  }
} 