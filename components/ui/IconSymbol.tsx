import Foundation from '@expo/vector-icons/Foundation';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import React from 'react';
import { OpaqueColorValue, StyleProp, TextStyle } from 'react-native';

export type IconType = 'material' | 'foundation' | 'ionicons' | 'material-community';

export type IconNameMap = {
  material: keyof typeof MaterialIcons.glyphMap;
  foundation: keyof typeof Foundation.glyphMap;
  ionicons: keyof typeof Ionicons.glyphMap;
  'material-community': keyof typeof MaterialCommunityIcons.glyphMap;
};

export interface IconSymbolProps<T extends IconType> {
  type?: T;
  name: IconNameMap[T];
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}

export function IconSymbol<T extends IconType = 'ionicons'>({
  name,
  type = 'ionicons' as T,
  size = 24,
  color,
  style,
}: IconSymbolProps<T>) {
  switch (type) {
    case 'foundation':
      return (
        <Foundation
          name={name as keyof typeof Foundation.glyphMap}
          size={size}
          color={color}
          style={style}
        />
      );
    case 'material':
      return (
        <MaterialIcons
          name={name as keyof typeof MaterialIcons.glyphMap}
          size={size}
          color={color}
          style={style}
        />
      );
    case 'material-community':
      return (
        <MaterialCommunityIcons
          name={name as keyof typeof MaterialCommunityIcons.glyphMap}
          size={size}
          color={color}
          style={style}
        />
      );
    case 'ionicons':
    default:
      return (
        <Ionicons
          name={name as keyof typeof Ionicons.glyphMap}
          size={size}
          color={color}
          style={style}
        />
      );
  }
}
