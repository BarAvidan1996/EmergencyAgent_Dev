"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shelterRoutes = void 0;
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const shelter_1 = require("../controllers/shelter");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
exports.shelterRoutes = router;
// Find nearest shelter validation
const findNearestShelterValidation = [
    (0, express_validator_1.query)('latitude')
        .isFloat({ min: 29.5, max: 33.3 })
        .withMessage('Please provide a valid latitude within Israel'),
    (0, express_validator_1.query)('longitude')
        .isFloat({ min: 34.2, max: 35.9 })
        .withMessage('Please provide a valid longitude within Israel')
];
// Search shelters by address validation
const searchSheltersByAddressValidation = [
    (0, express_validator_1.query)('address').notEmpty().withMessage('Address is required')
];
router.get('/nearest', auth_1.authenticate, findNearestShelterValidation, auth_1.validateRequest, shelter_1.findNearestShelter);
router.get('/search', auth_1.authenticate, searchSheltersByAddressValidation, auth_1.validateRequest, shelter_1.searchSheltersByAddress);
