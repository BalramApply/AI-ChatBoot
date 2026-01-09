import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/context/AuthContext';
import { adminAPI } from '../components/utils/api';
import { 
  MessageSquare, ArrowLeft, Users, MessageCircle, 
  Activity, ThumbsUp, TrendingUp, RefreshCw,
  Database, Clock
} from 'lucide-react';
import StatsCard from '../components/Admin/StatsCard';
import ActivityChart from '../components/Admin/ActivityChart';
import UserTable from '../components/Admin/UserTable';
import Styles from "./styles/AdminPage.module.css";

const AdminPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [systemStats, setSystemStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all data in parallel
      const [analyticsData, usersData, statsData] = await Promise.all([
        adminAPI.getAnalytics(),
        adminAPI.getAllUsers(1, 100),
        adminAPI.getSystemStats(),
      ]);

      setAnalytics(analyticsData.analytics);
      setUsers(usersData.users);
      setSystemStats(statsData.stats);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      alert('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleDeactivateUser = async (userId) => {
    if (!window.confirm('Are you sure you want to deactivate this user?')) return;

    try {
      await adminAPI.deactivateUser(userId);
      const response = await adminAPI.getAllUsers(1, 100);
      setUsers(response.users);
      alert('User deactivated successfully');
    } catch (error) {
      console.error('Failed to deactivate user:', error);
      alert('Failed to deactivate user. Please try again.');
    }
  };

  const handleActivateUser = async (userId) => {
    try {
      await adminAPI.activateUser(userId);
      const response = await adminAPI.getAllUsers(1, 100);
      setUsers(response.users);
      alert('User activated successfully');
    } catch (error) {
      console.error('Failed to activate user:', error);
      alert('Failed to activate user. Please try again.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) return;

    try {
      await adminAPI.deleteUser(userId);
      const response = await adminAPI.getAllUsers(1, 100);
      setUsers(response.users);
      alert('User deleted successfully');
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user. Please try again.');
    }
  };

  const handleViewDetails = (userId) => {
    alert(`User details view coming soon for user: ${userId}`);
  };

  if (loading) {
    return (
      <div className={Styles.loadingScreen}>
        <div className={Styles.loadingContent}>
          <div className={Styles.spinner}></div>
          <p className={Styles.loadingText}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={Styles.pageContainer}>
      {/* Header */}
      <div className={Styles.header}>
        <div className={Styles.headerContainer}>
          <div className={Styles.headerContent}>
            <div className={Styles.headerLeft}>
              <MessageSquare className={Styles.headerIcon} />
              <div className={Styles.headerInfo}>
                <h1 className={Styles.headerTitle}>Admin Dashboard</h1>
                <p className={Styles.headerSubtitle}>Welcome back, {user?.username}</p>
              </div>
            </div>
            <div className={Styles.headerActions}>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={Styles.refreshButton}
              >
                <RefreshCw className={`${Styles.buttonIcon} ${refreshing ? Styles.spinning : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => navigate('/chat')}
                className={Styles.backButton}
              >
                <ArrowLeft className={Styles.buttonIcon} />
                Back to Chat
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={Styles.content}>
        {/* Stats Grid */}
        <div className={Styles.statsGrid}>
          <StatsCard
            title="Total Users"
            value={analytics?.overview.totalUsers || 0}
            subtitle={`${analytics?.overview.activeUsers || 0} active`}
            icon={Users}
            color="blue"
            trend={{
              value: `${analytics?.recentActivity.newUsersThisWeek || 0} this week`,
              isPositive: analytics?.recentActivity.newUsersThisWeek > 0
            }}
          />
          
          <StatsCard
            title="Total Messages"
            value={analytics?.overview.totalMessages || 0}
            subtitle={analytics?.messages.ratio || '50% AI'}
            icon={MessageCircle}
            color="green"
            trend={{
              value: `${analytics?.recentActivity.newMessagesThisWeek || 0} this week`,
              isPositive: analytics?.recentActivity.newMessagesThisWeek > 0
            }}
          />
          
          <StatsCard
            title="Total Chats"
            value={analytics?.overview.totalChats || 0}
            subtitle={`Avg ${analytics?.overview.avgChatsPerUser || 0} per user`}
            icon={Activity}
            color="purple"
            trend={{
              value: `${analytics?.recentActivity.newChatsThisWeek || 0} this week`,
              isPositive: analytics?.recentActivity.newChatsThisWeek > 0
            }}
          />
          
          <StatsCard
            title="Total Reactions"
            value={analytics?.reactions.total || 0}
            subtitle={`${analytics?.reactions.thumbsUp || 0} 👍 · ${analytics?.reactions.heart || 0} ❤️`}
            icon={ThumbsUp}
            color="orange"
          />
        </div>

        {/* Charts Row */}
        <div className={Styles.chartsGrid}>
          <ActivityChart data={analytics?.dailyActivity || []} />

          {/* Top Users */}
          <div className={Styles.topUsersCard}>
            <h3 className={Styles.cardTitle}>Top Active Users</h3>
            <div className={Styles.topUsersList}>
              {analytics?.topUsers?.length > 0 ? (
                analytics.topUsers.map((topUser, index) => (
                  <div key={topUser._id} className={Styles.topUserItem}>
                    <div className={Styles.userRank}>
                      #{index + 1}
                    </div>
                    <img
                      src={topUser.avatar || `https://ui-avatars.com/api/?name=${topUser.username}`}
                      alt={topUser.username}
                      className={Styles.userAvatar}
                    />
                    <div className={Styles.userInfo}>
                      <p className={Styles.userName}>{topUser.username}</p>
                      <p className={Styles.userEmail}>{topUser.email}</p>
                    </div>
                    <div className={Styles.userStats}>
                      <p className={Styles.statValue}>{topUser.totalMessages || 0}</p>
                      <p className={Styles.statLabel}>messages</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className={Styles.emptyState}>No user activity yet</div>
              )}
            </div>
          </div>
        </div>

        {/* System Stats */}
        <div className={Styles.systemGrid}>
          <div className={Styles.systemCard}>
            <div className={Styles.systemHeader}>
              <div className={Styles.systemIconWrapper}>
                <Database className={Styles.systemIcon} />
              </div>
              <h3 className={Styles.systemTitle}>Database</h3>
            </div>
            <div className={Styles.systemStats}>
              <div className={Styles.statRow}>
                <span className={Styles.statKey}>Total Size:</span>
                <span className={Styles.statValueBold}>{systemStats?.database.totalSize || 'N/A'}</span>
              </div>
              {systemStats?.database.collections?.map((col) => (
                <div key={col.name} className={Styles.statRow}>
                  <span className={Styles.statKey}>{col.name}:</span>
                  <span className={Styles.statValueNormal}>{col.documents} docs</span>
                </div>
              ))}
            </div>
          </div>

          <div className={Styles.systemCard}>
            <div className={Styles.systemHeader}>
              <div className={`${Styles.systemIconWrapper} ${Styles.iconGreen}`}>
                <TrendingUp className={Styles.systemIcon} />
              </div>
              <h3 className={Styles.systemTitle}>Performance</h3>
            </div>
            <div className={Styles.systemStats}>
              <div className={Styles.statRow}>
                <span className={Styles.statKey}>Avg Response:</span>
                <span className={Styles.statValueBold}>{analytics?.aiPerformance.avgResponseTime || 'N/A'}</span>
              </div>
              <div className={Styles.statRow}>
                <span className={Styles.statKey}>Peak Hour:</span>
                <span className={Styles.statValueNormal}>{systemStats?.activity.peakHour || 'N/A'}</span>
              </div>
              <div className={Styles.statRow}>
                <span className={Styles.statKey}>AI Responses:</span>
                <span className={Styles.statValueNormal}>{analytics?.aiPerformance.totalAIResponses || 0}</span>
              </div>
            </div>
          </div>

          <div className={Styles.systemCard}>
            <div className={Styles.systemHeader}>
              <div className={`${Styles.systemIconWrapper} ${Styles.iconPurple}`}>
                <Clock className={Styles.systemIcon} />
              </div>
              <h3 className={Styles.systemTitle}>System Info</h3>
            </div>
            <div className={Styles.systemStats}>
              <div className={Styles.statRow}>
                <span className={Styles.statKey}>Server Uptime:</span>
                <span className={Styles.statValueBold}>
                  {systemStats?.uptime ? `${Math.floor(systemStats.uptime / 3600)}h ${Math.floor((systemStats.uptime % 3600) / 60)}m` : 'N/A'}
                </span>
              </div>
              <div className={Styles.statRow}>
                <span className={Styles.statKey}>Server Time:</span>
                <span className={Styles.statValueNormal}>
                  {systemStats?.serverTime ? new Date(systemStats.serverTime).toLocaleTimeString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* User Management */}
        <UserTable
          users={users}
          onDeactivate={handleDeactivateUser}
          onActivate={handleActivateUser}
          onDelete={handleDeleteUser}
          onViewDetails={handleViewDetails}
          loading={false}
        />
      </div>
    </div>
  );
};

export default AdminPage;