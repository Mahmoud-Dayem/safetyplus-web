// store/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import favoritesReducer from './favoritesSlice'
import departmentsReducer from './departmentsSlice'

const store = configureStore({
  reducer: {
    auth: authReducer,
    favorites: favoritesReducer,
    departments: departmentsReducer,
  },
});

export default store;
