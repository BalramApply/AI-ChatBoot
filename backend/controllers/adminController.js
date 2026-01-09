const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

// @desc    Get dashboard analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
const getAnalytics = async (req, res) => {
  try {
    // Get counts
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalChats = await Chat.countDocuments();
    const totalMessages = await Message.countDocuments();

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const newUsersThisWeek = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    const newChatsThisWeek = await Chat.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    const newMessagesThisWeek = await Message.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Get user messages breakdown
    const userMessages = await Message.countDocuments({ sender: 'user' });
    const aiMessages = await Message.countDocuments({ sender: 'ai' });

    // Get average messages per user
    const avgMessagesPerUser = totalUsers > 0 
      ? Math.round(totalMessages / totalUsers) 
      : 0;

    // Get average chats per user
    const avgChatsPerUser = totalUsers > 0 
      ? Math.round(totalChats / totalUsers) 
      : 0;

    // Get reaction statistics
    const messagesWithReactions = await Message.find({
      $or: [
        { 'reactions.thumbsUp': true },
        { 'reactions.thumbsDown': true },
        { 'reactions.heart': true }
      ]
    });

    let totalReactions = 0;
    let thumbsUpCount = 0;
    let thumbsDownCount = 0;
    let heartCount = 0;

    messagesWithReactions.forEach(msg => {
      if (msg.reactions.thumbsUp) { thumbsUpCount++; totalReactions++; }
      if (msg.reactions.thumbsDown) { thumbsDownCount++; totalReactions++; }
      if (msg.reactions.heart) { heartCount++; totalReactions++; }
    });

    // Get top active users
    const topUsers = await User.find()
      .sort({ totalMessages: -1 })
      .limit(5)
      .select('username email totalMessages totalChats lastLogin');

    // Get AI response time statistics
    const aiMessagesWithMetadata = await Message.find({
      sender: 'ai',
      'aiMetadata.responseTime': { $exists: true }
    }).select('aiMetadata.responseTime');

    let avgResponseTime = 0;
    if (aiMessagesWithMetadata.length > 0) {
      const totalResponseTime = aiMessagesWithMetadata.reduce(
        (sum, msg) => sum + (msg.aiMetadata.responseTime || 0), 
        0
      );
      avgResponseTime = Math.round(totalResponseTime / aiMessagesWithMetadata.length);
    }

    // Get daily activity for last 7 days
    const dailyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayMessages = await Message.countDocuments({
        createdAt: { $gte: date, $lt: nextDate }
      });

      const dayChats = await Chat.countDocuments({
        createdAt: { $gte: date, $lt: nextDate }
      });

      dailyActivity.push({
        date: date.toISOString().split('T')[0],
        messages: dayMessages,
        chats: dayChats
      });
    }

    res.status(200).json({
      success: true,
      analytics: {
        overview: {
          totalUsers,
          activeUsers,
          inactiveUsers: totalUsers - activeUsers,
          totalChats,
          totalMessages,
          avgMessagesPerUser,
          avgChatsPerUser
        },
        recentActivity: {
          newUsersThisWeek,
          newChatsThisWeek,
          newMessagesThisWeek
        },
        messages: {
          total: totalMessages,
          user: userMessages,
          ai: aiMessages,
          ratio: totalMessages > 0 
            ? ((aiMessages / totalMessages) * 100).toFixed(1) + '% AI' 
            : '0%'
        },
        reactions: {
          total: totalReactions,
          thumbsUp: thumbsUpCount,
          thumbsDown: thumbsDownCount,
          heart: heartCount
        },
        aiPerformance: {
          avgResponseTime: `${avgResponseTime}ms`,
          totalAIResponses: aiMessages
        },
        topUsers,
        dailyActivity
      }
    });
  } catch (error) {
    console.error('Get Analytics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics',
      error: error.message
    });
  }
};

// @desc    Get all users with pagination
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'all' } = req.query;

    // Build query
    const query = {};

    // Search by username or email
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by status
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    // Don't include admins in regular user list (optional)
    // query.role = 'user';

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-password');

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get All Users Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: error.message
    });
  }
};

// @desc    Get user details with activity
// @route   GET /api/admin/users/:userId
// @access  Private/Admin
const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's chats
    const chats = await Chat.find({ user: userId })
      .sort({ lastMessageAt: -1 })
      .limit(10);

    // Get recent messages
    const recentMessages = await Message.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('chat', 'title');

    // Get activity stats
    const totalReactions = await Message.countDocuments({
      userId,
      $or: [
        { 'reactions.thumbsUp': true },
        { 'reactions.thumbsDown': true },
        { 'reactions.heart': true }
      ]
    });

    res.status(200).json({
      success: true,
      user: user.toPublicJSON(),
      activity: {
        totalChats: chats.length,
        totalMessages: user.totalMessages,
        totalReactions,
        recentChats: chats,
        recentMessages
      }
    });
  } catch (error) {
    console.error('Get User Details Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user details',
      error: error.message
    });
  }
};

// @desc    Deactivate user account
// @route   PUT /api/admin/users/:userId/deactivate
// @access  Private/Admin
const deactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deactivating admin accounts
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot deactivate admin accounts'
      });
    }

    // Prevent self-deactivation
    if (user._id.toString() === req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }

    user.isActive = false;
    await user.save();

    console.log(`⚠️  User deactivated: ${user.username} by admin: ${req.user.username}`);

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
      user: user.toPublicJSON()
    });
  } catch (error) {
    console.error('Deactivate User Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate user',
      error: error.message
    });
  }
};

// @desc    Activate user account
// @route   PUT /api/admin/users/:userId/activate
// @access  Private/Admin
const activateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = true;
    await user.save();

    console.log(`✅ User activated: ${user.username} by admin: ${req.user.username}`);

    res.status(200).json({
      success: true,
      message: 'User activated successfully',
      user: user.toPublicJSON()
    });
  } catch (error) {
    console.error('Activate User Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate user',
      error: error.message
    });
  }
};

// @desc    Delete user permanently
// @route   DELETE /api/admin/users/:userId
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting admin accounts
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin accounts'
      });
    }

    // Prevent self-deletion
    if (user._id.toString() === req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Get user's chats
    const userChats = await Chat.find({ user: userId });
    const chatIds = userChats.map(chat => chat._id);

    // Delete all messages in user's chats
    await Message.deleteMany({ chat: { $in: chatIds } });

    // Delete all user's chats
    await Chat.deleteMany({ user: userId });

    // Delete user
    await user.deleteOne();

    console.log(`🗑️  User deleted: ${user.username} by admin: ${req.user.username}`);

    res.status(200).json({
      success: true,
      message: 'User and all associated data deleted successfully',
      deletedData: {
        user: user.username,
        chatsDeleted: userChats.length,
        messagesDeleted: await Message.countDocuments({ userId })
      }
    });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

// @desc    Get system statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getSystemStats = async (req, res) => {
  try {
    const db = User.db.db;

    const collections = await db.listCollections().toArray();

    let totalSize = 0;
    const collectionStats = [];

    for (const collection of collections) {
      const stats = await db.command({
        collStats: collection.name
      });

      totalSize += stats.size || 0;

      collectionStats.push({
        name: collection.name,
        documents: stats.count || 0,
        size: `${((stats.size || 0) / 1024).toFixed(2)} KB`
      });
    }

    const recentLogins = await User.find({ lastLogin: { $ne: null } })
      .sort({ lastLogin: -1 })
      .limit(10)
      .select('username email lastLogin');

    const messagesByHour = await Message.aggregate([
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    const peakHour = messagesByHour[0]
      ? `${messagesByHour[0]._id}:00`
      : 'N/A';

    res.status(200).json({
      success: true,
      stats: {
        database: {
          totalSize: `${(totalSize / 1024).toFixed(2)} KB`,
          collections: collectionStats
        },
        activity: {
          recentLogins,
          peakHour
        },
        uptime: process.uptime(),
        serverTime: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Get System Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system statistics',
      error: error.message
    });
  }
};


module.exports = {
  getAnalytics,
  getAllUsers,
  getUserDetails,
  deactivateUser,
  activateUser,
  deleteUser,
  getSystemStats
};