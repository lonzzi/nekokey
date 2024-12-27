import React from 'react';

type StateContext = {
  isSwipeDisabled: boolean;
  isOpen: boolean;
};
type SetContext = {
  setIsSwipeDisabled: (v: boolean) => void;
  setIsOpen: (v: boolean) => void;
};

const stateContext = React.createContext<StateContext>({
  isSwipeDisabled: false,
  isOpen: false,
});
const setContext = React.createContext<SetContext>({
  setIsSwipeDisabled: () => {},
  setIsOpen: () => {},
});

export function DrawerProvider({ children }: React.PropsWithChildren) {
  const [isSwipeDisabled, setIsSwipeDisabled] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <stateContext.Provider value={{ isSwipeDisabled, isOpen }}>
      <setContext.Provider value={{ setIsSwipeDisabled, setIsOpen }}>
        {children}
      </setContext.Provider>
    </stateContext.Provider>
  );
}

export function useIsDrawerSwipeDisabled() {
  return React.useContext(stateContext).isSwipeDisabled;
}

export function useSetDrawerSwipeDisabled() {
  return React.useContext(setContext).setIsSwipeDisabled;
}

export function useIsDrawerOpen() {
  return React.useContext(stateContext).isOpen;
}

export function useSetDrawerOpen() {
  return React.useContext(setContext).setIsOpen;
}
