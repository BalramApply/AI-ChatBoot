const express = require('express');
const router = express.Router();
const {
  getAnalytics,
  getAllUsers,
  getUserDetails,
  deactivateUser,
  activateUser,
  deleteUser,
  getSystemStats
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');

// All routes require authentication and admin role
router.use(protect, isAdmin);

// Analytics & Statistics
router.get('/analytics', getAnalytics);
router.get('/stats', getSystemStats);

// User Management
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserDetails);
router.put('/users/:userId/deactivate', deactivateUser);
router.put('/users/:userId/activate', activateUser);
router.delete('/users/:userId', deleteUser);

module.exports = router;