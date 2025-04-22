'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/database'
import { CreateTaskForm } from '../tasks/CreateTaskForm'
import { EditTaskForm } from '../tasks/EditTaskForm'

type Task = Database['public']['Tables']['tasks']['Row']
type User = {
  user_id: string
  email: string
  role: string
}

interface Column {
  id: 'backlog' | 'in_progress' | 'done'
  title: string
  tasks: Task[]
}

interface KanbanBoardProps {
  projectId: string
}

type SortOption = 'created_at' | 'due_date' | 'priority' | 'title'
type FilterOption = 'all' | 'assigned' | 'unassigned' | 'overdue'

export default function KanbanBoard({ projectId }: KanbanBoardProps) {
  const [columns, setColumns] = useState<Column[]>([
    {
      id: 'backlog',
      title: 'Backlog',
      tasks: []
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      tasks: []
    },
    {
      id: 'done',
      title: 'Done',
      tasks: []
    }
  ])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [projectMembers, setProjectMembers] = useState<Record<string, User>>({})
  const [sortBy, setSortBy] = useState<SortOption>('created_at')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const fetchTasks = useCallback(async () => {
    try {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Group tasks by status
      const groupedTasks = tasks.reduce((acc, task) => {
        const status = task.status
        if (!acc[status]) acc[status] = []
        acc[status].push(task)
        return acc
      }, {} as Record<string, Task[]>)

      setColumns(prevColumns => 
        prevColumns.map(column => ({
          ...column,
          tasks: groupedTasks[column.id] || []
        }))
      )
    } catch (err) {
      console.error('Error fetching tasks:', err)
      setError(err instanceof Error ? err.message : 'Failed to load tasks')
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  useEffect(() => {
    const fetchProjectMembers = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_project_members_if_allowed', {
            p_project_id: projectId,
            p_user_id: (await supabase.auth.getUser()).data.user?.id
          })

        if (error) throw error

        // Create a map of user IDs to user objects
        const membersMap = (data || []).reduce((acc: Record<string, User>, member: User) => {
          acc[member.user_id] = member
          return acc
        }, {} as Record<string, User>)

        setProjectMembers(membersMap)
      } catch (err) {
        console.error('Error fetching project members:', err)
      }
    }

    fetchProjectMembers()
  }, [projectId])

  useEffect(() => {
    console.log('Columns updated:', columns)
    // Debug logging for tasks
    columns.forEach(column => {
      console.log(`Column ${column.id} tasks:`, column.tasks.map(t => t.id))
    })
  }, [columns])

  const handleTaskCreated = () => {
    setShowCreateForm(false)
    fetchTasks()
  }

  const handleTaskUpdated = () => {
    setEditingTask(null)
    fetchTasks()
  }

  const onDragStart = useCallback(() => {
    // Add a class to the body to prevent text selection during drag
    document.body.classList.add('dragging')
  }, [])

  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { destination, source, draggableId } = result

    if (!destination) return

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    const sourceColumn = columns.find(col => col.id === source.droppableId)
    const destColumn = columns.find(col => col.id === destination.droppableId)

    if (!sourceColumn || !destColumn) return

    const task = sourceColumn.tasks.find(t => t.id === draggableId)
    if (!task) return

    // Optimistically update the UI
    setColumns(prevColumns => {
      const newColumns = [...prevColumns]
      
      // Remove from source column
      const sourceColIndex = newColumns.findIndex(col => col.id === source.droppableId)
      const newSourceTasks = [...newColumns[sourceColIndex].tasks]
      newSourceTasks.splice(source.index, 1)
      newColumns[sourceColIndex] = {
        ...newColumns[sourceColIndex],
        tasks: newSourceTasks
      }

      // Add to destination column
      const destColIndex = newColumns.findIndex(col => col.id === destination.droppableId)
      const newDestTasks = [...newColumns[destColIndex].tasks]
      newDestTasks.splice(destination.index, 0, {
        ...task,
        status: destColumn.id
      })
      newColumns[destColIndex] = {
        ...newColumns[destColIndex],
        tasks: newDestTasks
      }

      return newColumns
    })

    // Update the database in the background
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: destColumn.id })
        .eq('id', task.id)

      if (error) {
        // If the update fails, revert the optimistic update
        console.error('Error updating task status:', error)
        fetchTasks() // Re-fetch to sync with server state
      }
    } catch (err) {
      console.error('Error updating task status:', err)
      fetchTasks() // Re-fetch to sync with server state
    }
  }, [columns, fetchTasks])

  // Add filtered and sorted tasks
  const filteredAndSortedColumns = useMemo(() => {
    return columns.map(column => {
      let filteredTasks = column.tasks

      // Apply filters
      if (filterBy === 'assigned') {
        filteredTasks = filteredTasks.filter(task => task.assigned_to !== null)
      } else if (filterBy === 'unassigned') {
        filteredTasks = filteredTasks.filter(task => task.assigned_to === null)
      } else if (filterBy === 'overdue') {
        const today = new Date()
        filteredTasks = filteredTasks.filter(task => 
          task.due_date && new Date(task.due_date) < today
        )
      }

      // Apply sorting
      filteredTasks = [...filteredTasks].sort((a, b) => {
        if (sortBy === 'priority') {
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          return sortDirection === 'desc' 
            ? priorityOrder[b.priority] - priorityOrder[a.priority]
            : priorityOrder[a.priority] - priorityOrder[b.priority]
        } else if (sortBy === 'due_date') {
          if (!a.due_date) return 1
          if (!b.due_date) return -1
          return sortDirection === 'desc'
            ? new Date(b.due_date).getTime() - new Date(a.due_date).getTime()
            : new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        } else if (sortBy === 'title') {
          return sortDirection === 'desc'
            ? b.title.localeCompare(a.title)
            : a.title.localeCompare(b.title)
        } else {
          // Default to created_at
          return sortDirection === 'desc'
            ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        }
      })

      return {
        ...column,
        tasks: filteredTasks
      }
    })
  }, [columns, sortBy, sortDirection, filterBy])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        {error}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Task Board</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="filter" className="text-sm text-gray-400">Filter:</label>
            <select
              id="filter"
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as FilterOption)}
              className="px-2 py-1 bg-gray-800 border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Tasks</option>
              <option value="assigned">Assigned</option>
              <option value="unassigned">Unassigned</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-sm text-gray-400">Sort by:</label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-2 py-1 bg-gray-800 border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="created_at">Created Date</option>
              <option value="due_date">Due Date</option>
              <option value="priority">Priority</option>
              <option value="title">Title</option>
            </select>
            <button
              onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-1 hover:bg-gray-700 rounded"
            >
              {sortDirection === 'asc' ? '↑' : '↓'}
            </button>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
          >
            {showCreateForm ? 'Cancel' : 'Create Task'}
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="mb-6">
          <CreateTaskForm 
            projectId={projectId} 
            onTaskCreated={handleTaskCreated} 
          />
        </div>
      )}

      {editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-xl font-semibold mb-4">Edit Task</h3>
            <EditTaskForm
              task={editingTask}
              onTaskUpdated={handleTaskUpdated}
              onCancel={() => setEditingTask(null)}
            />
          </div>
        </div>
      )}

      <DragDropContext 
        onDragEnd={handleDragEnd}
        onDragStart={onDragStart}
      >
        <div className="flex-1 min-h-0">
          <div className="flex gap-4 h-full">
            {filteredAndSortedColumns.map((column) => (
              <Droppable 
                key={column.id} 
                droppableId={column.id}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex flex-col w-80 bg-gray-800 rounded-lg p-4 ${
                      snapshot.isDraggingOver ? 'bg-gray-700' : ''
                    }`}
                  >
                    <h2 className="text-lg font-semibold mb-4">{column.title}</h2>
                    <div className="flex-1 overflow-y-auto">
                      {column.tasks.map((task, index) => (
                        <Draggable 
                          key={task.id} 
                          draggableId={task.id} 
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                                cursor: 'grab',
                                userSelect: 'none',
                                touchAction: 'none',
                                transform: snapshot.isDragging ? provided.draggableProps.style?.transform : 'none'
                              }}
                              className={`bg-gray-700 rounded p-3 mb-3 hover:bg-gray-600 transition-colors duration-200 ${
                                snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-500' : ''
                              }`}
                              onClick={() => setEditingTask(task)}
                            >
                              <div className="flex items-center justify-between">
                                <h3 className="font-medium">{task.title}</h3>
                                <div className="flex items-center space-x-2">
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                    task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-green-500/20 text-green-400'
                                  }`}>
                                    {task.priority}
                                  </span>
                                  {task.due_date && (
                                    <span className="text-xs text-gray-400">
                                      Due: {new Date(task.due_date).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {task.description && (
                                <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                              {task.assigned_to && projectMembers[task.assigned_to] && (
                                <div className="mt-2 text-xs text-gray-400">
                                  Assigned to: {projectMembers[task.assigned_to].email}
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </div>
      </DragDropContext>
    </div>
  )
} 