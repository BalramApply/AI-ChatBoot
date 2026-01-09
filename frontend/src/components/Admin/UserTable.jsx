import { useState } from 'react';
import { Search, UserCheck, UserX, Trash2, MoreVertical, Eye } from 'lucide-react';
import styles from "./styles/UserTable.module.css";

const UserTable = ({ users, onDeactivate, onActivate, onDelete, onViewDetails, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showActionsMenu, setShowActionsMenu] = useState(null);

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesStatus;
  });

  const handleAction = (action, userId) => {
    setShowActionsMenu(null);
    action(userId);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.title}>User Management</h3>
        <div className={styles.controls}>
          {/* Search */}
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Users</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            <tr>
              <th className={styles.th}>User</th>
              <th className={styles.th}>Email</th>
              <th className={styles.th}>Role</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Activity</th>
              <th className={styles.th}>Joined</th>
              <th className={`${styles.th} ${styles.thRight}`}>Actions</th>
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="7" className={styles.emptyState}>
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user._id} className={styles.tableRow}>
                  {/* User */}
                  <td className={styles.td}>
                    <div className={styles.userCell}>
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className={styles.avatar}
                      />
                      <span className={styles.username}>{user.username}</span>
                    </div>
                  </td>
                  
                  {/* Email */}
                  <td className={`${styles.td} ${styles.email}`}>
                    {user.email}
                  </td>
                  
                  {/* Role */}
                  <td className={styles.td}>
                    <span className={`${styles.badge} ${user.role === 'admin' ? styles.badgeAdmin : styles.badgeUser}`}>
                      {user.role}
                    </span>
                  </td>
                  
                  {/* Status */}
                  <td className={styles.td}>
                    <span className={`${styles.badge} ${user.isActive ? styles.badgeActive : styles.badgeInactive}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  
                  {/* Activity */}
                  <td className={`${styles.td} ${styles.activity}`}>
                    <div className={styles.activityCell}>
                      <span>{user.totalMessages || 0} messages</span>
                      <span className={styles.activitySub}>{user.totalChats || 0} chats</span>
                    </div>
                  </td>
                  
                  {/* Joined */}
                  <td className={`${styles.td} ${styles.date}`}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  
                  {/* Actions */}
                  <td className={`${styles.td} ${styles.tdRight}`}>
                    <div className={styles.actionsCell}>
                      <button
                        onClick={() => setShowActionsMenu(showActionsMenu === user._id ? null : user._id)}
                        className={styles.actionButton}
                      >
                        <MoreVertical className={styles.actionIcon} />
                      </button>
                      
                      {showActionsMenu === user._id && (
                        <>
                          <div 
                            className={styles.menuOverlay}
                            onClick={() => setShowActionsMenu(null)}
                          />
                          <div className={styles.actionsMenu}>
                            <button
                              onClick={() => handleAction(onViewDetails, user._id)}
                              className={styles.menuItem}
                            >
                              <Eye className={styles.menuIcon} />
                              View Details
                            </button>
                            
                            {user.role !== 'admin' && (
                              <>
                                {user.isActive ? (
                                  <button
                                    onClick={() => handleAction(onDeactivate, user._id)}
                                    className={`${styles.menuItem} ${styles.menuItemWarning}`}
                                  >
                                    <UserX className={styles.menuIcon} />
                                    Deactivate
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleAction(onActivate, user._id)}
                                    className={`${styles.menuItem} ${styles.menuItemSuccess}`}
                                  >
                                    <UserCheck className={styles.menuIcon} />
                                    Activate
                                  </button>
                                )}
                                
                                <button
                                  onClick={() => handleAction(onDelete, user._id)}
                                  className={`${styles.menuItem} ${styles.menuItemDanger}`}
                                >
                                  <Trash2 className={styles.menuIcon} />
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      {filteredUsers.length > 0 && (
        <div className={styles.summary}>
          <span>Showing {filteredUsers.length} of {users.length} users</span>
          <span>
            {users.filter(u => u.isActive).length} active · {users.filter(u => !u.isActive).length} inactive
          </span>
        </div>
      )}
    </div>
  );
};

export default UserTable;