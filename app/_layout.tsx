import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as NavigationBar from 'expo-navigation-bar';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { ApiProvider } from '@/lib/contexts/ApiContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import '../i18n/config';

import { Platform } from 'react-native';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      // 检查登录状态，如果未登录则跳转到登录页
      const checkAuth = async () => {
        // 这里添加检查登录状态的逻辑
        const isLoggedIn = false; // 示例：替换为实际的登录状态检查
        if (!isLoggedIn) {
          router.replace('/login');
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
        <ApiProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen
                name="login"
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
        </ApiProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
