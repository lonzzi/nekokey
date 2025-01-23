import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Misskey from 'misskey-js';
import type { UserDetailed } from 'misskey-js/built/entities';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { initMisskeyClient } from '../api';

export interface ServerInfo {
  meta: Misskey.entities.MetaResponse;
  emojis: Misskey.entities.EmojisResponse['emojis'];
}

interface AuthState {
  user: UserDetailed | null;
  loading: boolean;
  loaded: boolean;
  isAuthenticated: boolean;
  serverInfo: ServerInfo | null;
  misskeyApi: Misskey.api.APIClient | null;
}

interface AuthActions {
  login: (token: string, server: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

type AuthContextType = AuthState & AuthActions;

const STORAGE_KEYS = {
  TOKEN: 'token',
  SERVER: 'server',
  USER: 'user',
  USER_DATA: 'userData',
} as const;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [misskeyApi, setMisskeyApi] = useState<Misskey.api.APIClient | null>(null);
  const queryClient = useQueryClient();

  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['user', misskeyApi],
    queryFn: async () => {
      if (!misskeyApi) return null;

      try {
        const userData = await misskeyApi.request('i', {});
        const userDetail = await misskeyApi.request('users/show', {
          userId: userData.id,
        });

        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userDetail));

        return userDetail;
      } catch (error) {
        console.error('Failed to fetch user:', error);
        throw error;
      }
    },
    retry: 1,
  });

  const { data: serverInfo, isLoading: isServerInfoLoading } = useQuery({
    queryKey: ['serverInfo', misskeyApi],
    queryFn: async () => {
      if (!misskeyApi) return null;

      try {
        const [meta, emojis] = await Promise.all([
          misskeyApi.request('meta', {}),
          misskeyApi.request('emojis', {}),
        ]);
        return { meta, emojis: emojis.emojis };
      } catch (error) {
        console.error('Failed to fetch server info:', error);
        throw error;
      }
    },
    retry: 1,
  });

  const login = useCallback(async (newToken: string, newServer: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, newToken);
      await AsyncStorage.setItem(STORAGE_KEYS.SERVER, newServer);

      const { misskeyApi } = initMisskeyClient(newToken, newServer);
      setMisskeyApi(misskeyApi);
    } catch (error) {
      console.error('Login failed:', error);
      Alert.alert('Error', 'Failed to save login information');
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.SERVER),
        AsyncStorage.removeItem(STORAGE_KEYS.USER),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
      ]);

      setMisskeyApi(null);
      queryClient.clear();
    } catch (error) {
      console.error('Logout failed:', error);
      Alert.alert('Error', 'Failed to clear login information');
    }
  }, [queryClient]);

  const refresh = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
      queryClient.invalidateQueries({ queryKey: ['user', misskeyApi] });
      queryClient.invalidateQueries({ queryKey: ['serverInfo', misskeyApi] });
    } catch (error) {
      console.error('Refresh failed:', error);
      Alert.alert('Error', 'Failed to update user information');
    }
  }, [queryClient, misskeyApi]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const [savedToken, savedServer] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
          AsyncStorage.getItem(STORAGE_KEYS.SERVER),
        ]);

        if (savedToken && savedServer) {
          const { misskeyApi } = initMisskeyClient(savedToken, savedServer);
          setMisskeyApi(misskeyApi);
        }
      } catch (error) {
        console.error('Init auth failed:', error);
      }
    };

    initAuth();
  }, []);

  const contextValue: AuthContextType = {
    user: user ?? null,
    loading: isUserLoading || isServerInfoLoading,
    loaded: !!misskeyApi,
    isAuthenticated: !!user,
    serverInfo: serverInfo ?? null,
    login,
    logout,
    refresh,
    misskeyApi,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
