import axios, {
  AxiosError,
  AxiosHeaders,
  InternalAxiosRequestConfig,
} from 'axios';
import { API_URL, SUPABASE_ANON_KEY } from './config';
import { tokenStorage } from './tokenStorage';
import { AuthErrorResponse, AuthSession } from './types';

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let refreshPromise: Promise<string | null> | null = null;

const attachDefaultHeaders = (config: InternalAxiosRequestConfig) => {
  const headers = AxiosHeaders.from(config.headers);

  if (SUPABASE_ANON_KEY) {
    headers.set('apikey', SUPABASE_ANON_KEY);
  }

  config.headers = headers;
};

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const refreshAccessToken = async () => {
  const refreshToken = await tokenStorage.getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  const response = await axios.post<AuthSession>(
    `${API_URL}/auth/v1/token?grant_type=refresh_token`,
    { refresh_token: refreshToken },
    {
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
      },
    },
  );

  await tokenStorage.setTokens(
    response.data.access_token,
    response.data.refresh_token,
  );

  return response.data.access_token;
};

apiClient.interceptors.request.use(async config => {
  attachDefaultHeaders(config);

  const accessToken = await tokenStorage.getAccessToken();

  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }

  return config;
});

apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError<AuthErrorResponse>) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/v1/token')
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      refreshPromise = refreshPromise ?? refreshAccessToken();
      const accessToken = await refreshPromise;
      refreshPromise = null;

      if (!accessToken) {
        await tokenStorage.clearTokens();
        return Promise.reject(error);
      }

      attachDefaultHeaders(originalRequest);
      originalRequest.headers.set('Authorization', `Bearer ${accessToken}`);

      return apiClient(originalRequest);
    } catch (refreshError) {
      refreshPromise = null;
      await tokenStorage.clearTokens();
      return Promise.reject(refreshError);
    }
  },
);

export const getApiErrorMessage = (error: unknown) => {
  if (axios.isAxiosError<AuthErrorResponse>(error)) {
    return (
      error.response?.data?.error_description ||
      error.response?.data?.message ||
      error.response?.data?.msg ||
      error.message
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return '요청 처리 중 문제가 발생했습니다.';
};
