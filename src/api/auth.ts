import { apiClient } from './client';
import { tokenStorage } from './tokenStorage';
import {
  AuthResult,
  AuthSession,
  AuthUser,
  LoginPayload,
  SignUpPayload,
  SignUpResponse,
  UserProfile,
} from './types';

type RawSignUpResponse =
  | AuthSession
  | SignUpResponse
  | (AuthUser & Partial<AuthSession> & Partial<SignUpResponse>);

const isAuthSession = (data: RawSignUpResponse): data is AuthSession => {
  return Boolean(
    'access_token' in data &&
      data.access_token &&
      'refresh_token' in data &&
      data.refresh_token,
  );
};

const isSignUpResponse = (
  data: RawSignUpResponse,
): data is SignUpResponse => {
  return 'user' in data || 'session' in data;
};

const saveSession = async (session: AuthSession | null | undefined) => {
  if (!session?.access_token || !session.refresh_token) {
    return;
  }

  await tokenStorage.setTokens(session.access_token, session.refresh_token);
};

const getProfile = async (userId: string) => {
  const response = await apiClient.get<UserProfile[]>('/rest/v1/profiles', {
    params: {
      id: `eq.${userId}`,
      select: '*',
    },
  });

  return response.data[0] ?? null;
};

const buildAuthResult = async (
  session: AuthSession | null | undefined,
  user: AuthUser | null | undefined,
): Promise<AuthResult> => {
  await saveSession(session);

  const authUser = session?.user ?? user ?? null;
  let profile: UserProfile | null = null;

  if (authUser?.id) {
    try {
      profile = await getProfile(authUser.id);
    } catch {
      profile = null;
    }
  }

  return {
    user: authUser,
    session: session ?? null,
    profile,
  };
};

export const authApi = {
  async login(payload: LoginPayload) {
    const response = await apiClient.post<AuthSession>(
      '/auth/v1/token?grant_type=password',
      {
        email: payload.email,
        password: payload.password,
      },
    );
    return buildAuthResult(response.data, response.data.user);
  },

  async signUp(payload: SignUpPayload) {
    const response = await apiClient.post<RawSignUpResponse>('/auth/v1/signup', {
      email: payload.email,
      password: payload.password,
      data: {
        nickname: payload.nickname,
      },
    });

    const session = isAuthSession(response.data)
      ? response.data
      : isSignUpResponse(response.data)
        ? response.data.session
        : null;
    const user = isAuthSession(response.data)
      ? response.data.user
      : isSignUpResponse(response.data)
        ? response.data.user
        : response.data;

    return buildAuthResult(session, user);
  },

  async logout() {
    try {
      await apiClient.post('/auth/v1/logout');
    } finally {
      await tokenStorage.clearTokens();
    }
  },

  async getStoredTokens() {
    const [accessToken, refreshToken] = await Promise.all([
      tokenStorage.getAccessToken(),
      tokenStorage.getRefreshToken(),
    ]);

    return { accessToken, refreshToken };
  },
};
