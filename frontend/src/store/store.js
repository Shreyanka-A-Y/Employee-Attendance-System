import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import attendanceReducer from './slices/attendanceSlice';
import dashboardReducer from './slices/dashboardSlice';
import leaveReducer from './slices/leaveSlice';
import calendarReducer from './slices/calendarSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    attendance: attendanceReducer,
    dashboard: dashboardReducer,
    leave: leaveReducer,
    calendar: calendarReducer,
  },
});

