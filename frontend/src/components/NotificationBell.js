import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bell } from 'lucide-react';
import {
  fetchUnreadCount,
  fetchNotifications,
} from '../store/slices/notificationSlice';
import NotificationsPanel from './NotificationsPanel';
import './NotificationBell.css';

const NotificationBell = () => {
  const dispatch = useDispatch();
  const { unreadCount, loading } = useSelector((state) => state.notifications);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const panelRef = useRef(null);

  // Fetch unread count on mount and periodically
  useEffect(() => {
    dispatch(fetchUnreadCount());

    // Poll for unread count every 30 seconds
    const interval = setInterval(() => {
      dispatch(fetchUnreadCount());
    }, 30000);

    return () => clearInterval(interval);
  }, [dispatch]);

  // Fetch full notifications when panel opens
  useEffect(() => {
    if (isPanelOpen) {
      dispatch(fetchNotifications({ limit: 50 }));
    }
  }, [isPanelOpen, dispatch]);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        // Check if click is not on the bell icon
        const bellButton = event.target.closest('.notification-bell-button');
        if (!bellButton) {
          setIsPanelOpen(false);
        }
      }
    };

    if (isPanelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isPanelOpen]);

  const togglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  return (
    <div className="notification-bell-container" ref={panelRef}>
      <button
        className="notification-bell-button"
        onClick={togglePanel}
        aria-label="Notifications"
        aria-expanded={isPanelOpen}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isPanelOpen && (
        <NotificationsPanel
          onClose={() => setIsPanelOpen(false)}
          loading={loading}
        />
      )}
    </div>
  );
};

export default NotificationBell;

