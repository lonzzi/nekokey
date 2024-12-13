import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, ListRenderItem, StyleSheet, ViewToken } from 'react-native';
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

const ImageItem: React.FC<{
  uri: string;
  onRequestClose?: () => void;
  initialPosition?: ImageViewProps['initialPosition'];
  isInitialImage: boolean;
  backgroundOpacity: SharedValue<number>;
}> = ({ uri, onRequestClose, initialPosition, isInitialImage, backgroundOpacity }) => {
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
      animation.value = withTiming(1, { duration: 300 });
      backgroundOpacity.value = withTiming(1, { duration: 300 });
    }
  }, []);

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
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  // 双击手势
  const doubleTabGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      'worklet';
      if (scale.value > 1) {
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      } else {
        scale.value = withSpring(2);
      }
    });

  // 单击手势
  // const singleTapGesture = Gesture.Tap().onEnd(() => {
  // 'worklet';
  //   if (onRequestClose) {
  //     runOnJS(onRequestClose)();
  //   }
  // });

  // 添加垂直滑动手势
  const verticalPanGesture = Gesture.Pan()
    .onChange((event) => {
      'worklet';
      verticalTranslate.value = event.translationY;
      const opacity = Math.max(1 - Math.abs(event.translationY) / 400, 0.3);
      imageOpacity.value = opacity;
      backgroundOpacity.value = opacity;
    })
    .onEnd((event) => {
      'worklet';
      if (Math.abs(event.translationY) > 100) {
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
    })
    .activeOffsetY([-10, 10])
    .failOffsetX([-20, 20]);

  const gesture = Gesture.Race(
    // singleTapGesture,
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
    opacity: imageOpacity.value,
  }));

  // 添加背景动画样式
  const backgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(0, 0, 0, ${backgroundOpacity.value})`,
  }));

  const interpolatedStyle = useAnimatedStyle(() => {
    if (!isInitialImage || !initialPosition) return {};

    const interpolatePosition = (start: number, end: number) =>
      start + (end - start) * animation.value;

    return {
      position: 'absolute',
      width: interpolatePosition(initialPosition.width, SCREEN_WIDTH),
      height: interpolatePosition(initialPosition.height, SCREEN_HEIGHT),
      left: interpolatePosition(initialPosition.x, 0),
      top: interpolatePosition(initialPosition.y, 0),
      opacity: animation.value,
    };
  });

  return (
    <Animated.View style={[styles.imageContainer, backgroundStyle]}>
      <GestureDetector gesture={gesture}>
        <Animated.Image
          source={{ uri }}
          style={[
            styles.image,
            animatedStyle,
            isInitialImage && initialPosition ? interpolatedStyle : null,
          ]}
          resizeMode="contain"
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
});

export default ImageView;
