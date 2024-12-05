import React from 'react';
import { Animated } from 'react-native';

type ScrollContextType = {
  scrollY: Animated.Value;
};

export const ScrollContext = React.createContext<ScrollContextType>({
  scrollY: new Animated.Value(0),
});

export function ScrollProvider({ children }: { children: React.ReactNode }) {
  const scrollY = React.useRef(new Animated.Value(0)).current;

  return <ScrollContext.Provider value={{ scrollY }}>{children}</ScrollContext.Provider>;
}

export const useScroll = () => React.useContext(ScrollContext);
