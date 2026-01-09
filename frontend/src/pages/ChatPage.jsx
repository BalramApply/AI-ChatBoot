import { useState, useEffect } from 'react';
import { useAuth } from '../components/context/AuthContext';
import { chatAPI } from '../components/utils/api';
import ChatSidebar from '../components/Chat/ChatSidebar';
import MessageList from '../components/Chat/MessageList';
import MessageInput from '../components/Chat/MessageInput';
import { Menu, X } from 'lucide-react';
import Styles from "./styles/ChatPage.module.css";

const ChatPage = () => {
  const { user } = useAuth();
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    initializeChat();
  }, []);

  const initializeChat = async () => {
    try {
      // Start or get active chat
      const response = await chatAPI.startChat();
      setCurrentChat(response.chat);

      // Load messages if chat has any
      if (response.chat.messageCount > 0) {
        await loadMessages(response.chat._id);
      }
    } catch (error) {
      console.error('Failed to initialize chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId) => {
    try {
      const response = await chatAPI.getChatMessages(chatId);
      setMessages(response.messages || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSendMessage = async (messageText) => {
    if (!currentChat || !messageText.trim()) return;

    // Create optimistic user message
    const tempUserMessage = {
      _id: Date.now().toString(),
      sender: 'user',
      content: messageText,
      username: user.username,
      avatar: user.avatar,
      createdAt: new Date().toISOString(),
    };

    // Add user message to UI immediately
    setMessages((prev) => [...prev, tempUserMessage]);

    // Show typing indicator
    setIsTyping(true);

    try {
      // Send to API
      const response = await chatAPI.sendMessage(currentChat._id, messageText);

      // Replace temp message with real one and add AI response
      setMessages((prev) => {
        const filtered = prev.filter((m) => m._id !== tempUserMessage._id);
        return [
          ...filtered,
          response.messages.userMessage,
          response.messages.aiMessage,
        ];
      });

      // Update chat title if changed
      if (response.chat.title !== currentChat.title) {
        setCurrentChat((prev) => ({
          ...prev,
          title: response.chat.title,
        }));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove temp message on error
      setMessages((prev) => prev.filter((m) => m._id !== tempUserMessage._id));
      alert('Failed to send message. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleNewChat = async () => {
    try {
      setLoading(true);
      // The backend will create a new chat or return active one
      await initializeChat();
    } catch (error) {
      console.error('Failed to create new chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChat = async (chatId) => {
    try {
      setLoading(true);
      setMessages([]);
      await loadMessages(chatId);
      
      // Update current chat
      const response = await chatAPI.getChatMessages(chatId);
      setCurrentChat({
        _id: chatId,
        title: response.chat.title,
        messageCount: response.chat.messageCount,
      });
    } catch (error) {
      console.error('Failed to load chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChat = async (chatId) => {
    try {
      await chatAPI.deleteChat(chatId);
      
      // If deleted chat was current, initialize new chat
      if (currentChat && currentChat._id === chatId) {
        setMessages([]);
        await initializeChat();
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
      throw error;
    }
  };

  const handleExportChat = async (chatId) => {
    try {
      const blob = await chatAPI.exportChat(chatId, 'json');
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-${chatId}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export chat:', error);
      alert('Failed to export chat. Please try again.');
    }
  };

  const handleReactionUpdate = (messageId, reactions) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg._id === messageId ? { ...msg, reactions } : msg
      )
    );
  };

  if (loading && messages.length === 0) {
    return (
      <div className={Styles.loadingContainer}>
        <div className={Styles.loadingContent}>
          <div className={Styles.spinner}></div>
          <p className={Styles.loadingText}>Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={Styles.pageContainer}>
      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={Styles.mobileToggle}
      >
        {sidebarOpen ? <X className={Styles.toggleIcon} /> : <Menu className={Styles.toggleIcon} />}
      </button>

      {/* Sidebar */}
      <div className={`${Styles.sidebarWrapper} ${sidebarOpen ? Styles.sidebarOpen : Styles.sidebarClosed}`}>
        <ChatSidebar
          currentChatId={currentChat?._id}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          onDeleteChat={handleDeleteChat}
          onExportChat={handleExportChat}
        />
      </div>

      {/* Main Chat Area */}
      <div className={Styles.mainContent}>
        {/* Chat Header */}
        <div className={Styles.chatHeader}>
          <div className={Styles.headerContent}>
            <div className={Styles.headerInfo}>
              <h1 className={Styles.chatTitle}>
                {currentChat?.title || 'New Conversation'}
              </h1>
              <p className={Styles.messageCount}>
                {messages.length} messages
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <MessageList
          messages={messages}
          isTyping={isTyping}
          onReactionUpdate={handleReactionUpdate}
        />

        {/* Input */}
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={isTyping || loading}
        />
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className={Styles.mobileOverlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default ChatPage;