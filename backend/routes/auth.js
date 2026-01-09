const express = require('express');
const router = express.Router();
const { 
  signup, 
  login, 
  getMe, 
  validatePassword 
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/check-password', validatePassword);

// Protected routes
router.get('/me', protect, getMe);

module.exports = router;