import { createContext, useContext } from 'react';
import { SharedValue, useSharedValue } from 'react-native-reanimated';

interface ParallaxScrollContextType {
  scrollOffset: SharedValue<number>;
}

const ParallaxScrollContext = createContext<ParallaxScrollContextType>({
  scrollOffset: { value: 0 } as SharedValue<number>,
});

export function ParallaxScrollProvider({ children }: { children: React.ReactNode }) {
  const scrollOffset = useSharedValue(0);

  return (
    <ParallaxScrollContext.Provider value={{ scrollOffset }}>
      {children}
    </ParallaxScrollContext.Provider>
  );
}

export function useParallaxScroll() {
  const context = useContext(ParallaxScrollContext);
  if (!context) {
    throw new Error('useParallaxScrollContext must be used within a ParallaxScrollProvider');
  }
  return context;
}
