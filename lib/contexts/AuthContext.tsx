import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Misskey from 'misskey-js';
import type { UserDetailed } from 'misskey-js/built/entities';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { initMisskeyClient, misskeyApi } from '../api';

type AuthContextType = {
  user: UserDetailed | null;
  /**
   * Check if the user data is fetching
   */
  loading: boolean;
  /**
   * Check if the storage is loaded
   */
  loaded: boolean;
  isAuthenticated: boolean;
  refresh: () => void;
  setToken: (token: string) => void;
  serverInfo: ServerInfo | null;
};

type ServerInfo = {
  meta: Misskey.entities.MetaResponse;
  emojis: Misskey.entities.EmojisResponse;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [misskeyApiLoaded, setMisskeyApiLoaded] = useState(false);
  const queryClient = useQueryClient();

  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['user', token],
    queryFn: async () => {
      if (!misskeyApi) return null;

      try {
        const cachedUserData = await AsyncStorage.getItem('userData');
        let userData;

        if (!cachedUserData) {
          userData = await misskeyApi.request('i', {});
          await AsyncStorage.setItem('userData', JSON.stringify(userData));
        } else {
          userData = JSON.parse(cachedUserData);
        }

        const userDetail = await misskeyApi.request('users/show', {
          userId: userData.id,
        });
        await AsyncStorage.setItem('user', JSON.stringify(userDetail));
        return userDetail;
      } catch (error) {
        console.error('API request failed:', error);
        Alert.alert(
          'Error',
          `Failed to fetch user information: ${error instanceof Error ? error.message : String(error)}`,
        );
        return null;
      }
    },
    enabled: !!misskeyApi,
  });

  const { data: serverInfoData, isLoading: isServerInfoLoading } = useQuery({
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
        console.error('Server info request failed:', error);
        return null;
      }
    },
    enabled: !!misskeyApi,
  });

  useEffect(() => {
    const fetchToken = async () => {
      const user = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('token');
      const server = await AsyncStorage.getItem('server');
      if (user && token && server) {
        initMisskeyClient(token, server);
        setMisskeyApiLoaded(true);
      }
      setToken(token);
    };
    fetchToken();
  }, [misskeyApiLoaded]);

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        loading: isUserLoading || isServerInfoLoading,
        loaded: !!token,
        isAuthenticated: !!user,
        refresh: () => {
          AsyncStorage.removeItem('userData').then(() => {
            queryClient.invalidateQueries({ queryKey: ['user', token] });
            queryClient.invalidateQueries({ queryKey: ['serverInfo', token] });
          });
        },
        setToken,
        serverInfo: serverInfoData ?? null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
