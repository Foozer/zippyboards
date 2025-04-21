'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error('Error fetching user:', error)
      } finally {
        setIsLoading(false)
      }
    }

    getUser()
  }, [])

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Welcome to ZippyBoards</h1>
      {user && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
          <p className="text-gray-300 mb-4">
            Welcome {user.email}! You&apos;re now ready to start managing your projects and tasks.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-700 rounded-lg">
              <h3 className="font-semibold mb-2">Create a Project</h3>
              <p className="text-gray-400">Start by creating your first project to organize your tasks.</p>
            </div>
            <div className="p-4 bg-gray-700 rounded-lg">
              <h3 className="font-semibold mb-2">Add Tasks</h3>
              <p className="text-gray-400">Break down your work into manageable tasks and track progress.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 