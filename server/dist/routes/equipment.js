"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.equipmentRoutes = void 0;
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const equipment_1 = require("../controllers/equipment");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
exports.equipmentRoutes = router;
// Equipment item validation schema
const equipmentItemValidation = [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Item name is required'),
    (0, express_validator_1.body)('quantity')
        .isInt({ min: 1 })
        .withMessage('Quantity must be a positive number'),
    (0, express_validator_1.body)('expiryDate')
        .optional()
        .isISO8601()
        .withMessage('Invalid expiry date format'),
    (0, express_validator_1.body)('notes').optional().isString()
];
// Create/Update list validation
const listValidation = [
    (0, express_validator_1.body)('title').notEmpty().withMessage('List title is required'),
    (0, express_validator_1.body)('items').isArray().withMessage('Items must be an array'),
    (0, express_validator_1.body)('items.*.name').notEmpty().withMessage('Item name is required'),
    (0, express_validator_1.body)('items.*.quantity')
        .isInt({ min: 1 })
        .withMessage('Quantity must be a positive number'),
    (0, express_validator_1.body)('items.*.expiryDate')
        .optional()
        .isISO8601()
        .withMessage('Invalid expiry date format'),
    (0, express_validator_1.body)('items.*.notes').optional().isString()
];
router.post('/', auth_1.authenticate, listValidation, auth_1.validateRequest, equipment_1.createList);
router.get('/', auth_1.authenticate, equipment_1.getLists);
router.get('/:listId', auth_1.authenticate, equipment_1.getList);
router.put('/:listId', auth_1.authenticate, listValidation, auth_1.validateRequest, equipment_1.updateList);
router.delete('/:listId', auth_1.authenticate, equipment_1.deleteList);
router.get('/:listId/export', auth_1.authenticate, equipment_1.exportToCsv);
