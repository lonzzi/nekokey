import { Image } from 'expo-image';
import React from 'react';
import { Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaFrame } from 'react-native-safe-area-context';

import { ImageItemProps, Rect } from './ImageItem';

const MAX_ORIGINAL_IMAGE_ZOOM = 2;
const MIN_SCREEN_ZOOM = 2;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ImageItem: React.FC<ImageItemProps> = ({
  image,
  isClosed,
  transforms,
  dismissGesture,
  scaled,
  onTap,
  onZoom,
  imageAspect,
  onLongPress,
}) => {
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();
  const isDragging = useSharedValue(false);
  const screenSizeDelayedForJSThreadOnly = useSafeAreaFrame();
  const maxZoomScale = Math.max(
    MIN_SCREEN_ZOOM,
    image.width
      ? (image.width / screenSizeDelayedForJSThreadOnly.width) * MAX_ORIGINAL_IMAGE_ZOOM
      : 1,
  );

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
    () => isClosed.value,
    (closed) => {
      if (closed) {
        runOnJS(resetZoom)();
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

  const zoomTo = (rect: Rect | undefined) => {
    if (!rect) return;
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

  const longPress = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      'worklet';
      if (onLongPress) {
        runOnJS(onLongPress)();
      }
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((e) => {
      'worklet';
      const willZoom = !scaled;
      let zoomRect;

      if (willZoom) {
        zoomRect = getZoomRectAfterDoubleTap(
          imageAspect,
          e.absoluteX,
          e.absoluteY,
          screenSizeDelayedForJSThreadOnly,
        );
      }

      runOnJS(zoomTo)(zoomRect);
    });

  const tapGestures = Gesture.Exclusive(doubleTap, singleTap);
  const gesture = Gesture.Simultaneous(dismissGesture, Gesture.Race(tapGestures, longPress));

  const containerStyle = useAnimatedStyle(() => {
    const { scaleAndMoveTransform, isHidden } = transforms.get();
    return {
      flex: 1,
      transform: scaleAndMoveTransform,
      opacity: isHidden ? 0 : 1,
    };
  });

  const imageCropStyle = useAnimatedStyle(() => {
    const { cropFrameTransform } = transforms.get();
    return {
      overflow: 'hidden',
      transform: cropFrameTransform,
      width: SCREEN_WIDTH,
      maxHeight: SCREEN_HEIGHT,
      alignSelf: 'center',
      aspectRatio: imageAspect ?? 1 /* force onLoad */,
      opacity: imageAspect === undefined ? 0 : 1,
    };
  });

  const imageStyle = useAnimatedStyle(() => {
    const { cropContentTransform } = transforms.get();
    return {
      transform: cropContentTransform,
      width: '100%',
      aspectRatio: imageAspect ?? 1 /* force onLoad */,
      opacity: imageAspect === undefined ? 0 : 1,
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
        style={containerStyle}
        pinchGestureEnabled
        maximumZoomScale={maxZoomScale}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        animatedProps={scrollViewProps}
        centerContent
      >
        <Animated.View style={imageCropStyle}>
          <Animated.View style={imageStyle}>
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

const getZoomRectAfterDoubleTap = (
  imageAspect: number | undefined,
  touchX: number,
  touchY: number,
  screenSize: { width: number; height: number },
): {
  x: number;
  y: number;
  width: number;
  height: number;
} => {
  'worklet';
  if (!imageAspect) {
    return {
      x: 0,
      y: 0,
      width: screenSize.width,
      height: screenSize.height,
    };
  }

  // First, let's figure out how much we want to zoom in.
  // We want to try to zoom in at least close enough to get rid of black bars.
  const screenAspect = screenSize.width / screenSize.height;
  const zoom = Math.max(imageAspect / screenAspect, screenAspect / imageAspect, MIN_SCREEN_ZOOM);
  // Unlike in the Android version, we don't constrain the *max* zoom level here.
  // Instead, this is done in the ScrollView props so that it constraints pinch too.

  // Next, we'll be calculating the rectangle to "zoom into" in screen coordinates.
  // We already know the zoom level, so this gives us the rectangle size.
  const rectWidth = screenSize.width / zoom;
  const rectHeight = screenSize.height / zoom;

  // Before we settle on the zoomed rect, figure out the safe area it has to be inside.
  // We don't want to introduce new black bars or make existing black bars unbalanced.
  let minX = 0;
  let minY = 0;
  let maxX = screenSize.width - rectWidth;
  let maxY = screenSize.height - rectHeight;
  if (imageAspect >= screenAspect) {
    // The image has horizontal black bars. Exclude them from the safe area.
    const renderedHeight = screenSize.width / imageAspect;
    const horizontalBarHeight = (screenSize.height - renderedHeight) / 2;
    minY += horizontalBarHeight;
    maxY -= horizontalBarHeight;
  } else {
    // The image has vertical black bars. Exclude them from the safe area.
    const renderedWidth = screenSize.height * imageAspect;
    const verticalBarWidth = (screenSize.width - renderedWidth) / 2;
    minX += verticalBarWidth;
    maxX -= verticalBarWidth;
  }

  // Finally, we can position the rect according to its size and the safe area.
  let rectX;
  if (maxX >= minX) {
    // Content fills the screen horizontally so we have horizontal wiggle room.
    // Try to keep the tapped point under the finger after zoom.
    rectX = touchX - touchX / zoom;
    rectX = Math.min(rectX, maxX);
    rectX = Math.max(rectX, minX);
  } else {
    // Keep the rect centered on the screen so that black bars are balanced.
    rectX = screenSize.width / 2 - rectWidth / 2;
  }
  let rectY;
  if (maxY >= minY) {
    // Content fills the screen vertically so we have vertical wiggle room.
    // Try to keep the tapped point under the finger after zoom.
    rectY = touchY - touchY / zoom;
    rectY = Math.min(rectY, maxY);
    rectY = Math.max(rectY, minY);
  } else {
    // Keep the rect centered on the screen so that black bars are balanced.
    rectY = screenSize.height / 2 - rectHeight / 2;
  }

  return {
    x: rectX,
    y: rectY,
    height: rectHeight,
    width: rectWidth,
  };
};

export default ImageItem;
