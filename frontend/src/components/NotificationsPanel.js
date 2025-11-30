import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  markNotificationRead,
  markAllRead,
} from '../store/slices/notificationSlice';
import {
  Calendar,
  CheckCircle,
  XCircle,
  Bell,
  AlertCircle,
  MessageSquare,
  X,
} from 'lucide-react';
import './NotificationsPanel.css';

const NotificationsPanel = ({ onClose, loading }) => {
  const dispatch = useDispatch();
  const { notifications, grouped, unreadCount } = useSelector(
    (state) => state.notifications
  );
  const [activeTab, setActiveTab] = useState('all');

  const handleMarkRead = async (notificationId, e) => {
    e.stopPropagation();
    await dispatch(markNotificationRead(notificationId));
  };

  const handleMarkAllRead = async () => {
    await dispatch(markAllRead());
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'leave':
        return <Calendar size={16} className="category-icon leave-icon" />;
      case 'approval':
        return <CheckCircle size={16} className="category-icon approval-icon" />;
      case 'notice':
        return <MessageSquare size={16} className="category-icon notice-icon" />;
      case 'alert':
        return <AlertCircle size={16} className="category-icon alert-icon" />;
      default:
        return <Bell size={16} className="category-icon" />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'leave':
        return 'var(--leave-color)';
      case 'approval':
        return 'var(--approval-color)';
      case 'notice':
        return 'var(--notice-color)';
      case 'alert':
        return 'var(--alert-color)';
      default:
        return 'var(--default-color)';
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const displayNotifications =
    activeTab === 'all' ? notifications : grouped[activeTab] || [];

  const tabs = [
    { id: 'all', label: 'All', count: notifications.length },
    { id: 'leave', label: 'Leave', count: grouped.leave?.length || 0 },
    { id: 'approval', label: 'Approvals', count: grouped.approval?.length || 0 },
    { id: 'notice', label: 'Notices', count: grouped.notice?.length || 0 },
  ];

  return (
    <div className="notifications-panel">
      <div className="notifications-panel-header">
        <h3>Notifications</h3>
        <div className="notifications-panel-actions">
          {unreadCount > 0 && (
            <button
              className="mark-all-read-btn"
              onClick={handleMarkAllRead}
              title="Mark all as read"
            >
              Mark all read
            </button>
          )}
          <button className="close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="notifications-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`notification-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="tab-count">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      <div className="notifications-list">
        {loading ? (
          <div className="notifications-loading">Loading notifications...</div>
        ) : displayNotifications.length === 0 ? (
          <div className="notifications-empty">
            <Bell size={48} className="empty-icon" />
            <p>No notifications</p>
          </div>
        ) : (
          displayNotifications.map((notification) => (
            <div
              key={notification._id}
              className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
              onClick={() => !notification.isRead && handleMarkRead(notification._id, { stopPropagation: () => {} })}
            >
              <div
                className="notification-indicator"
                style={{ backgroundColor: getCategoryColor(notification.category) }}
              />
              <div className="notification-content">
                <div className="notification-header">
                  <div className="notification-title-row">
                    {getCategoryIcon(notification.category)}
                    <h4 className="notification-title">{notification.title}</h4>
                    {!notification.isRead && (
                      <button
                        className="mark-read-btn"
                        onClick={(e) => handleMarkRead(notification._id, e)}
                        title="Mark as read"
                      >
                        <XCircle size={14} />
                      </button>
                    )}
                  </div>
                  <span className="notification-time">
                    {formatTime(notification.createdAt)}
                  </span>
                </div>
                <p className="notification-message">{notification.message}</p>
                {notification.metadata && (
                  <div className="notification-metadata">
                    {notification.metadata.approvalStatus && (
                      <span
                        className={`status-badge ${notification.metadata.approvalStatus}`}
                      >
                        {notification.metadata.approvalStatus === 'approved'
                          ? '✓ Approved'
                          : '✗ Rejected'}
                      </span>
                    )}
                    {notification.metadata.leaveType && (
                      <span className="leave-type-badge">
                        {notification.metadata.leaveType}
                      </span>
                    )}
                    {notification.targetGroup && notification.targetGroup !== 'all' && (
                      <span className="group-badge">
                        {notification.targetGroup.toUpperCase()} Team
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPanel;

