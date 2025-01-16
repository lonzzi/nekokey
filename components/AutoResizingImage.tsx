import { Colors } from '@/constants/Colors';
import { Image, useImage } from 'expo-image';
import React, { useState } from 'react';
import { ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

const AutoResizingImage = ({
  source,
  height = 24,
  className,
  style,
}: {
  source: { uri: string };
  height?: number;
  className?: string;
  style?: StyleProp<ImageStyle>;
}) => {
  const [retryCount, setRetryCount] = useState(0);
  const [imageKey, setImageKey] = useState(0);

  const image = useImage(source.uri, {
    onError: (error) => {
      console.log('Image loading error:', error);
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
          setImageKey((prevKey) => prevKey + 1);
        }, RETRY_DELAY);
      }
    },
  });

  if (!image) {
    return (
      <View
        style={[
          { height, width: height, backgroundColor: Colors.common.loadingBg, borderRadius: 4 },
          StyleSheet.flatten(style as StyleProp<ViewStyle>),
        ]}
      />
    );
  }

  const imageAspectRatio = image.width / image.height;

  const imageSize = {
    width: imageAspectRatio * height,
    height: height,
  };

  return (
    <Image
      key={imageKey}
      className={className}
      source={{ uri: source.uri }}
      placeholder={image}
      style={[imageSize, style]}
      contentFit="contain"
      recyclingKey={source.uri}
      transition={200}
    />
  );
};

export default AutoResizingImage;
