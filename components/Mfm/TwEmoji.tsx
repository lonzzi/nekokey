import { useAuth } from '@/lib/contexts/AuthContext';
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
  const { serverInfo } = useAuth();

  const codePoint = twemoji.convert.toCodePoint(text);
  const url = `${serverInfo?.meta.uri}/twemoji/${codePoint}.svg`;

  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={{
          height,
          width: height,
          transform: [{ translateY: calculateEmojiTranslateY(height) + offset }],
        }}
        contentFit="contain"
      />
    );
  }

  return <Text>{text}</Text>;
};
