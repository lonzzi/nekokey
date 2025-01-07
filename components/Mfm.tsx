import { useAuth } from '@/lib/contexts/AuthContext';
import { getEmoji } from '@/lib/utils/emojis';
import * as mfm from 'mfm-js';
import * as Misskey from 'misskey-js';
import React from 'react';
import { Linking, StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import AutoResizingImage from './AutoResizingImage';

interface MfmRenderProps {
  text: string;
  style?: StyleProp<TextStyle>;
  emojiUrls?: Record<string, string>;
  author?: Misskey.entities.UserLite;
  isNote?: boolean;
  rootScale?: number;
  nyaize?: boolean | 'respect';
  parsedNodes?: mfm.MfmNode[] | null;
}

export const Mfm: React.FC<MfmRenderProps> = ({
  text,
  style,
  emojiUrls = {},
  author,
  nyaize = false,
  parsedNodes = null,
}) => {
  const { serverInfo } = useAuth();

  const shouldNyaize = nyaize ? (nyaize === 'respect' ? author?.isCat : false) : false;

  const nodes = parsedNodes ?? mfm.parse(text);

  const safeParseFloat = (str: unknown): number | null => {
    if (typeof str !== 'string' || str === '') return null;
    const num = parseFloat(str);
    if (isNaN(num)) return null;
    return num;
  };

  const validTime = (t: string | boolean | null | undefined) => {
    if (t == null) return null;
    if (typeof t === 'boolean') return null;
    return t.match(/^-?[0-9.]+s$/) ? t : null;
  };

  const validColor = (c: unknown): string | null => {
    if (typeof c !== 'string') return null;
    return c.match(/^[0-9a-f]{3,6}$/i) ? c : null;
  };

  const renderNode = (node: mfm.MfmNode): React.ReactNode => {
    switch (node.type) {
      case 'text': {
        let text = node.props.text.replace(/(\r\n|\n|\r)/g, '\n');
        if (shouldNyaize) {
          text = Misskey.nyaize(text);
        }
        return <Text>{text}</Text>;
      }

      case 'url':
        return (
          <Text style={styles.url} onPress={() => Linking.openURL(node.props.url)}>
            {node.props.url}
          </Text>
        );

      case 'mention':
        return <Text style={styles.mention}>@{node.props.username}</Text>;

      case 'hashtag':
        return <Text style={styles.hashtag}>#{node.props.hashtag}</Text>;

      case 'bold':
        return (
          <Text style={styles.bold}>
            {node.children.map((child, i) => (
              <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
            ))}
          </Text>
        );

      case 'italic':
        return (
          <Text style={styles.italic}>
            {node.children.map((child, i) => (
              <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
            ))}
          </Text>
        );

      case 'strike':
        return (
          <Text style={styles.strike}>
            {node.children.map((child, i) => (
              <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
            ))}
          </Text>
        );

      case 'center':
        return (
          <View style={styles.center}>
            {node.children.map((child, i) => (
              <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
            ))}
          </View>
        );

      case 'small':
        return (
          <Text style={styles.small}>
            {node.children.map((child, i) => (
              <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
            ))}
          </Text>
        );

      case 'quote':
        return (
          <View style={styles.quote}>
            {node.children.map((child, i) => (
              <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
            ))}
          </View>
        );

      case 'search':
        return (
          <Text
            style={styles.search}
            onPress={() => Linking.openURL(`https://google.com/search?q=${node.props.query}`)}
          >
            🔍 {node.props.query}
          </Text>
        );

      case 'plain':
        return (
          <Text style={styles.plain}>
            {node.children.map((child, i) => (
              <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
            ))}
          </Text>
        );

      case 'fn': {
        switch (node.props.name) {
          case 'serif':
            return (
              <Text style={styles.serif}>
                {node.children.map((child, i) => (
                  <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
                ))}
              </Text>
            );
          case 'monospace':
            return (
              <Text style={styles.monospace}>
                {node.children.map((child, i) => (
                  <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
                ))}
              </Text>
            );
          case 'blur':
            return (
              <Text style={[styles.blur, { opacity: 0.5 }]}>
                {node.children.map((child, i) => (
                  <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
                ))}
              </Text>
            );
          case 'rainbow': {
            return (
              <Text style={styles.rainbow}>
                {node.children.map((child, i) => (
                  <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
                ))}
              </Text>
            );
          }
          case 'x2':
          case 'x3':
          case 'x4': {
            const scale = node.props.name === 'x2' ? 2 : node.props.name === 'x3' ? 3 : 4;
            return (
              <Text style={{ fontSize: 16 * scale }}>
                {node.children.map((child, i) => (
                  <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
                ))}
              </Text>
            );
          }
          case 'fg': {
            let color = validColor(node.props.args.color);
            color = color ?? 'f00';
            return (
              <Text style={{ color: `#${color}` }}>
                {node.children.map((child, i) => (
                  <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
                ))}
              </Text>
            );
          }
          case 'bg': {
            let color = validColor(node.props.args.color);
            color = color ?? 'f00';
            return (
              <Text style={{ backgroundColor: `#${color}` }}>
                {node.children.map((child, i) => (
                  <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
                ))}
              </Text>
            );
          }
          case 'border': {
            let color = validColor(node.props.args.color);
            color = color ? `#${color}` : '#2196F3';
            const width = safeParseFloat(node.props.args.width) ?? 1;
            const radius = safeParseFloat(node.props.args.radius) ?? 0;
            const style = {
              borderWidth: width,
              borderColor: color,
              borderRadius: radius,
              padding: 4,
            };
            return (
              <View style={style}>
                {node.children.map((child, i) => (
                  <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
                ))}
              </View>
            );
          }
          case 'ruby': {
            if (node.children.length === 1) {
              const child = node.children[0];
              let text = child.type === 'text' ? child.props.text : '';
              if (shouldNyaize) {
                text = Misskey.nyaize(text);
              }
              const [base, ruby] = text.split(' ');
              return (
                <View>
                  <Text style={styles.rubyText}>{base}</Text>
                  <Text style={styles.rubyAnnotation}>{ruby}</Text>
                </View>
              );
            }
            return null;
          }
          case 'unixtime': {
            const child = node.children[0];
            const unixtime = parseInt(child.type === 'text' ? child.props.text : '0');
            return (
              <View style={styles.unixtime}>
                <Text>🕒 {new Date(unixtime * 1000).toLocaleString()}</Text>
              </View>
            );
          }
          case 'tada': {
            const speed =
              Number((validTime(node.props.args.speed) ?? '1s').replace('s', '')) * 1000;
            return (
              <Animated.Text
                style={[
                  { fontSize: 24 },
                  useAnimatedStyle(() => ({
                    transform: [
                      {
                        scale: withRepeat(
                          withSequence(
                            withTiming(1.2, { duration: speed * 0.2 }),
                            withTiming(0.8, { duration: speed * 0.2 }),
                            withTiming(1, { duration: speed * 0.6 }),
                          ),
                          -1,
                        ),
                      },
                    ],
                  })),
                ]}
              >
                {node.children.map((child, i) => (
                  <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
                ))}
              </Animated.Text>
            );
          }
          case 'jelly':
          case 'twitch':
          case 'shake':
          case 'spin':
          case 'jump':
          case 'bounce': {
            const speed =
              Number((validTime(node.props.args.speed) ?? '0.5s').replace('s', '')) * 1000;

            switch (node.props.name) {
              case 'shake': {
                return (
                  <Animated.Text
                    style={useAnimatedStyle(() => ({
                      transform: [
                        {
                          translateX: withRepeat(
                            withSequence(
                              withTiming(5, { duration: speed / 4 }),
                              withTiming(-5, { duration: speed / 4 }),
                              withTiming(0, { duration: speed / 2 }),
                            ),
                            -1,
                          ),
                        },
                      ],
                    }))}
                  >
                    {node.children.map((child, i) => (
                      <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
                    ))}
                  </Animated.Text>
                );
              }

              case 'spin': {
                return (
                  <Animated.Text
                    style={useAnimatedStyle(() => ({
                      transform: [
                        {
                          rotate: withRepeat(withTiming('360deg', { duration: speed }), -1),
                        },
                      ],
                    }))}
                  >
                    {node.children.map((child, i) => (
                      <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
                    ))}
                  </Animated.Text>
                );
              }

              case 'jump': {
                return (
                  <Animated.Text
                    style={useAnimatedStyle(() => ({
                      transform: [
                        {
                          translateY: withRepeat(
                            withSequence(
                              withTiming(-10, { duration: speed / 2 }),
                              withTiming(0, { duration: speed / 2 }),
                            ),
                            -1,
                          ),
                        },
                      ],
                    }))}
                  >
                    {node.children.map((child, i) => (
                      <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
                    ))}
                  </Animated.Text>
                );
              }

              case 'bounce': {
                return (
                  <Animated.Text
                    style={useAnimatedStyle(() => ({
                      transform: [
                        {
                          translateY: withRepeat(
                            withSequence(
                              withTiming(0, { duration: speed / 3 }),
                              withTiming(-15, { duration: speed / 3 }),
                              withTiming(0, { duration: speed / 3 }),
                            ),
                            -1,
                          ),
                        },
                      ],
                    }))}
                  >
                    {node.children.map((child, i) => (
                      <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
                    ))}
                  </Animated.Text>
                );
              }

              case 'jelly': {
                return (
                  <Animated.Text
                    style={useAnimatedStyle(() => ({
                      transform: [
                        {
                          scale: withRepeat(
                            withSequence(
                              withTiming(1.1, { duration: speed / 3 }),
                              withTiming(0.9, { duration: speed / 3 }),
                              withTiming(1, { duration: speed / 3 }),
                            ),
                            -1,
                          ),
                        },
                      ],
                    }))}
                  >
                    {node.children.map((child, i) => (
                      <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
                    ))}
                  </Animated.Text>
                );
              }

              case 'twitch': {
                return (
                  <Animated.Text
                    style={useAnimatedStyle(() => ({
                      transform: [
                        {
                          translateX: withRepeat(
                            withSequence(
                              withTiming(2, { duration: speed / 8 }),
                              withTiming(-2, { duration: speed / 8 }),
                              withTiming(0, { duration: speed / 4 }),
                            ),
                            -1,
                          ),
                        },
                        {
                          translateY: withRepeat(
                            withSequence(
                              withTiming(-1, { duration: speed / 8 }),
                              withTiming(1, { duration: speed / 8 }),
                              withTiming(0, { duration: speed / 4 }),
                            ),
                            -1,
                          ),
                        },
                      ],
                    }))}
                  >
                    {node.children.map((child, i) => (
                      <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
                    ))}
                  </Animated.Text>
                );
              }

              default:
                return null;
            }
          }
          default:
            return null;
        }
      }

      case 'inlineCode':
        return <Text style={styles.inlineCode}>{node.props.code}</Text>;

      case 'mathInline':
        return <Text style={styles.mathInline}>{node.props.formula}</Text>;

      case 'emojiCode': {
        const emojiUrl =
          emojiUrls[node.props.name] ?? getEmoji(serverInfo?.emojis, node.props.name);
        const fontSize = (style as TextStyle)?.fontSize;
        const height = fontSize === 16 ? 24 : (fontSize ?? 24);
        if (emojiUrl) {
          // 0 width character to prevent layout shift
          return (
            <Text>
              {'\u200B'}
              <AutoResizingImage
                source={{ uri: emojiUrl }}
                height={height}
                style={{ transform: [{ translateY: (height || 24) / 2 }] }}
              />
            </Text>
          );
        }
        return <Text>:{node.props.name}:</Text>;
      }

      case 'unicodeEmoji':
        return <Text style={styles.unicodeEmoji}>{node.props.emoji}</Text>;

      default:
        if (node.children) {
          return node.children.map((child, i) => (
            <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
          ));
        }
        return null;
    }
  };

  return (
    <Text style={[style]} selectable>
      {nodes.map((node, i) => (
        <React.Fragment key={i}>{renderNode(node)}</React.Fragment>
      ))}
    </Text>
  );
};

const styles = StyleSheet.create({
  url: {
    color: '#2196F3',
    textDecorationLine: 'underline',
  },
  mention: {
    color: '#2196F3',
  },
  hashtag: {
    color: '#2196F3',
  },
  bold: {
    fontWeight: 'bold',
  },
  italic: {
    fontStyle: 'italic',
  },
  strike: {
    textDecorationLine: 'line-through',
  },
  center: {
    width: '100%',
    alignItems: 'center',
  },
  small: {
    fontSize: 12,
  },
  quote: {
    borderLeftWidth: 3,
    borderLeftColor: '#888',
    paddingLeft: 8,
    marginLeft: 8,
    marginVertical: 4,
  },
  search: {
    color: '#2196F3',
    textDecorationLine: 'underline',
  },
  plain: {
    fontFamily: 'System',
  },
  serif: {
    fontFamily: 'serif',
  },
  monospace: {
    fontFamily: 'monospace',
  },
  blur: {
    opacity: 0.5,
  },
  inlineCode: {
    fontFamily: 'monospace',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  mathInline: {
    fontFamily: 'monospace',
    backgroundColor: '#f8f8f8',
  },
  emoji: {
    width: 24,
    height: 24,
    marginHorizontal: 1,
    marginVertical: 1,
  },
  unicodeEmoji: {
    fontSize: 16,
    lineHeight: 24,
  },
  rainbow: {
    backgroundColor: 'transparent',
  },
  rubyText: {
    fontSize: 16,
    lineHeight: 24,
  },
  rubyAnnotation: {
    fontSize: 10,
    lineHeight: 12,
    textAlign: 'center',
    color: '#666',
  },
  unixtime: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 4,
    borderRadius: 12,
  },
});
