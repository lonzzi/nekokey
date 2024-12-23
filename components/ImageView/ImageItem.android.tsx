import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { ImageItemProps } from './ImageItem';
import {
  applyRounding,
  createTransform,
  prependPan,
  prependPinch,
  prependTransform,
  readTransform,
  TransformMatrix,
} from './transforms';

const MAX_ORIGINAL_IMAGE_ZOOM = 2;
const MIN_SCREEN_ZOOM = 2;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const initialTransform = createTransform();

const ImageItem: React.FC<ImageItemProps> = ({
  image,
  transforms,
  dismissGesture,
  onTap,
  onZoom,
  imageAspect,
}) => {
  const [isScaled, setIsScaled] = useState(false);
  const committedTransform = useSharedValue(initialTransform);
  const panTranslation = useSharedValue({ x: 0, y: 0 });
  const pinchOrigin = useSharedValue({ x: 0, y: 0 });
  const pinchScale = useSharedValue(1);
  const pinchTranslation = useSharedValue({ x: 0, y: 0 });
  const containerRef = useAnimatedRef();

  // Keep track of when we're entering or leaving scaled rendering.
  // Note: DO NOT move any logic reading animated values outside this function.
  useAnimatedReaction(
    () => {
      if (pinchScale.get() !== 1) {
        // We're currently pinching.
        return true;
      }
      const [, , committedScale] = readTransform(committedTransform.get());
      if (committedScale !== 1) {
        // We started from a pinched in state.
        return true;
      }
      // We're at rest.
      return false;
    },
    (nextIsScaled, prevIsScaled) => {
      if (nextIsScaled !== prevIsScaled) {
        runOnJS(handleZoom)(nextIsScaled);
      }
    },
  );
  function handleZoom(nextIsScaled: boolean) {
    setIsScaled(nextIsScaled);
    onZoom(nextIsScaled);
  }

  // On Android, stock apps prevent going "out of bounds" on pan or pinch. You should "bump" into edges.
  // If the user tried to pan too hard, this function will provide the negative panning to stay in bounds.
  function getExtraTranslationToStayInBounds(
    candidateTransform: TransformMatrix,
    screenSize: { width: number; height: number },
  ) {
    'worklet';
    if (!imageAspect) {
      return [0, 0];
    }
    const [nextTranslateX, nextTranslateY, nextScale] = readTransform(candidateTransform);
    const scaledDimensions = getScaledDimensions(imageAspect, nextScale, screenSize);
    const clampedTranslateX = clampTranslation(
      nextTranslateX,
      scaledDimensions.width,
      screenSize.width,
    );
    const clampedTranslateY = clampTranslation(
      nextTranslateY,
      scaledDimensions.height,
      screenSize.height,
    );
    const dx = clampedTranslateX - nextTranslateX;
    const dy = clampedTranslateY - nextTranslateY;
    return [dx, dy];
  }

  const pinch = Gesture.Pinch()
    .onStart((e) => {
      'worklet';
      pinchOrigin.set({
        x: e.focalX - SCREEN_WIDTH / 2,
        y: e.focalY - SCREEN_HEIGHT / 2,
      });
    })
    .onChange((e) => {
      'worklet';
      if (!image.width) {
        return;
      }

      // Don't let the picture zoom in so close that it gets blurry.
      // Don't let the picture zoom in so close that it gets blurry.
      // Also, like in stock Android apps, don't let the user zoom out further than 1:1.
      const [, , committedScale] = readTransform(committedTransform.get());
      const maxCommittedScale = Math.max(
        MIN_SCREEN_ZOOM,
        (image.width / SCREEN_WIDTH) * MAX_ORIGINAL_IMAGE_ZOOM,
      );
      const minPinchScale = 1 / committedScale;
      const maxPinchScale = maxCommittedScale / committedScale;
      const nextPinchScale = Math.min(Math.max(minPinchScale, e.scale), maxPinchScale);
      pinchScale.set(nextPinchScale);

      // Zooming out close to the corner could push us out of bounds, which we don't want on Android.
      // Calculate where we'll end up so we know how much to translate back to stay in bounds.
      const t = createTransform();
      prependPan(t, panTranslation.get());
      prependPinch(t, nextPinchScale, pinchOrigin.get(), pinchTranslation.get());
      prependTransform(t, committedTransform.get());
      const [dx, dy] = getExtraTranslationToStayInBounds(t, {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
      });
      if (dx !== 0 || dy !== 0) {
        const pt = pinchTranslation.get();
        pinchTranslation.set({
          x: pt.x + dx,
          y: pt.y + dy,
        });
      }
    })
    .onEnd(() => {
      'worklet';
      // Commit just the pinch.
      const t = createTransform();
      prependPinch(t, pinchScale.get(), pinchOrigin.get(), pinchTranslation.get());
      prependTransform(t, committedTransform.get());
      applyRounding(t);
      committedTransform.set(t);

      // Reset just the pinch.
      pinchScale.set(1);
      pinchOrigin.set({ x: 0, y: 0 });
      pinchTranslation.set({ x: 0, y: 0 });
    });

  const pan = Gesture.Pan()
    .averageTouches(true)
    // Unlike .enabled(isScaled), this ensures that an initial pinch can turn into a pan midway:
    .minPointers(isScaled ? 1 : 2)
    .onChange((e) => {
      'worklet';
      if (!image.width) {
        return;
      }

      const nextPanTranslation = { x: e.translationX, y: e.translationY };
      const t = createTransform();
      prependPan(t, nextPanTranslation);
      prependPinch(t, pinchScale.get(), pinchOrigin.get(), pinchTranslation.get());
      prependTransform(t, committedTransform.get());

      // Prevent panning from going out of bounds.
      const [dx, dy] = getExtraTranslationToStayInBounds(t, {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
      });
      nextPanTranslation.x += dx;
      nextPanTranslation.y += dy;
      panTranslation.set(nextPanTranslation);
    })
    .onEnd(() => {
      'worklet';
      // Commit just the pan.
      const t = createTransform();
      prependPan(t, panTranslation.get());
      prependTransform(t, committedTransform.get());
      applyRounding(t);
      committedTransform.set(t);

      // Reset just the pan.
      panTranslation.set({ x: 0, y: 0 });
    });

  const singleTap = Gesture.Tap().onEnd(() => {
    'worklet';
    runOnJS(onTap)();
  });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((e) => {
      'worklet';
      if (!image.width || !imageAspect) {
        return;
      }
      const [, , committedScale] = readTransform(committedTransform.get());
      if (committedScale !== 1) {
        // Go back to 1:1 using the identity vector.
        const t = createTransform();
        committedTransform.set(withClampedSpring(t));
        return;
      }

      // Try to zoom in so that we get rid of the black bars (whatever the orientation was).
      const screenAspect = SCREEN_WIDTH / SCREEN_HEIGHT;
      const candidateScale = Math.max(
        imageAspect / screenAspect,
        screenAspect / imageAspect,
        MIN_SCREEN_ZOOM,
      );
      // But don't zoom in so close that the picture gets blurry.
      const maxScale = Math.max(
        MIN_SCREEN_ZOOM,
        (image.width / SCREEN_WIDTH) * MAX_ORIGINAL_IMAGE_ZOOM,
      );
      const scale = Math.min(candidateScale, maxScale);

      // Calculate where we would be if the user pinched into the double tapped point.
      // We won't use this transform directly because it may go out of bounds.
      const candidateTransform = createTransform();
      const origin = {
        x: e.absoluteX - SCREEN_WIDTH / 2,
        y: e.absoluteY - SCREEN_HEIGHT / 2,
      };
      prependPinch(candidateTransform, scale, origin, { x: 0, y: 0 });

      // Now we know how much we went out of bounds, so we can shoot correctly.
      const [dx, dy] = getExtraTranslationToStayInBounds(candidateTransform, {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
      });
      const finalTransform = createTransform();
      prependPinch(finalTransform, scale, origin, { x: dx, y: dy });
      committedTransform.set(withClampedSpring(finalTransform));
    });

  const composedGesture = Gesture.Exclusive(
    dismissGesture,
    Gesture.Simultaneous(pinch, pan),
    doubleTap,
    singleTap,
  );

  const containerStyle = useAnimatedStyle(() => {
    const { scaleAndMoveTransform, isHidden } = transforms.get();
    // Apply the active adjustments on top of the committed transform before the gestures.
    // This is matrix multiplication, so operations are applied in the reverse order.
    const t = createTransform();
    prependPan(t, panTranslation.get());
    prependPinch(t, pinchScale.get(), pinchOrigin.get(), pinchTranslation.get());
    prependTransform(t, committedTransform.get());
    const [translateX, translateY, scale] = readTransform(t);
    const manipulationTransform = [{ translateX }, { translateY: translateY }, { scale }];
    return {
      opacity: isHidden ? 0 : 1,
      transform: scaleAndMoveTransform.concat(manipulationTransform),
      width: SCREEN_WIDTH,
      maxHeight: SCREEN_HEIGHT,
      alignSelf: 'center',
      aspectRatio: imageAspect ?? 1 /* force onLoad */,
    };
  });

  const imageCropStyle = useAnimatedStyle(() => {
    const { cropFrameTransform } = transforms.get();
    return {
      flex: 1,
      overflow: 'hidden',
      transform: cropFrameTransform,
    };
  });

  const imageStyle = useAnimatedStyle(() => {
    const { cropContentTransform } = transforms.get();
    return {
      flex: 1,
      transform: cropContentTransform,
      opacity: imageAspect === undefined ? 0 : 1,
    };
  });

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View ref={containerRef} style={[styles.container]} renderToHardwareTextureAndroid>
        <Animated.View style={containerStyle}>
          <Animated.View style={imageCropStyle}>
            <Animated.View style={imageStyle}>
              <Image
                contentFit="contain"
                source={{ uri: image.uri }}
                placeholderContentFit="contain"
                placeholder={{ uri: image.thumbnailUrl }}
                style={{ flex: 1 }}
              />
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    height: '100%',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  loading: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
});

export default ImageItem;

function getScaledDimensions(
  imageAspect: number,
  scale: number,
  screenSize: { width: number; height: number },
): {
  width: number;
  height: number;
} {
  'worklet';
  const screenAspect = screenSize.width / screenSize.height;
  const isLandscape = imageAspect > screenAspect;
  if (isLandscape) {
    return {
      width: scale * screenSize.width,
      height: (scale * screenSize.width) / imageAspect,
    };
  } else {
    return {
      width: scale * screenSize.height * imageAspect,
      height: scale * screenSize.height,
    };
  }
}

function clampTranslation(value: number, scaledSize: number, screenSize: number): number {
  'worklet';
  // Figure out how much the user should be allowed to pan, and constrain the translation.
  const panDistance = Math.max(0, (scaledSize - screenSize) / 2);
  const clampedValue = Math.min(Math.max(-panDistance, value), panDistance);
  return clampedValue;
}

function withClampedSpring(value: TransformMatrix) {
  'worklet';
  return withSpring(value, { overshootClamping: true });
}