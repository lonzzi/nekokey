import { api as MisskeyApi } from 'misskey-js';

let misskeyClient: MisskeyApi.APIClient | null = null;

export const createMisskeyClient = (token: string, host: string): MisskeyApi.APIClient => {
  if (!token || !host) {
    throw new Error('Token and host are required to create API client');
  }

  const origin =
    host.startsWith('http://') || host.startsWith('https://') ? host : `https://${host}`;

  return new MisskeyApi.APIClient({
    origin,
    credential: token,
  });
};

export const initMisskeyClient = (token: string, host: string): MisskeyApi.APIClient => {
  if (!misskeyClient) {
    misskeyClient = createMisskeyClient(token, host);
  }
  return misskeyClient;
};

export const getMisskeyClient = (): MisskeyApi.APIClient => {
  if (!misskeyClient) {
    throw new Error('API client is not initialized. Call initMisskeyClient first.');
  }
  return misskeyClient;
};

export { misskeyClient };
