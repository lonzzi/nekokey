import { Colors } from '@/constants/Colors';
import { TimelineEndpoint, useInfiniteTimelines } from '@/hooks/useInfiniteTimelines';
import useRefresh from '@/hooks/useRefresh';
import { useTopTabBarHeight } from '@/hooks/useTopTabBarHeight';
import { useMisskeyStream } from '@/lib/api';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useScrollHandlers } from '@/lib/contexts/ScrollContext';
import { isIOS } from '@/lib/utils/platform';
import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useIsFocused, useScrollToTop } from '@react-navigation/native';
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
  Platform,
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

const MAX_CACHED_NOTES = 100;

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
    const [hasNew, setHasNew] = useState(false);
    const [newNoteIds, setNewNoteIds] = useState<Set<string>>(new Set());
    const { user } = useAuth();
    const [isOnTop, setIsOnTop] = useState(true);
    const isFocused = useIsFocused();
    const [cachedNotes, setCachedNotes] = useState<NoteType[]>([]);

    const { data, refetch, isLoading, isFetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
      query;

    const scrollHandler = useAnimatedScrollHandler({
      onBeginDrag,
      onScroll: (event) => {
        'worklet';
        scrollOffset.value = event.contentOffset.y;
        if (event.contentOffset.y <= 0) {
          runOnJS(setHasNew)(false);
          runOnJS(setIsOnTop)(true);
        } else {
          runOnJS(setIsOnTop)(false);
        }
        onScroll(event);
      },
      onEndDrag,
      onMomentumEnd,
    });

    useEffect(() => {
      if (isOnTop && cachedNotes.length > 0) {
        queryClient.setQueryData([endpoint], (oldData: InfiniteData<NoteType[]>) => {
          if (!oldData) return { pages: [cachedNotes], pageParams: [undefined] };
          return {
            ...oldData,
            pages: [[...cachedNotes, ...oldData.pages[0]], ...oldData.pages.slice(1)],
          };
        });
        setCachedNotes([]);
      }
    }, [cachedNotes, isOnTop]);

    const checkForNew = useCallback(() => {
      if (isFetching || !hasNew) {
        return;
      }
      refetch();
    }, [refetch, isFetching, hasNew]);

    const scrollToTop = () => {
      if (cachedNotes.length > 0) {
        queryClient.setQueryData([endpoint], (oldData: InfiniteData<NoteType[]>) => {
          if (!oldData) return { pages: [cachedNotes], pageParams: [undefined] };
          return {
            ...oldData,
            pages: [[...cachedNotes, ...oldData.pages[0]], ...oldData.pages.slice(1)],
          };
        });
        setCachedNotes([]);
      }
      setHasNew(false);
      checkForNew();
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
          setHasNew(false);
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

      channel.on('note', async (note) => {
        if (isFocused && isOnTop) {
          queryClient.setQueryData([endpoint], (oldData: InfiniteData<NoteType[]>) => {
            if (!oldData) return { pages: [[note]], pageParams: [undefined] };
            return {
              ...oldData,
              pages: [[note, ...oldData.pages[0]], ...oldData.pages.slice(1)],
            };
          });
        } else {
          setCachedNotes((prev) => {
            const newCache = [note, ...prev];
            return newCache.slice(0, MAX_CACHED_NOTES);
          });
          setHasNew(true);
        }
      });

      return () => {
        channel.dispose();
      };
    }, [stream, queryClient, isFocused, isOnTop]);

    if (isLoading) {
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
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => `${item.id}-${user?.id}`}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              progressViewOffset={Platform.OS === 'android' ? topTabBarHeight : 0}
            />
          }
          contentContainerStyle={{
            paddingTop: Platform.OS === 'ios' ? 0 : topTabBarHeight,
          }}
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
          scrollEventThrottle={1}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={2}
          maxToRenderPerBatch={isIOS ? 5 : 1}
          windowSize={9}
          updateCellsBatchingPeriod={40}
          removeClippedSubviews={true}
          initialNumToRender={10}
          ListFooterComponent={() =>
            hasNextPage ? (
              <ThemedView style={styles.footerContainer}>
                <ActivityIndicator size="small" />
              </ThemedView>
            ) : null
          }
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged}
        />
        {hasNew && (
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

export const HomeTimeline = memo(() => <TimelineList endpoint="notes/timeline" />);
HomeTimeline.displayName = 'HomeTimeline';

export const GlobalTimeline = memo(() => <TimelineList endpoint="notes/global-timeline" />);
GlobalTimeline.displayName = 'GlobalTimeline';

export const LocalTimeline = memo(() => <TimelineList endpoint="notes/local-timeline" />);
LocalTimeline.displayName = 'LocalTimeline';

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
