import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// ========================
// EMPLOYEE LEAVE ACTIONS
// ========================

export const applyLeave = createAsyncThunk('leave/apply', async (leaveData, { rejectWithValue }) => {
  try {
    const response = await api.post('leave/apply', leaveData);
    return response.data;
  } catch (error) {
    console.error('Apply leave error:', error);
    return rejectWithValue(error.response?.data?.message || 'Failed to apply for leave');
  }
});

export const getMyLeaveRequests = createAsyncThunk('leave/getMyRequests', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('leave/my-requests');
    return response.data;
  } catch (error) {
    console.error('Get my leave requests error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to get leave requests';
    if (error.response?.status === 404) {
      return rejectWithValue('Leave requests endpoint not found. Please restart the backend server.');
    }
    return rejectWithValue(errorMessage);
  }
});

// ========================
// MANAGER LEAVE ACTIONS
// ========================

export const getPendingLeaves = createAsyncThunk('leave/getPending', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('leave/pending');
    return response.data;
  } catch (error) {
    console.error('Get pending leaves error:', error);
    return rejectWithValue(error.response?.data?.message || 'Failed to get pending leave requests');
  }
});

export const getAllLeaves = createAsyncThunk('leave/getAll', async (filters, { rejectWithValue }) => {
  try {
    const params = {};
    if (filters?.status) params.status = filters.status;
    if (filters?.employeeId) params.employeeId = filters.employeeId;
    if (filters?.startDate) params.startDate = filters.startDate;
    if (filters?.endDate) params.endDate = filters.endDate;

    const response = await api.get('leave/all', { params });
    return response.data;
  } catch (error) {
    console.error('Get all leaves error:', error);
    return rejectWithValue(error.response?.data?.message || 'Failed to get leave requests');
  }
});

export const approveLeave = createAsyncThunk('leave/approve', async ({ leaveId, comment }, { rejectWithValue }) => {
  try {
    const response = await api.post(`leave/${leaveId}/approve`, { comment });
    return response.data;
  } catch (error) {
    console.error('Approve leave error:', error);
    return rejectWithValue(error.response?.data?.message || 'Failed to approve leave');
  }
});

export const rejectLeave = createAsyncThunk('leave/reject', async ({ leaveId, comment }, { rejectWithValue }) => {
  try {
    const response = await api.post(`leave/${leaveId}/reject`, { comment });
    return response.data;
  } catch (error) {
    console.error('Reject leave error:', error);
    return rejectWithValue(error.response?.data?.message || 'Failed to reject leave');
  }
});

export const getLeaveStats = createAsyncThunk('leave/getStats', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('leave/stats');
    return response.data;
  } catch (error) {
    console.error('Get leave stats error:', error);
    return rejectWithValue(error.response?.data?.message || 'Failed to get leave statistics');
  }
});

// =============================
// SLICE
// =============================

const leaveSlice = createSlice({
  name: 'leave',
  initialState: {
    myLeaves: [],
    pendingLeaves: [],
    allLeaves: [],
    stats: null,
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
      // Apply Leave
      .addCase(applyLeave.fulfilled, (state, action) => {
        state.error = null;
      })
      // Get My Leave Requests
      .addCase(getMyLeaveRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMyLeaveRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.myLeaves = action.payload.leaves || [];
        state.error = null;
      })
      .addCase(getMyLeaveRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Pending Leaves
      .addCase(getPendingLeaves.fulfilled, (state, action) => {
        state.pendingLeaves = action.payload.leaves || [];
        state.error = null;
      })
      // Get All Leaves
      .addCase(getAllLeaves.fulfilled, (state, action) => {
        state.allLeaves = action.payload.leaves || [];
        state.error = null;
      })
      // Approve Leave
      .addCase(approveLeave.fulfilled, (state, action) => {
        // Update the leave in pendingLeaves and allLeaves
        const leaveId = action.payload.leave.id;
        state.pendingLeaves = state.pendingLeaves.filter(leave => leave._id !== leaveId);
        state.allLeaves = state.allLeaves.map(leave =>
          leave._id === leaveId ? { ...leave, ...action.payload.leave } : leave
        );
        state.error = null;
      })
      // Reject Leave
      .addCase(rejectLeave.fulfilled, (state, action) => {
        // Update the leave in pendingLeaves and allLeaves
        const leaveId = action.payload.leave.id;
        state.pendingLeaves = state.pendingLeaves.filter(leave => leave._id !== leaveId);
        state.allLeaves = state.allLeaves.map(leave =>
          leave._id === leaveId ? { ...leave, ...action.payload.leave } : leave
        );
        state.error = null;
      })
      // Get Leave Stats
      .addCase(getLeaveStats.fulfilled, (state, action) => {
        state.stats = action.payload;
        state.error = null;
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

export const { clearError } = leaveSlice.actions;
export default leaveSlice.reducer;

