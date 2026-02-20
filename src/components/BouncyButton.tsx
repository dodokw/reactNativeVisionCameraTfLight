import React from 'react';
import { Pressable, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface BouncyButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const BouncyButton = ({
  onPress,
  children,
  style,
}: BouncyButtonProps) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    // 버튼 모양이 쫀득하게 작아지도록 짧은 시간(100ms)과 ease 효과를 줍니다.
    scale.value = withTiming(0.96, {
      duration: 100,
      easing: Easing.out(Easing.ease),
    });
  };

  const handlePressOut = () => {
    // 손을 떼었을 때 원래 크기로 자연스럽게 복구됩니다 (150ms).
    scale.value = withTiming(1, {
      duration: 150,
      easing: Easing.out(Easing.ease),
    });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
};
