import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  ListRenderItem,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  ViewToken,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  TapGesture,
} from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ImageItemProps } from './ImageLayoutGrid';

interface ImageViewProps {
  images: ImageItemProps[];
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
  image: ImageItemProps;
  onRequestClose?: () => void;
  initialPosition?: ImageViewProps['initialPosition'];
  isInitialImage: boolean;
  backgroundOpacity: SharedValue<number>;
  isClosed: SharedValue<boolean>;
  singleTap: TapGesture;
}> = ({
  image,
  onRequestClose,
  initialPosition,
  isInitialImage,
  backgroundOpacity,
  isClosed,
  singleTap,
}) => {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const verticalTranslate = useSharedValue(0);
  const animation = useSharedValue(0);
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();
  const [scaled, setScaled] = useState(false);

  useAnimatedReaction(
    () => isInitialImage,
    (isInitial) => {
      if (isInitial) {
        animation.value = 0;
        animation.value = withSpring(1, springOptions);
        backgroundOpacity.value = withSpring(1, springOptions);
      }
    },
    [isInitialImage],
  );

  useAnimatedReaction(
    () => isClosed.value,
    (closed) => {
      if (closed) {
        backgroundOpacity.value = withSpring(0, springOptions);
        animation.value = withSpring(0, springOptions, () => {
          if (onRequestClose) {
            runOnJS(onRequestClose)();
          }
        });
      }
    },
    [isClosed],
  );

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    'worklet';
    const nextIsScaled = event.nativeEvent.zoomScale > 1;
    if (scaled !== nextIsScaled) {
      setScaled(nextIsScaled);
    }
  };

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

  const verticalPanGesture = Gesture.Pan()
    .activeOffsetY([-10, 10])
    .failOffsetX([-10, 10])
    .maxPointers(1)
    .enabled(!scaled)
    .onChange((event) => {
      'worklet';
      if (animation.value !== 1 || scale.value !== 1) {
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
        backgroundOpacity.value = withTiming(0);
      } else {
        verticalTranslate.value = withTiming(0);
        backgroundOpacity.value = withTiming(1);
      }
    });

  const gesture = Gesture.Exclusive(verticalPanGesture, doubleTap, singleTap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value + verticalTranslate.value },
      { scale: scale.value },
    ],
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
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={scaled}
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

const ImageView: React.FC<ImageViewProps> = ({
  images,
  initialIndex = 0,
  onIndexChange,
  onRequestClose,
  initialPosition,
}) => {
  const flatListRef = useRef<FlatList>(null);
  const backgroundOpacity = useSharedValue(0);
  const isClosed = useSharedValue(false);
  const [showCloseButton, setShowCloseButton] = useState(true);
  const showCloseButtonAnim = useSharedValue(1);
  const { top } = useSafeAreaInsets();

  const toggleCloseButton = () => {
    'worklet';
    showCloseButtonAnim.value = withTiming(!showCloseButton ? 1 : 0, {
      duration: 200,
      easing: Easing.ease,
    });
    runOnJS(setShowCloseButton)(!showCloseButton);
  };

  useAnimatedReaction(
    () => backgroundOpacity.value,
    (opacity) => {
      showCloseButtonAnim.value = opacity;
    },
    [backgroundOpacity],
  );

  const singleTap = Gesture.Tap().onEnd(() => {
    'worklet';
    toggleCloseButton();
  });

  const backgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(0, 0, 0, ${backgroundOpacity.value})`,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  }));

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

  const renderItem: ListRenderItem<ImageItemProps> = ({ item, index }) => (
    <ImageItem
      image={item}
      onRequestClose={onRequestClose}
      initialPosition={initialPosition}
      isInitialImage={index === initialIndex}
      backgroundOpacity={backgroundOpacity}
      isClosed={isClosed}
      singleTap={singleTap}
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
      <Animated.View style={backgroundStyle} />
      <Animated.View style={[styles.closeButton, closeButtonStyle, { top: top + 20 }]}>
        <TouchableWithoutFeedback
          onPress={() => {
            'worklet';
            isClosed.value = true;
            toggleCloseButton();
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
  closeButton: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
});

export default ImageView;
