import { Colors } from '@/constants/Colors';
import { useHeaderTransform } from '@/hooks/useHeaderTransform';
import { useTopTabBarHeight } from '@/hooks/useTopTabBarHeight';
import { useTopTabBar } from '@/lib/contexts/TopTabBarContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform, StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native';
import Animated, { interpolate, SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_WIDTH = 60;

interface TopTabBarProps {
  headerTitle?: React.ReactNode;
  tabBarBackground?: () => React.ReactNode;
  selectedIndex: number;
  onSelectTab?: (index: number) => void;
  dragProgress: SharedValue<number>;
  dragState: SharedValue<'idle' | 'dragging' | 'settling'>;
  tabs: { key: string; label: string }[];
}

function TopTabBar({
  headerTitle,
  tabBarBackground,
  selectedIndex,
  onSelectTab,
  dragProgress,
  tabs,
}: TopTabBarProps) {
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const topTabBarHeight = useTopTabBarHeight();
  const headerTransform = useHeaderTransform();
  const { setCurrentIndex } = useTopTabBar();

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: dragProgress.value * TAB_WIDTH }],
  }));

  useEffect(() => {
    setCurrentIndex(selectedIndex);
  }, [selectedIndex]);

  return (
    <Animated.View
      style={[
        styles.container,
        headerTransform,
        {
          paddingTop: insets.top,
          height: topTabBarHeight,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(0,0,0,0.1)',
        },
        Platform.OS !== 'ios'
          ? { backgroundColor: Colors[colorScheme ?? 'light'].background }
          : null,
      ]}
    >
      {tabBarBackground?.()}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => {
            queryClient.clear();
          }}
        >
          <Animated.Text style={[styles.clearButtonText, { color: colors.primary }]}>
            清除缓存
          </Animated.Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={async () => {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('server');
            await AsyncStorage.removeItem('user');
            router.replace('/auth');
          }}
        >
          <Animated.Text className="text-red-500">登出</Animated.Text>
        </TouchableOpacity>

        <Animated.Text style={[styles.headerText, { color: colors.text }]}>
          {headerTitle}
        </Animated.Text>
      </View>

      <View style={styles.tabContainer}>
        {tabs.map((tab, index) => {
          const isFocused = selectedIndex === index;

          const tabAnimatedStyle = useAnimatedStyle(() => {
            const opacity = interpolate(
              dragProgress.value,
              [index - 1, index, index + 1],
              [0.3, 1, 0.3],
              'clamp',
            );

            return {
              opacity: isFocused ? 1 : opacity,
            };
          });

          return (
            <View key={tab.key}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                onPress={() => onSelectTab?.(index)}
                style={styles.tabButton}
              >
                <Animated.Text
                  style={[
                    styles.tabText,
                    tabAnimatedStyle,
                    {
                      color: colors.text,
                      fontWeight: isFocused ? '600' : '400',
                    },
                  ]}
                >
                  {tab.label}
                </Animated.Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      <Animated.View style={[styles.containerIndicator, indicatorStyle]}>
        <View style={{ backgroundColor: colors.primary, height: 2, width: '60%' }} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 1,
  },

  headerContainer: {
    height: 40,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },

  headerText: {
    fontSize: 17,
    fontWeight: '600',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },

  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    height: 48,
    alignItems: 'center',
  },

  tabButton: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    paddingBottom: 6,
    width: TAB_WIDTH,
  },

  tabText: {
    fontSize: 15,
  },

  containerIndicator: {
    height: 2,
    position: 'absolute',
    bottom: 0,
    left: 16,
    width: TAB_WIDTH,
    alignItems: 'center',
  },

  clearButton: {
    position: 'absolute',
    right: 16,
    zIndex: 1,
  },

  clearButtonText: {
    fontSize: 14,
  },

  logoutButton: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },

  logoutButtonText: {
    fontSize: 14,
  },
});

export default TopTabBar;
