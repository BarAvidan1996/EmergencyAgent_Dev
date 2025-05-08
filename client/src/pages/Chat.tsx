import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  CircularProgress
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';
import Chat from '../components/Chat';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Chat {
  _id: string;
  title: string;
  messages: Message[];
}

const ChatPage: React.FC = () => {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  return (
    <Chat 
      activeSessionId={activeSessionId}
      setActiveSessionId={setActiveSessionId}
    />
  );
};

export default ChatPage; 