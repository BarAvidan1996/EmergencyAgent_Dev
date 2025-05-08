import express from 'express';
import { body } from 'express-validator';
import { register, login, getProfile } from '../controllers/auth';
import { validateRequest, authenticate } from '../middleware/auth';

const router = express.Router();

// Register validation
const registerValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('phoneNumber')
    .optional()
    .matches(/^(\+972|0)([23489]|5[0248]|77)[1-9]\d{6}$/)
    .withMessage('Please enter a valid Israeli phone number')
];

// Login validation
const loginValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

router.post('/register', registerValidation, validateRequest, register);
router.post('/login', loginValidation, validateRequest, login);
router.get('/profile', authenticate, getProfile);

export { router as authRoutes }; 