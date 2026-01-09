import { useState, useEffect } from 'react';
import { MessageSquare, Plus, Trash2, Download, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { chatAPI } from '../utils/api';
import Styles from "./Style/ChatSidebar.module.css";

const ChatSidebar = ({ currentChatId, onNewChat, onSelectChat, onDeleteChat, onExportChat }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    try {
      const response = await chatAPI.getChatHistory(1, 20);
      setChats(response.chats || []);
    } catch (error) {
      console.error('Failed to load chat history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChat = async (chatId, e) => {
    e.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this chat?')) {
      try {
        await onDeleteChat(chatId);
        setChats(chats.filter(chat => chat._id !== chatId));
      } catch (error) {
        console.error('Failed to delete chat:', error);
      }
    }
  };

  const handleExportChat = async (chatId, e) => {
    e.stopPropagation();
    try {
      await onExportChat(chatId);
    } catch (error) {
      console.error('Failed to export chat:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAdminClick = () => {
    navigate('/admin');
  };

  return (
    <div className={Styles.sidebar}>
      {/* Header */}
      <div className={Styles.header}>
        <div className={Styles.headerTop}>
          <div className={Styles.logoContainer}>
            <MessageSquare className={Styles.logoIcon} />
            <h2 className={Styles.logoText}>AI Chatbot</h2>
          </div>
        </div>

        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className={Styles.newChatButton}
        >
          <Plus className={Styles.buttonIcon} />
          New Chat
        </button>
      </div>

      {/* Chat History */}
      <div className={Styles.chatHistory}>
        {loading ? (
          <div className={Styles.loadingContainer}>
            <div className={Styles.spinner}></div>
          </div>
        ) : chats.length === 0 ? (
          <div className={Styles.emptyState}>
            No chat history yet. Start a new conversation!
          </div>
        ) : (
          <div className={Styles.chatList}>
            {chats.map((chat) => (
              <div
                key={chat._id}
                onClick={() => onSelectChat(chat._id)}
                className={`${Styles.chatItem} ${
                  currentChatId === chat._id ? Styles.chatItemActive : ''
                }`}
              >
                <div className={Styles.chatItemContent}>
                  <div className={Styles.chatItemInfo}>
                    <h3 className={Styles.chatTitle}>
                      {chat.title}
                    </h3>
                    <p className={Styles.chatMeta}>
                      {chat.messageCount} messages
                    </p>
                  </div>
                  
                  {/* Actions */}
                  <div className={Styles.chatActions}>
                    <button
                      onClick={(e) => handleExportChat(chat._id, e)}
                      className={Styles.actionButton}
                      title="Export chat"
                    >
                      <Download className={Styles.actionIcon} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteChat(chat._id, e)}
                      className={`${Styles.actionButton} ${Styles.actionButtonDelete}`}
                      title="Delete chat"
                    >
                      <Trash2 className={Styles.actionIcon} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Profile */}
      <div className={Styles.userProfile}>
        <div className={Styles.userInfo}>
          <img
            src={user?.avatar}
            alt={user?.username}
            className={Styles.avatar}
          />
          <div className={Styles.userDetails}>
            <p className={Styles.username}>
              {user?.username}
            </p>
            <p className={Styles.userEmail}>
              {user?.email}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={Styles.profileActions}>
          {user?.role === 'admin' && (
            <button
              onClick={handleAdminClick}
              className={Styles.profileButton}
            >
              <Shield className={Styles.profileButtonIcon} />
              Admin Dashboard
            </button>
          )}
          
          <button
            onClick={handleLogout}
            className={`${Styles.profileButton} ${Styles.logoutButton}`}
          >
            <LogOut className={Styles.profileButtonIcon} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;