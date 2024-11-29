import { api as MisskeyApi } from 'misskey-js';

export const createApi = (token: string, host: string) => {
  return new MisskeyApi.APIClient({
    origin: `https://${host}`,
    credential: token,
  });
};
