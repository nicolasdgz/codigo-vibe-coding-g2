import { body, param, validationResult } from 'express-validator';

const VALID_STATUSES = ['pending', 'in-progress', 'done'];

export const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const validateCreate = [
  body('title')
    .trim()
    .notEmpty().withMessage('title is required')
    .isString().withMessage('title must be a string')
    .isLength({ max: 255 }).withMessage('title max 255 characters'),
  body('description')
    .optional()
    .isString().withMessage('description must be a string')
    .isLength({ max: 2000 }).withMessage('description max 2000 characters'),
  body('status')
    .optional()
    .isIn(VALID_STATUSES).withMessage(`status must be one of: ${VALID_STATUSES.join(', ')}`),
  handleValidation,
];

export const validateUpdate = [
  param('id')
    .isUUID().withMessage('id must be a valid UUID'),
  body('title')
    .optional()
    .trim()
    .notEmpty().withMessage('title cannot be empty')
    .isString().withMessage('title must be a string')
    .isLength({ max: 255 }).withMessage('title max 255 characters'),
  body('description')
    .optional()
    .isString().withMessage('description must be a string')
    .isLength({ max: 2000 }).withMessage('description max 2000 characters'),
  body('status')
    .optional()
    .isIn(VALID_STATUSES).withMessage(`status must be one of: ${VALID_STATUSES.join(', ')}`),
  handleValidation,
];

export const validateId = [
  param('id')
    .isUUID().withMessage('id must be a valid UUID'),
  handleValidation,
];
