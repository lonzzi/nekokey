import { Image } from 'expo-image';
import React, { useState } from 'react';
import { ImageStyle, StyleProp } from 'react-native';

const AutoResizingImage = ({
  uri,
  height = 24,
  className,
  style,
}: {
  uri: string;
  height?: number;
  className?: string;
  style?: StyleProp<ImageStyle>;
}) => {
  const [imageSize, setImageSize] = useState({ width: height, height: height });

  const onImageLoad = ({ source }: { source: { width: number; height: number } }) => {
    const { width, height: sourceHeight } = source;
    if (width && sourceHeight) {
      const scaleFactor = height / sourceHeight;
      setImageSize({
        width: width * scaleFactor,
        height: height,
      });
    }
  };

  return (
    <Image
      className={className}
      source={{ uri }}
      style={[imageSize, style]}
      onLoad={onImageLoad}
      contentFit="contain"
      cachePolicy="memory-disk"
    />
  );
};

export default AutoResizingImage;
