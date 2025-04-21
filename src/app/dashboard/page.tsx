'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { Database } from '@/types/database'
import AppLayout from '@/components/layout/AppLayout'

type Project = Database['public']['Tables']['projects']['Row']

export default function DashboardPage() {
  const [recentProjects, setRecentProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          const { data: memberData, error: memberError } = await supabase
            .from('project_members')
            .select('project_id')
            .eq('user_id', user.id)

          if (memberError) throw memberError

          if (!memberData || memberData.length === 0) {
            setRecentProjects([])
          } else {
            const projectIds = memberData.map(member => member.project_id)
            const { data: projectsData, error: projectsError } = await supabase
              .from('projects')
              .select('*')
              .in('id', projectIds)
              .order('created_at', { ascending: false })
              .limit(3)

            if (projectsError) throw projectsError
            setRecentProjects(projectsData || [])
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load dashboard data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-md p-4 mb-6">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        <div className="grid gap-6 mb-8">
          {/* Quick Actions */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="flex gap-4">
              <Link
                href="/dashboard/projects"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md p-4 text-center"
              >
                View All Projects
              </Link>
              <Link
                href="/dashboard/projects"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-md p-4 text-center"
              >
                Create New Project
              </Link>
            </div>
          </div>

          {/* Recent Projects */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Recent Projects</h2>
              <Link
                href="/dashboard/projects"
                className="text-blue-400 hover:text-blue-300"
              >
                View All
              </Link>
            </div>

            {recentProjects.length === 0 ? (
              <p className="text-gray-400">
                No projects yet. Create your first project to get started!
              </p>
            ) : (
              <div className="grid gap-4">
                {recentProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <h3 className="font-semibold mb-1">{project.name}</h3>
                    {project.description && (
                      <p className="text-gray-400 text-sm line-clamp-1">
                        {project.description}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Coming Soon: Recent Activity */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <p className="text-gray-400">
              Activity feed coming soon! Track your team's progress and stay updated on project changes.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
} 