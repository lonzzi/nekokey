import { Colors } from '@/constants/Colors';
import React, { useState } from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

export const RubyText = ({ base, ruby }: { base: string; ruby: string }) => {
  const rubyChars = Array.from(ruby || '');
  const [baseWidth, setBaseWidth] = useState(0);
  const colorScheme = useColorScheme();

  return (
    <View style={styles.container}>
      <View style={[styles.ruby, { width: baseWidth }]}>
        {rubyChars.map((char, index) => (
          <Text style={styles.rubyText} key={index}>
            {char}
          </Text>
        ))}
      </View>
      <Text
        style={[styles.base, { color: Colors[colorScheme ?? 'light'].text }]}
        onLayout={(e) => setBaseWidth(e.nativeEvent.layout.width)}
      >
        {base}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruby: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: -2,
  },
  rubyText: {
    fontSize: 8,
    color: '#888',
  },
  base: {
    marginBottom: -4,
  },
});
