import { useState } from 'react';
import { Bot, ThumbsUp, ThumbsDown, Heart } from 'lucide-react';
import { chatAPI } from '../utils/api';
import Styles from "./Style/Message.module.css";

const Message = ({ message, onReactionUpdate }) => {
  const [reactions, setReactions] = useState(message.reactions || {});
  const [updating, setUpdating] = useState(false);

  const isAI = message.sender === 'ai';

  const handleReaction = async (reactionType) => {
    if (updating) return;

    setUpdating(true);
    try {
      const response = await chatAPI.addReaction(message._id, reactionType);
      setReactions(response.reactions);
      if (onReactionUpdate) {
        onReactionUpdate(message._id, response.reactions);
      }
    } catch (error) {
      console.error('Failed to add reaction:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    // Less than 1 minute
    if (diff < 60000) return 'Just now';

    // Less than 1 hour
    if (diff < 3600000) {
      const mins = Math.floor(diff / 60000);
      return `${mins} ${mins === 1 ? 'min' : 'mins'} ago`;
    }

    // Less than 1 day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }

    // More than 1 day
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`${Styles.messageContainer} ${isAI ? Styles.aiMessage : Styles.userMessage}`}>
      {/* Avatar */}
      <div className={Styles.avatarWrapper}>
        {isAI ? (
          <div className={Styles.aiAvatar}>
            <Bot className={Styles.aiIcon} />
          </div>
        ) : (
          <img
            src={message.avatar || `https://ui-avatars.com/api/?name=${message.username}&background=random&color=fff`}
            alt={message.username}
            className={Styles.userAvatar}
          />
        )}
      </div>

      {/* Message Content */}
      <div className={`${Styles.messageContent} ${isAI ? Styles.aiContent : Styles.userContent}`}>
        {/* Username & Time */}
        <div className={`${Styles.messageHeader} ${isAI ? Styles.aiHeader : Styles.userHeader}`}>
          <span className={Styles.username}>
            {isAI ? 'AI Assistant' : message.username}
          </span>
          <span className={Styles.timestamp}>
            {formatTime(message.createdAt)}
          </span>
        </div>

        {/* Message Bubble */}
        <div className={`${Styles.messageBubble} ${isAI ? Styles.aiBubble : Styles.userBubble}`}>
          <p className={Styles.messageText}>
            {message.content}
          </p>
        </div>

        {/* Reactions - Only for AI messages */}
        {isAI && (
          <div className={Styles.reactions}>
            {/* Thumbs Up */}
            <button
              onClick={() => handleReaction('thumbsUp')}
              disabled={updating}
              className={`${Styles.reactionButton} ${reactions.thumbsUp ? Styles.reactionActive : ''} ${Styles.reactionThumbsUp}`}
            >
              <ThumbsUp className={Styles.reactionIcon} />
            </button>

            {/* Thumbs Down */}
            <button
              onClick={() => handleReaction('thumbsDown')}
              disabled={updating}
              className={`${Styles.reactionButton} ${reactions.thumbsDown ? Styles.reactionActive : ''} ${Styles.reactionThumbsDown}`}
            >
              <ThumbsDown className={Styles.reactionIcon} />
            </button>

            {/* Heart */}
            <button
              onClick={() => handleReaction('heart')}
              disabled={updating}
              className={`${Styles.reactionButton} ${reactions.heart ? Styles.reactionActive : ''} ${Styles.reactionHeart}`}
            >
              <Heart className={Styles.reactionIcon} />
            </button>
          </div>
        )}

        {/* AI Metadata */}
        {isAI && message.aiMetadata && (
          <div className={Styles.metadata}>
            Response time: {message.aiMetadata.responseTime}ms
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;