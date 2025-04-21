'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import CreateProjectForm from '@/components/projects/CreateProjectForm'
import Link from 'next/link'
import { Database } from '@/types/database'

type Project = Database['public']['Tables']['projects']['Row']

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true); // Start loading
      setError(null); // Clear previous errors
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // Fetch project IDs the user is a member of using a direct query
          console.log('Fetching project member IDs for user:', user.id);
          const { data: memberData, error: memberError } = await supabase
            .from('project_members')
            .select('project_id')
            .eq('user_id', user.id);

          if (memberError) {
              console.error('Error fetching project member IDs:', {
                  message: memberError.message,
                  details: memberError.details,
                  hint: memberError.hint,
                  code: memberError.code
              });
              throw new Error(`Database Error: ${memberError.message}${memberError.details ? ` - ${memberError.details}` : ''}`);
          }

          console.log('Fetched member data:', memberData);

          if (!memberData || memberData.length === 0) {
            console.log('No project memberships found for user.');
            setProjects([]); // No projects found for user
          } else {
            // Extract the IDs from the response
            const projectIds = memberData.map(member => member.project_id);
            console.log('Fetching project details for IDs:', projectIds);

            // Step 2: Fetch project details for those IDs
            const { data: projectsData, error: projectsError } = await supabase
              .from('projects')
              .select('*')
              .in('id', projectIds);

            if (projectsError) {
                console.error('Error fetching project details:', projectsError);
                throw projectsError;
            }
            console.log('Fetched project data:', projectsData);
            setProjects(projectsData || []);
          }
        } else {
            console.log('No authenticated user found.');
            setProjects([]); // Clear projects if no user
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
        setProjects([]); // Clear projects on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4 text-red-500">Error Loading Dashboard</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Projects</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          {showCreateForm ? 'Cancel' : 'Create Project'}
        </button>
      </div>

      {showCreateForm && (
        <div className="mb-8">
          <CreateProjectForm />
        </div>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4">No Projects Yet</h2>
          <p className="text-gray-400 mb-6">
            Create your first project to start organizing your tasks.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="block p-6 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <h3 className="text-xl font-semibold mb-2">{project.name}</h3>
              {project.description && (
                <p className="text-gray-400 mb-4 line-clamp-2">{project.description}</p>
              )}
              <div className="text-sm text-gray-500">
                Created {new Date(project.created_at).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
} 