import { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import { Animated } from 'react-native';

type ScrollContextType = {
  scrollY: Animated.Value;
  /**
   * 0: 停止
   * 1: 向上
   * 2: 向下
   */
  directionValue: Animated.Value;
  isDragging: Animated.Value;
};

export const ScrollContext = createContext<ScrollContextType>({
  scrollY: new Animated.Value(0),
  directionValue: new Animated.Value(0),
  isDragging: new Animated.Value(0),
});

export function ScrollProvider({ children }: { children: React.ReactNode }) {
  const scrollY = useRef(new Animated.Value(0)).current;
  const directionValue = useRef(new Animated.Value(0)).current;
  const isDragging = useRef(new Animated.Value(0)).current;
  const scrollEndTimer = useRef<NodeJS.Timeout>();
  const lastScrollY = useRef(0);
  const SCROLL_THRESHOLD = 1;
  const lastDirection = useRef<'up' | 'down' | null>(null);

  const handleScroll = useCallback((value: number) => {
    const scrollDiff = value - lastScrollY.current;

    if (Math.abs(scrollDiff) > SCROLL_THRESHOLD) {
      const direction = scrollDiff > 0 ? 'down' : 'up';

      lastDirection.current = direction;
      directionValue.setValue(direction === 'up' ? 1 : 2);
      lastScrollY.current = value;
    }

    if (scrollEndTimer.current) {
      clearTimeout(scrollEndTimer.current);
    }
  }, []);

  useEffect(() => {
    const scrollListener = scrollY.addListener(({ value }) => handleScroll(value));

    return () => {
      scrollY.removeListener(scrollListener);
      if (scrollEndTimer.current) {
        clearTimeout(scrollEndTimer.current);
      }
    };
  }, [scrollY, handleScroll]);

  return (
    <ScrollContext.Provider value={{ scrollY, directionValue, isDragging }}>
      {children}
    </ScrollContext.Provider>
  );
}

export const useScroll = () => useContext(ScrollContext);
