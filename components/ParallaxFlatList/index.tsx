import { ThemedView } from '@/components/ThemedView';
import { useBottomTabOverflow } from '@/components/ui/TabBarBackground';
import { useColorScheme } from '@/hooks/useColorScheme';
import { BlurView } from 'expo-blur';
import { type ReactElement } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import Animated, {
  FlatListPropsWithLayout,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { ReanimatedScrollEvent } from 'react-native-reanimated/lib/typescript/hook/commonTypes';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useParallaxScroll } from './useParallaxScroll';

type Props<ItemT> = {
  headerImage: ReactElement;
  headerBackgroundColor: { dark: string; light: string };
  stickyHeaderComponent?: ReactElement;
  staticHeaderComponent?: ReactElement;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onScroll?: (event: ReanimatedScrollEvent) => void;
} & Omit<
  FlatListPropsWithLayout<ItemT>,
  'onScroll' | 'ListHeaderComponent' | 'stickyHeaderIndices'
>;

const HEADER_HEIGHT = 200;
const BLUR_INTENSITY = 80;

export default function ParallaxFlatList<ItemT>({
  headerImage,
  headerBackgroundColor,
  stickyHeaderComponent,
  staticHeaderComponent,
  onRefresh,
  isRefreshing = false,
  onScroll,
  ...props
}: Props<ItemT>) {
  const { top } = useSafeAreaInsets();
  const topBarHeight = top + 50;
  const topOffset = HEADER_HEIGHT - topBarHeight;
  const colorScheme = useColorScheme() ?? 'light';
  const bottom = useBottomTabOverflow();
  const { scrollOffset } = useParallaxScroll();
  const staticHeaderHeight = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    'worklet';
    scrollOffset.value = event.contentOffset.y;
    if (onScroll) {
      runOnJS(onScroll)(event);
    }
  });

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollOffset.value,
          [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
          [-HEADER_HEIGHT / 2, 0, 0],
        ),
      },
      {
        scale: interpolate(scrollOffset.value, [-HEADER_HEIGHT, 0, HEADER_HEIGHT], [2, 1, 1]),
      },
    ],
    opacity: scrollOffset.value > topOffset ? 0 : 1,
  }));

  const topHeaderAnimatedStyle = useAnimatedStyle(() => ({
    opacity: scrollOffset.value > topOffset ? 1 : 0,
  }));

  const stickyHeaderAnimatedStyle = useAnimatedStyle(() => ({
    opacity: scrollOffset.value > topOffset + staticHeaderHeight.value ? 1 : 0,
  }));

  const blurAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollOffset.value, [0, topOffset], [0, 1], 'clamp'),
  }));

  return (
    <ThemedView style={styles.container}>
      <Animated.View
        style={[
          styles.header,
          topHeaderAnimatedStyle,
          {
            backgroundColor: headerBackgroundColor[colorScheme],
            position: 'absolute',
            top: -topOffset,
            left: 0,
            right: 0,
            zIndex: 1,
          },
        ]}
      >
        {headerImage}
        <Animated.View style={[styles.blurContainer, blurAnimatedStyle]}>
          <BlurView
            intensity={BLUR_INTENSITY}
            tint={colorScheme === 'dark' ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
            experimentalBlurMethod="dimezisBlurView"
          />
        </Animated.View>
      </Animated.View>
      <Animated.View
        style={[
          stickyHeaderAnimatedStyle,
          {
            position: 'absolute',
            top: topBarHeight,
            left: 0,
            right: 0,
            zIndex: 1,
          },
        ]}
      >
        {stickyHeaderComponent}
      </Animated.View>
      <Animated.FlatList
        scrollEventThrottle={1}
        scrollIndicatorInsets={{ bottom }}
        contentContainerStyle={{ paddingBottom: bottom }}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              progressViewOffset={100}
            />
          ) : undefined
        }
        {...props}
        onScroll={scrollHandler}
        ListHeaderComponent={
          <View>
            <Animated.View
              style={[
                styles.header,
                {
                  backgroundColor: headerBackgroundColor[colorScheme],
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                },
                headerAnimatedStyle,
              ]}
            >
              {headerImage}
              <Animated.View style={[styles.blurContainer, blurAnimatedStyle]}>
                <BlurView
                  intensity={BLUR_INTENSITY}
                  tint={colorScheme === 'dark' ? 'dark' : 'light'}
                  style={StyleSheet.absoluteFill}
                  experimentalBlurMethod="dimezisBlurView"
                />
              </Animated.View>
            </Animated.View>
            <Animated.View
              style={{ marginTop: HEADER_HEIGHT }}
              onLayout={(e) => {
                staticHeaderHeight.value = e.nativeEvent.layout.height;
              }}
            >
              {staticHeaderComponent}
            </Animated.View>
            <Animated.View>{stickyHeaderComponent}</Animated.View>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: HEADER_HEIGHT,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
  },
});
