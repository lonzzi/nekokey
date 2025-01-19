import { Colors } from '@/constants/Colors';
import { isAndroid } from '@/lib/utils/platform';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  GestureResponderEvent,
  Modal,
  StatusBar,
  StyleProp,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native';

import { ThemedText } from '../ThemedText';
import { ImageSource, Rect } from './ImageItem';
import ImageView from './ImageView';

interface ImagePreviewProps {
  images: ImageSource[];
  numColumns?: number;
  imageSize?: number;
  spacing?: number;
  style?: StyleProp<ViewStyle>;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ images, style }) => {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [modalVisible, setModalVisible] = useState(false);
  const imageCount = images.length;
  const [imagePositions, setImagePositions] = useState<Array<Rect>>([]);
  const [containerWidth, setContainerWidth] = useState(0);
  const [imageAspectRatio, setImageAspectRatio] = useState(0);
  const [showSensitive, setShowSensitive] = useState<{ [key: number]: boolean }>({});

  const imageRefs = useRef<Array<View | null>>([]);

  const measureAllImages = () => {
    imageRefs.current.forEach((ref, index) => {
      if (ref) {
        ref.measure((x, y, width, height, pageX, pageY) => {
          const windowHeight = Dimensions.get('window').height;
          const screenHeight = Dimensions.get('screen').height;
          const statusBarHeight = StatusBar.currentHeight;
          const navbarHeight = screenHeight - windowHeight - (statusBarHeight ?? 0);

          setImagePositions((prev) => {
            const newPositions = [...prev];
            newPositions[index] = {
              x: pageX,
              y: isAndroid ? pageY - navbarHeight : pageY,
              width,
              height,
            };
            return newPositions;
          });
        });
      }
    });
  };

  const getImageStyle = (index: number) => {
    switch (imageCount) {
      case 1:
        return styles.singleImage;
      case 2:
        return styles.doubleImage;
      case 3:
        return index === 0 ? styles.tripleMainImage : styles.tripleSecondaryImage;
      case 4:
        return styles.quadImage;
      default:
        return styles.quadImage;
    }
  };

  const handlePressImage = (index: number) => {
    if (images[index].isSensitive && !showSensitive[index]) {
      setShowSensitive((prev) => ({ ...prev, [index]: true }));
      return;
    }
    setSelectedIndex(index);
    setModalVisible(true);
    measureAllImages();
  };

  const toggleSensitive = (index: number, event: GestureResponderEvent) => {
    event.stopPropagation();
    setShowSensitive((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <View
      style={[styles.container, style]}
      onLayout={(event) => {
        const { width } = event.nativeEvent.layout;
        setContainerWidth(width);
        setImageAspectRatio((images[0]?.height ?? 0) / (images[0]?.width ?? 1));
      }}
    >
      <View
        style={[
          styles.imageContainer,
          imageCount === 1 && {
            width: containerWidth,
            height: Math.max(Math.min(imageAspectRatio * containerWidth, 560) || 280, 60),
          },
          imageCount === 2 && styles.doubleImageContainer,
          imageCount >= 3 && styles.multiImageContainer,
        ]}
      >
        {images.slice(0, imageCount === 3 ? 3 : 4).map((item, index) => {
          const isTripleLayout = imageCount === 3;
          const containerStyle = isTripleLayout
            ? index === 0
              ? styles.tripleMainImage
              : [styles.tripleSecondaryImage, { height: '49.5%' as const }]
            : getImageStyle(index);

          return (
            <View
              key={index}
              ref={(ref) => (imageRefs.current[index] = ref)}
              style={[
                containerStyle,
                isTripleLayout &&
                  index > 0 && {
                    position: 'absolute',
                    right: 0,
                    top: index === 1 ? 0 : '50.5%',
                    width: '49.5%',
                  },
              ]}
            >
              <TouchableWithoutFeedback onPress={() => handlePressImage(index)}>
                <View style={{ width: '100%', height: '100%' }}>
                  <Image
                    source={{ uri: item.uri }}
                    style={styles.thumbnailImage}
                    placeholder={{ uri: item.thumbnailUrl }}
                    contentFit="cover"
                    placeholderContentFit="cover"
                    blurRadius={item.isSensitive && !showSensitive[index] ? 50 : 0}
                  />
                  {item.isSensitive && !showSensitive[index] && (
                    <View style={styles.sensitiveOverlay}>
                      <ThemedText style={styles.sensitiveText}>敏感内容</ThemedText>
                    </View>
                  )}
                  {item.isSensitive && (
                    <TouchableWithoutFeedback onPress={(e) => toggleSensitive(index, e)}>
                      <View style={styles.sensitiveButton}>
                        <Ionicons
                          name={showSensitive[index] ? 'eye-off' : 'eye'}
                          size={16}
                          color="#fff"
                        />
                      </View>
                    </TouchableWithoutFeedback>
                  )}
                </View>
              </TouchableWithoutFeedback>
            </View>
          );
        })}
      </View>

      <Modal visible={modalVisible} transparent animationType="none" statusBarTranslucent>
        <ImageView
          images={images.map((image) => ({
            ...image,
            thumbRect: imagePositions[images.indexOf(image)],
          }))}
          initialIndex={selectedIndex}
          onRequestClose={() => setModalVisible(false)}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gridContainer: {
    padding: 5,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.common.loadingBg,
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  singleImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  doubleImageContainer: {
    height: 200,
  },
  doubleImage: {
    width: '49.5%',
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  multiImageContainer: {
    height: 200,
  },
  tripleMainImage: {
    width: '49.5%',
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tripleSecondaryImage: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  quadImage: {
    width: '49.5%',
    height: '49.5%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  sensitiveButton: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  sensitiveOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  sensitiveText: {
    color: '#fff',
    fontSize: 14,
  },
});

export default ImagePreview;
