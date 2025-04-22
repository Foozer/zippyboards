'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/database'
import {
  addProjectMemberAction,
  removeProjectMemberAction 
} from '@/app/projects/[id]/actions'

type Project = Database['public']['Tables']['projects']['Row']

interface ProjectMember {
  user_id: string
  role: 'owner' | 'member'
  users: { email?: string | null }
}

interface ProjectSettingsProps {
  project: Project
}

interface ProjectMemberData {
  user_id: string
  role: string
  email: string
}

// interface ErrorDetails {
//   message?: string
//   details?: string
//   hint?: string
//   code?: string
// }

export default function ProjectSettings({ project }: ProjectSettingsProps) {
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMutating, setIsMutating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newMemberEmail, setNewMemberEmail] = useState('')

  const fetchMembers = useCallback(async (showLoadingIndicator = false) => {
    if (showLoadingIndicator) {
      setIsLoading(true);
    }
    setError(null);
    
    let userId: string | null = null;
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw authError || new Error('No authenticated user');
      userId = user.id;
    } catch (err) {
       console.error('Failed to get current user before fetching members:', err);
       setError('Failed to authenticate user for fetching members.');
       setIsLoading(false);
       return;
    }

    try {
      console.log('Attempting to fetch members with:', { projectId: project.id, userId });
      
      const { data, error: rpcError } = await supabase.rpc('get_project_members_if_allowed', {
        p_project_id: project.id,
        p_user_id: userId
      });

      console.log('Raw RPC response:', { data, error: rpcError });

      if (rpcError) {
        console.error("Error calling RPC:", rpcError);
        throw rpcError;
      }

      const formattedMembers = data?.map((member: ProjectMemberData) => ({
        user_id: member.user_id,
        role: member.role as 'owner' | 'member',
        users: { email: member.email }
      })) || [];

      setMembers(formattedMembers);
    } catch (err) {
      console.error('Error fetching members:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch members - check console for details');
    } finally {
      setIsLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsMutating(true);
    setError(null);

    try {
      if (!project?.id || !newMemberEmail) {
          setError('Project ID and email are required.');
          setIsMutating(false);
          return;
      }
      
      const result = await addProjectMemberAction(project.id, newMemberEmail);

      if (result.success) {
        setNewMemberEmail('');
        await fetchMembers(true);
      } else {
        setError(result.error || 'Failed to add member');
      }
    } catch (err) {
      console.error('Error calling addProjectMemberAction:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsMutating(false);
    }
  };

  const handleRemoveMember = async (userIdToRemove: string) => {
    setIsMutating(true);
    setError(null);

    try {
        const result = await removeProjectMemberAction(project.id, userIdToRemove);

        if (result.success) {
            await fetchMembers(true);
        } else {
            setError(result.error || 'Failed to remove member');
        }
    } catch (err) {
        console.error('Error calling removeProjectMemberAction:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
        setIsMutating(false);
    }
  };

  if (isLoading && members.length === 0) {
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
                disabled={isMutating}
              />
              <button
                type="submit"
                disabled={isMutating || !newMemberEmail}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isMutating ? 'Processing...' : 'Add Member'}
              </button>
            </div>
          </form>

          {isLoading && members.length > 0 && (
             <div className="text-sm text-gray-400 mb-4">Refreshing members...</div> 
          )}
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
                  <p className="text-gray-100">{member.users?.email || 'N/A'}</p>
                  <p className="text-sm text-gray-400">{member.role}</p>
                </div>
                {member.role !== 'owner' && (
                  <button
                    onClick={() => handleRemoveMember(member.user_id)}
                    disabled={isMutating}
                    className="px-3 py-1 text-sm text-red-500 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
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