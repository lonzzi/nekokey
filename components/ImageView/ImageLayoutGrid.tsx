import { isAndroid } from '@/lib/utils/platform';
import { Image } from 'expo-image';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  StatusBar,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { ImageSource, Rect } from './ImageItem';
import ImageView from './ImageView';

interface ImagePreviewProps {
  images: ImageSource[];
  numColumns?: number;
  imageSize?: number;
  spacing?: number;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ images }) => {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [modalVisible, setModalVisible] = useState(false);
  const imageCount = images.length;
  const [imagePositions, setImagePositions] = useState<Array<Rect>>([]);
  const [containerWidth, setContainerWidth] = useState(0);
  const [imageAspectRatio, setImageAspectRatio] = useState(0);

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

  return (
    <View
      style={styles.container}
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
            height: Math.min(imageAspectRatio * containerWidth, 560) || 280,
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
              <TouchableWithoutFeedback
                onPress={() => {
                  setSelectedIndex(index);
                  setModalVisible(true);
                  measureAllImages();
                }}
              >
                <Image
                  source={{ uri: item.uri }}
                  style={styles.thumbnailImage}
                  placeholder={{ uri: item.thumbnailUrl }}
                  contentFit="cover"
                  placeholderContentFit="cover"
                />
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
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    marginVertical: 8,
  },
  singleImageContainer: {
    minHeight: 200,
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
});

export default ImagePreview;
