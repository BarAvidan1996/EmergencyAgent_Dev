"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const auth_1 = require("../controllers/auth");
const auth_2 = require("../middleware/auth");
const router = express_1.default.Router();
exports.authRoutes = router;
// Register validation
const registerValidation = [
    (0, express_validator_1.body)('email').isEmail().withMessage('Please enter a valid email'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    (0, express_validator_1.body)('firstName').notEmpty().withMessage('First name is required'),
    (0, express_validator_1.body)('lastName').notEmpty().withMessage('Last name is required'),
    (0, express_validator_1.body)('phoneNumber')
        .optional()
        .matches(/^(\+972|0)([23489]|5[0248]|77)[1-9]\d{6}$/)
        .withMessage('Please enter a valid Israeli phone number')
];
// Login validation
const loginValidation = [
    (0, express_validator_1.body)('email').isEmail().withMessage('Please enter a valid email'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required')
];
router.post('/register', registerValidation, auth_2.validateRequest, auth_1.register);
router.post('/login', loginValidation, auth_2.validateRequest, auth_1.login);
router.get('/profile', auth_2.authenticate, auth_1.getProfile);
