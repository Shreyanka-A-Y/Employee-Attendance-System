import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// ========================
// EMPLOYEE ATTENDANCE
// ========================

export const checkIn = createAsyncThunk('attendance/checkIn', async (_, { rejectWithValue }) => {
  try {
    const response = await api.post('/attendance/checkin');
    return response.data;
  } catch (error) {
    console.error('Check-in error:', error);
    return rejectWithValue(error.response?.data?.message || 'Check-in failed');
  }
});

export const checkOut = createAsyncThunk('attendance/checkOut', async (_, { rejectWithValue }) => {
  try {
    const response = await api.post('/attendance/checkout');
    return response.data;
  } catch (error) {
    console.error('Check-out error:', error);
    return rejectWithValue(error.response?.data?.message || 'Check-out failed');
  }
});

export const getTodayStatus = createAsyncThunk('attendance/getTodayStatus', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/attendance/today');
    return response.data;
  } catch (error) {
    console.error('Get today status error:', error);
    return rejectWithValue(error.response?.data?.message || 'Failed to get today status');
  }
});

export const getMyHistory = createAsyncThunk('attendance/getMyHistory', async (params, { rejectWithValue }) => {
  try {
    const response = await api.get('/attendance/my-history', { params });
    return response.data;
  } catch (error) {
    console.error('Get history error:', error);
    return rejectWithValue(error.response?.data?.message || 'Failed to get history');
  }
});

export const getMySummary = createAsyncThunk('attendance/getMySummary', async (params, { rejectWithValue }) => {
  try {
    const response = await api.get('/attendance/my-summary', { params });
    return response.data;
  } catch (error) {
    console.error('Get summary error:', error);
    return rejectWithValue(error.response?.data?.message || 'Failed to get summary');
  }
});

// ========================
// MANAGER ATTENDANCE
// ========================

export const getAllAttendance = createAsyncThunk('attendance/getAllAttendance', async (params, { rejectWithValue }) => {
  try {
    const response = await api.get('/attendance/all', { params });
    return response.data;
  } catch (error) {
    console.error('Get all attendance error:', error);
    return rejectWithValue(error.response?.data?.message || 'Failed to get attendance');
  }
});

export const getTeamSummary = createAsyncThunk('attendance/getTeamSummary', async (params, { rejectWithValue }) => {
  try {
    const response = await api.get('/attendance/summary', { params });
    return response.data;
  } catch (error) {
    console.error('Get team summary error:', error);
    return rejectWithValue(error.response?.data?.message || 'Failed to get team summary');
  }
});

export const getTodayStatusAll = createAsyncThunk('attendance/getTodayStatusAll', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/attendance/today-status');
    return response.data;
  } catch (error) {
    console.error('Get today status all error:', error);
    return rejectWithValue(error.response?.data?.message || 'Failed to get today status');
  }
});

export const exportAttendance = createAsyncThunk('attendance/export', async (params, { rejectWithValue }) => {
  try {
    const response = await api.get('/attendance/export', { params, responseType: 'blob' });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `attendance-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    return { success: true };
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Export failed');
  }
});

export const getDepartments = createAsyncThunk('users/getDepartments', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/users/departments');
    return response.data;
  } catch (error) {
    console.error('Get departments error:', error);
    return rejectWithValue(error.response?.data?.message || 'Failed to get departments');
  }
});

// =============================
// SLICE
// =============================

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState: {
    todayStatus: null,
    history: [],
    summary: null,
    allAttendance: [],
    teamSummary: null,
    todayStatusAll: null,
    departments: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkIn.fulfilled, (state, action) => {
        state.todayStatus = action.payload.attendance;
      })
      .addCase(checkOut.fulfilled, (state, action) => {
        state.todayStatus = action.payload.attendance;
      })
      .addCase(getTodayStatus.fulfilled, (state, action) => {
        state.todayStatus = action.payload.attendance;
      })
      .addCase(getMyHistory.fulfilled, (state, action) => {
        state.history = action.payload.attendance || [];
      })
      .addCase(getMySummary.fulfilled, (state, action) => {
        state.summary = action.payload;
      })
      .addCase(getAllAttendance.fulfilled, (state, action) => {
        state.allAttendance = action.payload.attendance;
      })
      .addCase(getTeamSummary.fulfilled, (state, action) => {
        state.teamSummary = action.payload;
      })
      .addCase(getTodayStatusAll.fulfilled, (state, action) => {
        state.todayStatusAll = action.payload;
      })
      .addCase(getDepartments.fulfilled, (state, action) => {
        state.departments = action.payload.departments || [];
      })
      // Global loading and errors
      .addMatcher(
        (action) => action.type.endsWith('/pending'),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type.endsWith('/rejected'),
        (state, action) => {
          state.loading = false;
          state.error = action.payload;
        }
      )
      .addMatcher(
        (action) => action.type.endsWith('/fulfilled'),
        (state) => {
          state.loading = false;
        }
      );
  },
});

export const { clearError } = attendanceSlice.actions;
export default attendanceSlice.reducer;
