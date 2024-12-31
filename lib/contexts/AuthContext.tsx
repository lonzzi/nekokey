import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Misskey from 'misskey-js';
import type { UserDetailed } from 'misskey-js/built/entities';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { initMisskeyClient, misskeyApi } from '../api';

// 将类型定义放在一起，便于管理
interface ServerInfo {
  meta: Misskey.entities.MetaResponse;
  emojis: Misskey.entities.EmojisResponse;
}

interface AuthState {
  user: UserDetailed | null;
  loading: boolean;
  loaded: boolean;
  isAuthenticated: boolean;
  serverInfo: ServerInfo | null;
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
  const [token, setToken] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['user', token],
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
    enabled: !!misskeyApi,
    retry: 1,
  });

  const { data: serverInfo, isLoading: isServerInfoLoading } = useQuery({
    queryKey: ['serverInfo', token],
    queryFn: async () => {
      if (!misskeyApi) return null;

      try {
        const [meta, emojis] = await Promise.all([
          misskeyApi.request('meta', {}),
          misskeyApi.request('emojis', {}),
        ]);
        return { meta, emojis };
      } catch (error) {
        console.error('Failed to fetch server info:', error);
        throw error;
      }
    },
    enabled: !!misskeyApi,
    retry: 1,
  });

  const login = useCallback(async (newToken: string, newServer: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, newToken);
      await AsyncStorage.setItem(STORAGE_KEYS.SERVER, newServer);

      initMisskeyClient(newToken, newServer);
      setToken(newToken);
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

      setToken(null);
      queryClient.clear();
    } catch (error) {
      console.error('Logout failed:', error);
      Alert.alert('Error', 'Failed to clear login information');
    }
  }, [queryClient]);

  const refresh = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
      queryClient.invalidateQueries({ queryKey: ['user', token] });
      queryClient.invalidateQueries({ queryKey: ['serverInfo', token] });
    } catch (error) {
      console.error('Refresh failed:', error);
      Alert.alert('Error', 'Failed to update user information');
    }
  }, [queryClient, token]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const [savedToken, savedServer] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
          AsyncStorage.getItem(STORAGE_KEYS.SERVER),
        ]);

        if (savedToken && savedServer) {
          initMisskeyClient(savedToken, savedServer);
          setToken(savedToken);
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
    loaded: !!token,
    isAuthenticated: !!user,
    serverInfo: serverInfo ?? null,
    login,
    logout,
    refresh,
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
