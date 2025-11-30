import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const getEmployeeDashboard = createAsyncThunk('dashboard/employee', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('dashboard/employee');
    return response.data;
  } catch (error) {
    console.error('Dashboard error:', error);
    return rejectWithValue(error.response?.data?.message || 'Failed to get dashboard');
  }
});

export const getManagerDashboard = createAsyncThunk('dashboard/manager', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('dashboard/manager');
    return response.data;
  } catch (error) {
    console.error('Dashboard error:', error);
    return rejectWithValue(error.response?.data?.message || 'Failed to get dashboard');
  }
});

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    employeeData: null,
    managerData: null,
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
      .addCase(getEmployeeDashboard.fulfilled, (state, action) => {
        state.employeeData = action.payload;
      })
      .addCase(getManagerDashboard.fulfilled, (state, action) => {
        state.managerData = action.payload;
      })
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

export const { clearError } = dashboardSlice.actions;
export default dashboardSlice.reducer;

