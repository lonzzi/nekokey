import React, { useState } from 'react';
import { Image, Modal, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';

import ImageView from './ImageView';

export interface ImageItemProps {
  uri: string;
  thumbnailUrl?: string | null;
  width?: number;
  height?: number;
}

interface ImagePreviewProps {
  images: ImageItemProps[];
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
        {images.slice(0, 4).map((item, index) => (
          <View key={index} style={getImageStyle(index)}>
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
              <Image source={{ uri: item.uri }} style={styles.thumbnailImage} resizeMode="cover" />
            </TouchableWithoutFeedback>
          </View>
        ))}
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
    width: '49.5%',
    height: '49.5%',
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
