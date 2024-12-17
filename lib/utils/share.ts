import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export const openImageShareModal = async (url: string) => {
  try {
    let localUri = url;
    if (url.startsWith('http')) {
      const getExtension = (url: string) => {
        const match = url.match(/\.(?:jpg|jpeg|png|gif|webp)$/i);
        return match ? match[0] : '.png';
      };
      const extension = getExtension(url);
      const filename = `${url.split('/').pop()}${extension}`;
      const localPath = `${FileSystem.cacheDirectory}${filename}`;

      const { uri } = await FileSystem.downloadAsync(url, localPath);
      localUri = uri;
    }

    await Sharing.shareAsync(localUri, {
      mimeType: 'image/png',
      UTI: 'public.image',
      dialogTitle: '分享图片',
    });
  } catch (error) {
    console.error('分享失败:', error);
  }
};
