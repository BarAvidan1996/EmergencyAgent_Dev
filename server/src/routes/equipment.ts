import express from 'express';
import { body } from 'express-validator';
import {
  createList,
  getLists,
  getList,
  updateList,
  deleteList,
  exportToCsv
} from '../controllers/equipment';
import { validateRequest, authenticate } from '../middleware/auth';

const router = express.Router();

// Equipment item validation schema
const equipmentItemValidation = [
  body('name').notEmpty().withMessage('Item name is required'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive number'),
  body('expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid expiry date format'),
  body('notes').optional().isString()
];

// Create/Update list validation
const listValidation = [
  body('title').notEmpty().withMessage('List title is required'),
  body('items').isArray().withMessage('Items must be an array'),
  body('items.*.name').notEmpty().withMessage('Item name is required'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive number'),
  body('items.*.expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid expiry date format'),
  body('items.*.notes').optional().isString()
];

router.post('/', authenticate, listValidation, validateRequest, createList);
router.get('/', authenticate, getLists);
router.get('/:listId', authenticate, getList);
router.put('/:listId', authenticate, listValidation, validateRequest, updateList);
router.delete('/:listId', authenticate, deleteList);
router.get('/:listId/export', authenticate, exportToCsv);

export { router as equipmentRoutes }; 