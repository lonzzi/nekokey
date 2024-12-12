import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import { useRef } from 'react';
import { Animated } from 'react-native';

export function HapticTab(props: BottomTabBarButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const createAnimation = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
      }}
    >
      <PlatformPressable
        {...props}
        // Remove the ripple effect on Android
        android_ripple={{
          color: 'transparent',
        }}
        onPressIn={(ev) => {
          createAnimation();

          // if (process.env.EXPO_OS === 'ios') {
          //   // Add a soft haptic feedback when pressing down on the tabs.
          //   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          // }
          props.onPressIn?.(ev);
        }}
      />
    </Animated.View>
  );
}
