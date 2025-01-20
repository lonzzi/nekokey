import { ThemedView } from '@/components/ThemedView';
import { useBottomTabOverflow } from '@/components/ui/TabBarBackground';
import { useColorScheme } from '@/hooks/useColorScheme';
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

const emulatedScrollOffset = (scrollOffset: number, topOffset: number) => {
  'worklet';
  if (scrollOffset > topOffset) {
    return -topOffset;
  }
  if (scrollOffset > 0) {
    return -scrollOffset;
  }
  return 0;
};

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
  const topOffset = HEADER_HEIGHT - top;
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
      {
        translateY: emulatedScrollOffset(scrollOffset.value, topOffset),
      },
    ],
    zIndex: scrollOffset.value > topOffset ? 2 : 0,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: emulatedScrollOffset(scrollOffset.value, topOffset + staticHeaderHeight.value),
      },
    ],
  }));

  return (
    <ThemedView style={styles.container}>
      <Animated.FlatList
        scrollEventThrottle={16}
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
                { backgroundColor: headerBackgroundColor[colorScheme] },
                headerAnimatedStyle,
              ]}
            >
              {headerImage}
            </Animated.View>
            <Animated.View
              style={contentAnimatedStyle}
              onLayout={(e) => {
                staticHeaderHeight.value = e.nativeEvent.layout.height;
              }}
            >
              {staticHeaderComponent}
            </Animated.View>
            <Animated.View style={contentAnimatedStyle}>{stickyHeaderComponent}</Animated.View>
          </View>
        }
        stickyHeaderIndices={[0]}
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
});
