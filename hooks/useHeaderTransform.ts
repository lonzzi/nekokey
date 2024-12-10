import { useShellMode } from '@/lib/contexts/ShellMode';
import { interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { useTopTabBarHeight } from './useTopTabBarHeight';

export function useHeaderTransform() {
  const { headerMode } = useShellMode();
  const headerHeight = useTopTabBarHeight();

  const headerTransform = useAnimatedStyle(() => {
    const headerModeValue = headerMode.get();
    return {
      pointerEvents: headerModeValue === 0 ? 'auto' : 'none',
      opacity: Math.pow(1 - headerModeValue, 2),
      transform: [
        {
          translateY: interpolate(headerModeValue, [0, 1], [0, -headerHeight]),
        },
      ],
    };
  });

  return headerTransform;
}
