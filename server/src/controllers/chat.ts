import { Request, Response } from 'express';
import { Chat } from '../models/Chat';

interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

export const createChat = async (req: AuthRequest, res: Response) => {
  try {
    const { title, message } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const chat = new Chat({
      userId,
      title,
      messages: [{
        role: 'user',
        content: message,
        timestamp: new Date()
      }]
    });

    await chat.save();

    // TODO: Add AI response using RAG
    const aiResponse = 'This is a placeholder response. RAG implementation pending.';

    chat.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    });

    await chat.save();

    res.status(201).json(chat);
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ message: 'Error creating chat' });
  }
};

export const getChats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const chats = await Chat.find({ userId }).sort({ updatedAt: -1 });
    res.json(chats);
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ message: 'Error fetching chats' });
  }
};

export const getChat = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const chat = await Chat.findOne({ _id: chatId, userId });
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    res.json(chat);
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ message: 'Error fetching chat' });
  }
};

export const addMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const { message } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const chat = await Chat.findOne({ _id: chatId, userId });
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    chat.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // TODO: Add AI response using RAG
    const aiResponse = 'This is a placeholder response. RAG implementation pending.';

    chat.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    });

    await chat.save();
    res.json(chat);
  } catch (error) {
    console.error('Add message error:', error);
    res.status(500).json({ message: 'Error adding message' });
  }
};

export const deleteChat = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const chat = await Chat.findOneAndDelete({ _id: chatId, userId });
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ message: 'Error deleting chat' });
  }
}; 