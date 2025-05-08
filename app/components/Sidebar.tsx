'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';

const supabaseUrl = 'https://lfmxtaefgvjbuipcdcya.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmbXh0YWVmZ3ZqYnVpcGNkY3lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyOTg5NDksImV4cCI6MjA1OTg3NDk0OX0.GfUDSLhxwdTEOKDyewAipXnZE_suNjKQba6x0q3QKEE';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

interface SidebarProps {
  activeSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
}

export default function Sidebar({ activeSessionId, onSessionSelect }: SidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (err) {
      setError('Failed to load chat sessions');
      console.error(err);
    }
  };

  const handleRename = async (sessionId: string) => {
    if (!newTitle.trim()) {
      setEditingId(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ title: newTitle })
        .eq('id', sessionId);

      if (error) throw error;
      
      setEditingId(null);
      fetchSessions();
    } catch (err) {
      setError('Failed to rename session');
      console.error(err);
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this chat session?')) return;

    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
      fetchSessions();
    } catch (err) {
      setError('Failed to delete session');
      console.error(err);
    }
  };

  const truncateTitle = (title: string, maxLength: number = 30) => {
    return title.length > maxLength ? `${title.substring(0, maxLength)}...` : title;
  };

  return (
    <div className="w-64 h-full bg-gray-800 text-white p-4">
      {error && (
        <div className="bg-red-500 text-white p-2 mb-4 rounded">
          {error}
          <button 
            onClick={() => setError(null)}
            className="float-right font-bold"
          >
            ×
          </button>
        </div>
      )}

      <div className="space-y-2">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`p-2 rounded cursor-pointer flex items-center justify-between group ${
              activeSessionId === session.id ? 'bg-blue-600' : 'hover:bg-gray-700'
            }`}
            onClick={() => onSessionSelect(session.id)}
          >
            {editingId === session.id ? (
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onBlur={() => handleRename(session.id)}
                onKeyDown={(e) => e.key === 'Enter' && handleRename(session.id)}
                className="bg-gray-900 text-white px-2 py-1 rounded w-full"
                autoFocus
              />
            ) : (
              <>
                <span className="flex-1">{truncateTitle(session.title)}</span>
                <div className="hidden group-hover:flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(session.id);
                      setNewTitle(session.title);
                    }}
                    className="text-gray-300 hover:text-white"
                  >
                    <FiEdit2 size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(session.id);
                    }}
                    className="text-gray-300 hover:text-red-500"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 