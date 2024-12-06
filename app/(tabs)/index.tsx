import { Note } from '@/components/Note';
import { ThemedView } from '@/components/ThemedView';
import TabBar from '@/components/TopTabBar';
import { useTopTabBarHeight } from '@/hooks/useTopTabBarHeight';
import { useMisskeyApi } from '@/lib/contexts/MisskeyApiContext';
import { useScroll } from '@/lib/contexts/ScrollContext';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Animated, RefreshControl, StyleSheet } from 'react-native';

const Tab = createMaterialTopTabNavigator();

export default function HomeScreen() {
  const { api } = useMisskeyApi();
  const { scrollY } = useScroll();
  const topTabBarHeight = useTopTabBarHeight();
  const bottomTabHeight = useBottomTabBarHeight();

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
        contentInset={{ top: topTabBarHeight, bottom: bottomTabHeight }}
        contentInsetAdjustmentBehavior="automatic"
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
      />
    );
  };

  // 定义每个标签页的组件
  const HomeTimeline = () => renderTimelineList(homeTimelineQuery);
  const GlobalTimeline = () => renderTimelineList(globalTimelineQuery);
  const LocalTimeline = () => renderTimelineList(localTimelineQuery);

  return (
    <Tab.Navigator tabBar={(props) => <TabBar {...props} headerTitle="综合" />}>
      <Tab.Screen name="综合" component={HomeTimeline} />
      <Tab.Screen name="全局" component={GlobalTimeline} />
      <Tab.Screen name="本地" component={LocalTimeline} />
    </Tab.Navigator>
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
