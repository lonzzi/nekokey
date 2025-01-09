import { useCallback, useState } from 'react';

type FetchFn = () => Promise<unknown>;

const useRefresh = (query: FetchFn) => {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    query().finally(() => setRefreshing(false));
  }, [query]);

  return { refreshing, onRefresh };
};

export default useRefresh;
