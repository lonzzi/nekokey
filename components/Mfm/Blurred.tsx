import { BlurView } from 'expo-blur';
import { ReactNode, useState } from 'react';
import { StyleSheet, View } from 'react-native';

type BlurredProps = {
  intensity?: number;
  tint?: 'light' | 'dark';
  children: ReactNode;
};

export const Blurred = ({ intensity = 8, tint = 'light', children }: BlurredProps) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleBlurViewClick = () => {
    setIsVisible(false);
  };

  return (
    <View style={styles.container}>
      {children}
      {isVisible && (
        <BlurView
          intensity={intensity}
          tint={tint}
          style={styles.blurView}
          onTouchEnd={handleBlurViewClick}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 8,
  },
  blurView: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
});
