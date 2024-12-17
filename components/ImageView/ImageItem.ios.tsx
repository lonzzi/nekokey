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

import { ImageItemProps, Rect } from './ImageItem';

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

  const zoomTo = (rect: Rect) => {
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
        maximumZoomScale={3}
        minimumZoomScale={1}
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

export default ImageItem;
