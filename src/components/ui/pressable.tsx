import type { ReactNode } from 'react';
import { Pressable, type GestureResponderEvent, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { motion, pressScale } from '@/config/theme';

const APressable = Animated.createAnimatedComponent(Pressable);

export interface ScalePressableProps extends Omit<PressableProps, 'style' | 'children'> {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  /** pressed scale (default token 0.98). */
  scaleTo?: number;
}

/**
 * Pressable with the ui-v2 press feedback: a light scale-down (Reanimated). With "reduce motion" on,
 * it dims a little instead. Keeps the 48 px touch target to the caller (via minHeight / hitSlop).
 */
export function ScalePressable({ style, children, scaleTo = pressScale, onPressIn, onPressOut, disabled, ...rest }: ScalePressableProps) {
  const reduce = useReducedMotion();
  const v = useSharedValue(0);
  const anim = useAnimatedStyle(() => (reduce ? { opacity: 1 - 0.15 * v.value } : { transform: [{ scale: 1 - (1 - scaleTo) * v.value }] }));
  return (
    <APressable
      disabled={disabled}
      onPressIn={(e: GestureResponderEvent) => {
        v.value = withTiming(1, { duration: motion.fast });
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        v.value = withTiming(0, { duration: motion.normal });
        onPressOut?.(e);
      }}
      style={[style, anim]}
      {...rest}
    >
      {children}
    </APressable>
  );
}
