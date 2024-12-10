import { useShellMode } from '@/lib/contexts/ShellMode';
import { useCallback } from 'react';

export const useTopTabBar = () => {
  const { setMode } = useShellMode();

  const showTabBar = useCallback(() => {
    'worklet';
    setMode(false);
  }, [setMode]);

  return {
    showTabBar,
  };
};
