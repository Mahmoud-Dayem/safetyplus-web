// import { createSlice } from '@reduxjs/toolkit';

// const initialState = {
//   items: [],
// };

// const favoritesSlice = createSlice({
//   name: 'favorites',
//   initialState,
//   reducers: {
//     setFavorites(state, action) {
//       state.items = action.payload;
//     },
//     toggleFavorite(state, action) {
//       const code = action.payload;
//       if (state.items.includes(code)) {
//         state.items = state.items.filter(c => c !== code);
//       } else {
//         state.items.push(code);
//       }
//       localStorage.setItem('favorite_spares', JSON.stringify(state.items));
//     },
//   },
// });

// export const { toggleFavorite, setFavorites } = favoritesSlice.actions;
// export default favoritesSlice.reducer;
