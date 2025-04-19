'use client'

import React from 'react'
import AppLayout from '@/components/layout/AppLayout'
import KanbanBoard from '@/components/board/KanbanBoard'

export default function AppPage() {
  return (
    <AppLayout>
      <KanbanBoard />
    </AppLayout>
  )
} 