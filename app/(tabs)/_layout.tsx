import { DrawerContent } from '@/components/Drawer';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useIsDrawerOpen, useSetDrawerOpen } from '@/lib/contexts/DrawerContext';
import { useTopTabBar } from '@/lib/contexts/TopTabBarContext';
import { isAndroid, isIOS } from '@/lib/utils/platform';
import { Image } from 'expo-image';
import { Tabs } from 'expo-router';
import { useCallback } from 'react';
import { ColorSchemeName, Platform, useWindowDimensions } from 'react-native';
import { Drawer } from 'react-native-drawer-layout';

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
  const onOpenDrawer = useCallback(() => setIsDrawerOpen(true), [setIsDrawerOpen]);
  const onCloseDrawer = useCallback(() => setIsDrawerOpen(false), [setIsDrawerOpen]);
  const { currentIndex } = useTopTabBar();

  const swipeEnabled = currentIndex === 0;

  if (!loaded) {
    return <LoadingScreen />;
  }

  return (
    <Drawer
      renderDrawerContent={DrawerContent}
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
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile/[user]"
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
                <IconSymbol size={28} name="person.fill" color={color} />
              ),
          }}
          initialParams={{ user: `${user?.username}` }}
        />
      </Tabs>
    </Drawer>
  );
}
