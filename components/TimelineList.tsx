import { useInfiniteTimelines } from '@/hooks/useInfiniteTimelines';
import useRefresh from '@/hooks/useRefresh';
import { useTopTabBarHeight } from '@/hooks/useTopTabBarHeight';
import { useMisskeyStream } from '@/lib/api';
import { useScrollHandlers } from '@/lib/contexts/ScrollContext';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { UseInfiniteQueryResult, useQueryClient } from '@tanstack/react-query';
import type { Note as NoteType } from 'misskey-js/built/entities';
import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import Animated, { useAnimatedScrollHandler } from 'react-native-reanimated';
import { Colors } from 'react-native/Libraries/NewAppScreen';

import { Note } from './Note';
import { ThemedView } from './ThemedView';

export const TimelineList = ({ query }: { query: UseInfiniteQueryResult<NoteType[]> }) => {
  const topTabBarHeight = useTopTabBarHeight();
  const bottomTabHeight = useBottomTabBarHeight();
  const colorScheme = useColorScheme();
  const { onBeginDrag, onScroll, onEndDrag, onMomentumEnd } = useScrollHandlers();
  const { refreshing, onRefresh } = useRefresh(query);
  const listRef = useRef<FlatList>(null);

  const scrollHandler = useAnimatedScrollHandler({
    onBeginDrag,
    onScroll,
    onEndDrag,
    onMomentumEnd,
  });

  if (query.isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <Animated.FlatList
      ref={listRef}
      data={query.data}
      renderItem={({ item }) => <Note note={item} />}
      keyExtractor={(item, index) => `${item.id}-${index}`}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentInset={{ top: topTabBarHeight, bottom: bottomTabHeight }}
      contentOffset={{ x: 0, y: -topTabBarHeight }}
      scrollIndicatorInsets={{ top: topTabBarHeight, bottom: bottomTabHeight }}
      style={[
        styles.container,
        {
          backgroundColor: Colors[colorScheme ?? 'light'].background,
        },
      ]}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      onEndReached={() => {
        if (query.hasNextPage) {
          query.fetchNextPage();
        }
      }}
      onEndReachedThreshold={0.5}
      maintainVisibleContentPosition={{
        minIndexForVisible: 0,
      }}
      ListFooterComponent={() =>
        query.hasNextPage ? (
          <ThemedView style={styles.footerContainer}>
            <ActivityIndicator size="small" color={Colors[colorScheme ?? 'light'].tint} />
          </ThemedView>
        ) : null
      }
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    />
  );
};

export const HomeTimeline = () => {
  const stream = useMisskeyStream();
  const queryClient = useQueryClient();

  useEffect(() => {
    const homeChannel = stream.useChannel('homeTimeline');
    homeChannel.on('note', (note) => {
      console.log('homeChannel', note);
      queryClient.setQueryData(['notes/timeline'], (oldData: NoteType[]) => [
        note,
        ...(oldData || []),
      ]);
    });

    return () => {
      homeChannel.dispose();
    };
  }, [stream, queryClient]);

  return <TimelineList query={useInfiniteTimelines('notes/timeline')} />;
};
export const GlobalTimeline = () => (
  <TimelineList query={useInfiniteTimelines('notes/global-timeline')} />
);
export const LocalTimeline = () => (
  <TimelineList query={useInfiniteTimelines('notes/local-timeline')} />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
});
