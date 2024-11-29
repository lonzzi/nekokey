import { createApi } from '@/lib/api';
import { api as MisskeyApi } from 'misskey-js';
import { createContext, ReactNode, useCallback, useContext, useState } from 'react';

interface ApiContextType {
  api: MisskeyApi.APIClient | null;
  setApi: (token: string, host: string) => void;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export function ApiProvider({ children }: { children: ReactNode }) {
  const [api, setApiInstance] = useState<MisskeyApi.APIClient | null>(null);

  const setApi = useCallback((token: string, host: string) => {
    const newApi = createApi(token, host);
    setApiInstance(newApi);
  }, []);

  return <ApiContext.Provider value={{ api, setApi }}>{children}</ApiContext.Provider>;
}

export function useApi() {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}
