'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/database'

type User = {
  user_id: string
  email: string
  role: string
}

interface EditTaskFormProps {
  task: Database['public']['Tables']['tasks']['Row']
  onTaskUpdated: () => void
  onCancel: () => void
}

export function EditTaskForm({ task, onTaskUpdated, onCancel }: EditTaskFormProps) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(task.priority)
  const [dueDate, setDueDate] = useState(task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '')
  const [assignedTo, setAssignedTo] = useState<string | null>(task.assigned_to)
  const [status, setStatus] = useState<'todo' | 'in_progress' | 'done'>(task.status)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [projectMembers, setProjectMembers] = useState<User[]>([])

  useEffect(() => {
    const fetchProjectMembers = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_project_members_if_allowed', {
            p_project_id: task.project_id,
            p_user_id: (await supabase.auth.getUser()).data.user?.id
          })

        if (error) throw error
        setProjectMembers(data || [])
      } catch (err) {
        console.error('Error fetching project members:', err)
        setError('Failed to load project members')
      }
    }

    fetchProjectMembers()
  }, [task.project_id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title,
          description,
          priority,
          due_date: dueDate || null,
          assigned_to: assignedTo || null,
          status
        })
        .eq('id', task.id)

      if (error) throw error
      onTaskUpdated()
    } catch (err) {
      console.error('Error updating task:', err)
      setError(err instanceof Error ? err.message : 'Failed to update task')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">
          Task Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          minLength={3}
          maxLength={100}
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          maxLength={500}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-300 mb-1">
            Priority
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'todo' | 'in_progress' | 'done')}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-300 mb-1">
            Due Date
          </label>
          <input
            type="date"
            id="dueDate"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-300 mb-1">
            Assign To
          </label>
          <select
            id="assignedTo"
            value={assignedTo || ''}
            onChange={(e) => setAssignedTo(e.target.value || null)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Unassigned</option>
            {projectMembers.map((member) => (
              <option key={member.user_id} value={member.user_id}>
                {member.email}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-md"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
} 