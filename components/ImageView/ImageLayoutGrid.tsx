import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Modal, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';

import { ImageSource } from './ImageItem';
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
  const [selectedImagePosition, setSelectedImagePosition] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const imageCount = images.length;
  const [containerWidth, setContainerWidth] = useState(0);
  const [imageAspectRatio, setImageAspectRatio] = useState(0);

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
          imageCount === 1 &&
            styles.singleImageContainer && {
              width: containerWidth,
              height: imageAspectRatio * containerWidth || 280,
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
                onPress={(event) => {
                  'worklet';
                  const { target } = event;
                  target.measure((x, y, width, height, pageX, pageY) => {
                    setSelectedImagePosition({ x: pageX, y: pageY, width, height });
                    setSelectedIndex(index);
                    setModalVisible(true);
                  });
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
          images={images.map((image) => image)}
          initialIndex={selectedIndex}
          onRequestClose={() => setModalVisible(false)}
          initialPosition={selectedImagePosition}
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
