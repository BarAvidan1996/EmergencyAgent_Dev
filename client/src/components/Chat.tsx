import React, { useRef, useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { createClient } from '@supabase/supabase-js'
import { FiCopy, FiCheck, FiDatabase, FiCpu } from 'react-icons/fi'
import Sidebar from './Sidebar'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../contexts/ThemeContext'

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
  console.log('טוענים את Chat.tsx האמיתי!');
  const { user } = useAuth()
  const { isDarkMode } = useTheme()
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

  const isRTL = typeof document !== 'undefined' && document.dir === 'rtl';
  const userBackground = isDarkMode ? '#2a2b3d' : '#f3f4f6';
  const assistantBackground = isDarkMode ? '#2a2b3d' : '#f3f4f6';

  return (
    <div
      className="chat-container"
      style={{ background: 'transparent' }}
    >
      {/* Chat Messages Area */}
      <div className="chat-messages">
        {messages.map((message) => {
          const messageAlign = message.role === 'user'
            ? (isRTL ? 'align-right' : 'align-left')
            : (isRTL ? 'align-left' : 'align-right');
          return (
            <div
              key={message.id}
              className={`chat-message ${message.role} ${messageAlign}`}
              style={{
                backgroundColor: message.role === 'user' ? userBackground : assistantBackground,
                color: isDarkMode ? '#E5E7EB' : '#111827',
              }}
            >
              <ReactMarkdown>{message.content}</ReactMarkdown>
              <button
                onClick={() => copyMessage(message.content, message.id)}
                className="copy-button"
              >
                {copiedMessageId === message.id
                  ? (isRTL ? 'הועתק' : 'Copied')
                  : (isRTL ? 'העתק' : 'Copy')}
              </button>
            </div>
          );
        })}
        {isLoading && (
          <div
            className={`chat-message assistant ${isRTL ? 'align-left' : 'align-right'}`}
            style={{
              backgroundColor: assistantBackground,
              color: isDarkMode ? '#E5E7EB' : '#111827',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '48px',
              width: '80px',
              borderRadius: '24px',
            }}
          >
            <div className="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        className={`chat-input-form ${isRTL ? 'rtl' : 'ltr'}`}
      >
        {isRTL ? (
          <>
            <button
              type="submit"
              disabled={isLoading}
              className="send-button"
            >
              {isLoading ? 'טוען...' : 'שלח'}
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="הקלד את שאלתך..."
              className="chat-input"
              disabled={isLoading}
              style={{ textAlign: 'right' }}
            />
          </>
        ) : (
          <>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question..."
              className="chat-input"
              disabled={isLoading}
              style={{ textAlign: 'left' }}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="send-button"
            >
              {isLoading ? 'Loading...' : 'Send'}
            </button>
          </>
        )}
      </form>
    </div>
  )
}

export default Chat 