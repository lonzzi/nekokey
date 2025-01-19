import { ThemedView } from '@/components/ThemedView';
import { useBottomTabOverflow } from '@/components/ui/TabBarBackground';
import { useColorScheme } from '@/hooks/useColorScheme';
import { type ReactElement } from 'react';
import { RefreshControl, SectionList, SectionListProps, StyleSheet, View } from 'react-native';
import Animated, {
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
  extraListHeaderComponent?: ReactElement;
  headerBackgroundColor: { dark: string; light: string };
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onScroll?: (event: ReanimatedScrollEvent) => void;
  renderSectionHeader?: () => ReactElement;
} & Omit<SectionListProps<ItemT>, 'sections' | 'onScroll'> & {
    sections: Array<{
      title: string;
      data: ItemT[];
    }>;
  };

const HEADER_HEIGHT = 200;

export default function ParallaxSectionList<ItemT>({
  headerImage,
  headerBackgroundColor,
  extraListHeaderComponent,
  onRefresh,
  isRefreshing = false,
  onScroll,
  renderSectionHeader,
  ...props
}: Props<ItemT>) {
  const AnimatedSectionList =
    Animated.createAnimatedComponent<SectionListProps<ItemT>>(SectionList);
  const { top } = useSafeAreaInsets();
  const topOffset = HEADER_HEIGHT - top;
  const colorScheme = useColorScheme() ?? 'light';
  const bottom = useBottomTabOverflow();
  const { scrollOffset } = useParallaxScroll();
  const extraListHeaderHeight = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    'worklet';
    scrollOffset.value = event.contentOffset.y;
    if (onScroll) {
      runOnJS(onScroll)(event);
    }
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
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
          translateY:
            scrollOffset.value > topOffset
              ? -topOffset
              : scrollOffset.value > 0
                ? -scrollOffset.value
                : 0,
        },
      ],
      zIndex: scrollOffset.value > topOffset ? 2 : 0,
    };
  });

  const extraListHeaderAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scrollOffset.value > 0 ? -scrollOffset.value : 0 }],
  }));

  const renderSectionHeaderAnimatedStyle = useAnimatedStyle(() => {
    const sectionHeaderTopOffset = topOffset + extraListHeaderHeight.value;

    return {
      transform: [
        {
          translateY:
            scrollOffset.value > sectionHeaderTopOffset
              ? -sectionHeaderTopOffset
              : scrollOffset.value > 0
                ? -scrollOffset.value
                : 0,
        },
      ],
    };
  });

  return (
    <ThemedView style={styles.container}>
      <AnimatedSectionList
        style={{ zIndex: 2 }}
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
        renderSectionHeader={() => (
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
              style={[extraListHeaderAnimatedStyle, { zIndex: 1 }]}
              onLayout={(e) => {
                extraListHeaderHeight.value = e.nativeEvent.layout.height;
              }}
            >
              {extraListHeaderComponent}
            </Animated.View>
            <Animated.View
              style={[
                renderSectionHeaderAnimatedStyle,
                { backgroundColor: headerBackgroundColor[colorScheme] },
              ]}
            >
              {renderSectionHeader?.()}
            </Animated.View>
          </View>
        )}
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
    zIndex: 1,
  },
  content: {
    flex: 1,
  },
});
