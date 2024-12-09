import { BlueViewIntensity } from '@/constants/Colors';
import { useTopTabBarHeight } from '@/hooks/useTopTabBarHeight';
import { useScroll } from '@/lib/contexts/ScrollContext';
import { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import { useLinkBuilder, useTheme } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { Platform, Animated as RNAnimated, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_WIDTH = 60;

type TabBarProps = MaterialTopTabBarProps & {
  headerTitle?: string;
};

function TabBar({ state, descriptors, navigation, position, headerTitle }: TabBarProps) {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const topTabBarHeight = useTopTabBarHeight();
  const { buildHref } = useLinkBuilder();
  const { scrollY, isDragging, dragStartY, dragEndY, directionValue } = useScroll();
  const lastTranslateY = useSharedValue(0);

  const inputRange = state.routes.map((_, i) => i);
  const translateX = position.interpolate({
    inputRange,
    outputRange: inputRange.map((i) => i * TAB_WIDTH),
  });

  const animatedStyle = useAnimatedStyle(() => {
    const isAtTop = scrollY.value <= 0;

    if (isAtTop) {
      return { transform: [{ translateY: 0 }] };
    }

    const dragDistance = dragEndY.value - dragStartY.value;
    const initialOffset = -scrollY.value;

    const currentTranslateY = isDragging.value
      ? Math.max(
          -topTabBarHeight,
          Math.min(0, directionValue.value === 2 ? dragDistance : initialOffset + dragDistance),
        )
      : Math.max(-topTabBarHeight, Math.min(0, -scrollY.value));

    console.log('dragDistance', dragDistance, currentTranslateY, lastTranslateY.value);

    if (isDragging.value) {
      if (directionValue.value === 2 && lastTranslateY.value === -topTabBarHeight) {
        return {
          transform: [{ translateY: -topTabBarHeight }],
        };
      }

      lastTranslateY.value = currentTranslateY;
      return {
        transform: [{ translateY: currentTranslateY }],
      };
    }

    const targetTranslateY = directionValue.value === 2 ? -topTabBarHeight : 0;
    const translateY = withTiming(targetTranslateY, {
      duration: 250,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });

    lastTranslateY.value = targetTranslateY;
    return {
      transform: [{ translateY }],
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
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
});

export default TabBar;
