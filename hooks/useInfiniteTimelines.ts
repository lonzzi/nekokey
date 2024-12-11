import { useMisskeyApi } from '@/lib/contexts/MisskeyApiContext';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Endpoints } from 'misskey-js';

type TimelineEndpoint = keyof Pick<
  Endpoints,
  | 'notes/timeline'
  | 'notes/global-timeline'
  | 'notes/local-timeline'
  | 'notes/hybrid-timeline'
  | 'notes/user-list-timeline'
>;

export const useInfiniteTimelines = (endpoint: TimelineEndpoint) => {
  const { api } = useMisskeyApi();

  return useInfiniteQuery({
    queryKey: [endpoint],
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      if (!api) throw new Error('API not initialized');
      return await api.request<'notes/timeline', Endpoints[TimelineEndpoint]['req']>(
        endpoint as 'notes/timeline',
        {
          limit: 10,
          untilId: pageParam,
        },
      );
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length === 0) return undefined;
      return lastPage[lastPage.length - 1].id;
    },
    select: (data) => data.pages.flat(),
  });
};
