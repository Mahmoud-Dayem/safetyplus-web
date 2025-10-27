import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const STORAGE_KEY = 'safetyplus_departments_cache_v1';
// Default TTL for departments cache (in ms). Adjust as needed.
export const DEPARTMENTS_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

const isTimestampStale = (updatedAt, ttlMs = DEPARTMENTS_TTL_MS) => {
  if (!updatedAt || typeof updatedAt !== 'number') return true;
  return Date.now() - updatedAt > ttlMs;
};

// Hydrate from localStorage only (no network)
export const hydrateDepartmentsFromStorage = createAsyncThunk(
  'departments/hydrateFromStorage',
  async () => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (!cached) return { list: [], updatedAt: null };
      const parsed = JSON.parse(cached);
      // Expect shape: { list: [...], updatedAt: number }
      if (Array.isArray(parsed?.list)) {
        return { list: parsed.list, updatedAt: parsed.updatedAt || null };
      }
      return { list: [], updatedAt: null };
    } catch {
      return { list: [], updatedAt: null };
    }
  }
);

// Optional: fetch from Firestore and cache
export const fetchAndCacheDepartments = createAsyncThunk(
  'departments/fetchAndCache',
  async (_, { rejectWithValue }) => {
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase/firebaseConfig');
      const snap = await getDoc(doc(db, 'departments', 'all_departments'));
      if (!snap.exists()) {
        return { list: [], updatedAt: Date.now() };
      }
      const data = snap.data();
      const list = Object.values(data.departments || {}).sort((a, b) =>
        String(a.dept_name || '').localeCompare(String(b.dept_name || ''))
      );
      const payload = { list, updatedAt: Date.now() };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch {}
      return payload;
    } catch (err) {
      return rejectWithValue(err?.message || 'Failed to fetch departments');
    }
  }
);

// Thunk: Refresh from Firestore only if the cached data is stale based on TTL
export const refreshDepartmentsIfStale = createAsyncThunk(
  'departments/refreshIfStale',
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      const { departments } = getState();
      const { updatedAt } = departments || {};
      if (isTimestampStale(updatedAt)) {
        // Trigger a fetch; unwrap so this async function waits for completion
        await dispatch(fetchAndCacheDepartments()).unwrap();
        return { refreshed: true };
      }
      return { refreshed: false };
    } catch (err) {
      return rejectWithValue(err?.message || 'Failed to refresh departments');
    }
  }
);

const initialState = {
  list: [], // array of department objects
  updatedAt: null,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const departmentsSlice = createSlice({
  name: 'departments',
  initialState,
  reducers: {
    setDepartmentsFromCache(state, action) {
      const { list, updatedAt } = action.payload || {};
      state.list = Array.isArray(list) ? list : [];
      state.updatedAt = updatedAt || null;
      state.status = 'succeeded';
      state.error = null;
    },
    clearDepartments(state) {
      state.list = [];
      state.updatedAt = null;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateDepartmentsFromStorage.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(hydrateDepartmentsFromStorage.fulfilled, (state, action) => {
        state.list = Array.isArray(action.payload.list) ? action.payload.list : [];
        state.updatedAt = action.payload.updatedAt || null;
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(hydrateDepartmentsFromStorage.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error?.message || 'Failed to hydrate';
      })
      .addCase(fetchAndCacheDepartments.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchAndCacheDepartments.fulfilled, (state, action) => {
        state.list = Array.isArray(action.payload.list) ? action.payload.list : [];
        state.updatedAt = action.payload.updatedAt || Date.now();
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(fetchAndCacheDepartments.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error?.message || 'Failed to fetch';
      })
      .addCase(refreshDepartmentsIfStale.pending, (state) => {
        // don't switch to loading to avoid UI flicker; keep current status
        state.error = null;
      })
      .addCase(refreshDepartmentsIfStale.fulfilled, (state) => {
        // no direct state mutation here; fetchAndCacheDepartments handles updates
      })
      .addCase(refreshDepartmentsIfStale.rejected, (state, action) => {
        state.error = action.payload || action.error?.message || 'Failed to refresh';
      });
  },
});

export const { setDepartmentsFromCache, clearDepartments } = departmentsSlice.actions;
export default departmentsSlice.reducer;

// Selectors
export const selectDepartments = (state) => state.departments.list;
export const selectDepartmentsUpdatedAt = (state) => state.departments.updatedAt;
export const selectDepartmentsIsStale = (state, ttl = DEPARTMENTS_TTL_MS) =>
  isTimestampStale(state.departments.updatedAt, ttl);
