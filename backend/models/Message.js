const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true,
    index: true
  },
  sender: {
    type: String,
    enum: ['user', 'ai'],
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [5000, 'Message cannot exceed 5000 characters']
  },
  // User info (for user messages)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.sender === 'user';
    }
  },
  username: {
    type: String,
    required: function() {
      return this.sender === 'user';
    }
  },
  avatar: {
    type: String
  },
  // Reactions on messages
  reactions: {
    thumbsUp: {
      type: Boolean,
      default: false
    },
    thumbsDown: {
      type: Boolean,
      default: false
    },
    heart: {
      type: Boolean,
      default: false
    }
  },
  // AI metadata (for AI messages)
  aiMetadata: {
    model: String,
    responseTime: Number, // in milliseconds
    tokensUsed: Number,
    suggestedActions: [String]
  },
  // File attachments (if any)
  attachments: [{
    filename: String,
    fileType: String,
    fileSize: Number,
    url: String
  }],
  // Status
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for performance
messageSchema.index({ chat: 1, createdAt: 1 });
messageSchema.index({ userId: 1 });

// Method to add reaction
messageSchema.methods.addReaction = function(reactionType) {
  const validReactions = ['thumbsUp', 'thumbsDown', 'heart'];
  
  if (!validReactions.includes(reactionType)) {
    throw new Error('Invalid reaction type');
  }

  // Toggle reaction
  this.reactions[reactionType] = !this.reactions[reactionType];
  
  // If thumbsUp is selected, deselect thumbsDown and vice versa
  if (reactionType === 'thumbsUp' && this.reactions.thumbsUp) {
    this.reactions.thumbsDown = false;
  } else if (reactionType === 'thumbsDown' && this.reactions.thumbsDown) {
    this.reactions.thumbsUp = false;
  }
  
  return this.save();
};

// Method to get reaction count
messageSchema.methods.getReactionCount = function() {
  let count = 0;
  if (this.reactions.thumbsUp) count++;
  if (this.reactions.thumbsDown) count++;
  if (this.reactions.heart) count++;
  return count;
};

// Virtual for formatted timestamp
messageSchema.virtual('formattedTime').get(function() {
  const now = new Date();
  const messageTime = this.createdAt;
  const diff = now - messageTime;
  
  // Less than 1 minute
  if (diff < 60000) {
    return 'Just now';
  }
  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  // Less than 1 day
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }
  // More than 1 day
  return messageTime.toLocaleDateString() + ' ' + messageTime.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
});

// Ensure virtuals are included in JSON
messageSchema.set('toJSON', { virtuals: true });
messageSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Message', messageSchema);