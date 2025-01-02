import { Pager, RenderTabBarFnProps } from '@/components/Pager';
import { GlobalTimeline, HomeTimeline, LocalTimeline } from '@/components/TimelineList';
import TopTabBar from '@/components/TopTabBar';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { useTopTabBar } from '@/lib/contexts/TopTabBarContext';
import { useCallback } from 'react';
import { View } from 'react-native';

const TIMELINE_TABS = [
  {
    key: 'home',
    label: '主页',
    component: HomeTimeline,
  },
  {
    key: 'global',
    label: '全站',
    component: GlobalTimeline,
  },
  {
    key: 'local',
    label: '本站',
    component: LocalTimeline,
  },
] as const;

export default function HomeScreen() {
  const { showTabBar, currentIndex } = useTopTabBar();

  const renderTabBar = useCallback(
    (props: RenderTabBarFnProps) => (
      <TopTabBar
        headerTitle="时间线"
        tabBarBackground={TabBarBackground}
        selectedIndex={props.selectedPage}
        onSelectTab={props.onSelect}
        dragProgress={props.dragProgress}
        dragState={props.dragState}
        tabs={TIMELINE_TABS.map(({ key, label }) => ({ key, label }))}
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
      {TIMELINE_TABS.map(({ key, component: TimelineComponent }, index) => (
        <View key={key} className="flex-1">
          <TimelineComponent isFocused={currentIndex === index} />
        </View>
      ))}
    </Pager>
  );
}
