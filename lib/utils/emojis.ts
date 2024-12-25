import * as Misskey from 'misskey-js';

const emojiCache = new Map<string, string | null>();

export const getEmoji = (
  emojisData: Misskey.entities.EmojisResponse | null | undefined,
  name: string,
) => {
  if (emojiCache.has(name)) {
    return emojiCache.get(name);
  }

  if (!emojisData) return null;

  const result = emojisData.emojis.find((emoji) => emoji.name === name)?.url;
  emojiCache.set(name, result ?? null);

  return result;
};
