import { api as MisskeyApi } from 'misskey-js';
import * as Misskey from 'misskey-js';

const removeProtocol = (host: string): string => {
  return host.replace(/^(https?:\/\/)/, '');
};

let misskeyApi: MisskeyApi.APIClient | null = null;
let misskeyStream: Misskey.Stream | null = null;

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

export const initMisskeyClient = (token: string, host: string) => {
  const cleanHost = removeProtocol(host);

  if (!misskeyApi) {
    misskeyApi = createMisskeyClient(token, `https://${cleanHost}`);
  }
  if (!misskeyStream) {
    misskeyStream = new Misskey.Stream(`wss://${cleanHost}`, { token });
  }

  return { misskeyApi, misskeyStream };
};

export const useMisskeyApi = (): MisskeyApi.APIClient => {
  if (!misskeyApi) {
    throw new Error('API client is not initialized.');
  }
  return misskeyApi;
};

export const useMisskeyStream = (): Misskey.Stream => {
  if (!misskeyStream) {
    throw new Error('Stream is not initialized.');
  }
  return misskeyStream;
};

export { misskeyApi };
