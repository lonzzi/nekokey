import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as NavigationBar from 'expo-navigation-bar';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { MisskeyApiProvider } from '@/lib/contexts/MisskeyApiContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import '../i18n/config';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

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

        if (!token || !server) {
          router.replace('/auth');
        } else {
          setAuthInfo({ token, server });
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
        </MisskeyApiProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
