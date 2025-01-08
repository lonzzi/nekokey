import { BlurTint, BlurView } from 'expo-blur';
import { ReactNode, useState } from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

type BlurredProps = {
  intensity?: number;
  tint?: BlurTint;
  children: ReactNode;
};

export const Blurred = ({ intensity = 8, tint = 'light', children }: BlurredProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const colorScheme = useColorScheme();
  const [textDimensions, setTextDimensions] = useState({ width: 0, height: 0 });

  const offset = 10;

  const handleBlurViewClick = () => {
    setIsVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text onLayout={(e) => setTextDimensions(e.nativeEvent.layout)}>{children}</Text>
      {isVisible && (
        <BlurView
          intensity={intensity}
          tint={tint}
          style={[
            styles.blurView,
            {
              backgroundColor:
                colorScheme === 'dark' ? 'rgba(150, 150, 150, 0.04)' : 'rgba(255, 255, 255, 0.4)',
            },
            {
              width: textDimensions.width + offset + 4,
              height: textDimensions.height + offset,
              top: -offset / 2,
              left: -(offset + 4) / 2,
            },
          ]}
          onTouchEnd={handleBlurViewClick}
          experimentalBlurMethod="dimezisBlurView"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    transform: [{ translateY: 4 }],
    borderRadius: 10,
  },
  blurView: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
});
