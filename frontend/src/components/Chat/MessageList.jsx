import { useEffect, useRef } from 'react';
import Message from './Message';
import TypingIndicator from './TypingIndicator';
import Styles from "./Style/MessageList.module.css";

const MessageList = ({ messages, isTyping, onReactionUpdate }) => {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Empty state
  if (!messages || messages.length === 0) {
    return (
      <div className={Styles.emptyStateContainer}>
        <div className={Styles.emptyStateContent}>
          <div className={Styles.emptyStateIcon}>
            <svg className={Styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className={Styles.emptyStateTitle}>Start a conversation</h3>
          <p className={Styles.emptyStateText}>
            Send a message to begin chatting with your AI assistant. Ask questions, get help, or just have a conversation!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={Styles.messageListContainer}
    >
      {/* Messages */}
      {messages.map((message) => (
        <Message 
          key={message._id} 
          message={message}
          onReactionUpdate={onReactionUpdate}
        />
      ))}

      {/* Typing Indicator */}
      {isTyping && <TypingIndicator />}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;