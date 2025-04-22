'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Navigation from '@/components/layout/Navigation'
import type { User } from '@supabase/supabase-js'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          throw error
        }
        
        if (!session?.user) {
          router.push('/login')
          return
        }
        
        setUser(session.user)
      } catch (error) {
        console.error('Error checking auth:', error)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Desktop Navigation - Always visible */} 
      <div className="hidden md:flex md:flex-shrink-0">
         <Navigation user={user} />
      </div>

      {/* Mobile Navigation - Toggles visibility */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          {/* Sidebar */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gray-800">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setIsMobileNavOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                {/* Heroicon name: outline/x */}
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <Navigation user={user} />
          </div>
          {/* Backdrop to close nav */} 
          <div className="flex-shrink-0 w-14" aria-hidden="true" onClick={() => setIsMobileNavOpen(false)}></div> 
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
         {/* Hamburger Button for Mobile */}
         <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3">
            <button
              type="button"
              className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              onClick={() => setIsMobileNavOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              {/* Heroicon name: outline/menu */}
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {/* Add some padding to the top of the content on mobile to account for the hamburger button */}
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
} 