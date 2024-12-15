import { Image } from 'expo-image';
import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { ImageItemProps } from './ImageItem';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const springOptions = {
  mass: 1.25,
  damping: 150,
  stiffness: 900,
  restDisplacementThreshold: 0.01,
};

const ImageItem: React.FC<ImageItemProps> = ({
  image,
  onRequestClose,
  initialPosition,
  isInitialImage,
  openProgress,
  isClosed,
  transforms,
  dismissGesture,
  scaled,
  onTap,
  onZoom,
}) => {
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();
  const isDragging = useSharedValue(false);
  const animation = useSharedValue(0);

  const resetZoom = () => {
    const scrollResponder = scrollViewRef?.current?.getScrollResponder();
    scrollResponder?.scrollResponderZoomTo({
      x: 0,
      y: 0,
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      animated: false,
    });
  };

  useAnimatedReaction(
    () => isInitialImage,
    (isInitial) => {
      if (isInitial) {
        animation.value = 0;
        animation.value = withSpring(1, springOptions);
        openProgress.value = withSpring(1, springOptions);
      }
    },
    [isInitialImage],
  );

  useAnimatedReaction(
    () => isClosed.value,
    (closed) => {
      if (closed) {
        runOnJS(resetZoom)();
        openProgress.value = withSpring(0, springOptions);
        animation.value = withSpring(0, springOptions, () => {
          if (onRequestClose) {
            runOnJS(onRequestClose)();
          }
        });
      }
    },
    [isClosed],
  );

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      'worklet';
      const nextIsScaled = event.zoomScale > 1;
      if (scaled !== nextIsScaled) {
        runOnJS(onZoom)(nextIsScaled);
      }
    },
    onBeginDrag() {
      'worklet';
      if (!scaled) {
        isDragging.value = true;
      }
    },
    onEndDrag() {
      'worklet';
      if (!scaled) {
        isDragging.value = false;
      }
    },
  });

  const zoomTo = (rect: { x: number; y: number; width: number; height: number }) => {
    const scrollResponder = scrollViewRef?.current?.getScrollResponder();
    scrollResponder?.scrollResponderZoomTo({
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      animated: true,
    });
  };

  const singleTap = Gesture.Tap().onEnd(() => {
    'worklet';
    if (onTap) {
      runOnJS(onTap)();
    }
  });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((e) => {
      'worklet';
      const willZoom = !scaled;
      let zoomRect;

      if (willZoom) {
        const scale = 2;
        const width = SCREEN_WIDTH / scale;
        const height = SCREEN_HEIGHT / scale;
        const x = Math.max(0, e.absoluteX - width / 2);
        const y = Math.max(0, e.absoluteY - height / 2);

        zoomRect = { x, y, width, height };
      } else {
        zoomRect = {
          x: 0,
          y: 0,
          width: SCREEN_WIDTH,
          height: SCREEN_HEIGHT,
        };
      }

      runOnJS(zoomTo)(zoomRect);
    });

  const gesture = Gesture.Exclusive(dismissGesture, doubleTap, singleTap);

  const animatedStyle = useAnimatedStyle(() => {
    const { scale, translateX, translateY, verticalTranslate } = transforms.value;
    // console.log(scale, translateX, translateY, verticalTranslate);

    return {
      transform: [{ translateX }, { translateY: translateY + verticalTranslate }, { scale }],
    };
  });

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

  const scrollViewProps = useAnimatedProps(() => ({
    bounces: scaled || isDragging.value,
    scrollEnabled: scaled,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        pinchGestureEnabled
        maximumZoomScale={3}
        minimumZoomScale={1}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        animatedProps={scrollViewProps}
        centerContent
      >
        <Animated.View style={styles.imageContainer}>
          <Animated.View
            style={[
              styles.image,
              animatedStyle,
              isInitialImage && initialPosition ? interpolatedStyle : null,
            ]}
          >
            <Image
              style={{ flex: 1 }}
              source={{ uri: image.uri }}
              placeholder={{ uri: image.thumbnailUrl }}
              contentFit="contain"
              placeholderContentFit="contain"
            />
          </Animated.View>
        </Animated.View>
      </Animated.ScrollView>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
});

export default ImageItem;
