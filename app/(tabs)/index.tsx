import { Pager, RenderTabBarFnProps } from '@/components/Pager';
import { GlobalTimeline, HomeTimeline, LocalTimeline } from '@/components/TimelineList';
import TopTabBar from '@/components/TopTabBar';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { useTopTabBar } from '@/hooks/useTopTabBar';
import { useCallback } from 'react';
import { View } from 'react-native';

export default function HomeScreen() {
  const { showTabBar } = useTopTabBar();
  const renderTabBar = useCallback(
    (props: RenderTabBarFnProps) => (
      <TopTabBar
        headerTitle="时间线"
        tabBarBackground={TabBarBackground}
        selectedIndex={props.selectedPage}
        onSelectTab={props.onSelect}
        dragProgress={props.dragProgress}
        dragState={props.dragState}
        tabs={[
          { key: 'home', label: '主页' },
          { key: 'global', label: '全站' },
          { key: 'local', label: '本站' },
        ]}
      />
    ),
    [],
  );

  return (
    <Pager
      renderTabBar={renderTabBar}
      onPageScrollStateChanged={(state) => {
        if (state === 'dragging') {
          showTabBar();
        }
      }}
    >
      <View key="home">
        <HomeTimeline />
      </View>
      <View key="global">
        <GlobalTimeline />
      </View>
      <View key="local">
        <LocalTimeline />
      </View>
    </Pager>
  );
}
