import * as FileSystem from 'expo-file-system';
import { useCallback, useEffect, useRef, useState } from 'react';

interface CacheOptions {
  // 缓存过期时间（毫秒）
  expiresIn?: number;
  // 缓存大小限制（字节）
  maxSize?: number;
  // 是否在组件挂载时立即加载
  immediate?: boolean;
}

interface UseCacheFileProps {
  url: string | null | undefined;
  key: string;
  options?: CacheOptions;
}

interface CacheMetadata {
  timestamp: number;
  url: string;
}

export const useFileCache = ({ url, key, options = {} }: UseCacheFileProps) => {
  const {
    expiresIn = 7 * 24 * 60 * 60 * 1000, // 默认7天
    maxSize = 50 * 1024 * 1024, // 默认50MB
    immediate = true,
  } = options;

  const [cachedUri, setCachedUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const getCacheDir = useCallback(() => {
    return `${FileSystem.cacheDirectory}${key}/`;
  }, [key]);

  const getMetadataPath = useCallback(() => {
    return `${getCacheDir()}metadata.json`;
  }, [getCacheDir]);

  const readMetadata = async (): Promise<Record<string, CacheMetadata>> => {
    try {
      const metadataPath = getMetadataPath();
      const exists = await FileSystem.getInfoAsync(metadataPath);
      if (!exists.exists) return {};

      const content = await FileSystem.readAsStringAsync(metadataPath);
      return JSON.parse(content);
    } catch {
      return {};
    }
  };

  const writeMetadata = async (metadata: Record<string, CacheMetadata>) => {
    const metadataPath = getMetadataPath();
    await FileSystem.writeAsStringAsync(metadataPath, JSON.stringify(metadata));
  };

  const cleanCache = useCallback(async () => {
    try {
      const metadata = await readMetadata();
      const now = Date.now();
      const updatedMetadata: Record<string, CacheMetadata> = {};

      for (const [path, data] of Object.entries(metadata)) {
        if (now - data.timestamp <= expiresIn) {
          updatedMetadata[path] = data;
        } else {
          await FileSystem.deleteAsync(path, { idempotent: true });
        }
      }

      await writeMetadata(updatedMetadata);
    } catch (err) {
      console.error('Error cleaning cache:', err);
    }
  }, [expiresIn, maxSize]);

  const cacheFile = useCallback(
    async (fileUrl: string) => {
      if (!fileUrl) return;

      try {
        setIsLoading(true);
        setError(null);

        const filename = fileUrl.split('/').pop();
        const dir = getCacheDir();
        const path = dir + filename;

        const dirInfo = await FileSystem.getInfoAsync(dir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
        }

        const metadata = await readMetadata();
        const existingFile = metadata[path];

        if (existingFile && Date.now() - existingFile.timestamp <= expiresIn) {
          const fileInfo = await FileSystem.getInfoAsync(path);
          if (fileInfo.exists) {
            setCachedUri(path);
            return;
          }
        }

        abortControllerRef.current = new AbortController();

        await FileSystem.downloadAsync(fileUrl, path);

        metadata[path] = {
          timestamp: Date.now(),
          url: fileUrl,
        };
        await writeMetadata(metadata);

        await cleanCache();

        setCachedUri(path);
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') return;

        const error = err instanceof Error ? err : new Error('Failed to cache file');
        setError(error);
        setCachedUri(fileUrl); // 失败时使用原始URL
      } finally {
        setIsLoading(false);
      }
    },
    [getCacheDir, expiresIn, cleanCache],
  );

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (url && immediate) {
      cacheFile(url);
    }

    return () => {
      cancel();
    };
  }, [url, immediate, cacheFile, cancel]);

  return {
    cachedUri,
    isLoading,
    error,
    reload: () => url && cacheFile(url),
    cancel,
  };
};
