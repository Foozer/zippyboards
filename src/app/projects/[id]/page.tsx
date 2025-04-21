'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/database'
import ProjectSettings from '@/components/projects/ProjectSettings'
import AppLayout from '@/components/layout/AppLayout'
import Link from 'next/link'

type Project = Database['public']['Tables']['projects']['Row']

export default function ProjectPage() {
  const params = useParams()
  const projectId = params.id as string
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'board' | 'settings'>('board')

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single()

        if (error) throw error
        setProject(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch project')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProject()
  }, [projectId])

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </AppLayout>
    )
  }

  if (error || !project) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
            <p className="text-gray-400 mb-6">{error || 'Project not found'}</p>
            <Link
              href="/dashboard/projects"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
            >
              Back to Projects
            </Link>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            {project.description && (
              <p className="text-gray-400 mt-2">{project.description}</p>
            )}
          </div>
          <div className="flex gap-4">
            <Link
              href="/dashboard/projects"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-md"
            >
              Back to Projects
            </Link>
          </div>
        </div>

        <div className="border-b border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('board')}
              className={`${
                activeTab === 'board'
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Board
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Settings
            </button>
          </nav>
        </div>

        {activeTab === 'board' ? (
          <div className="bg-gray-800 rounded-lg p-6">
            <p className="text-gray-400">Kanban board will be implemented here</p>
          </div>
        ) : (
          <ProjectSettings project={project} />
        )}
      </div>
    </AppLayout>
  )
} 