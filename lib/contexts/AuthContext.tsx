import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { User } from 'misskey-js/built/entities';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { useMisskeyApi } from './MisskeyApiContext';

interface AuthContextType {
  user: User | null;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { api } = useMisskeyApi();
  const [token, setToken] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', token],
    queryFn: async () => {
      if (!api) {
        return null;
      }

      try {
        return await api.request('i', {});
      } catch (error) {
        console.error('API request failed:', error);
        Alert.alert(
          'Error',
          `Failed to fetch user information: ${error instanceof Error ? error.message : String(error)}`,
        );
        return null;
      }
    },
    enabled: !!api,
  });

  useEffect(() => {
    const fetchToken = async () => {
      const token = await AsyncStorage.getItem('token');
      setToken(token);
    };
    fetchToken();
  }, [api]);

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        loading: isLoading,
        loaded: !!token,
        isAuthenticated: !!user,
        refresh: () => {
          queryClient.invalidateQueries({ queryKey: ['user', token] });
        },
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
