import { createApi } from '@/lib/api';
import { api as MisskeyApi } from 'misskey-js';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

interface MisskeyApiContextType {
  api: MisskeyApi.APIClient | null;
  setApi: (token: string, host: string) => void;
}

const MisskeyApiContext = createContext<MisskeyApiContextType | undefined>(undefined);

export function MisskeyApiProvider({
  children,
  initialToken,
  initialServer,
}: {
  children: ReactNode;
  initialToken: string;
  initialServer: string;
}) {
  const [api, setApiInstance] = useState<MisskeyApi.APIClient | null>(null);

  const setApi = useCallback((token: string, host: string) => {
    const newApi = createApi(token, host);
    setApiInstance(newApi);
  }, []);

  useEffect(() => {
    if (initialToken && initialServer) {
      setApi(initialToken, initialServer);
    }
  }, [initialToken, initialServer]);

  return (
    <MisskeyApiContext.Provider value={{ api, setApi }}>{children}</MisskeyApiContext.Provider>
  );
}

export function useMisskeyApi() {
  const context = useContext(MisskeyApiContext);
  if (context === undefined) {
    throw new Error('useMisskeyApi must be used within an MisskeyApiProvider');
  }
  return context;
}
