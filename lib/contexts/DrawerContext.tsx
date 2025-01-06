import React from 'react';

import { DrawerOpenProvider } from './DrawerOpenContext';
import { DrawerSwipeProvider } from './DrawerSwipeContext';

export function DrawerProvider({ children }: React.PropsWithChildren) {
  return (
    <DrawerSwipeProvider>
      <DrawerOpenProvider>{children}</DrawerOpenProvider>
    </DrawerSwipeProvider>
  );
}

export { useIsDrawerSwipeDisabled, useSetDrawerSwipeDisabled } from './DrawerSwipeContext';

export { useIsDrawerOpen, useSetDrawerOpen } from './DrawerOpenContext';
