import React, { createContext, useCallback, useContext, useState } from 'react';

import { useShellMode } from './ShellMode';

interface TopTabBarContextType {
  topbarHeight: number;
  currentIndex: number;
  setTopbarHeight: (height: number) => void;
  setCurrentIndex: (index: number) => void;
  showTabBar: () => void;
}

const TopTabBarContext = createContext<TopTabBarContextType | undefined>(undefined);

export function TopTabBarProvider({ children }: { children: React.ReactNode }) {
  const [topbarHeight, setTopbarHeight] = useState<number>(0);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const { setMode } = useShellMode();

  const showTabBar = useCallback(() => {
    'worklet';
    setMode(false);
  }, [setMode]);

  const value = {
    topbarHeight,
    currentIndex,
    setTopbarHeight,
    setCurrentIndex,
    showTabBar,
  };

  return <TopTabBarContext.Provider value={value}>{children}</TopTabBarContext.Provider>;
}

export function useTopTabBar() {
  const context = useContext(TopTabBarContext);
  if (context === undefined) {
    throw new Error('useTopTabBar must be used within a TopTabBarProvider');
  }
  return context;
}
