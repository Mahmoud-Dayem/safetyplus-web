import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null, // will hold minimal serializable info
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action) => {
      const firebaseUser = action.payload;

      // Only keep serializable fields
      state.user = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        emailVerified: firebaseUser.emailVerified,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        token: firebaseUser.token,
        companyId: firebaseUser.companyId,
        isAdmin: firebaseUser.isAdmin,
        isPrivileged: firebaseUser.isPrivileged,
        // Employee-specific fields from employees_collection
        department: firebaseUser.department || null,
        fullName: firebaseUser.fullName || null,
        jobTitle: firebaseUser.jobTitle || null,
      };
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
    setAuthenticated: (state, action) => {
    state.isAuthenticated = action.payload;
    },
    saveUser: (state, action) => {
      state.user = action.payload;
    },
    updateUserProfile: (state, action) => {
      // Update specific employee fields fetched from employees_collection
      if (state.user) {
        state.user = {
          ...state.user,
          department: action.payload.department || state.user.department,
          fullName: action.payload.fullName || state.user.fullName,
          jobTitle: action.payload.jobTitle || state.user.jobTitle,
        };
      }
    }
  }});

export const { login, logout, setAuthenticated, saveUser, updateUserProfile } = authSlice.actions;
export default authSlice.reducer;
