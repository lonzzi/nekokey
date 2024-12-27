import React, { createContext, useContext, useState } from 'react';

interface TopTabBarContextType {
  topbarHeight: number;
  currentIndex: number;
  setTopbarHeight: (height: number) => void;
  setCurrentIndex: (index: number) => void;
}

const TopTabBarContext = createContext<TopTabBarContextType | undefined>(undefined);

export function TopTabBarProvider({ children }: { children: React.ReactNode }) {
  const [topbarHeight, setTopbarHeight] = useState<number>(0);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const value = {
    topbarHeight,
    currentIndex,
    setTopbarHeight,
    setCurrentIndex,
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
