'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface CreateProjectFormProps {
  onSuccess?: () => void
}

export default function CreateProjectForm({ onSuccess }: CreateProjectFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('You must be logged in to create a project')
      }

      // Insert the project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert([
          { 
            name,
            description,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single()

      if (projectError) throw projectError

      if (!project) {
        throw new Error('Failed to create project')
      }

      // Add the creator as a project member with owner role
      const { error: memberError } = await supabase
        .from('project_members')
        .insert([
          {
            project_id: project.id,
            user_id: user.id,
            role: 'owner',
            created_at: new Date().toISOString()
          }
        ])

      if (memberError) throw memberError

      // Reset form
      setName('')
      setDescription('')
      onSuccess?.()

      router.push(`/projects/${project.id}`)
    } catch (err) {
      console.error('Error creating project:', err)
      setError(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
          Project Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          minLength={3}
          maxLength={100}
          placeholder="Enter project name"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
          Description (Optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          maxLength={500}
          placeholder="Describe your project"
        />
      </div>

      {error && (
        <div className="text-red-500 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Creating...' : 'Create Project'}
      </button>
    </form>
  )
} 