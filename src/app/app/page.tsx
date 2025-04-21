import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'

export default async function AppPage() {
  // Get the Supabase client
  const supabase = await createClient()
  
  // Verify authentication
  const { data: { user }, error } = await supabase.auth.getUser()
  
  // If no authenticated user, redirect to login
  if (error || !user) {
    redirect('/login?redirectedFrom=/app')
  }
  
  return (
    <AppLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Welcome to your App</h1>
        <p className="text-xl mb-4">You are logged in as: {user.email}</p>
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Your Dashboard</h2>
          <p className="text-gray-300">This is a protected route that requires authentication.</p>
        </div>
      </div>
    </AppLayout>
  )
} 