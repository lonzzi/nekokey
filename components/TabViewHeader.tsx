import { Header } from '@react-navigation/elements';
import { useTheme } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { ComponentProps } from 'react';
import { Dimensions, StyleSheet, useColorScheme, View } from 'react-native';
import { TabBar, TabView } from 'react-native-tab-view';

type TabViewHeaderProps = {
  headerProps: ComponentProps<typeof Header>;
  tabViewProps: Omit<ComponentProps<typeof TabView>, 'renderScene'>;
};

const TabViewHeader = ({ headerProps, tabViewProps }: TabViewHeaderProps) => {
  const theme = useTheme();
  const colorScheme = useColorScheme();

  const renderTabBar = (props: ComponentProps<typeof TabBar>) => (
    <TabBar
      {...props}
      indicatorStyle={{
        backgroundColor: theme.colors.primary,
      }}
      style={{
        backgroundColor: 'transparent',
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 0,
        shadowColor: 'transparent',
      }}
      tabStyle={{ backgroundColor: 'transparent' }}
      activeColor={theme.colors.primary}
      inactiveColor={theme.colors.text}
    />
  );

  return (
    <View style={styles.container}>
      <BlurView
        tint={colorScheme === 'dark' ? 'dark' : 'light'}
        intensity={100}
        style={StyleSheet.absoluteFill}
      />
      <Header {...headerProps} />
      <TabView
        {...tabViewProps}
        renderScene={() => null}
        initialLayout={{ width: Dimensions.get('window').width }}
        renderTabBar={renderTabBar}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  blur: {
    zIndex: 1,
  },
  header: {
    zIndex: 2,
  },
});

export default TabViewHeader;
