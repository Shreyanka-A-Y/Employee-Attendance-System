import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Async thunks
export const register = createAsyncThunk('api/auth/register', async (userData, { rejectWithValue }) => {
  try {
    // use relative path 'auth/register' because baseURL already includes '/api'
    const response = await api.post('auth/register', userData);
    localStorage.setItem('token', response.data.token);
    return response.data;
  } catch (error) {
    // Handle different error formats
    let errorMessage = 'Registration failed';
    if (error.response) {
      // Server responded with error
      errorMessage = error.response.data?.message || error.response.data?.error || 'Registration failed';
    } else if (error.request) {
      // Request made but no response
      errorMessage = 'Unable to connect to server. Please check your connection.';
    } else {
      // Something else happened
      errorMessage = error.message || 'Registration failed';
    }
    console.error('Registration error:', error);
    return rejectWithValue(errorMessage);
  }
});

export const login = createAsyncThunk('api/auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const response = await api.post('auth/login', credentials);
    localStorage.setItem('token', response.data.token);
    return response.data;
  } catch (error) {
    // Handle different error formats
    let errorMessage = 'Login failed';
    if (error.response) {
      // Server responded with error
      errorMessage = error.response.data?.message || error.response.data?.error || 'Login failed';
    } else if (error.request) {
      // Request made but no response
      errorMessage = 'Unable to connect to server. Please check your connection.';
    } else {
      // Something else happened
      errorMessage = error.message || 'Login failed';
    }
    console.error('Login error:', error);
    return rejectWithValue(errorMessage);
  }
});

export const getMe = createAsyncThunk('api/auth/getMe', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('auth/me');
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to get user');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('token'),
    loading: false,
    error: null,
    isAuthenticated: !!localStorage.getItem('token'),
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Me
      .addCase(getMe.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMe.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        // Update token if it exists in response
        if (action.payload.token) {
          state.token = action.payload.token;
          localStorage.setItem('token', action.payload.token);
        }
      })
      .addCase(getMe.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        // Token removal is handled by API interceptor, but ensure it's removed here too
        if (localStorage.getItem('token')) {
          localStorage.removeItem('token');
        }
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;

