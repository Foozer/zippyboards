'use client'

import React, { useState } from 'react'

interface Task {
  id: string
  title: string
  description: string
  status: 'backlog' | 'in-progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  dueDate?: Date
  labels: string[]
}

interface Column {
  id: string
  title: string
  tasks: Task[]
}

export default function KanbanBoard() {
  const [columns, setColumns] = useState<Column[]>([
    {
      id: 'backlog',
      title: 'Backlog',
      tasks: []
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      tasks: []
    },
    {
      id: 'done',
      title: 'Done',
      tasks: []
    }
  ])

  const handleAddTask = (columnId: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title: 'New Task',
      description: '',
      status: columnId as Task['status'],
      priority: 'medium',
      labels: []
    }

    setColumns(prevColumns => 
      prevColumns.map(column => 
        column.id === columnId
          ? { ...column, tasks: [...column.tasks, newTask] }
          : column
      )
    )
  }

  return (
    <div className="flex gap-4 p-4 h-[calc(100vh-4rem)] overflow-x-auto">
      {columns.map((column) => (
        <div
          key={column.id}
          className="flex flex-col w-80 bg-gray-800 rounded-lg p-4"
        >
          <h2 className="text-lg font-semibold mb-4">{column.title}</h2>
          <div className="flex-1 overflow-y-auto">
            {column.tasks.map((task) => (
              <div
                key={task.id}
                className="bg-gray-700 rounded p-3 mb-3 cursor-pointer hover:bg-gray-600"
              >
                <h3 className="font-medium">{task.title}</h3>
                <div className="flex gap-2 mt-2">
                  {task.labels.map((label) => (
                    <span
                      key={label}
                      className="text-xs px-2 py-1 bg-gray-600 rounded"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button
            className="mt-4 p-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            onClick={() => handleAddTask(column.id)}
          >
            + Add Task
          </button>
        </div>
      ))}
    </div>
  )
} 