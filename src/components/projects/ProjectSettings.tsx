'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/database'

type Project = Database['public']['Tables']['projects']['Row']
type User = Database['public']['Tables']['users']['Row']

interface ProjectMember {
  user_id: string
  role: 'owner' | 'member'
  users: User
}

type ProjectMemberResponse = {
  user_id: string
  role: 'owner' | 'member'
  users: User
}

interface ProjectSettingsProps {
  project: Project
}

export default function ProjectSettings({ project }: ProjectSettingsProps) {
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [isAddingMember, setIsAddingMember] = useState(false)

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const { data, error } = await supabase
          .from('project_members')
          .select(`
            user_id,
            role,
            users:users (
              id,
              email,
              created_at,
              updated_at
            )
          `)
          .eq('project_id', project.id)

        if (error) throw error
        setMembers(data as unknown as ProjectMember[])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch members')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMembers()
  }, [project.id])

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAddingMember(true)
    setError(null)

    try {
      // First, find the user by email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', newMemberEmail)
        .single()

      if (userError) throw userError
      if (!userData) throw new Error('User not found')

      // Add the user as a project member
      const { error: memberError } = await supabase
        .from('project_members')
        .insert({
          project_id: project.id,
          user_id: userData.id,
          role: 'member'
        })

      if (memberError) throw memberError

      // Refresh members list
      const { data: updatedMembers, error: fetchError } = await supabase
        .from('project_members')
        .select(`
          user_id,
          role,
          users:users (
            id,
            email,
            created_at,
            updated_at
          )
        `)
        .eq('project_id', project.id)

      if (fetchError) throw fetchError
      setMembers(updatedMembers as unknown as ProjectMember[])
      setNewMemberEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member')
    } finally {
      setIsAddingMember(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', project.id)
        .eq('user_id', userId)

      if (error) throw error

      setMembers(members.filter(member => member.user_id !== userId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Project Details</h2>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">Project Name</label>
            <p className="text-gray-100">{project.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <p className="text-gray-100">{project.description || 'No description'}</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Team Members</h2>
        <div className="bg-gray-800 rounded-lg p-4">
          <form onSubmit={handleAddMember} className="mb-4">
            <div className="flex gap-2">
              <input
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="Enter email address"
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="submit"
                disabled={isAddingMember}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAddingMember ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          </form>

          {error && (
            <div className="text-red-500 text-sm mb-4">
              {error}
            </div>
          )}

          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.user_id}
                className="flex items-center justify-between p-2 bg-gray-700 rounded-md"
              >
                <div>
                  <p className="text-gray-100">{member.users.email}</p>
                  <p className="text-sm text-gray-400">{member.role}</p>
                </div>
                {member.role !== 'owner' && (
                  <button
                    onClick={() => handleRemoveMember(member.user_id)}
                    className="px-3 py-1 text-sm text-red-500 hover:text-red-400"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 