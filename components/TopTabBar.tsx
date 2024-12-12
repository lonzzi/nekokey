import { BlueViewIntensity, Colors } from '@/constants/Colors';
import { useHeaderTransform } from '@/hooks/useHeaderTransform';
import { useTopTabBarHeight } from '@/hooks/useTopTabBarHeight';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import { useLinkBuilder, useTheme } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { BlurView } from 'expo-blur';
import {
  Platform,
  Animated as RNAnimated,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_WIDTH = 60;

type TabBarProps = MaterialTopTabBarProps & {
  headerTitle?: React.ReactNode;
};

function TopTabBar({ state, descriptors, navigation, position, headerTitle }: TabBarProps) {
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const topTabBarHeight = useTopTabBarHeight();
  const { buildHref } = useLinkBuilder();
  const headerTransform = useHeaderTransform();

  const inputRange = state.routes.map((_, i) => i);
  const translateX = position.interpolate({
    inputRange,
    outputRange: inputRange.map((i) => i * TAB_WIDTH),
  });

  return (
    <Animated.View style={[styles.container, headerTransform]}>
      <BlurView
        intensity={BlueViewIntensity}
        tint="systemChromeMaterial"
        style={[
          Platform.OS === 'ios'
            ? styles.blurView
            : {
                backgroundColor: Colors[colorScheme ?? 'light'].background,
              },
          {
            paddingTop: insets.top,
            height: topTabBarHeight,
          },
        ]}
      >
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
            }}
          >
            <Animated.Text className="text-red-500">登出</Animated.Text>
          </TouchableOpacity>

          <Animated.Text style={[styles.headerText, { color: colors.text }]}>
            {headerTitle}
          </Animated.Text>
        </View>

        <View style={styles.tabContainer}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label =
              options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                  ? options.title
                  : route.name;

            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <View key={route.key}>
                <TouchableOpacity
                  {...(Platform.OS === 'web' ? { href: buildHref(route.name, route.params) } : {})}
                  accessibilityRole={Platform.OS === 'web' ? 'link' : 'button'}
                  accessibilityState={isFocused ? { selected: true } : {}}
                  accessibilityLabel={options.tabBarAccessibilityLabel}
                  testID={options.tabBarButtonTestID}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  style={styles.tabButton}
                >
                  <RNAnimated.Text
                    style={[
                      styles.tabText,
                      {
                        opacity: position.interpolate({
                          inputRange,
                          outputRange: inputRange.map((i) => (i === index ? 1 : 0.3)),
                        }),
                        color: colors.text,
                        fontWeight: isFocused ? '600' : '400',
                      },
                    ]}
                  >
                    {typeof label === 'function'
                      ? label({ focused: isFocused, color: colors.text, children: '' })
                      : label}
                  </RNAnimated.Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        <RNAnimated.View style={[styles.containerIndicator, { transform: [{ translateX }] }]}>
          <View style={{ backgroundColor: colors.primary, height: 2, width: '60%' }} />
        </RNAnimated.View>
      </BlurView>
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

  blurView: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
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
