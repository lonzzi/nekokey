import { Colors } from '@/constants/Colors';
import { TimelineEndpoint, useInfiniteTimelines } from '@/hooks/useInfiniteTimelines';
import useRefresh from '@/hooks/useRefresh';
import { useTopTabBarHeight } from '@/hooks/useTopTabBarHeight';
import { useMisskeyStream } from '@/lib/api';
import { useScrollHandlers } from '@/lib/contexts/ScrollContext';
import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useScrollToTop } from '@react-navigation/native';
import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import type { Note as NoteType } from 'misskey-js/built/entities';
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ViewToken,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';

import { Note } from './Note';
import { ThemedView } from './ThemedView';

const TIMELINE_CHANNEL_MAP = {
  'notes/timeline': 'homeTimeline',
  'notes/global-timeline': 'globalTimeline',
  'notes/local-timeline': 'localTimeline',
  'notes/hybrid-timeline': 'hybridTimeline',
  'notes/user-list-timeline': 'roleTimeline',
} as const;

const MemoizedNote = memo(Note, (prev, next) => prev.note.id === next.note.id);

export interface TimelineListRef {
  scrollToTop: () => void;
}

export const TimelineList = forwardRef<TimelineListRef, { endpoint: TimelineEndpoint }>(
  ({ endpoint }, ref) => {
    const query = useInfiniteTimelines(endpoint);
    const topTabBarHeight = useTopTabBarHeight();
    const bottomTabHeight = useBottomTabBarHeight();
    const colorScheme = useColorScheme();
    const { onBeginDrag, onScroll, onEndDrag, onMomentumEnd } = useScrollHandlers();
    const { refreshing, onRefresh } = useRefresh(query);
    const stream = useMisskeyStream();
    const queryClient = useQueryClient();
    const listRef = useRef<FlatList>(null);
    const scrollOffset = useSharedValue(0);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [newNoteIds, setNewNoteIds] = useState<Set<string>>(new Set());

    const scrollHandler = useAnimatedScrollHandler({
      onBeginDrag,
      onScroll: (event) => {
        'worklet';
        scrollOffset.value = event.contentOffset.y;
        if (event.contentOffset.y <= 0) {
          runOnJS(setShowScrollTop)(false);
        }
        onScroll(event);
      },
      onEndDrag,
      onMomentumEnd,
    });

    const scrollToTop = () => {
      setShowScrollTop(false);
      listRef.current?.scrollToOffset({ offset: -topTabBarHeight, animated: true });
    };

    useImperativeHandle(ref, () => ({
      scrollToTop,
    }));

    useScrollToTop(useRef({ scrollToTop }));

    const handleNoteVisible = useCallback((noteId: string) => {
      setNewNoteIds((prev) => {
        const next = new Set(prev);
        next.delete(noteId);
        if (next.size === 0) {
          setShowScrollTop(false);
        }
        return next;
      });
    }, []);

    const viewabilityConfig = {
      itemVisiblePercentThreshold: 50,
      minimumViewTime: 0.5e3,
    };

    const onViewableItemsChanged = useCallback(
      ({ changed }: { changed: ViewToken<NoteType>[] }) => {
        changed.forEach((item) => {
          if (item.isViewable && newNoteIds.has(item.item.id)) {
            handleNoteVisible(item.item.id);
          }
        });
      },
      [newNoteIds, handleNoteVisible],
    );

    const renderItem = useCallback(
      ({ item }: { item: NoteType }) => <MemoizedNote endpoint={endpoint} note={item} />,
      [],
    );

    useEffect(() => {
      const channel = stream.useChannel(TIMELINE_CHANNEL_MAP[endpoint] as 'homeTimeline');

      channel.on('note', (note) => {
        if (scrollOffset.value > 0) {
          setShowScrollTop(true);
          setNewNoteIds((prev) => new Set(prev).add(note.id));
        }
        queryClient.setQueryData([endpoint], (oldData: InfiniteData<NoteType[]>) => {
          if (!oldData) return { pages: [[note]], pageParams: [undefined] };
          return {
            ...oldData,
            pages: [[note, ...oldData.pages[0]], ...oldData.pages.slice(1)],
          };
        });
      });

      return () => {
        channel.dispose();
      };
    }, [stream, queryClient]);

    if (query.isLoading) {
      return (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </ThemedView>
      );
    }

    return (
      <>
        <Animated.FlatList
          ref={listRef}
          data={query.data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
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
          onEndReachedThreshold={1}
          // Keep the offset when getting channel updates
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
          }}
          removeClippedSubviews={true}
          ListFooterComponent={() =>
            query.hasNextPage ? (
              <ThemedView style={styles.footerContainer}>
                <ActivityIndicator size="small" />
              </ThemedView>
            ) : null
          }
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged}
        />
        {showScrollTop && (
          <TouchableOpacity
            style={[
              styles.scrollTopButton,
              {
                bottom: bottomTabHeight + 20,
                backgroundColor: Colors[colorScheme ?? 'light'].background,
              },
            ]}
            onPress={scrollToTop}
          >
            <Ionicons name="arrow-up" size={24} color={Colors[colorScheme ?? 'light'].text} />
            <ThemedView
              style={[
                styles.notificationDot,
                {
                  backgroundColor: 'red',
                },
              ]}
            />
          </TouchableOpacity>
        )}
      </>
    );
  },
);
TimelineList.displayName = 'TimelineList';

export const HomeTimeline = () => <TimelineList endpoint="notes/timeline" />;
export const GlobalTimeline = () => <TimelineList endpoint="notes/global-timeline" />;
export const LocalTimeline = () => <TimelineList endpoint="notes/local-timeline" />;

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
  },
  scrollTopButton: {
    position: 'absolute',
    left: 20,
    width: 60,
    height: 60,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  notificationDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 9999,
  },
});
