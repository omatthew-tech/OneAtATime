import { useEffect, useRef, useState } from "react";
import { Animated } from "react-native";
import Svg, { ClipPath, Defs, G, Path } from "react-native-svg";

const HEART_D =
  "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";

const VB = 24;
const HEART_TOP = 3;
const HEART_BOTTOM = 21.35;
const HEART_RANGE = HEART_BOTTOM - HEART_TOP;
const WAVE_AMP = 0.7;
const WAVE_FREQ = 2.5;
const FILL_LERP = 3;
const WAVE_SPEED = 0.35;

let nextId = 0;

function buildLiquidPath(fillY, phase) {
  let d = "";
  for (let x = 0; x <= VB; x += 0.5) {
    const y =
      fillY +
      Math.sin((x / VB) * Math.PI * 2 * WAVE_FREQ + phase * Math.PI * 2) *
        WAVE_AMP;
    d += x === 0 ? `M${x} ${y}` : ` L${x} ${y}`;
  }
  d += ` L${VB} ${VB + 2} L0 ${VB + 2} Z`;
  return d;
}

export default function LiquidHeart({
  size = 32,
  fillPercent = 0.25,
  liquidColor = "#00d4aa",
  outlineColor = "#00d4aa",
}) {
  const [clipId] = useState(() => `hc_${nextId++}`);
  const targetRef = useRef(fillPercent);
  const stateRef = useRef({ fill: fillPercent, phase: 0 });
  const [, tick] = useState(0);
  const frameRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseRunning = useRef(false);

  targetRef.current = fillPercent;

  useEffect(() => {
    const shouldPulse = fillPercent >= 1;

    if (shouldPulse && !pulseRunning.current) {
      pulseRunning.current = true;
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else if (!shouldPulse && pulseRunning.current) {
      pulseRunning.current = false;
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [fillPercent >= 1]);

  useEffect(() => {
    let last = Date.now();

    const loop = () => {
      const now = Date.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const s = stateRef.current;
      stateRef.current = {
        fill:
          s.fill +
          (targetRef.current - s.fill) * Math.min(1, dt * FILL_LERP),
        phase: (s.phase + dt * WAVE_SPEED) % 1,
      };
      tick((n) => n + 1);
      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const { fill, phase } = stateRef.current;
  const fillY = HEART_BOTTOM - HEART_RANGE * fill;
  const liquidD = buildLiquidPath(fillY, phase);

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <Svg width={size} height={size} viewBox={`0 0 ${VB} ${VB}`}>
        <Defs>
          <ClipPath id={clipId}>
            <Path d={HEART_D} />
          </ClipPath>
        </Defs>
        <G clipPath={`url(#${clipId})`}>
          <Path d={liquidD} fill={liquidColor} />
        </G>
        <Path
          d={HEART_D}
          fill="none"
          stroke={outlineColor}
          strokeWidth={1.2}
        />
      </Svg>
    </Animated.View>
  );
}
