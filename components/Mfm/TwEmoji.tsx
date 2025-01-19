import { calculateEmojiTranslateY } from '@/lib/utils/emojis';
import { Image } from 'expo-image';
import React from 'react';
import { Text } from 'react-native';
import twemoji from 'twemoji';

interface EmojiProps {
  text: string;
  height?: number;
  offset?: number;
}

export const TwEmoji: React.FC<EmojiProps> = ({ text, height = 20, offset = 0 }) => {
  const parsed = twemoji.parse(text, {
    folder: 'svg',
    ext: '.svg',
    base: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/',
  });

  const match = parsed.match(/src="([^"]+)"/);
  const url = match ? match[1] : null;

  if (url) {
    return (
      <Text>
        <Image
          source={{ uri: url }}
          style={{
            height,
            width: height,
            transform: [{ translateY: calculateEmojiTranslateY(height) + offset }],
          }}
          contentFit="contain"
        />
      </Text>
    );
  }

  return <Text>{text}</Text>;
};
