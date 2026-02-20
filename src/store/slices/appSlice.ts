import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AppState {
  isFirstLaunch: boolean;
}

const initialState: AppState = {
  isFirstLaunch: true,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setFirstLaunch: (state, action: PayloadAction<boolean>) => {
      state.isFirstLaunch = action.payload;
    },
  },
});

export const { setFirstLaunch } = appSlice.actions;
export default appSlice.reducer;
