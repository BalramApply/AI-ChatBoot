const express = require('express');
const router = express.Router();
const {
  startChat,
  sendMessage,
  getChatHistory,
  getChatMessages,
  addReaction,
  deleteChat,
  exportChat
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

// All routes are protected (require authentication)

// Start or get active chat
router.post('/start', protect, startChat);

// Send message and get AI response
router.post('/message', protect, sendMessage);

// Get user's chat history
router.get('/history', protect, getChatHistory);

// Get messages from specific chat
router.get('/:chatId/messages', protect, getChatMessages);

// Add reaction to message
router.post('/message/:messageId/react', protect, addReaction);

// Delete chat
router.delete('/:chatId', protect, deleteChat);

// Export chat
router.get('/:chatId/export', protect, exportChat);

module.exports = router;