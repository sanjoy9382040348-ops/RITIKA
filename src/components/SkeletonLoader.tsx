import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';
import { palettes } from '@theme/tokens';

interface Props {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export const SkeletonLoader: React.FC<Props> = ({ width, height, borderRadius = 12, style }) => {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 750, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width: width as any, height, borderRadius, backgroundColor: palettes.dark.skeleton, opacity },
        style,
      ]}
    />
  );
};
