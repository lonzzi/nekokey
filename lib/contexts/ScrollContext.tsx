import { createContext, useContext, useMemo } from 'react';
import { NativeScrollEvent } from 'react-native';

type ScrollContextType = {
  onBeginDrag: (e: NativeScrollEvent) => void;
  onEndDrag: (e: NativeScrollEvent) => void;
  onScroll: (e: NativeScrollEvent) => void;
  onMomentumEnd: (e: NativeScrollEvent) => void;
};

export const ScrollContext = createContext<ScrollContextType>({
  onBeginDrag: () => {},
  onEndDrag: () => {},
  onScroll: () => {},
  onMomentumEnd: () => {},
});

type ScrollContextProviderProps = {
  children: React.ReactNode;
} & ScrollContextType;

export function ScrollProvider({
  children,
  onBeginDrag,
  onEndDrag,
  onScroll,
  onMomentumEnd,
}: ScrollContextProviderProps) {
  const handlers = useMemo(
    () => ({
      onBeginDrag,
      onEndDrag,
      onScroll,
      onMomentumEnd,
    }),
    [onBeginDrag, onEndDrag, onScroll, onMomentumEnd],
  );

  return <ScrollContext.Provider value={handlers}>{children}</ScrollContext.Provider>;
}

export const useScrollHandlers = () => useContext(ScrollContext);
