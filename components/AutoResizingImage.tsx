import { Colors } from '@/constants/Colors';
import { Image, useImage } from 'expo-image';
import React, { useEffect, useState } from 'react';
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
  const [currentUri, setCurrentUri] = useState(source.uri);

  const image = useImage(currentUri, {
    onError: (error) => {
      console.log('Image loading error:', error);
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
          setCurrentUri(`${source.uri}${source.uri.includes('?') ? '&' : '?'}retry=${Date.now()}`);
        }, RETRY_DELAY);
      }
    },
  });

  useEffect(() => {
    setRetryCount(0);
    setCurrentUri(source.uri);
  }, [source.uri]);

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
      className={className}
      source={{ uri: currentUri }}
      placeholder={image}
      style={[imageSize, style]}
      contentFit="contain"
      recyclingKey={currentUri}
      transition={200}
    />
  );
};

export default AutoResizingImage;
