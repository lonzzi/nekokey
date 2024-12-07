import { BlueViewIntensity } from '@/constants/Colors';
import { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import { useLinkBuilder, useTheme } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { Animated, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTopTabBarHeight } from '../hooks/useTopTabBarHeight';

const TAB_WIDTH = 60;

type TabBarProps = MaterialTopTabBarProps & {
  headerTitle?: string;
};

function TabBar({ state, descriptors, navigation, position, headerTitle }: TabBarProps) {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const topTabBarHeight = useTopTabBarHeight();
  const { buildHref } = useLinkBuilder();

  const inputRange = state.routes.map((_, i) => i);
  const translateX = position.interpolate({
    inputRange,
    outputRange: inputRange.map((i) => i * TAB_WIDTH),
  });

  return (
    <BlurView
      intensity={BlueViewIntensity}
      tint={dark ? 'dark' : 'light'}
      style={[
        Platform.OS === 'ios' ? styles.blurView : {},
        {
          paddingTop: insets.top,
          height: topTabBarHeight,
        },
      ]}
    >
      <View style={styles.headerContainer}>
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
                <Animated.Text
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
                </Animated.Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      <Animated.View style={[styles.containerIndicator, { transform: [{ translateX }] }]}>
        <View style={{ backgroundColor: colors.primary, height: 2, width: '60%' }} />
      </Animated.View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
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
});

export default TabBar;
