import { UseQueryResult } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

const useRefresh = (query: UseQueryResult) => {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    query.refetch().finally(() => setRefreshing(false));
  }, [query]);

  return { refreshing, onRefresh };
};

export default useRefresh;
