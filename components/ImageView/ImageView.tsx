import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  ListRenderItem,
  StyleSheet,
  TouchableOpacity,
  ViewToken,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const AnimatedImage = Animated.createAnimatedComponent(Image);

interface ImageViewProps {
  images: string[];
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const springOptions = {
  mass: 1.25,
  damping: 150,
  stiffness: 900,
  restDisplacementThreshold: 0.01,
};

const ImageItem: React.FC<{
  uri: string;
  onRequestClose?: () => void;
  initialPosition?: ImageViewProps['initialPosition'];
  isInitialImage: boolean;
  backgroundOpacity: SharedValue<number>;
  isClosed?: boolean;
}> = ({ uri, onRequestClose, initialPosition, isInitialImage, backgroundOpacity, isClosed }) => {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const verticalTranslate = useSharedValue(0);
  const imageOpacity = useSharedValue(1);
  const animation = useSharedValue(0);

  useEffect(() => {
    if (isInitialImage) {
      animation.value = 0;
      animation.value = withSpring(1, springOptions);
      backgroundOpacity.value = withSpring(1, springOptions);
    }
  }, []);

  useEffect(() => {
    if (isClosed) {
      animation.value = withSpring(0, springOptions, () => {
        if (onRequestClose) {
          runOnJS(onRequestClose)();
        }
      });
      backgroundOpacity.value = withSpring(0, springOptions);
    }
  }, [isClosed]);

  // const backdropStyle = useAnimatedStyle(() => {
  //   let opacity = 1;

  //   const dragProgress = Math.min(Math.abs(verticalTranslate.value) / (SCREEN_HEIGHT / 2), 1);
  //   opacity -= dragProgress;
  //   const factor = 100;
  //   return {
  //     opacity: Math.round(opacity * factor) / factor,
  //   };
  // });

  // 处理捏合缩放手势
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      'worklet';
      savedScale.value = scale.value;
    })
    .onUpdate((event) => {
      'worklet';
      scale.value = savedScale.value * event.scale;
    })
    .onEnd(() => {
      'worklet';
      if (scale.value < 1) {
        scale.value = withTiming(1);
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
      }
    });

  // 双击手势
  const doubleTabGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      'worklet';
      if (scale.value > 1) {
        scale.value = withTiming(1);
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
      } else {
        scale.value = withTiming(2);
      }
    });

  // 添加垂直滑动手势
  const verticalPanGesture = Gesture.Pan()
    .activeOffsetY([-10, 10])
    .failOffsetX([-10, 10])
    .maxPointers(1)
    .onChange((event) => {
      'worklet';
      if (animation.value !== 1) {
        return;
      }

      verticalTranslate.value = event.translationY;
      let opacity = 1;

      const dragProgress = Math.min(Math.abs(verticalTranslate.value) / (SCREEN_HEIGHT / 2), 1);
      opacity -= dragProgress;
      const factor = 100;
      backgroundOpacity.value = Math.round(opacity * factor) / factor;
    })
    .onEnd((event) => {
      'worklet';
      if (Math.abs(event.translationY) > 80) {
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
        backgroundOpacity.value = withTiming(0);
      } else {
        verticalTranslate.value = withTiming(0);
        imageOpacity.value = withTiming(1);
        backgroundOpacity.value = withTiming(1);
      }
    });

  const gesture = Gesture.Race(
    doubleTabGesture,
    verticalPanGesture,
    Gesture.Simultaneous(pinchGesture),
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value + verticalTranslate.value },
      { scale: scale.value },
    ],
  }));

  const backgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(0, 0, 0, ${backgroundOpacity.value})`,
  }));

  const interpolatedStyle = useAnimatedStyle(() => {
    if (!isInitialImage || !initialPosition) return {};

    const imageAspect = SCREEN_WIDTH / SCREEN_HEIGHT;
    const thumbAspect = initialPosition.width / initialPosition.height;

    let uncroppedInitialWidth, uncroppedInitialHeight;
    if (imageAspect > thumbAspect) {
      uncroppedInitialWidth = initialPosition.height * imageAspect;
      uncroppedInitialHeight = initialPosition.height;
    } else {
      uncroppedInitialWidth = initialPosition.width;
      uncroppedInitialHeight = initialPosition.width / imageAspect;
    }

    let finalWidth, finalHeight;
    if (imageAspect > thumbAspect) {
      finalWidth = SCREEN_HEIGHT * imageAspect;
      finalHeight = SCREEN_HEIGHT;
    } else {
      finalWidth = SCREEN_WIDTH;
      finalHeight = SCREEN_WIDTH / imageAspect;
    }

    const initialScale = Math.min(
      uncroppedInitialWidth / finalWidth,
      uncroppedInitialHeight / finalHeight,
    );

    const screenCenterX = SCREEN_WIDTH / 2;
    const screenCenterY = SCREEN_HEIGHT / 2;
    const thumbnailCenterX = initialPosition.x + initialPosition.width / 2;
    const thumbnailCenterY = initialPosition.y + initialPosition.height / 2;

    const initialTranslateX = thumbnailCenterX - screenCenterX;
    const initialTranslateY = thumbnailCenterY - screenCenterY;

    const scale = initialScale + (1 - initialScale) * animation.value;
    const translateX = initialTranslateX * (1 - animation.value);
    const translateY = initialTranslateY * (1 - animation.value);

    return {
      position: 'absolute',
      width: finalWidth,
      height: finalHeight,
      transform: [{ translateX: translateX }, { translateY: translateY }, { scale: scale }],
    };
  });

  return (
    <Animated.View style={[styles.imageContainer, backgroundStyle]}>
      <GestureDetector gesture={gesture}>
        <AnimatedImage
          source={{ uri }}
          style={[
            styles.image,
            animatedStyle,
            isInitialImage && initialPosition ? interpolatedStyle : null,
          ]}
          contentFit="contain"
        />
      </GestureDetector>
    </Animated.View>
  );
};

const ImageView: React.FC<ImageViewProps> = ({
  images,
  initialIndex = 0,
  onIndexChange,
  onRequestClose,
  initialPosition,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList>(null);
  const backgroundOpacity = useSharedValue(0);
  const [isClosed, setIsClosed] = useState(false);

  const backgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(0, 0, 0, ${backgroundOpacity.value})`,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  }));

  const renderItem: ListRenderItem<string> = ({ item: uri, index }) => (
    <ImageItem
      uri={uri}
      onRequestClose={onRequestClose}
      initialPosition={initialPosition}
      isInitialImage={index === initialIndex}
      backgroundOpacity={backgroundOpacity}
      isClosed={isClosed}
    />
  );

  const onViewableItemsChanged = React.useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        const newIndex = viewableItems[0].index ?? 0;
        setCurrentIndex(newIndex);
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
      <Animated.View style={backgroundStyle} />
      <TouchableOpacity style={styles.closeButton} onPress={() => setIsClosed(true)}>
        <Ionicons name="close" size={24} color="white" />
      </TouchableOpacity>
      <FlatList
        ref={flatListRef}
        data={images}
        renderItem={renderItem}
        horizontal
        pagingEnabled
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
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
});

export default ImageView;
