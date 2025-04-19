import { supabase } from './supabase'
import { Database } from '@/types/database'

type User = Database['public']['Tables']['users']['Row']
type Project = Database['public']['Tables']['projects']['Row']
type Task = Database['public']['Tables']['tasks']['Row']

// User operations
export async function createUser(email: string): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .insert({ email })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select()
    .eq('email', email)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

// Project operations
export async function createProject(name: string, userId: string, description?: string): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert({ name, user_id: userId, description })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getProjectsByUserId(userId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select()
    .eq('user_id', userId)

  if (error) throw error
  return data
}

// Task operations
export async function createTask(
  title: string,
  projectId: string,
  options?: {
    description?: string
    status?: 'todo' | 'in_progress' | 'done'
    priority?: 'low' | 'medium' | 'high'
    dueDate?: string
    assignedTo?: string
  }
): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title,
      project_id: projectId,
      description: options?.description,
      status: options?.status || 'todo',
      priority: options?.priority || 'medium',
      due_date: options?.dueDate,
      assigned_to: options?.assignedTo,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getTasksByProjectId(projectId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select()
    .eq('project_id', projectId)

  if (error) throw error
  return data
}

export async function updateTaskStatus(taskId: string, status: 'todo' | 'in_progress' | 'done'): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', taskId)
    .select()
    .single()

  if (error) throw error
  return data
} 