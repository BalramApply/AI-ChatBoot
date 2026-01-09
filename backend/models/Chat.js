const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    default: 'New Conversation',
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }],
  messageCount: {
    type: Number,
    default: 0
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Store conversation context for AI (last 10 messages)
  context: [{
    role: {
      type: String,
      enum: ['user', 'assistant']
    },
    content: String,
    timestamp: Date
  }],
  // Metadata
  metadata: {
    averageResponseTime: Number,
    totalReactions: {
      type: Number,
      default: 0
    },
    tags: [String]
  }
}, {
  timestamps: true
});

// Index for faster queries
chatSchema.index({ user: 1, createdAt: -1 });
chatSchema.index({ lastMessageAt: -1 });

// Method to add message to context (keep last 10)
chatSchema.methods.addToContext = function(role, content) {
  this.context.push({
    role,
    content,
    timestamp: new Date()
  });

  // Keep only last 10 messages for context
  if (this.context.length > 10) {
    this.context = this.context.slice(-10);
  }
};

// Method to get context for AI
chatSchema.methods.getAIContext = function() {
  return this.context.map(msg => ({
    role: msg.role,
    content: msg.content
  }));
};

// Virtual for getting message count
chatSchema.virtual('totalMessages').get(function() {
  return this.messages.length;
});

// Update title based on first message
chatSchema.methods.generateTitle = function(firstMessage) {
  if (this.title === 'New Conversation' && firstMessage) {
    // Use first 50 characters of first message as title
    this.title = firstMessage.substring(0, 50) + (firstMessage.length > 50 ? '...' : '');
  }
};

module.exports = mongoose.model('Chat', chatSchema);