import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// ========================
// CALENDAR ACTIONS
// ========================

export const getCalendarMonth = createAsyncThunk(
  'calendar/getMonth',
  async ({ year, month }, { rejectWithValue }) => {
    try {
      const response = await api.get('calendar/month', {
        params: { year, month },
      });
      return response.data;
    } catch (error) {
      console.error('Get calendar month error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to get calendar data');
    }
  }
);

export const getCalendarMonthAll = createAsyncThunk(
  'calendar/getMonthAll',
  async ({ year, month, userId }, { rejectWithValue }) => {
    try {
      const params = { year, month };
      if (userId) params.userId = userId;
      
      const response = await api.get('calendar/month/all', { params });
      return response.data;
    } catch (error) {
      console.error('Get calendar month all error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to get calendar data');
    }
  }
);

// =============================
// SLICE
// =============================

const calendarSlice = createSlice({
  name: 'calendar',
  initialState: {
    monthData: [],
    monthDataAll: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearMonthData: (state) => {
      state.monthData = [];
      state.monthDataAll = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCalendarMonth.fulfilled, (state, action) => {
        state.monthData = action.payload;
        state.error = null;
      })
      .addCase(getCalendarMonthAll.fulfilled, (state, action) => {
        state.monthDataAll = action.payload;
        state.error = null;
      })
      .addCase(getCalendarMonth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCalendarMonth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getCalendarMonthAll.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCalendarMonthAll.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearMonthData } = calendarSlice.actions;
export default calendarSlice.reducer;

