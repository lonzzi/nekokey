import { Note } from '@/components/Note';
import { ThemedView } from '@/components/ThemedView';
import TabBar from '@/components/TopTabBar';
import { Colors } from '@/constants/Colors';
import useRefresh from '@/hooks/useRefresh';
import { useTopTabBarHeight } from '@/hooks/useTopTabBarHeight';
import { useMisskeyApi } from '@/lib/contexts/MisskeyApiContext';
import { useScroll } from '@/lib/contexts/ScrollContext';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, RefreshControl, StyleSheet, useColorScheme } from 'react-native';
import Animated, { useAnimatedScrollHandler } from 'react-native-reanimated';

const Tab = createMaterialTopTabNavigator();

export default function HomeScreen() {
  const { api } = useMisskeyApi();
  const { scrollY, isDragging, dragStartY, dragEndY } = useScroll();
  const topTabBarHeight = useTopTabBarHeight();
  const bottomTabHeight = useBottomTabBarHeight();
  const colorScheme = useColorScheme();

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

  const renderTimelineList = (query: typeof homeTimelineQuery) => {
    const { refreshing, onRefresh } = useRefresh(query);

    const scrollHandler = useAnimatedScrollHandler({
      onScroll: ({ contentOffset: { y } }) => {
        scrollY.value = y;
        isDragging.value = true;
        dragStartY.value = y;
      },
      onEndDrag: () => {
        isDragging.value = false;
        dragEndY.value = scrollY.value;
      },
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
        data={query.data}
        renderItem={({ item }) => <Note note={item} />}
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
      />
    );
  };

  const HomeTimeline = () => renderTimelineList(homeTimelineQuery);
  const GlobalTimeline = () => renderTimelineList(globalTimelineQuery);
  const LocalTimeline = () => renderTimelineList(localTimelineQuery);

  return (
    <Tab.Navigator tabBar={(props) => <TabBar {...props} headerTitle="时间线" />}>
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
