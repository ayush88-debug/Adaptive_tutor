import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

const initialState = {
  user: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  verificationToken: null,
};

export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, thunkAPI) => {
  try {
    const { data } = await api.get('/user/get-user');
    return data?.data?.user || null;
  } catch (err) {
    return thunkAPI.rejectWithValue('Failed to fetch user');
  }
});

export const signup = createAsyncThunk('auth/signup', async ({ username, email, password }, thunkAPI) => {
  try {
    const { data } = await api.post('/auth/signup', { username, email, password });
    return data?.data?.verificationToken;
  } catch (err) {
    return thunkAPI.rejectWithValue('Signup failed');
  }
});

export const login = createAsyncThunk('auth/login', async ({ email, password }, thunkAPI) => {
  try {
    const { data } = await api.post('/auth/login', { email, password });
    if (data?.data?.verificationToken) {
      return { needsVerification: true, verificationToken: data.data.verificationToken };
    } else {
      // If user data is present in login response, return it
      if (data?.data?.user) {
        return { needsVerification: false, user: data.data.user };
      }
      // Otherwise, fetch user from /user/get-user
      const user = await thunkAPI.dispatch(fetchMe()).unwrap();
      return { needsVerification: false, user };
    }
  } catch (err) {
    return thunkAPI.rejectWithValue('Login failed');
  }
});

export const verifyEmail = createAsyncThunk('auth/verifyEmail', async (code, thunkAPI) => {
  const state = thunkAPI.getState().auth;
  const token = state.verificationToken;
  console.log("[verifyEmail] Token to send:", token);
  if (!token) return thunkAPI.rejectWithValue('No verification token found. Please signup/login again.');
  try {
    const response = await api.post('/auth/verify-email', { code }, { headers: { Authorization: `Bearer ${token}` } });
    console.log("[verifyEmail] Backend response:", response);
    await thunkAPI.dispatch(fetchMe());
    return null;
  } catch (err) {
    console.error("[verifyEmail] Error:", err);
    return thunkAPI.rejectWithValue('Email verification failed');
  }
});

export const logout = createAsyncThunk('auth/logout', async (_, thunkAPI) => {
  try {
    await api.post('/auth/logout');
    return null;
  } catch (err) {
    return thunkAPI.rejectWithValue('Logout failed');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = !!action.payload;
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = action.payload;
      })
      .addCase(signup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.loading = false;
        state.verificationToken = action.payload;
      })
      .addCase(signup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.needsVerification) {
          state.verificationToken = action.payload.verificationToken;
        } else {
          state.user = action.payload.user || null;
          state.isAuthenticated = !!action.payload.user;
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(verifyEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state) => {
        state.loading = false;
        state.verificationToken = null;
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.verificationToken = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export default authSlice.reducer;
