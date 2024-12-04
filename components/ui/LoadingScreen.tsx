import { Image, StyleSheet, View } from 'react-native';

export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <Image source={require('@/assets/images/icon.png')} style={styles.icon} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  icon: {
    width: 100,
    height: 100,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  spinner: {
    marginTop: 10,
  },
});
