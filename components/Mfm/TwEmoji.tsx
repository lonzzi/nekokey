import { Image } from 'expo-image';
import React from 'react';
import { Text } from 'react-native';
import twemoji from 'twemoji';

interface EmojiProps {
  text: string;
  height?: number;
}

export const TwEmoji: React.FC<EmojiProps> = ({ text, height = 20 }) => {
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
            transform: [{ translateY: height / 5 }],
          }}
          contentFit="contain"
        />
      </Text>
    );
  }

  return <Text>{text}</Text>;
};
