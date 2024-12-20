import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as NavigationBar from 'expo-navigation-bar';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import 'react-native-reanimated';

import { MainScrollProvider } from '@/components/MainScrollProvider';
import { useColorScheme } from '@/hooks/useColorScheme';
import { initMisskeyClient } from '@/lib/api';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import { ShellModeProvider } from '@/lib/contexts/ShellMode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { persistQueryClient } from '@tanstack/query-persist-client-core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Platform } from 'react-native';

import '../global.css';
import '../i18n/config';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24小时
      staleTime: 1000 * 60 * 5, // 5分钟
      refetchOnWindowFocus: false,
      structuralSharing: false,
      retry: false,
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'MISSKEY_QUERY_CACHE',
});

persistQueryClient({
  queryClient,
  persister: asyncStoragePersister,
  maxAge: 1000 * 60 * 60 * 24, // 24小时
  buster: '1', // 版本号，当需要清除所有缓存时可以更改
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      const checkAuth = async () => {
        const token = await AsyncStorage.getItem('token');
        const server = await AsyncStorage.getItem('server');

        if (token && server) {
          initMisskeyClient(token, server);
        } else {
          router.push('/auth');
        }
      };
      checkAuth();
    }
  }, [loaded]);

  useEffect(() => {
    // set the navigation bar to be transparent
    if (Platform.OS === 'android') {
      NavigationBar.setPositionAsync('absolute');
      NavigationBar.setBackgroundColorAsync('transparent');
    }
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ShellModeProvider>
            <MainScrollProvider>
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <Stack>
                  <Stack.Screen
                    name="auth"
                    options={{
                      headerShown: false,
                      // 防止用户通过返回按钮回到登录页
                      gestureEnabled: false,
                    }}
                  />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="+not-found" />
                </Stack>
                <StatusBar style="auto" backgroundColor="transparent" translucent={true} />
              </ThemeProvider>
            </MainScrollProvider>
          </ShellModeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
