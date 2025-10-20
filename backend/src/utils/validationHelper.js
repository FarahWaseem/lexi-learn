const Joi = require('joi');

/**
 * Validation helper functions
 */
class ValidationHelper {
  static validateUUID(id) {
    const uuidSchema = Joi.string().uuid();
    const { error } = uuidSchema.validate(id);
    return !error;
  }

  static validateEmail(email) {
    const emailSchema = Joi.string().email();
    const { error } = emailSchema.validate(email);
    return !error;
  }

  static validatePassword(password) {
    // At least 6 characters, contains at least one letter and one number
    const passwordSchema = Joi.string().min(6).pattern(/^(?=.*[A-Za-z])(?=.*\d)/);
    const { error } = passwordSchema.validate(password);
    return !error;
  }

  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .substring(0, 1000); // Limit length
  }

  static validatePaginationParams(params) {
    const schema = Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      sortBy: Joi.string().valid('created_at', 'updated_at', 'name', 'email').default('created_at'),
      sortOrder: Joi.string().valid('asc', 'desc').default('desc')
    });

    const { error, value } = schema.validate(params);
    return { error, value };
  }

  static validateSearchQuery(query) {
    if (!query || typeof query !== 'string') {
      return { isValid: false, error: 'Search query must be a string' };
    }

    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
      return { isValid: false, error: 'Search query must be at least 2 characters long' };
    }

    if (trimmedQuery.length > 100) {
      return { isValid: false, error: 'Search query must be less than 100 characters' };
    }

    return { isValid: true, query: trimmedQuery };
  }
}

module.exports = ValidationHelper;
