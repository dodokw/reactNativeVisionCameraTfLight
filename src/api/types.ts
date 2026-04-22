export interface AuthUser {
  id: string;
  email?: string;
  aud?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
  user_metadata?: {
    nickname?: string;
    [key: string]: unknown;
  };
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  expires_at?: number;
  token_type: string;
  user: AuthUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignUpPayload extends LoginPayload {
  nickname?: string;
}

export interface SignUpResponse {
  user: AuthUser | null;
  session: AuthSession | null;
}

export interface UserProfile {
  id: string;
  nickname: string;
  height_cm?: number | null;
  weight_kg?: number | null;
  weekly_session_goal?: number | null;
  daily_calorie_goal?: number | null;
  notifications_enabled?: boolean;
  data_sync_enabled?: boolean;
  health_steps_connected?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResult {
  user: AuthUser | null;
  session: AuthSession | null;
  profile: UserProfile | null;
}

export interface AuthErrorResponse {
  error?: string;
  error_description?: string;
  msg?: string;
  message?: string;
}
