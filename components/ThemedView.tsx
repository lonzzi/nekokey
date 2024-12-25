import { useThemeColor } from '@/hooks/useThemeColor';
import { View, type ViewProps } from 'react-native';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const bgColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background') as string;

  return <View style={[{ backgroundColor: bgColor }, style]} {...otherProps} />;
}
