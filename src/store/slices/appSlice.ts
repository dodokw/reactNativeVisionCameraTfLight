import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AppState {
  isFirstLaunch: boolean;
  isRppgEnabled: boolean;
}

const initialState: AppState = {
  isFirstLaunch: true,
  isRppgEnabled: true,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setFirstLaunch: (state, action: PayloadAction<boolean>) => {
      state.isFirstLaunch = action.payload;
    },
    setRppgEnabled: (state, action: PayloadAction<boolean>) => {
      state.isRppgEnabled = action.payload;
    },
  },
});

export const { setFirstLaunch, setRppgEnabled } = appSlice.actions;
export default appSlice.reducer;
