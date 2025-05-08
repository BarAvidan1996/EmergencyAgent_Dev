import React, { useRef, useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { createClient } from '@supabase/supabase-js'
import { FiCopy, FiCheck, FiDatabase, FiCpu } from 'react-icons/fi'
import Sidebar from './Sidebar2'
import { useAuth } from '../../client/src/hooks/useAuth'

const supabaseUrl = 'https://lfmxtaefgvjbuipcdcya.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmbXh0YWVmZ3ZqYnVpcGNkY3lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyOTg5NDksImV4cCI6MjA1OTg3NDk0OX0.GfUDSLhxwdTEOKDyewAipXnZE_suNjKQba6x0q3QKEE'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Add API base URL constant at the top of the file
const API_BASE_URL = 'http://localhost:3001';

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

interface ConnectionStatus {
  supabase: boolean;
  openai: boolean;
}

const Chat: React.FC<ChatProps> = ({ activeSessionId, setActiveSessionId }) => {
  console.log('נכנס ל-Chat2.tsx החדש!')
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    supabase: false,
    openai: false
  })
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)

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

  // Check Supabase connection on mount
  useEffect(() => {
    const checkSupabaseConnection = async () => {
      try {
        const { data, error } = await supabase.from('chat_sessions').select('count').limit(1)
        setConnectionStatus(prev => ({ ...prev, supabase: !error }))
      } catch (err) {
        setConnectionStatus(prev => ({ ...prev, supabase: false }))
      }
    }
    checkSupabaseConnection()
  }, [])

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
    if (!user?.id) {
      setError('User not authenticated')
      return
    }

    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert([{ 
          title: 'שיחה חדשה',
          user_id: user.id,
          created_at: new Date().toISOString()
        }])
        .select('*')

      if (error) {
        console.error('Error creating chat:', error)
        throw error
      }
      
      setActiveSessionId(data[0].id)
      setMessages([])
    } catch (err) {
      setError('Failed to create new chat')
      console.error(err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !user?.id) return

    setIsLoading(true)
    setError(null)

    try {
      // Create new chat session if none exists
      let currentSessionId = activeSessionId
      if (!currentSessionId) {
        const { data, error } = await supabase
          .from('chat_sessions')
          .insert([{ 
            title: 'שיחה חדשה',
            user_id: user.id,
            created_at: new Date().toISOString()
          }])
          .select('*')

        if (error) {
          console.error('Error creating chat:', error)
          throw error
        }
        currentSessionId = data[0].id
        setActiveSessionId(currentSessionId)
      }

      // Save user message
      const { data: userMessage, error: userError } = await supabase
        .from('chat_messages')
        .insert([{
          session_id: currentSessionId,
          role: 'user',
          content: input,
          created_at: new Date().toISOString()
        }])
        .select('*')

      if (userError) throw userError

      // Update UI optimistically
      setMessages(prev => [...prev, userMessage[0]])
      setInput('')

      // Set OpenAI connection status to true before API call
      setConnectionStatus(prev => ({ ...prev, openai: true }))

      // Get AI response (streaming)
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input,
          sessionId: currentSessionId 
        }),
      })

      if (!response.ok) {
        const errorData = await response.text().catch(() => null)
        throw new Error(
          errorData || 
          `Server error: ${response.status} ${response.statusText}`
        )
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      // Start streaming the response
      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let partialText = ''

      // Add an empty assistant message to start streaming into
      setMessages(prev => [...prev, {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString()
      }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        partialText += decoder.decode(value, { stream: true })
        setMessages(prevMessages => {
          const updatedMessages = [...prevMessages]
          const lastMessage = updatedMessages[updatedMessages.length - 1]
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.content = partialText
          }
          return updatedMessages
        })
      }

      // Save assistant message to Supabase
      const { data: assistantMessage, error: assistantError } = await supabase
        .from('chat_messages')
        .insert([{
          session_id: currentSessionId,
          role: 'assistant',
          content: partialText,
          created_at: new Date().toISOString()
        }])
        .select('*')

      if (assistantError) throw assistantError

      // Update UI with the final assistant message (replace the streaming one)
      setMessages(prev => {
        // Remove the last (streamed) assistant message and add the saved one
        return [...prev.slice(0, -1), assistantMessage[0]]
      })

    } catch (err) {
      console.error('Error in handleSubmit:', err)
      setError(
        err instanceof Error 
          ? err.message 
          : 'שגיאה בשליחת ההודעה. אנא נסה שוב.'
      )
      // If we failed after sending user message, show it in red
      const lastMessage = messages[messages.length - 1]
      if (lastMessage?.role === 'user') {
        setMessages(prev => [
          ...prev.slice(0, -1),
          { ...lastMessage, error: true }
        ])
      }
    } finally {
      setIsLoading(false)
      // Reset OpenAI connection status
      setConnectionStatus(prev => ({ ...prev, openai: false }))
    }
  }

  const copyMessage = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMessageId(id)
      setTimeout(() => setCopiedMessageId(null), 1500)
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
    <div className="flex flex-col h-full w-full items-center justify-center">
      {/* Chat Messages Area */}
      <div className="flex-1 w-full max-w-2xl mx-auto overflow-y-auto space-y-6 px-4 py-8">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex w-full ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
          >
            <div className="flex flex-col items-end max-w-[80%] md:max-w-[70%]">
              <div
                className={`p-4 rounded-2xl ${
                  message.role === 'assistant'
                    ? 'bg-gray-50 text-gray-900'
                    : 'bg-[#6C5DD3] text-white'
                }`}
                style={{ wordBreak: 'break-word', fontSize: '1.1rem', lineHeight: '1.7' }}
              >
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
              <button
                onClick={() => copyMessage(message.content, message.id)}
                className="mt-2 text-xs text-gray-400 hover:text-[#6C5DD3] transition-colors flex items-center"
              >
                {copiedMessageId === message.id ? (
                  <>
                    <FiCheck className="ml-1" /> הועתק
                  </>
                ) : (
                  <>
                    <FiCopy className="ml-1" /> העתק
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl mx-auto flex items-center gap-2 bg-transparent px-4 py-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="הקלד את שאלתך..."
          className="flex-1 p-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6C5DD3] bg-gray-50 text-gray-800 text-lg"
          disabled={isLoading}
          style={{ fontSize: '1.15rem' }}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center justify-center px-6 py-3 bg-[#6C5DD3] hover:bg-[#5847b6] text-white rounded-xl font-semibold text-lg transition-colors"
          style={{ fontSize: '1.15rem', minHeight: '56px' }}
        >
          {isLoading ? (
            <span className="animate-pulse">טוען...</span>
          ) : (
            <span className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              שלח
            </span>
          )}
        </button>
      </form>
    </div>
  )
}

export default Chat