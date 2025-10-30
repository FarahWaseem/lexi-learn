const Joi = require('joi');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

// Validation schemas
const schemas = {
  // User validation
  register: Joi.object({
    firstName: Joi.string().min(2).max(100).required(),
    lastName: Joi.string().min(2).max(100).optional(),
    email: Joi.string().email().max(150).required(),
    password: Joi.string().min(6).required()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  // Vocab validation
  createVocab: Joi.object({
    lesson: Joi.string().min(1).max(255).required(),
    word: Joi.string().min(1).max(100).required(),
    translation: Joi.string().min(1).max(255).required(),
    example: Joi.string().max(500).optional(),
    audioUrl: Joi.string().uri().optional()
  }),

  updateVocab: Joi.object({
    lesson: Joi.string().min(1).max(255).optional(),
    word: Joi.string().min(1).max(100).optional(),
    translation: Joi.string().min(1).max(255).optional(),
    example: Joi.string().max(500).optional(),
    audioUrl: Joi.string().uri().optional()
  }),

  // Lesson validation
  createLesson: Joi.object({
    dayNumber: Joi.number().integer().min(1).max(60).required(),
    titleEn: Joi.string().min(1).max(255).required(),
    level: Joi.string().valid('A1', 'A2', 'B1', 'B2').required(),
    content: Joi.string().optional(),
    audioUrl: Joi.string().uri().optional(),
    estimatedMinutes: Joi.number().integer().min(1).max(120).optional()
  }),

  // Query parameters validation
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().max(100).optional(),
    sortBy: Joi.string().valid('word', 'lesson', 'created_at').default('word'),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc')
  })
};

module.exports = {
  validateRequest,
  schemas
};
