"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteChat = exports.addMessage = exports.getChat = exports.getChats = exports.createChat = void 0;
const Chat_1 = require("../models/Chat");
const createChat = async (req, res) => {
    var _a;
    try {
        const { title, message } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const chat = new Chat_1.Chat({
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
    }
    catch (error) {
        console.error('Create chat error:', error);
        res.status(500).json({ message: 'Error creating chat' });
    }
};
exports.createChat = createChat;
const getChats = async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const chats = await Chat_1.Chat.find({ userId }).sort({ updatedAt: -1 });
        res.json(chats);
    }
    catch (error) {
        console.error('Get chats error:', error);
        res.status(500).json({ message: 'Error fetching chats' });
    }
};
exports.getChats = getChats;
const getChat = async (req, res) => {
    var _a;
    try {
        const { chatId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const chat = await Chat_1.Chat.findOne({ _id: chatId, userId });
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }
        res.json(chat);
    }
    catch (error) {
        console.error('Get chat error:', error);
        res.status(500).json({ message: 'Error fetching chat' });
    }
};
exports.getChat = getChat;
const addMessage = async (req, res) => {
    var _a;
    try {
        const { chatId } = req.params;
        const { message } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const chat = await Chat_1.Chat.findOne({ _id: chatId, userId });
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
    }
    catch (error) {
        console.error('Add message error:', error);
        res.status(500).json({ message: 'Error adding message' });
    }
};
exports.addMessage = addMessage;
const deleteChat = async (req, res) => {
    var _a;
    try {
        const { chatId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const chat = await Chat_1.Chat.findOneAndDelete({ _id: chatId, userId });
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }
        res.json({ message: 'Chat deleted successfully' });
    }
    catch (error) {
        console.error('Delete chat error:', error);
        res.status(500).json({ message: 'Error deleting chat' });
    }
};
exports.deleteChat = deleteChat;
