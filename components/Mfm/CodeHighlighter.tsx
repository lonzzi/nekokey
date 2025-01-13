import { isAndroid } from '@/lib/utils/platform';
import { Highlight, themes } from 'prism-react-renderer';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextStyle, View } from 'react-native';

export const CodeHighlighter = ({
  code,
  language,
  isFirst = false,
}: {
  code: string;
  language?: string;
  isFirst?: boolean;
}) => {
  const [height, setHeight] = useState(100);

  return (
    <Highlight theme={themes.github} code={code} language={language || 'javascript'}>
      {({ style, tokens, getLineProps, getTokenProps }) => (
        <Text>
          {!isFirst && <Text>{'\n'}</Text>}
          {isAndroid && <Text style={{ lineHeight: height }}>{'\n'}</Text>}
          <ScrollView
            horizontal
            style={[styles.container, { backgroundColor: style.backgroundColor || '#1e1e1e' }]}
          >
            <View
              onLayout={(e) => {
                const { height } = e.nativeEvent.layout;
                setHeight(height);
              }}
            >
              {tokens.map((line, i) => (
                <View {...getLineProps({ line, key: i })} style={styles.line} key={i}>
                  {line.map((token, key) => {
                    const { style: tokenStyle, children } = getTokenProps({ token, key });

                    return (
                      <Text key={key} style={[styles.token, tokenStyle as TextStyle]}>
                        {children}
                      </Text>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
        </Text>
      )}
    </Highlight>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    borderRadius: 8,
    width: '100%',
    display: 'flex',
  },
  line: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  code: {
    flex: 1,
    fontFamily: 'Courier',
    fontSize: 14,
    color: '#f8f8f2',
  },
  token: {
    fontFamily: 'Courier',
    fontSize: 14,
  },
});
