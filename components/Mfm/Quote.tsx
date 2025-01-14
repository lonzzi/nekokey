import { StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';

export const Quote = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}) => {
  const { fontSize = 16, lineHeight = 24 } = StyleSheet.flatten(style);

  return (
    <>
      <View style={styles.quote}>
        <Text style={{ fontSize, lineHeight }}>{children}</Text>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  quote: {
    width: '100%',
    borderLeftWidth: 3,
    borderLeftColor: '#888',
    paddingLeft: 8,
    marginLeft: 8,
    flex: 1,
    opacity: 0.6,
  },
});
