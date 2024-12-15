import React from 'react';
import { View } from 'react-native';
import { Gesture } from 'react-native-gesture-handler/lib/typescript/handlers/gestures/gesture';
import { SharedValue } from 'react-native-reanimated';

import { ImageViewItemProps } from './ImageView';

export interface ImageSource {
  uri: string;
  thumbnailUrl?: string | null;
  width?: number;
  height?: number;
}

export type ImageItemProps = ImageViewItemProps & {
  transforms: SharedValue<{
    scale: number;
    translateX: number;
    translateY: number;
    verticalTranslate: number;
  }>;
  dismissGesture: Gesture;
  scaled: boolean;
  onZoom: (nextIsScaled: boolean) => void;
};

const ImageItem: React.FC<ImageItemProps> = () => {
  return <View />;
};

export default ImageItem;
