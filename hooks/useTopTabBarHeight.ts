import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_BAR_BASE_HEIGHT = 88;

export function useTopTabBarHeight() {
  const insets = useSafeAreaInsets();
  return insets.top + TAB_BAR_BASE_HEIGHT;
}
