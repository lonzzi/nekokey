import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  ListRenderItem,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  ViewToken,
} from 'react-native';
import { Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ImageItem, { ImageSource } from './ImageItem';

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
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ImageViewItem: React.FC<ImageViewItemProps> = ({ onRequestClose, openProgress, ...rest }) => {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const verticalTranslate = useSharedValue(0);
  const [scaled, setScaled] = useState(false);

  const transforms = useDerivedValue(() => {
    return {
      scale: scale.value,
      translateX: translateX.value,
      translateY: translateY.value,
      verticalTranslate: verticalTranslate.value,
    };
  });

  const onZoom = useCallback((nextIsScaled: boolean) => {
    setScaled(nextIsScaled);
  }, []);

  const dismissGesture = Gesture.Pan()
    .activeOffsetY([-10, 10])
    .failOffsetX([-10, 10])
    .maxPointers(1)
    .enabled(!scaled)
    .onChange((event) => {
      'worklet';
      verticalTranslate.value = event.translationY;
      let opacity = 1;

      const dragProgress = Math.min(Math.abs(verticalTranslate.value) / (SCREEN_HEIGHT / 2), 1);
      opacity -= dragProgress;
      const factor = 100;
      openProgress.value = Math.round(opacity * factor) / factor;
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
        openProgress.value = withTiming(0);
      } else {
        verticalTranslate.value = withTiming(0);
        openProgress.value = withTiming(1);
      }
    });

  return (
    <ImageItem
      {...rest}
      openProgress={openProgress}
      onRequestClose={onRequestClose}
      transforms={transforms}
      dismissGesture={dismissGesture}
      onZoom={onZoom}
      scaled={scaled}
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
  const isClosed = useSharedValue(false);
  const [showCloseButton, setShowCloseButton] = useState(true);
  const showCloseButtonAnim = useSharedValue(1);
  const { top } = useSafeAreaInsets();

  const toggleCloseButton = useCallback(() => {
    showCloseButtonAnim.value = withTiming(!showCloseButton ? 1 : 0, {
      duration: 200,
      easing: Easing.ease,
    });
    runOnJS(setShowCloseButton)(!showCloseButton);
  }, [showCloseButton]);

  useAnimatedReaction(
    () => openProgress.value,
    (opacity) => {
      showCloseButtonAnim.value = opacity;
    },
    [openProgress],
  );

  const backgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(0, 0, 0, ${openProgress.value})`,
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

  const renderItem: ListRenderItem<ImageSource> = ({ item, index }) => (
    <ImageViewItem
      image={item}
      onRequestClose={onRequestClose}
      initialPosition={initialPosition}
      isInitialImage={index === initialIndex}
      openProgress={openProgress}
      isClosed={isClosed}
      onTap={toggleCloseButton}
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
