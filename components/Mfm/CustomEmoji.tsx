import { calculateEmojiTranslateY } from '@/lib/utils/emojis';
import { isAndroid } from '@/lib/utils/platform';
import { Text } from 'react-native';

import AutoResizingImage from '../AutoResizingImage';

export const CustomEmoji = ({
  emojiName,
  emojiUrl,
  height,
  isName = false,
}: {
  emojiName: string;
  emojiUrl: string;
  height: number;
  isName?: boolean;
}) => {
  if (emojiUrl) {
    // 0 width character to prevent layout shift
    return (
      <Text>
        {'\u200B'}
        <AutoResizingImage
          source={{ uri: emojiUrl }}
          height={height}
          style={{
            transform: [
              {
                translateY:
                  calculateEmojiTranslateY(height) +
                  (isName ? (isAndroid ? -(height * 0.2) : -5) : 0),
              },
            ],
          }}
        />
      </Text>
    );
  }
  return <Text>:{emojiName}:</Text>;
};
