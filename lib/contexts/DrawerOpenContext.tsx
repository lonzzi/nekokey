import React from 'react';

type OpenStateContext = {
  isOpen: boolean;
};

type OpenSetContext = {
  setIsOpen: (v: boolean) => void;
};

const openStateContext = React.createContext<OpenStateContext>({
  isOpen: false,
});

const openSetContext = React.createContext<OpenSetContext>({
  setIsOpen: () => {},
});

export function DrawerOpenProvider({ children }: React.PropsWithChildren) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <openStateContext.Provider value={{ isOpen }}>
      <openSetContext.Provider value={{ setIsOpen }}>{children}</openSetContext.Provider>
    </openStateContext.Provider>
  );
}

export function useIsDrawerOpen() {
  return React.useContext(openStateContext).isOpen;
}

export function useSetDrawerOpen() {
  return React.useContext(openSetContext).setIsOpen;
}
