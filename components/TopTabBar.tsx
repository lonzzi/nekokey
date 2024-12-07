import { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import { useLinkBuilder, useTheme } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { Animated, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTopTabBarHeight } from '../hooks/useTopTabBarHeight';

type TabBarProps = MaterialTopTabBarProps & {
  headerTitle?: string;
};

function TabBar({ state, descriptors, navigation, position, headerTitle }: TabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const topTabBarHeight = useTopTabBarHeight();
  const { buildHref } = useLinkBuilder();

  return (
    <BlurView
      intensity={80}
      tint="light"
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

          const inputRange = state.routes.map((_, i) => i);
          const opacity = position.interpolate({
            inputRange,
            outputRange: inputRange.map((i) => (i === index ? 1 : 0.6)),
          });

          return (
            <TouchableOpacity
              key={route.key}
              {...(Platform.OS === 'web' ? { href: buildHref(route.name, route.params) } : {})}
              accessibilityRole={Platform.OS === 'web' ? 'link' : 'button'}
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[
                styles.tabButton,
                { backgroundColor: isFocused ? 'rgba(0,0,0,0.05)' : 'transparent' },
              ]}
            >
              <Animated.Text
                style={[
                  styles.tabText,
                  {
                    opacity,
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
          );
        })}
      </View>
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
    flex: 1,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },

  tabText: {
    fontSize: 15,
  },
});

export default TabBar;
