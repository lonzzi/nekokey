import { createContext, useCallback, useContext } from 'react';
import { SharedValue, useSharedValue, withSpring } from 'react-native-reanimated';

type ShellModeContextType = {
  dragStartY: SharedValue<number | null>;
  headerMode: SharedValue<number>;
  setMode: (v: boolean) => void;
};

export const ShellModeContext = createContext<ShellModeContextType>({
  dragStartY: { value: null } as SharedValue<number | null>,
  headerMode: { value: 0 } as SharedValue<number>,
  setMode: () => {},
});

export function ShellModeProvider({ children }: { children: React.ReactNode }) {
  const dragStartY = useSharedValue<number | null>(null);
  const headerMode = useSharedValue(0);

  const setMode = useCallback(
    (v: boolean) => {
      'worklet';
      headerMode.value = withSpring(v ? 1 : 0, {
        overshootClamping: true,
      });
    },
    [headerMode],
  );

  return (
    <ShellModeContext.Provider
      value={{
        dragStartY,
        headerMode,
        setMode,
      }}
    >
      {children}
    </ShellModeContext.Provider>
  );
}

export const useShellMode = () => useContext(ShellModeContext);
