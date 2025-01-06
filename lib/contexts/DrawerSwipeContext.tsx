import React from 'react';

type SwipeStateContext = {
  isSwipeDisabled: boolean;
};

type SwipeSetContext = {
  setIsSwipeDisabled: (v: boolean) => void;
};

const swipeStateContext = React.createContext<SwipeStateContext>({
  isSwipeDisabled: false,
});

const swipeSetContext = React.createContext<SwipeSetContext>({
  setIsSwipeDisabled: () => {},
});

export function DrawerSwipeProvider({ children }: React.PropsWithChildren) {
  const [isSwipeDisabled, setIsSwipeDisabled] = React.useState(false);

  return (
    <swipeStateContext.Provider value={{ isSwipeDisabled }}>
      <swipeSetContext.Provider value={{ setIsSwipeDisabled }}>{children}</swipeSetContext.Provider>
    </swipeStateContext.Provider>
  );
}

export function useIsDrawerSwipeDisabled() {
  return React.useContext(swipeStateContext).isSwipeDisabled;
}

export function useSetDrawerSwipeDisabled() {
  return React.useContext(swipeSetContext).setIsSwipeDisabled;
}
