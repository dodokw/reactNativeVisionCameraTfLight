import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthSession, AuthUser, UserProfile } from '../../api/types';

interface UserState {
  user: AuthUser | null;
  profile: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

const initialState: UserState = {
  user: null,
  profile: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
};

type SetSessionPayload = {
  session: AuthSession;
  profile?: UserProfile | null;
};

const getNickname = (user: AuthUser | null, profile: UserProfile | null) => {
  return profile?.nickname || user?.user_metadata?.nickname || null;
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setAuthSession: (state, action: PayloadAction<SetSessionPayload>) => {
      const { session, profile = null } = action.payload;

      state.user = {
        ...session.user,
        user_metadata: {
          ...session.user.user_metadata,
          nickname: getNickname(session.user, profile) ?? undefined,
        },
      };
      state.profile = profile;
      state.accessToken = session.access_token;
      state.refreshToken = session.refresh_token;
      state.isAuthenticated = true;
    },
    updateUserProfile: (state, action: PayloadAction<UserProfile | null>) => {
      state.profile = action.payload;

      if (state.user && action.payload?.nickname) {
        state.user.user_metadata = {
          ...state.user.user_metadata,
          nickname: action.payload.nickname,
        };
      }
    },
    clearUser: () => initialState,
  },
});

export const { clearUser, setAuthSession, updateUserProfile } =
  userSlice.actions;
export default userSlice.reducer;
