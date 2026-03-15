import { useEffect, useRef } from "react";
import { Animated } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { colors } from "../theme";

export default function FishIcon({
  size = 80,
  pulse = false,
  color = colors.textPrimary,
  flipHorizontal = false,
}) {
  const opacity = useRef(new Animated.Value(pulse ? 0.4 : 1)).current;

  useEffect(() => {
    if (!pulse) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse, opacity]);

  return (
    <Animated.View
      style={{
        opacity,
        transform: flipHorizontal ? [{ scaleX: -1 }] : [],
      }}
    >
      <Svg
        width={size}
        height={size / 2}
        viewBox="0 0 100 50"
        fill="none"
        stroke={color}
        strokeWidth={2}
      >
        <Path
          d="M 10 25 Q 30 5, 70 25 Q 30 45, 10 25 M 75 25 L 95 15 M 75 25 L 95 35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx="25" cy="22" r="4" strokeWidth="2" />
      </Svg>
    </Animated.View>
  );
}
