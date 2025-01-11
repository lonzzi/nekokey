import { isIOS } from '@/lib/utils/platform';
import * as mfm from 'mfm-js';
import * as Misskey from 'misskey-js';
import React, { useState } from 'react';
import { Linking, type StyleProp, type ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';
import twemoji from 'twemoji';

export type MfmRenderProps = {
  text: string;
  emojiUrls?: Record<string, string>;
  author?: Misskey.entities.UserLite;
  nyaize?: boolean | 'respect';
  parsedNodes?: mfm.MfmNode[] | null;
  serverUrl?: string;
  style?: StyleProp<ViewStyle>;
  autoAdjustHeight?: boolean;
};

const htmlTemplate = (htmlContent: string) => `
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
    />
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        margin: 0;
        padding: 0;
      }
    </style>
  </head>
  <body style="overflow: hidden;"><span>${htmlContent}</span></body>
  <script>
    function sendHeight() {
      const height = document.body.scrollHeight;
      window.ReactNativeWebView.postMessage(height);
    }
    ${
      isIOS
        ? 'window.onload = () => window.ReactNativeWebView.postMessage(document.body.scrollHeight)'
        : 'window.onresize = () => window.ReactNativeWebView.postMessage(document.body.scrollHeight)'
    }
  </script>
</html>
`;

export const WebViewMfm: React.FC<MfmRenderProps> = ({
  text,
  emojiUrls = {},
  author,
  nyaize = false,
  parsedNodes = null,
  serverUrl = 'https://misskey.io',
  style,
  autoAdjustHeight = true,
}) => {
  const [height, setHeight] = useState(80);

  const shouldNyaize = nyaize ? (nyaize === 'respect' ? author?.isCat : false) : false;

  text = text.trim();

  const nodes = parsedNodes ?? mfm.parse(text);

  const renderNodeToHtml = (node: mfm.MfmNode): string => {
    switch (node.type) {
      case 'text': {
        let text = node.props.text.replace(/(\r\n|\n|\r)/g, '<br>');
        if (shouldNyaize) {
          text = Misskey.nyaize(text);
        }
        return `<span>${text}</span>`;
      }

      case 'url':
        return `<a href="${node.props.url}" style="color: #2196F3; text-decoration: underline;">${node.props.url}</a>`;

      case 'link':
        return `<a href="${node.props.url}" style="color: #2196F3; text-decoration: underline;">${node.children.map(renderNodeToHtml).join('')}</a>`;

      case 'mention':
        return `<span style="color: #2196F3;">@${node.props.username}</span>`;

      case 'hashtag':
        return `<span style="color: rgb(255, 145, 86);">#${node.props.hashtag}</span>`;

      case 'bold':
        return `<strong>${node.children.map(renderNodeToHtml).join('')}</strong>`;

      case 'italic':
        return `<em>${node.children.map(renderNodeToHtml).join('')}</em>`;

      case 'strike':
        return `<del>${node.children.map(renderNodeToHtml).join('')}</del>`;

      case 'center':
        return `<div style="text-align: center;">${node.children.map(renderNodeToHtml).join('')}</div>`;

      case 'small':
        return `<small>${node.children.map(renderNodeToHtml).join('')}</small>`;

      case 'quote':
        return `<blockquote style="border-left: 3px solid #888; padding-left: 8px; margin: 8px; opacity: 0.7;">${node.children.map(renderNodeToHtml).join('')}</blockquote>`;

      case 'search':
        return `
          <div style="display: flex; align-items: center; justify-content: space-between; background-color: #f0f0f0; padding: 8px; border-radius: 8px; margin: 4px 0;">
            <span style="color: #2196F3;">🔍 ${node.props.query}</span>
            <a href="https://www.google.com/search?q=${encodeURIComponent(node.props.query)}" style="background-color: #2196F3; color: white; padding: 6px 12px; border-radius: 4px; margin-left: 8px; text-decoration: none;">Google</a>
          </div>
          `;

      case 'fn': {
        switch (node.props.name) {
          case 'serif':
            return `<span style="font-family: serif;">${node.children.map(renderNodeToHtml).join('')}</span>`;
          case 'monospace':
            return `<span style="font-family: monospace;">${node.children.map(renderNodeToHtml).join('')}</span>`;
          case 'blur':
            return `<span style="filter: blur(6px); transition: filter 0.2s;" onmouseover="this.style.filter='none'" onmouseout="this.style.filter='blur(10px)'">${node.children.map(renderNodeToHtml).join('')}</span>`;
          case 'rainbow':
            return `<span style="background: linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${node.children.map(renderNodeToHtml).join('')}</span>`;
          case 'x2':
          case 'x3':
          case 'x4': {
            const scale = node.props.name === 'x2' ? 2 : node.props.name === 'x3' ? 3 : 4;
            return `<span style="font-size: ${scale}em;">${node.children.map(renderNodeToHtml).join('')}</span>`;
          }
          case 'fg': {
            const color = node.props.args.color || 'f00';
            return `<span style="color: #${color};">${node.children.map(renderNodeToHtml).join('')}</span>`;
          }
          case 'bg': {
            const color = node.props.args.color || 'f00';
            return `<span style="background-color: #${color};">${node.children.map(renderNodeToHtml).join('')}</span>`;
          }
          case 'border': {
            const color = node.props.args.color || '2196F3';
            const width = node.props.args.width || 1;
            const radius = node.props.args.radius || 0;
            return `<span style="border: ${width}px solid #${color}; border-radius: ${radius}px;">${node.children.map(renderNodeToHtml).join('')}</span>`;
          }
          case 'ruby': {
            if (node.children.length === 1) {
              const child = node.children[0];
              if (!child) {
                return '';
              }
              let text = child.type === 'text' ? child.props.text : '';
              if (shouldNyaize) {
                text = Misskey.nyaize(text);
              }
              const [base, ruby] = text.split(' ');
              return `<ruby>${base}<rt style="transform: translateY(4px); color: #888;">${ruby}</rt></ruby>`;
            }
            return '';
          }
          case 'unixtime': {
            const child = node.children[0];
            if (!child) {
              return '';
            }
            const unixtime = parseInt(child.type === 'text' ? child.props.text : '0');
            return `<span>🕒 ${new Date(unixtime * 1000).toLocaleString()}</span>`;
          }
          case 'tada': {
            return `<span style="font-size: 24px; animation: tada 1s infinite;">${node.children.map(renderNodeToHtml).join('')}</span>`;
          }
          case 'flip': {
            const transform =
              node.props.args.h && node.props.args.v
                ? 'scale(-1, -1)'
                : node.props.args.v
                  ? 'scaleY(-1)'
                  : 'scaleX(-1)';
            return `<span style="display: inline-block; transform: ${transform};">${node.children.map(renderNodeToHtml).join('')}</span>`;
          }
          case 'rotate': {
            const angle = node.props.args.deg || 90;
            return `<span style="display: inline-block; transform: rotate(${angle}deg); transform-origin: center center;">${node.children.map(renderNodeToHtml).join('')}</span>`;
          }
          case 'position': {
            const x = node.props.args.x || 0;
            const y = node.props.args.y || 0;
            return `<span style="position: relative; left: ${x}em; top: ${y}em;">${node.children.map(renderNodeToHtml).join('')}</span>`;
          }
          case 'scale': {
            const x = Math.min(Number(node.props.args.x) || 1, 5);
            const y = Math.min(Number(node.props.args.y) || 1, 5);
            return `<span style="display: inline-block; transform: scale(${x}, ${y});">${node.children.map(renderNodeToHtml).join('')}</span>`;
          }
          case 'jelly':
          case 'twitch':
          case 'shake':
          case 'spin':
          case 'jump':
          case 'bounce': {
            const speed = node.props.args.speed || '0.5s';
            const animationName = node.props.name;
            return `<span style="animation: ${animationName} ${speed} infinite;">${node.children.map(renderNodeToHtml).join('')}</span>`;
          }
          default:
            return '';
        }
      }

      case 'inlineCode':
        return `<code style="background-color: #f0f0f0; padding: 2px 4px; border-radius: 3px;">${node.props.code}</code>`;

      case 'blockCode':
        return `<pre style="background-color: #f0f0f0; padding: 8px; border-radius: 8px; margin: 4px 0;"><code>${node.props.code}</code></pre>`;

      case 'mathInline':
        return `<span style="font-family: monospace;">${node.props.formula}</span>`;

      case 'emojiCode': {
        const emojiUrl = emojiUrls[node.props.name];
        return `<img src="${emojiUrl}" alt="${node.props.name}" style="height: 1.5em; vertical-align: middle;" />`;
      }

      case 'unicodeEmoji': {
        const codePoint = twemoji.convert.toCodePoint(node.props.emoji);
        const url = `${serverUrl}/twemoji/${codePoint}.svg`;
        return `<img src="${url}" alt="${node.props.emoji}" style="height: 1.25em; vertical-align: -.25em;" />`;
      }

      default:
        if (node.children) {
          return node.children.map(renderNodeToHtml).join('');
        }
        return '';
    }
  };

  const htmlContent = nodes.map(renderNodeToHtml).join('');

  return (
    <WebView
      originWhitelist={['*']}
      scrollEnabled={false}
      source={{
        html: htmlTemplate(htmlContent),
      }}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      style={[style, { height: autoAdjustHeight ? height : undefined }]}
      onMessage={(event) => {
        const height = parseInt(event.nativeEvent.data);
        if (height) {
          setHeight(height);
        }
      }}
      onShouldStartLoadWithRequest={(request) => {
        const isLocal = request.url === 'about:blank';
        if (!isLocal) {
          Linking.openURL(request.url);
        }

        return isLocal;
      }}
    />
  );
};
