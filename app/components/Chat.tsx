'use client'

import React, { useRef, useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { createClient } from '@supabase/supabase-js'
import { FiCopy } from 'react-icons/fi'
import Sidebar from './Sidebar'

const supabaseUrl = 'https://lfmxtaefgvjbuipcdcya.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmbXh0YWVmZ3ZqYnVpcGNkY3lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyOTg5NDksImV4cCI6MjA1OTg3NDk0OX0.GfUDSLhxwdTEOKDyewAipXnZE_suNjKQba6x0q3QKEE'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

interface ChatProps {
  activeSessionId: string | null
  setActiveSessionId: (sessionId: string | null) => void
}

export default function Chat({ activeSessionId, setActiveSessionId }: ChatProps) {
  console.log('%c נטען קובץ Chat הישן מ-app/components/Chat.tsx!', 'color: red; font-size: 20px;');
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (activeSessionId) {
      loadMessages(activeSessionId)
    }
  }, [activeSessionId])

  const loadMessages = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (err) {
      setError('Failed to load messages')
      console.error(err)
    }
  }

  const newChat = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert([{ title: 'שיחה חדשה' }])
        .select()

      if (error) throw error
      setActiveSessionId(data[0].id)
      setMessages([])
    } catch (err) {
      setError('Failed to create new chat')
      console.error(err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      // Create new chat session if none exists
      if (!activeSessionId) {
        const { data, error } = await supabase
          .from('chat_sessions')
          .insert([{ title: 'שיחה חדשה' }])
          .select()

        if (error) throw error
        setActiveSessionId(data[0].id)
      }

      // Save user message
      const { data: userMessage, error: userError } = await supabase
        .from('chat_messages')
        .insert([{
          session_id: activeSessionId,
          role: 'user',
          content: input
        }])
        .select()

      if (userError) throw userError

      // Update UI optimistically
      setMessages(prev => [...prev, userMessage[0]])
      setInput('')

      // Get AI response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input,
          sessionId: activeSessionId 
        }),
      })

      if (!response.ok) throw new Error('Failed to get response')
      const data = await response.json()

      // Save assistant message
      const { data: assistantMessage, error: assistantError } = await supabase
        .from('chat_messages')
        .insert([{
          session_id: activeSessionId,
          role: 'assistant',
          content: data.answer
        }])
        .select()

      if (assistantError) throw assistantError

      // Update UI with assistant message
      setMessages(prev => [...prev, assistantMessage[0]])

      // Generate title if this is the first exchange
      if (messages.length === 0) {
        const titleResponse = await fetch('/api/generate-title', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            question: input,
            answer: data.answer
          }),
        })

        if (titleResponse.ok) {
          const { title } = await titleResponse.json()
          await supabase
            .from('chat_sessions')
            .update({ title })
            .eq('id', activeSessionId)
        }
      }

    } catch (err) {
      setError('Failed to send message')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
    } catch (err) {
      setError('Failed to copy message')
      console.error(err)
    }
  }

  const clearChat = async () => {
    if (!activeSessionId) return
    
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('session_id', activeSessionId)

      if (error) throw error
      setMessages([])
    } catch (err) {
      setError('Failed to clear chat')
      console.error(err)
    }
  }

  return (
    <div className="flex h-screen">
      <Sidebar 
        activeSessionId={activeSessionId} 
        onSessionSelect={setActiveSessionId} 
      />
      
      <div className="flex flex-col flex-1">
        {error && (
          <div className="bg-red-500 text-white p-4">
            {error}
            <button 
              onClick={() => setError(null)}
              className="float-right font-bold"
            >
              ×
            </button>
          </div>
        )}

        <div className="flex justify-between p-4 border-b">
          <button
            onClick={newChat}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            התחל שיחה חדשה
          </button>
          {activeSessionId && (
            <button
              onClick={clearChat}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              נקה שיחה
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'assistant' ? 'justify-start' : 'justify-end'
              }`}
            >
              <div
                className={`rounded-lg px-4 py-2 max-w-[80%] relative group ${
                  message.role === 'assistant'
                    ? 'bg-gray-200'
                    : 'bg-blue-500 text-white'
                }`}
              >
                <ReactMarkdown className="markdown-content">{message.content}</ReactMarkdown>
                <button
                  onClick={() => copyMessage(message.content)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <FiCopy className={message.role === 'assistant' ? 'text-gray-600' : 'text-white'} />
                </button>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex space-x-4">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="הקלד את שאלתך..."
              className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'טוען...' : 'שלח'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 