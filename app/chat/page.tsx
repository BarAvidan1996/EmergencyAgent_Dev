'use client'

import { useState } from 'react'
import Chat from '../components/Chat2'
import Sidebar from '../components/Sidebar2'

export default function ChatPage() {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)

  return (
    <div className="flex h-screen">
      <Sidebar 
        activeSessionId={activeSessionId}
        onSessionSelect={setActiveSessionId}
      />
      <div className="flex-1">
        <Chat 
          activeSessionId={activeSessionId}
          setActiveSessionId={setActiveSessionId}
        />
      </div>
    </div>
  )
} 