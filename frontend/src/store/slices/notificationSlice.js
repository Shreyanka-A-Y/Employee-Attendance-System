import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// ========================
// NOTIFICATION ACTIONS
// ========================

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async ({ category, unreadOnly, limit } = {}, { rejectWithValue }) => {
    try {
      const params = {};
      if (category) params.category = category;
      if (unreadOnly) params.unreadOnly = unreadOnly;
      if (limit) params.limit = limit;

      const response = await api.get('notifications', { params });
      return response.data;
    } catch (error) {
      console.error('Fetch notifications error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('notifications/unread-count');
      return response.data;
    } catch (error) {
      console.error('Fetch unread count error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch unread count');
    }
  }
);

export const markNotificationRead = createAsyncThunk(
  'notifications/markRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await api.put(`notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Mark notification read error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to mark notification as read');
    }
  }
);

export const markAllRead = createAsyncThunk(
  'notifications/markAllRead',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.put('notifications/read-all');
      return response.data;
    } catch (error) {
      console.error('Mark all read error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to mark all as read');
    }
  }
);

export const broadcastNotice = createAsyncThunk(
  'notifications/broadcast',
  async ({ message, targetGroup, title }, { rejectWithValue }) => {
    try {
      const response = await api.post('notifications/broadcast', {
        message,
        targetGroup,
        title,
      });
      return response.data;
    } catch (error) {
      console.error('Broadcast notice error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to broadcast notice');
    }
  }
);

// =============================
// SLICE
// =============================

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    notifications: [],
    grouped: {
      leave: [],
      approval: [],
      notice: [],
      alert: [],
      system: [],
      all: [],
    },
    unreadCount: 0,
    loading: false,
    error: null,
    lastFetched: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    incrementUnreadCount: (state) => {
      state.unreadCount += 1;
    },
    decrementUnreadCount: (state) => {
      if (state.unreadCount > 0) {
        state.unreadCount -= 1;
      }
    },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      state.grouped.all.unshift(action.payload);
      if (action.payload.category && state.grouped[action.payload.category]) {
        state.grouped[action.payload.category].unshift(action.payload);
      }
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.notifications || [];
        state.grouped = action.payload.grouped || state.grouped;
        state.unreadCount = action.payload.unreadCount || 0;
        state.lastFetched = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Unread Count
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload.unreadCount || 0;
      })
      // Mark Notification Read
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const notification = action.payload.notification;
        const index = state.notifications.findIndex((n) => n._id === notification._id);
        if (index !== -1 && !state.notifications[index].isRead) {
          state.notifications[index].isRead = true;
          state.notifications[index].readAt = notification.readAt;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }

        // Update in grouped
        Object.keys(state.grouped).forEach((category) => {
          const groupedIndex = state.grouped[category].findIndex((n) => n._id === notification._id);
          if (groupedIndex !== -1 && !state.grouped[category][groupedIndex].isRead) {
            state.grouped[category][groupedIndex].isRead = true;
            state.grouped[category][groupedIndex].readAt = notification.readAt;
          }
        });
      })
      // Mark All Read
      .addCase(markAllRead.fulfilled, (state) => {
        state.notifications = state.notifications.map((n) => ({
          ...n,
          isRead: true,
          readAt: new Date().toISOString(),
        }));
        Object.keys(state.grouped).forEach((category) => {
          state.grouped[category] = state.grouped[category].map((n) => ({
            ...n,
            isRead: true,
            readAt: new Date().toISOString(),
          }));
        });
        state.unreadCount = 0;
      })
      // Broadcast Notice
      .addCase(broadcastNotice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(broadcastNotice.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(broadcastNotice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, incrementUnreadCount, decrementUnreadCount, addNotification } =
  notificationSlice.actions;
export default notificationSlice.reducer;

