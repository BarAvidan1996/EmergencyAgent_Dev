"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRoutes = void 0;
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const chat_1 = require("../controllers/chat");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
exports.chatRoutes = router;
// Create chat validation
const createChatValidation = [
    (0, express_validator_1.body)('title').notEmpty().withMessage('Title is required'),
    (0, express_validator_1.body)('message').notEmpty().withMessage('Message is required')
];
// Add message validation
const addMessageValidation = [
    (0, express_validator_1.body)('message').notEmpty().withMessage('Message is required')
];
router.post('/', auth_1.authenticate, createChatValidation, auth_1.validateRequest, chat_1.createChat);
router.get('/', auth_1.authenticate, chat_1.getChats);
router.get('/:chatId', auth_1.authenticate, chat_1.getChat);
router.post('/:chatId/messages', auth_1.authenticate, addMessageValidation, auth_1.validateRequest, chat_1.addMessage);
router.delete('/:chatId', auth_1.authenticate, chat_1.deleteChat);
