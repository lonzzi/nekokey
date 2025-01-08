import { isIOS } from '@/lib/utils/platform';
import { StyleProp, Text, TextStyle } from 'react-native';

import AutoResizingImage from '../AutoResizingImage';

export const CustomEmoji = ({
  emojiName,
  emojiUrl,
  style,
}: {
  emojiName: string;
  emojiUrl: string;
  style: StyleProp<TextStyle>;
}) => {
  const fontSize = (style as TextStyle)?.fontSize;
  const height = fontSize === 16 ? 24 : (fontSize ?? 24);
  if (emojiUrl) {
    // 0 width character to prevent layout shift
    return (
      <Text>
        {'\u200B'}
        <AutoResizingImage
          source={{ uri: emojiUrl }}
          height={height}
          style={{ transform: [{ translateY: (height || 24) / (isIOS ? 2 : 4) }] }}
        />
      </Text>
    );
  }
  return <Text>:{emojiName}:</Text>;
};
