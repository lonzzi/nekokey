/**
 * The code is based on Bluesky's ImageViewing component, the link to the original code is:
 * https://github.com/bluesky-social/social-app/tree/main/src/view/com/lightbox/ImageViewing
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  ListRenderItem,
  PixelRatio,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  ViewToken,
} from 'react-native';
import { Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  AnimationCallback,
  Easing,
  interpolate,
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  WithSpringConfig,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ImageItem, { ImageSource, Transform } from './ImageItem';

const PIXEL_RATIO = PixelRatio.get();

const springOptions = {
  mass: 1.25,
  damping: 150,
  stiffness: 900,
  restDisplacementThreshold: 0.01,
};

export interface ImageViewProps {
  images: ImageSource[];
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
  onRequestClose?: () => void;
  initialPosition?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export type ImageViewItemProps = {
  image: ImageSource;
  onRequestClose?: () => void;
  initialPosition?: ImageViewProps['initialPosition'];
  isInitialImage: boolean;
  openProgress: SharedValue<number>;
  isClosed: SharedValue<boolean>;
  onTap: () => void;
  onZoom: (nextIsScaled: boolean) => void;
  verticalTranslate: SharedValue<number>;
  scaled: boolean;
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ImageViewItem: React.FC<ImageViewItemProps> = ({
  onRequestClose,
  openProgress,
  initialPosition,
  image,
  verticalTranslate,
  scaled,
  onZoom,
  ...rest
}) => {
  const scale = useSharedValue(1);

  const transforms = useDerivedValue(() => {
    if (openProgress.value === 0) {
      return {
        isHidden: true,
        isResting: false,
        scaleAndMoveTransform: [],
        cropFrameTransform: [],
        cropContentTransform: [],
      };
    }

    if (image.width && image.height && initialPosition && openProgress.value < 1) {
      return interpolateTransform(
        openProgress.value,
        initialPosition,
        {
          x: 0,
          y: 0,
          width: SCREEN_WIDTH,
          height: SCREEN_HEIGHT,
        },
        image.width / image.height,
      );
    }

    return {
      isHidden: false,
      isResting: verticalTranslate.value === 0,
      scaleAndMoveTransform: [{ translateY: verticalTranslate.value }],
      cropFrameTransform: [],
      cropContentTransform: [],
    };
  });

  const dismissGesture = Gesture.Pan()
    .activeOffsetY([-10, 10])
    .failOffsetX([-10, 10])
    .maxPointers(1)
    .enabled(!scaled)
    .onChange((event) => {
      'worklet';
      verticalTranslate.value = event.translationY;
    })
    .onEnd((event) => {
      'worklet';
      if (scale.value !== 1) {
        return;
      }

      if (Math.abs(event.velocityY) > 200) {
        const direction = event.translationY > 0 ? 1 : -1;
        verticalTranslate.value = withTiming(
          direction * SCREEN_HEIGHT,
          {
            duration: 300,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          },
          () => {
            if (onRequestClose) {
              runOnJS(onRequestClose)();
            }
          },
        );
      } else {
        verticalTranslate.value = withTiming(0);
      }
    });

  return (
    <ImageItem
      {...rest}
      image={image}
      openProgress={openProgress}
      onRequestClose={onRequestClose}
      transforms={transforms}
      dismissGesture={dismissGesture}
      onZoom={onZoom}
      scaled={scaled}
      imageAspect={(image.width ?? 1) / (image.height ?? 1)}
      verticalTranslate={verticalTranslate}
    />
  );
};

const ImageView: React.FC<ImageViewProps> = ({
  images,
  initialIndex = 0,
  onIndexChange,
  onRequestClose,
  initialPosition,
}) => {
  const flatListRef = useRef<FlatList>(null);
  const openProgress = useSharedValue(0);
  const verticalTranslate = useSharedValue(0);
  const isClosed = useSharedValue(false);
  const showCloseButtonAnim = useSharedValue(1);
  const showCloseButton = useSharedValue(true);
  const { top } = useSafeAreaInsets();
  const [scaled, setScaled] = useState(false);

  const toggleCloseButton = useCallback(() => {
    showCloseButton.value = !showCloseButton.value;
    showCloseButtonAnim.value = withTiming(showCloseButton.value ? 1 : 0, {
      duration: 200,
      easing: Easing.ease,
    });
  }, [onRequestClose]);

  useAnimatedReaction(
    () => openProgress.value,
    (opacity) => {
      showCloseButtonAnim.value = opacity;
    },
    [openProgress],
  );

  useAnimatedReaction(
    () => isClosed.value,
    (closed) => {
      if (closed) {
        openProgress.set(() =>
          withClampedSpring(0, springOptions, () => {
            if (onRequestClose) {
              runOnJS(onRequestClose)();
            }
          }),
        );
      }
    },
    [isClosed],
  );

  useEffect(() => {
    // https://github.com/software-mansion/react-native-reanimated/issues/6677
    rAF_FIXED(() => {
      openProgress.set(() => withClampedSpring(1, springOptions));
    });
  }, [openProgress]);

  const backdropStyle = useAnimatedStyle(() => {
    let opacity = 1;
    const openProgressValue = openProgress.get();
    if (openProgressValue < 1) {
      opacity = Math.sqrt(openProgressValue);
    } else {
      const dragProgress = Math.min(Math.abs(verticalTranslate.value) / (SCREEN_HEIGHT / 2), 1);
      opacity -= dragProgress;
    }
    const factor = 100;
    return {
      opacity: Math.round(opacity * factor) / factor,
    };
  });

  const closeButtonStyle = useAnimatedStyle(() => {
    return {
      opacity: showCloseButtonAnim.value,
      transform: [
        {
          translateY: interpolate(showCloseButtonAnim.value, [0, 1], [-20, 0]),
        },
      ],
    };
  });

  const onZoom = useCallback((nextIsScaled: boolean) => {
    setScaled(nextIsScaled);
  }, []);

  const renderItem: ListRenderItem<ImageSource> = ({ item, index }) => (
    <ImageViewItem
      image={item}
      onRequestClose={onRequestClose}
      initialPosition={initialPosition}
      isInitialImage={index === initialIndex}
      openProgress={openProgress}
      isClosed={isClosed}
      onTap={toggleCloseButton}
      onZoom={onZoom}
      verticalTranslate={verticalTranslate}
      scaled={scaled}
    />
  );

  const onViewableItemsChanged = React.useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        const newIndex = viewableItems[0].index ?? 0;
        onIndexChange?.(newIndex);
      }
    },
    [onIndexChange],
  );

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <Animated.View style={[backdropStyle, StyleSheet.absoluteFill]} className="bg-black" />
      <Animated.View style={[styles.closeButton, closeButtonStyle, { top: top + 20 }]}>
        <TouchableWithoutFeedback
          onPress={() => {
            'worklet';
            isClosed.value = true;
          }}
        >
          <View>
            <Ionicons name="close" size={24} color="white" />
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>
      <FlatList
        ref={flatListRef}
        data={images}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        scrollEnabled={!scaled}
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        initialScrollIndex={initialIndex}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
});

function interpolatePx(px: number, inputRange: readonly number[], outputRange: readonly number[]) {
  'worklet';
  const value = interpolate(px, inputRange, outputRange);
  return Math.round(value * PIXEL_RATIO) / PIXEL_RATIO;
}

function interpolateTransform(
  progress: number,
  thumbnailDims: {
    x: number;
    width: number;
    y: number;
    height: number;
  },
  safeArea: { width: number; height: number; x: number; y: number },
  imageAspect: number,
): {
  scaleAndMoveTransform: Transform;
  cropFrameTransform: Transform;
  cropContentTransform: Transform;
  isResting: boolean;
  isHidden: boolean;
} {
  'worklet';
  const thumbAspect = thumbnailDims.width / thumbnailDims.height;
  let uncroppedInitialWidth;
  let uncroppedInitialHeight;
  if (imageAspect > thumbAspect) {
    uncroppedInitialWidth = thumbnailDims.height * imageAspect;
    uncroppedInitialHeight = thumbnailDims.height;
  } else {
    uncroppedInitialWidth = thumbnailDims.width;
    uncroppedInitialHeight = thumbnailDims.width / imageAspect;
  }
  const safeAreaAspect = safeArea.width / safeArea.height;
  let finalWidth;
  let finalHeight;
  if (safeAreaAspect > imageAspect) {
    finalWidth = safeArea.height * imageAspect;
    finalHeight = safeArea.height;
  } else {
    finalWidth = safeArea.width;
    finalHeight = safeArea.width / imageAspect;
  }
  const initialScale = Math.min(
    uncroppedInitialWidth / finalWidth,
    uncroppedInitialHeight / finalHeight,
  );
  const croppedFinalWidth = thumbnailDims.width / initialScale;
  const croppedFinalHeight = thumbnailDims.height / initialScale;
  const screenCenterX = safeArea.width / 2;
  const screenCenterY = safeArea.height / 2;
  const thumbnailSafeAreaX = thumbnailDims.x - safeArea.x;
  const thumbnailSafeAreaY = thumbnailDims.y - safeArea.y;
  const thumbnailCenterX = thumbnailSafeAreaX + thumbnailDims.width / 2;
  const thumbnailCenterY = thumbnailSafeAreaY + thumbnailDims.height / 2;
  const initialTranslateX = thumbnailCenterX - screenCenterX;
  const initialTranslateY = thumbnailCenterY - screenCenterY;
  const scale = interpolate(progress, [0, 1], [initialScale, 1]);
  const translateX = interpolatePx(progress, [0, 1], [initialTranslateX, 0]);
  const translateY = interpolatePx(progress, [0, 1], [initialTranslateY, 0]);
  const cropScaleX = interpolate(progress, [0, 1], [croppedFinalWidth / finalWidth, 1]);
  const cropScaleY = interpolate(progress, [0, 1], [croppedFinalHeight / finalHeight, 1]);
  return {
    isHidden: false,
    isResting: progress === 1,
    scaleAndMoveTransform: [{ translateX }, { translateY }, { scale }],
    cropFrameTransform: [{ scaleX: cropScaleX }, { scaleY: cropScaleY }],
    cropContentTransform: [{ scaleX: 1 / cropScaleX }, { scaleY: 1 / cropScaleY }],
  };
}

function withClampedSpring(value: number, config: WithSpringConfig, callback?: AnimationCallback) {
  'worklet';
  return withSpring(value, { ...config, overshootClamping: true }, callback);
}

let isFrameScheduled = false;
let pendingFrameCallbacks: Array<() => void> = [];
function rAF_FIXED(callback: () => void) {
  pendingFrameCallbacks.push(callback);
  if (!isFrameScheduled) {
    isFrameScheduled = true;
    requestAnimationFrame(() => {
      const callbacks = pendingFrameCallbacks.slice();
      isFrameScheduled = false;
      pendingFrameCallbacks = [];
      let hasError = false;
      let error;
      for (let i = 0; i < callbacks.length; i++) {
        try {
          callbacks[i]();
        } catch (e) {
          hasError = true;
          error = e;
        }
      }
      if (hasError) {
        throw error;
      }
    });
  }
}

export default ImageView;
