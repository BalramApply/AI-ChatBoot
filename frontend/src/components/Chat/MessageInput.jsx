import { useState } from 'react';
import { Send } from 'lucide-react';
import Styles from "./Style/MessageInput.module.css";

const MessageInput = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInput = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  return (
    <form onSubmit={handleSubmit} className={Styles.inputForm}>
      <div className={Styles.inputWrapper}>
        {/* Text Input */}
        <div className={Styles.textareaContainer}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
            disabled={disabled}
            rows={1}
            className={Styles.textarea}
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={disabled || !message.trim()}
          className={Styles.sendButton}
        >
          <Send className={Styles.sendIcon} />
        </button>
      </div>

      {/* Helper Text */}
      <div className={Styles.helperText}>
        Press <kbd className={Styles.kbd}>Enter</kbd> to send, 
        <kbd className={Styles.kbdShift}>Shift + Enter</kbd> for new line
      </div>
    </form>
  );
};

export default MessageInput;