import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_STORAGE_KEYS } from './config';

export const tokenStorage = {
  async getAccessToken() {
    return AsyncStorage.getItem(AUTH_STORAGE_KEYS.accessToken);
  },

  async getRefreshToken() {
    return AsyncStorage.getItem(AUTH_STORAGE_KEYS.refreshToken);
  },

  async setTokens(accessToken: string, refreshToken: string) {
    await AsyncStorage.multiSet([
      [AUTH_STORAGE_KEYS.accessToken, accessToken],
      [AUTH_STORAGE_KEYS.refreshToken, refreshToken],
    ]);
  },

  async clearTokens() {
    await AsyncStorage.multiRemove([
      AUTH_STORAGE_KEYS.accessToken,
      AUTH_STORAGE_KEYS.refreshToken,
    ]);
  },
};
