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

export const getEmployeeCalendar = createAsyncThunk(
  'calendar/getEmployeeCalendar',
  async ({ userId, year, month, date }, { rejectWithValue }) => {
    try {
      // Validate inputs
      if (!userId) {
        throw new Error('User ID is required');
      }
      if (!year || !month) {
        throw new Error('Year and month are required');
      }

      const params = { year, month };
      if (date) params.date = date;
      
      const url = `calendar/employee/${userId}`;
      
      console.log('📅 Fetching employee calendar:', {
        url,
        params,
        userId,
        fullUrl: `${api.defaults.baseURL}/${url}?year=${year}&month=${month}`
      });

      const response = await api.get(url, { params });
      
      console.log('✅ Employee calendar response:', {
        status: response.status,
        hasEmployee: !!response.data?.employee,
        calendarDataLength: response.data?.calendarData?.length || 0
      });

      return response.data;
    } catch (error) {
      console.error('❌ Get employee calendar error:', {
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        } : null,
        config: error.config ? {
          url: error.config.url,
          baseURL: error.config.baseURL,
          params: error.config.params
        } : null,
        userId,
        year,
        month
      });

      let errorMessage = 'Failed to get employee calendar';
      
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = `Endpoint not found. Please verify the backend server is running and the route exists.`;
        } else if (error.response.status === 401) {
          errorMessage = 'Authentication required. Please log in again.';
        } else if (error.response.status === 403) {
          errorMessage = 'Access denied. Manager role required.';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check if the backend server is running.';
      }

      return rejectWithValue(errorMessage);
    }
  }
);

export const getEmployeeSummary = createAsyncThunk(
  'calendar/getEmployeeSummary',
  async ({ userId, year, month }, { rejectWithValue }) => {
    try {
      // Validate inputs
      if (!userId) {
        throw new Error('User ID is required');
      }
      if (!year || !month) {
        throw new Error('Year and month are required');
      }

      const params = { year, month };
      const url = `calendar/employee/${userId}/summary`;
      
      console.log('📊 Fetching employee summary:', {
        url,
        params,
        userId,
        fullUrl: `${api.defaults.baseURL}/${url}?year=${year}&month=${month}`
      });

      const response = await api.get(url, { params });
      
      console.log('✅ Employee summary response:', {
        status: response.status,
        dataKeys: Object.keys(response.data || {}),
        hasStatistics: !!response.data?.statistics
      });

      return response.data;
    } catch (error) {
      console.error('❌ Get employee summary error:', {
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        } : null,
        config: error.config ? {
          method: error.config.method,
          url: error.config.url,
          baseURL: error.config.baseURL,
          fullURL: `${error.config.baseURL}/${error.config.url}`,
          params: error.config.params
        } : null,
        userId,
        year,
        month
      });

      // Provide detailed error message
      let errorMessage = 'Failed to get employee summary';
      
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = `Endpoint not found. Please verify the backend server is running and the route exists.`;
        } else if (error.response.status === 401) {
          errorMessage = 'Authentication required. Please log in again.';
        } else if (error.response.status === 403) {
          errorMessage = 'Access denied. Manager role required.';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else {
          errorMessage = `Server error (${error.response.status}): ${error.response.statusText}`;
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check if the backend server is running on port 5000.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return rejectWithValue(errorMessage);
    }
  }
);

export const getAllEmployees = createAsyncThunk(
  'calendar/getAllEmployees',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('users/all');
      return response.data;
    } catch (error) {
      console.error('Get all employees error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to get employees');
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
    employeeCalendar: null,
    employeeSummary: null,
    employees: [],
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
      })
      .addCase(getEmployeeCalendar.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getEmployeeCalendar.fulfilled, (state, action) => {
        state.loading = false;
        state.employeeCalendar = action.payload;
        state.error = null;
      })
      .addCase(getEmployeeCalendar.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getEmployeeSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getEmployeeSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.employeeSummary = action.payload;
        state.error = null;
      })
      .addCase(getEmployeeSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getAllEmployees.fulfilled, (state, action) => {
        state.employees = action.payload.users || [];
        state.error = null;
      })
      .addCase(getAllEmployees.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearError, clearMonthData } = calendarSlice.actions;
export default calendarSlice.reducer;

