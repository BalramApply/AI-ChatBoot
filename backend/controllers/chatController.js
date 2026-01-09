const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const aiService = require('../utils/aiService');

// @desc    Create new chat or get existing active chat
// @route   POST /api/chat/start
// @access  Private
const startChat = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user has an active chat
    let chat = await Chat.findOne({ 
      user: userId, 
      isActive: true 
    }).sort({ lastMessageAt: -1 });

    if (!chat) {
      // Create new chat
      chat = await Chat.create({
        user: userId,
        title: 'New Conversation'
      });

      console.log(`✅ New chat created for user: ${req.user.username}`);
    }

    res.status(200).json({
      success: true,
      chat
    });
  } catch (error) {
    console.error('Start Chat Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start chat',
      error: error.message
    });
  }
};

// @desc    Send message and get AI response
// @route   POST /api/chat/message
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { chatId, message } = req.body;
    const userId = req.user.id;

    // Validation
    if (!chatId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Chat ID and message are required'
      });
    }

    // Find chat and verify ownership
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    if (chat.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this chat'
      });
    }

    // Save user message
    const userMessage = await Message.create({
      chat: chatId,
      sender: 'user',
      content: message,
      userId: userId,
      username: req.user.username,
      avatar: req.user.avatar
    });

    // Add to context
    chat.addToContext('user', message);

    // Update chat title if it's the first message
    if (chat.messages.length === 0) {
      chat.generateTitle(message);
    }

    // Add message to chat
    chat.messages.push(userMessage._id);
    chat.messageCount += 1;
    chat.lastMessageAt = new Date();

    // Get AI context and format messages
    const contextMessages = chat.getAIContext();
    const formattedMessages = aiService.formatMessages(
      contextMessages.slice(0, -1), // Exclude the current message as it's added separately
      message
    );

    console.log(`💬 User message: "${message.substring(0, 50)}..."`);

    // Get AI response
    const aiResponse = await aiService.chat(formattedMessages);

    if (!aiResponse.success) {
      return res.status(500).json({
        success: false,
        message: aiResponse.message,
        userMessage
      });
    }

    // Save AI message
    const aiMessage = await Message.create({
      chat: chatId,
      sender: 'ai',
      content: aiResponse.message,
      aiMetadata: {
        model: aiResponse.metadata.model,
        responseTime: aiResponse.metadata.responseTime,
        tokensUsed: aiResponse.metadata.tokensUsed,
        suggestedActions: aiService.generateSuggestedActions(aiResponse.message)
      }
    });

    // Add AI response to context
    chat.addToContext('assistant', aiResponse.message);

    // Add AI message to chat
    chat.messages.push(aiMessage._id);
    chat.messageCount += 1;
    chat.lastMessageAt = new Date();

    // Update metadata
    if (!chat.metadata.averageResponseTime) {
      chat.metadata.averageResponseTime = aiResponse.metadata.responseTime;
    } else {
      chat.metadata.averageResponseTime = 
        (chat.metadata.averageResponseTime + aiResponse.metadata.responseTime) / 2;
    }

    await chat.save();

    // Update user stats
    await User.findByIdAndUpdate(userId, {
      $inc: { totalMessages: 2 } // User message + AI message
    });

    console.log(`🤖 AI response: "${aiResponse.message.substring(0, 50)}..."`);

    res.status(200).json({
      success: true,
      messages: {
        userMessage,
        aiMessage
      },
      chat: {
        id: chat._id,
        title: chat.title,
        messageCount: chat.messageCount
      }
    });
  } catch (error) {
    console.error('Send Message Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
};

// @desc    Get all user chats
// @route   GET /api/chat/history
// @access  Private
const getChatHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const chats = await Chat.find({ user: userId })
      .sort({ lastMessageAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('title messageCount lastMessageAt createdAt isActive');

    const total = await Chat.countDocuments({ user: userId });

    res.status(200).json({
      success: true,
      chats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalChats: total
      }
    });
  } catch (error) {
    console.error('Get Chat History Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat history',
      error: error.message
    });
  }
};

// @desc    Get messages from a specific chat
// @route   GET /api/chat/:chatId/messages
// @access  Private
const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 50 } = req.query;

    // Find chat and verify ownership
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    if (chat.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this chat'
      });
    }

    // Get messages
    const messages = await Message.find({ chat: chatId })
      .sort({ createdAt: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Message.countDocuments({ chat: chatId });

    res.status(200).json({
      success: true,
      chat: {
        id: chat._id,
        title: chat.title,
        messageCount: chat.messageCount
      },
      messages,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalMessages: total
      }
    });
  } catch (error) {
    console.error('Get Chat Messages Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get messages',
      error: error.message
    });
  }
};

// @desc    Add reaction to message
// @route   POST /api/chat/message/:messageId/react
// @access  Private
const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { reactionType } = req.body;
    const userId = req.user.id;

    // Validate reaction type
    const validReactions = ['thumbsUp', 'thumbsDown', 'heart'];
    if (!validReactions.includes(reactionType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reaction type'
      });
    }

    // Find message
    const message = await Message.findById(messageId).populate('chat');

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Verify user owns the chat
    if (message.chat.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Add reaction
    await message.addReaction(reactionType);

    // Update chat metadata
    const chat = await Chat.findById(message.chat._id);
    chat.metadata.totalReactions = (chat.metadata.totalReactions || 0) + 1;
    await chat.save();

    res.status(200).json({
      success: true,
      message: 'Reaction added',
      reactions: message.reactions
    });
  } catch (error) {
    console.error('Add Reaction Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add reaction',
      error: error.message
    });
  }
};

// @desc    Delete chat
// @route   DELETE /api/chat/:chatId
// @access  Private
const deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    if (chat.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Delete all messages in chat
    await Message.deleteMany({ chat: chatId });

    // Delete chat
    await chat.deleteOne();

    // Update user stats
    await User.findByIdAndUpdate(userId, {
      $inc: { 
        totalChats: -1,
        totalMessages: -chat.messageCount
      }
    });

    res.status(200).json({
      success: true,
      message: 'Chat deleted successfully'
    });
  } catch (error) {
    console.error('Delete Chat Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete chat',
      error: error.message
    });
  }
};

// @desc    Export chat history
// @route   GET /api/chat/:chatId/export
// @access  Private
const exportChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    const { format = 'json' } = req.query;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    if (chat.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Get all messages
    const messages = await Message.find({ chat: chatId }).sort({ createdAt: 1 });

    if (format === 'txt') {
      // Plain text format
      let txtContent = `Chat: ${chat.title}\n`;
      txtContent += `Date: ${chat.createdAt.toLocaleString()}\n`;
      txtContent += `Total Messages: ${messages.length}\n`;
      txtContent += `\n${'='.repeat(50)}\n\n`;

      messages.forEach(msg => {
        txtContent += `[${msg.createdAt.toLocaleString()}] ${msg.sender === 'user' ? msg.username : 'AI'}:\n`;
        txtContent += `${msg.content}\n\n`;
      });

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="chat-${chatId}.txt"`);
      return res.send(txtContent);
    }

    // JSON format (default)
    const exportData = {
      chat: {
        id: chat._id,
        title: chat.title,
        createdAt: chat.createdAt,
        messageCount: chat.messageCount
      },
      messages: messages.map(msg => ({
        sender: msg.sender,
        content: msg.content,
        timestamp: msg.createdAt,
        reactions: msg.reactions
      }))
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="chat-${chatId}.json"`);
    res.send(JSON.stringify(exportData, null, 2));
  } catch (error) {
    console.error('Export Chat Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export chat',
      error: error.message
    });
  }
};

module.exports = {
  startChat,
  sendMessage,
  getChatHistory,
  getChatMessages,
  addReaction,
  deleteChat,
  exportChat
};