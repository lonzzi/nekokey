import React from 'react';
import { TransformsStyle, View } from 'react-native';
import { Gesture } from 'react-native-gesture-handler/lib/typescript/handlers/gestures/gesture';
import { SharedValue } from 'react-native-reanimated';

import { ImageViewItemProps } from './ImageView';

export type Transform = Exclude<TransformsStyle['transform'], string | undefined>;

export type Rect = { x: number; y: number; width: number; height: number };

export interface ImageSource {
  uri: string;
  thumbnailUrl?: string | null;
  width?: number;
  height?: number;
  thumbRect?: Rect;
  isSensitive?: boolean;
}

export type ImageItemProps = ImageViewItemProps & {
  transforms: SharedValue<{
    scaleAndMoveTransform: Transform;
    cropFrameTransform: Transform;
    cropContentTransform: Transform;
    isResting: boolean;
    isHidden: boolean;
  }>;
  dismissGesture: Gesture;
  scaled: boolean;
  imageAspect: number;
  onLongPress?: () => void;
};

const ImageItem: React.FC<ImageItemProps> = () => {
  return <View />;
};

export default ImageItem;
