/**
 * This project includes code from [Bluesky](https://github.com/bluesky-social/social-app/blob/main/src/view/com/util/MainScrollProvider.tsx),
 * licensed under the MIT License.
 */

import { useTopTabBarHeight } from '@/hooks/useTopTabBarHeight';
import { ScrollProvider } from '@/lib/contexts/ScrollContext';
import { useShellMode } from '@/lib/contexts/ShellMode';
import { useCallback } from 'react';
import { NativeScrollEvent } from 'react-native';
import { clamp, interpolate, useSharedValue } from 'react-native-reanimated';

export const MainScrollProvider = ({ children }: { children: React.ReactNode }) => {
  const { dragStartY, headerMode, setMode } = useShellMode();
  const topTabBarHeight = useTopTabBarHeight();
  const startMode = useSharedValue<number | null>(null);

  const snapToClosestState = useCallback(
    (e: NativeScrollEvent) => {
      'worklet';
      if (e.velocity && e.velocity.y !== 0) {
        // If we detect a velocity, wait for onMomentumEnd to snap.
        return;
      }

      const offsetY = Math.max(0, e.contentOffset.y);

      const startDragOffsetValue = dragStartY.get();
      if (startDragOffsetValue === null) {
        return;
      }
      const didScrollDown = offsetY > startDragOffsetValue;
      dragStartY.set(null);
      startMode.set(null);
      if (offsetY < topTabBarHeight) {
        // If we're close to the top, show the shell.
        setMode(false);
      } else if (didScrollDown) {
        // Showing the bar again on scroll down feels annoying, so don't.
        setMode(true);
      } else {
        // Snap to whichever state is the closest.
        setMode(Math.round(headerMode.get()) === 1);
      }
    },
    [dragStartY, startMode, setMode, headerMode, topTabBarHeight],
  );

  const onBeginDrag = useCallback(
    (e: NativeScrollEvent) => {
      'worklet';
      const offsetY = Math.max(0, e.contentOffset.y);
      dragStartY.set(offsetY);
      startMode.set(headerMode.get());
    },
    [snapToClosestState],
  );

  const onEndDrag = useCallback(
    (e: NativeScrollEvent) => {
      'worklet';
      snapToClosestState(e);
    },
    [dragStartY, startMode],
  );

  const onMomentumEnd = useCallback(
    (e: NativeScrollEvent) => {
      'worklet';
      snapToClosestState(e);
    },
    [snapToClosestState],
  );

  const onScroll = useCallback(
    (e: NativeScrollEvent) => {
      'worklet';
      const offsetY = Math.max(0, e.contentOffset.y);
      const startDragOffsetValue = dragStartY.get();
      const startModeValue = startMode.get();

      if (startDragOffsetValue === null || startModeValue === null) {
        if (headerMode.get() !== 0 && offsetY < topTabBarHeight) {
          // If we're close enough to the top, always show the shell.
          // Even if we're not dragging.
          setMode(false);
        }
        return;
      }

      // The "mode" value is always between 0 and 1.
      // Figure out how much to move it based on the current dragged distance.
      const dy = offsetY - startDragOffsetValue;
      const dProgress = interpolate(dy, [-topTabBarHeight, topTabBarHeight], [-1, 1]);
      const newValue = clamp(startModeValue + dProgress, 0, 1);
      if (newValue !== headerMode.get()) {
        // Manually adjust the value. This won't be (and shouldn't be) animated.
        headerMode.set(newValue);
      }
    },
    [dragStartY, startMode, setMode, headerMode, topTabBarHeight],
  );

  return (
    <ScrollProvider
      onBeginDrag={onBeginDrag}
      onScroll={onScroll}
      onEndDrag={onEndDrag}
      onMomentumEnd={onMomentumEnd}
    >
      {children}
    </ScrollProvider>
  );
};
