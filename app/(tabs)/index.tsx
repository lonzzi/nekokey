import { Note } from '@/components/Note';
import TabViewHeader from '@/components/TabViewHeader';
import { ThemedView } from '@/components/ThemedView';
import { useMisskeyApi } from '@/lib/contexts/MisskeyApiContext';
import { useScroll } from '@/lib/contexts/ScrollContext';
import { useHeaderHeight } from '@react-navigation/elements';
import { useQuery } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Animated, RefreshControl, StyleSheet } from 'react-native';
import { SceneMap, TabView } from 'react-native-tab-view';

export default function HomeScreen() {
  const { api } = useMisskeyApi();
  const headerHeight = useHeaderHeight();
  const { scrollY } = useScroll();
  const [index, setIndex] = useState(0);

  const [routes] = useState([
    { key: 'home', title: '综合' },
    { key: 'global', title: '全局' },
    { key: 'local', title: '本地' },
  ]);

  const homeTimelineQuery = useQuery({
    queryKey: ['timeline', 'home'],
    queryFn: async () => {
      if (!api) throw new Error('API not initialized');
      return await api.request('notes/timeline', { limit: 20 });
    },
  });

  const globalTimelineQuery = useQuery({
    queryKey: ['timeline', 'global'],
    queryFn: async () => {
      if (!api) throw new Error('API not initialized');
      return await api.request('notes/global-timeline', { limit: 20 });
    },
  });

  const localTimelineQuery = useQuery({
    queryKey: ['timeline', 'local'],
    queryFn: async () => {
      if (!api) throw new Error('API not initialized');
      return await api.request('notes/local-timeline', { limit: 20 });
    },
  });

  // 定义每个标签页的渲染函数
  const renderTimelineList = (query: typeof homeTimelineQuery) => {
    if (query.isLoading) {
      return (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </ThemedView>
      );
    }

    return (
      <Animated.FlatList
        data={query.data}
        renderItem={({ item }) => <Note note={item} />}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={query.isRefetching} onRefresh={query.refetch} />
        }
        style={styles.container}
        contentInset={{ top: headerHeight }}
        contentOffset={{ x: 0, y: -headerHeight }}
        automaticallyAdjustContentInsets
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
      />
    );
  };

  const renderScene = SceneMap({
    home: () => renderTimelineList(homeTimelineQuery),
    global: () => renderTimelineList(globalTimelineQuery),
    local: () => renderTimelineList(localTimelineQuery),
  });

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: '主页',
          header: ({ options }) => {
            const title = options.title ?? '主页';
            return (
              <TabViewHeader
                headerProps={{ ...options, title }}
                tabViewProps={{
                  navigationState: { index, routes },
                  onIndexChange: setIndex,
                }}
              />
            );
          },
        }}
      />
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        renderTabBar={() => null}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
