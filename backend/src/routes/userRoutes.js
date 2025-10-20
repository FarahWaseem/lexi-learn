const express = require('express');
const router = express.Router();
const { validateRequest, schemas } = require('../middleware/validationMiddleware');
const { protect } = require('../middleware/authMiddleware');
const {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  deleteAccount,
  getUserStats
} = require('../controllers/userController');

// Public routes
router.post('/register', validateRequest(schemas.register), registerUser);
router.post('/login', validateRequest(schemas.login), loginUser);

// Protected routes
router.use(protect); // All routes below this middleware are protected

router.get('/me', getMe);
router.get('/stats', getUserStats);
router.put('/profile', updateProfile);
router.delete('/account', deleteAccount);

module.exports = router;
