import { createContext, useContext } from 'react';
import { SharedValue, useAnimatedReaction, useSharedValue } from 'react-native-reanimated';

type ScrollContextType = {
  scrollY: SharedValue<number>;
  /**
   * 0: 停止
   * 1: 向上
   * 2: 向下
   */
  directionValue: SharedValue<number>;
  isDragging: SharedValue<boolean>;
  dragStartY: SharedValue<number>;
  dragEndY: SharedValue<number>;
};

export const ScrollContext = createContext<ScrollContextType>({
  scrollY: { value: 0 } as SharedValue<number>,
  directionValue: { value: 0 } as SharedValue<number>,
  isDragging: { value: false } as SharedValue<boolean>,
  dragStartY: { value: 0 } as SharedValue<number>,
  dragEndY: { value: 0 } as SharedValue<number>,
});

export function ScrollProvider({ children }: { children: React.ReactNode }) {
  const scrollY = useSharedValue(0);
  const directionValue = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const lastScrollY = useSharedValue(0);
  const dragStartY = useSharedValue(0);
  const dragEndY = useSharedValue(0);
  const SCROLL_THRESHOLD = 10; // 滚动阈值（单位：像素）

  const updateScrollDirection = (currentY: number) => {
    'worklet';
    const diff = currentY - lastScrollY.value;
    if (Math.abs(diff) < SCROLL_THRESHOLD) {
      return;
    }

    if (diff > 0) {
      directionValue.value = 2; // 向下滚动
    } else {
      directionValue.value = 1; // 向上滚动
    }
    lastScrollY.value = currentY;
  };

  useAnimatedReaction(
    () => scrollY.value,
    (currentY) => {
      updateScrollDirection(currentY);
    },
  );

  return (
    <ScrollContext.Provider value={{ scrollY, directionValue, isDragging, dragStartY, dragEndY }}>
      {children}
    </ScrollContext.Provider>
  );
}

export const useScroll = () => useContext(ScrollContext);
