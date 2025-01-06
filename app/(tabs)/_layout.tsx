import { DrawerContent } from '@/components/Drawer';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
  useIsDrawerOpen,
  useIsDrawerSwipeDisabled,
  useSetDrawerOpen,
} from '@/lib/contexts/DrawerContext';
import { useTopTabBar } from '@/lib/contexts/TopTabBarContext';
import { isAndroid, isIOS } from '@/lib/utils/platform';
import { Image } from 'expo-image';
import { Tabs } from 'expo-router';
import { useCallback } from 'react';
import { ColorSchemeName, Platform, useWindowDimensions } from 'react-native';
import { Drawer } from 'react-native-drawer-layout';

export const unstable_settings = {
  initialRouteName: '(home)/index',
};

const getOverlayColor = (scheme: ColorSchemeName) => {
  if (scheme === 'light') {
    return 'rgba(0, 57, 117, 0.1)';
  }

  if (scheme === 'dark') {
    return isAndroid ? 'rgba(16, 133, 254, 0.1)' : 'rgba(1, 82, 168, 0.1)';
  }

  return 'rgba(10, 13, 16, 0.8)'; // fallback color
};

export default function TabLayout() {
  const winDim = useWindowDimensions();
  const colorScheme = useColorScheme();
  const { loaded, user } = useAuth();
  const isDrawerOpen = useIsDrawerOpen();
  const setIsDrawerOpen = useSetDrawerOpen();
  const isSwipeDisabled = useIsDrawerSwipeDisabled();
  const onOpenDrawer = useCallback(() => setIsDrawerOpen(true), [setIsDrawerOpen]);
  const onCloseDrawer = useCallback(() => setIsDrawerOpen(false), [setIsDrawerOpen]);
  const { currentIndex } = useTopTabBar();

  const renderDrawerContent = useCallback(() => <DrawerContent />, []);
  const swipeEnabled = currentIndex === 0 && !isSwipeDisabled;

  if (!loaded) {
    return <LoadingScreen />;
  }

  return (
    <Drawer
      renderDrawerContent={renderDrawerContent}
      drawerStyle={{ width: Math.min(400, winDim.width * 0.8) }}
      configureGestureHandler={(handler) => {
        if (swipeEnabled) {
          if (isDrawerOpen) {
            return handler.activeOffsetX([-1, 1]);
          } else {
            return (
              handler
                // Any movement to the left is a pager swipe
                // so fail the drawer gesture immediately.
                .failOffsetX(-1)
                // Don't rush declaring that a movement to the right
                // is a drawer swipe. It could be a vertical scroll.
                .activeOffsetX(5)
            );
          }
        } else {
          // Fail the gesture immediately.
          // This seems more reliable than the `swipeEnabled` prop.
          // With `swipeEnabled` alone, the gesture may freeze after toggling off/on.
          return handler.failOffsetX([0, 0]).failOffsetY([0, 0]);
        }
      }}
      open={isDrawerOpen}
      onOpen={onOpenDrawer}
      onClose={onCloseDrawer}
      swipeEdgeWidth={winDim.width}
      swipeMinVelocity={100}
      swipeMinDistance={10}
      drawerType={isIOS ? 'slide' : 'front'}
      overlayStyle={{
        backgroundColor: getOverlayColor(colorScheme),
      }}
    >
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              position: 'absolute',
            },
            android: {
              height: 70,
            },
            default: {},
          }),
          tabBarShowLabel: false,
          headerShown: false,
          tabBarItemStyle: {
            paddingVertical: 10,
          },
        }}
      >
        <Tabs.Screen
          name="(home)"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <IconSymbol size={28} name={focused ? 'home' : 'home-outline'} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="(search)"
          options={{
            title: '搜索',
            tabBarIcon: ({ color, focused }) => (
              <IconSymbol size={28} name={focused ? 'search' : 'search-outline'} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="(messages)"
          options={{
            title: '消息',
            tabBarIcon: ({ color, focused }) => (
              <IconSymbol
                size={28}
                name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="(notifications)"
          options={{
            title: '通知',
            tabBarIcon: ({ color, focused }) => (
              <IconSymbol
                size={28}
                name={focused ? 'notifications' : 'notifications-outline'}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="(profile)"
          options={{
            title: 'MyProfile',
            tabBarIcon: ({ color, focused }) =>
              user ? (
                <Image
                  source={{ uri: user.avatarUrl ?? '' }}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: focused ? color : 'transparent',
                  }}
                  priority="high"
                />
              ) : (
                <IconSymbol size={28} name="person-outline" color={color} />
              ),
          }}
        />
      </Tabs>
    </Drawer>
  );
}
