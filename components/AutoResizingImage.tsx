import { Colors } from '@/constants/Colors';
import { isAndroid } from '@/lib/utils/platform';
import { Image, useImage } from 'expo-image';
import React from 'react';
import { ImageStyle, StyleProp, View, ViewStyle } from 'react-native';

const AutoResizingImage = ({
  source,
  height = 24,
  className,
  style,
  placeholderStyle,
}: {
  source: { uri: string };
  height?: number;
  className?: string;
  style?: StyleProp<ImageStyle>;
  placeholderStyle?: StyleProp<ViewStyle>;
}) => {
  const image = useImage(source.uri, {
    maxHeight: height,
    onError: (error) => {
      console.log(error);
    },
  });

  if (!image) {
    return (
      <View
        style={[
          { height, width: height, backgroundColor: Colors.common.loadingBg, borderRadius: 4 },
          placeholderStyle,
        ]}
      />
    );
  }

  const imageAspectRatio = image.width / image.height;

  const imageSize = {
    width: isAndroid ? imageAspectRatio * height : image.width,
    height: isAndroid ? height : image.height,
  };

  return (
    <Image
      className={className}
      source={source}
      style={[imageSize, style]}
      contentFit="contain"
      cachePolicy="memory-disk"
      recyclingKey={source.uri}
      transition={200}
    />
  );
};

export default AutoResizingImage;
