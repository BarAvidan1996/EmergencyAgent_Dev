import express from 'express';
import { body } from 'express-validator';
import { createChat, getChats, getChat, addMessage, deleteChat } from '../controllers/chat';
import { validateRequest, authenticate } from '../middleware/auth';

const router = express.Router();

// Create chat validation
const createChatValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('message').notEmpty().withMessage('Message is required')
];

// Add message validation
const addMessageValidation = [
  body('message').notEmpty().withMessage('Message is required')
];

router.post('/', authenticate, createChatValidation, validateRequest, createChat);
router.get('/', authenticate, getChats);
router.get('/:chatId', authenticate, getChat);
router.post('/:chatId/messages', authenticate, addMessageValidation, validateRequest, addMessage);
router.delete('/:chatId', authenticate, deleteChat);

export { router as chatRoutes }; 