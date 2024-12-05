import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as NavigationBar from 'expo-navigation-bar';
import { router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import { MisskeyApiProvider } from '@/lib/contexts/MisskeyApiContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { persistQueryClient } from '@tanstack/query-persist-client-core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Platform } from 'react-native';

import '../i18n/config';

import { JsStack } from '@/components/JsStack';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24小时
      staleTime: 1000 * 60 * 5, // 5分钟
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
  const [authInfo, setAuthInfo] = useState({ token: '', server: '' });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      const checkAuth = async () => {
        const token = await AsyncStorage.getItem('token');
        const server = await AsyncStorage.getItem('server');

        if (token && server) {
          setAuthInfo({ token, server });
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
        <MisskeyApiProvider initialToken={authInfo.token} initialServer={authInfo.server}>
          <AuthProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <JsStack>
                <JsStack.Screen
                  name="auth"
                  options={{
                    headerShown: false,
                    // 防止用户通过返回按钮回到登录页
                    gestureEnabled: false,
                  }}
                />
                <JsStack.Screen name="(tabs)" options={{ headerShown: false }} />
                <JsStack.Screen name="+not-found" />
              </JsStack>
              <StatusBar style="auto" backgroundColor="transparent" translucent={true} />
            </ThemeProvider>
          </AuthProvider>
        </MisskeyApiProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
