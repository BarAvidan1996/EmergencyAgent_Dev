import express from 'express';
import { query } from 'express-validator';
import { findNearestShelter, searchSheltersByAddress } from '../controllers/shelter';
import { validateRequest, authenticate } from '../middleware/auth';

const router = express.Router();

// Find nearest shelter validation
const findNearestShelterValidation = [
  query('latitude')
    .isFloat({ min: 29.5, max: 33.3 })
    .withMessage('Please provide a valid latitude within Israel'),
  query('longitude')
    .isFloat({ min: 34.2, max: 35.9 })
    .withMessage('Please provide a valid longitude within Israel'),
  query('radius')
    .optional()
    .isInt({ min: 100, max: 3000 })
    .withMessage('Radius must be between 100 and 3000 meters')
];

// Search shelters by address validation
const searchSheltersByAddressValidation = [
  query('address').notEmpty().withMessage('Address is required'),
  query('radius')
    .optional()
    .isInt({ min: 100, max: 3000 })
    .withMessage('Radius must be between 100 and 3000 meters')
];

router.get(
  '/nearest',
  authenticate,
  findNearestShelterValidation,
  validateRequest,
  findNearestShelter
);

router.get(
  '/search',
  authenticate,
  searchSheltersByAddressValidation,
  validateRequest,
  searchSheltersByAddress
);

export { router as shelterRoutes }; 