import * as Misskey from 'misskey-js';

import { isIOS } from './platform';

const emojiCache = new Map<string, string | null>();

export const getEmoji = (
  emojisData: Misskey.entities.EmojisResponse['emojis'] | null | undefined,
  name: string,
) => {
  if (emojiCache.has(name)) {
    return emojiCache.get(name);
  }

  if (!emojisData || !Array.isArray(emojisData)) return null;

  const result = emojisData.find((emoji) => emoji.name === name)?.url;
  emojiCache.set(name, result ?? null);

  return result;
};

export const calculateEmojiTranslateY = (height: number) => {
  return height / (isIOS ? 2 : 4);
};
