import { GlobalTimeline, HomeTimeline, LocalTimeline } from '@/components/TimelineList';
import TopTabBar from '@/components/TopTabBar';
import { useTopTabBar } from '@/hooks/useTopTabBar';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

const Tab = createMaterialTopTabNavigator();

export default function HomeScreen() {
  const { showTabBar } = useTopTabBar();

  return (
    <Tab.Navigator
      tabBar={(props) => <TopTabBar {...props} headerTitle="时间线" />}
      screenListeners={{
        swipeStart: () => {
          showTabBar();
        },
      }}
    >
      <Tab.Screen name="综合" component={HomeTimeline} />
      <Tab.Screen name="全局" component={GlobalTimeline} />
      <Tab.Screen name="本地" component={LocalTimeline} />
    </Tab.Navigator>
  );
}
