import { Colors } from '@/constants/Colors';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getEmoji } from '@/lib/utils/emojis';
import { isAndroid } from '@/lib/utils/platform';
import * as mfm from 'mfm-js';
import * as Misskey from 'misskey-js';
import React from 'react';
import {
  Linking,
  StyleProp,
  StyleSheet,
  Text,
  TextProps,
  TextStyle,
  useColorScheme,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Blurred } from './Blurred';
import { CodeHighlighter } from './CodeHighlighter';
import { CustomEmoji } from './CustomEmoji';
import { RubyText } from './RubyText';
import { TwEmoji } from './TwEmoji';

type MfmRenderProps = {
  text: string;
  style?: StyleProp<TextStyle>;
  emojiUrls?: Record<string, string>;
  author?: Misskey.entities.UserLite;
  isNote?: boolean;
  rootScale?: number;
  nyaize?: boolean | 'respect';
  parsedNodes?: mfm.MfmNode[] | null;
  isName?: boolean;
} & TextProps;

const IMAGE_SCALE = 1.5;

export const Mfm: React.FC<MfmRenderProps> = ({
  text,
  style,
  emojiUrls = {},
  author,
  nyaize = false,
  parsedNodes = null,
  isName = false,
  ...props
}) => {
  const { serverInfo } = useAuth();
  const colorScheme = useColorScheme();

  const shouldNyaize = nyaize ? (nyaize === 'respect' ? author?.isCat : false) : false;

  const nodes = parsedNodes ?? mfm.parse(text);

  const fontSize = StyleSheet.flatten(style)?.fontSize ?? 16;
  // const lineHeight = StyleSheet.flatten(style)?.lineHeight ?? 24;
  const emojiHeight = isName ? fontSize : fontSize * IMAGE_SCALE;

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
        return <Text style={{ color: Colors[colorScheme ?? 'light'].text }}>{text}</Text>;
      }

      case 'url':
        return (
          <Text style={styles.url} onPress={() => Linking.openURL(node.props.url)}>
            {node.props.url}
          </Text>
        );

      case 'link':
        return (
          <Text style={styles.url} onPress={() => Linking.openURL(node.props.url)}>
            {node.children.map((child, i) => (
              <React.Fragment key={i}>
                {React.cloneElement((renderNode(child) as React.ReactElement) ?? <></>, {
                  style: { color: 'inherit' },
                })}
              </React.Fragment>
            ))}
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
          <>
            <Text>{'\n'}</Text>
            <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'center' }}>
              {node.children.map((child, i) => (
                <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
              ))}
            </View>
          </>
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
          <>
            <Text>{'\n'}</Text>
            <View style={styles.quote}>
              {node.children.map((child, i) => (
                <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
              ))}
            </View>
          </>
        );

      case 'search':
        return (
          <View style={styles.search}>
            <Text style={styles.searchText}>🔍 {node.props.query}</Text>
            <Text
              style={styles.searchButton}
              onPress={() =>
                Linking.openURL(
                  `https://www.google.com/search?q=${encodeURIComponent(node.props.query)}`,
                )
              }
            >
              Google
            </Text>
          </View>
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
              <Blurred
                intensity={16}
                tint={
                  colorScheme === 'dark'
                    ? isAndroid
                      ? 'systemMaterialDark'
                      : 'dark'
                    : 'systemChromeMaterialLight'
                }
              >
                {node.children.map((child, i) => (
                  <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
                ))}
              </Blurred>
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
              <Text style={{ fontSize: fontSize * scale, lineHeight: fontSize * scale }}>
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
                  <React.Fragment key={i}>
                    {React.cloneElement((renderNode(child) as React.ReactElement) ?? <></>, {
                      style: { color: 'inherit' },
                    })}
                  </React.Fragment>
                ))}
              </Text>
            );
          }
          case 'bg': {
            let color = validColor(node.props.args.color);
            color = color ?? 'f00';
            return (
              <View
                style={{
                  backgroundColor: `#${color}`,
                  transform: [{ scale: 1.1 }, { translateX: 1 }, { translateY: 1 }],
                }}
              >
                <Text>
                  {node.children.map((child, i) => (
                    <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
                  ))}
                </Text>
              </View>
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
              return <RubyText base={base} ruby={ruby} />;
            }
            return <></>;
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
          case 'flip': {
            const transform =
              node.props.args.h && node.props.args.v
                ? [{ scaleX: -1 }, { scaleY: -1 }]
                : node.props.args.v
                  ? [{ scaleY: -1 }]
                  : [{ scaleX: -1 }];

            return (
              <View style={{ transform: transform }}>
                {node.children.map((child, i) => (
                  <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
                ))}
              </View>
            );
          }
          case 'rotate': {
            const angle = safeParseFloat(node.props.args.deg) ?? 90;
            return (
              <View
                style={{
                  transform: [{ rotate: `${angle}deg` }],
                }}
              >
                {node.children.map((child, i) => (
                  <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
                ))}
              </View>
            );
          }
          case 'position': {
            const x = safeParseFloat(node.props.args.x) ?? 0;
            const y = safeParseFloat(node.props.args.y) ?? 0;
            return (
              <View
                style={{
                  transform: [{ translateX: x * fontSize }, { translateY: y * fontSize }],
                  zIndex: 1,
                }}
              >
                {node.children.map((child, i) => (
                  <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
                ))}
              </View>
            );
          }
          case 'scale': {
            const x = Math.min(safeParseFloat(node.props.args.x) ?? 1, 5);
            const y = Math.min(safeParseFloat(node.props.args.y) ?? 1, 5);
            return (
              <View
                style={{
                  transform: [{ scaleX: x }, { scaleY: y }],
                  // backgroundColor: 'red',
                }}
              >
                {node.children.map((child, i) => (
                  <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
                ))}
              </View>
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
                  <Animated.View
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
                  </Animated.View>
                );
              }

              case 'spin': {
                return (
                  <Animated.View
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
                  </Animated.View>
                );
              }

              case 'jump': {
                return (
                  <Animated.View
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
                  </Animated.View>
                );
              }

              case 'bounce': {
                return (
                  <Animated.View
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
                  </Animated.View>
                );
              }

              case 'jelly': {
                return (
                  <Animated.View
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
                  </Animated.View>
                );
              }

              case 'twitch': {
                return (
                  <Animated.View
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
                  </Animated.View>
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
        return (
          <View style={styles.inlineCode}>
            <Text
              style={{
                fontFamily: 'monospace',
              }}
            >
              {node.props.code}
            </Text>
          </View>
        );

      case 'blockCode':
        return <CodeHighlighter code={node.props.code} />;

      case 'mathInline':
        return (
          <View style={styles.mathInline}>
            <Text style={{ fontFamily: 'monospace' }}>{node.props.formula}</Text>
          </View>
        );

      case 'emojiCode': {
        const emojiUrl =
          emojiUrls[node.props.name] ?? getEmoji(serverInfo?.emojis, node.props.name);
        return (
          <CustomEmoji
            emojiName={node.props.name}
            emojiUrl={emojiUrl}
            height={emojiHeight}
            isName={isName}
          />
        );
      }

      case 'unicodeEmoji':
        return <TwEmoji text={node.props.emoji} offset={-2} />;

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
    <Text style={[style, { color: Colors[colorScheme ?? 'light'].text }]} selectable {...props}>
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
    color: Colors.common.hashtag,
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
    flex: 1,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 8,
    marginVertical: 4,
  },
  searchText: {
    flex: 1,
    color: '#2196F3',
  },
  searchButton: {
    backgroundColor: '#2196F3',
    color: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  serif: {
    fontFamily: 'serif',
  },
  monospace: {
    fontFamily: 'monospace',
  },
  inlineCode: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    transform: [{ translateY: 6 }],
  },
  mathInline: {
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
  unixtime: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 4,
    borderRadius: 12,
  },
});
