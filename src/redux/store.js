import { configureStore, createSlice } from '@reduxjs/toolkit';

const initialState = {
  autoScrollEnabled: false,
  scrollSpeed: 'smooth',
  platform: null
};

const autoScrollSlice = createSlice({
  name: 'autoScroll',
  initialState,
  reducers: {
    setAutoScrollEnabled: (state, action) => {
      state.autoScrollEnabled = action.payload;
    },
    setScrollSpeed: (state, action) => {
      state.scrollSpeed = action.payload;
    },
    setPlatform: (state, action) => {
      state.platform = action.payload;
    }
  }
});

export const { setAutoScrollEnabled, setScrollSpeed, setPlatform } = autoScrollSlice.actions;

const store = configureStore({
  reducer: autoScrollSlice.reducer,
  devTools: process.env.NODE_ENV !== 'production'
});

export default store;
