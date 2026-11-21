import { useEffect, useMemo, useState } from 'react';
import { PanResponder, Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { AppText } from '../AppText';
import { useTheme } from '../useTheme';
import { uiHaptic } from './haptic';
import { GAUGE, gaugeGeometry, mixHex, needleDegrees, onArc, segmentBand, segmentPath, stepUrge, urgeWord, valueFromPoint } from './urgeGaugeLogic';

interface Props {
  /** 1–10, or null while nothing is chosen. */
  value: number | null;
  onChange: (v: number) => void;
  /** The question, for the screen reader. */
  label: string;
  /** Main colour of the arc (the camp tone). Defaults to the primary colour. */
  color?: string;
  /** Comparison mode: the first answer, shown as a faint ghost needle with the change below. */
  compareTo?: number | null;
}

const NEEDLE_W = 4;
const PIN = 14;

/**
 * Urge gauge (SPEC_V4 §C.1): a half-circle of 10 segments from calm to strong (no red), a needle that
 * springs to the value, a big number with its word, end labels, and a row of 10 numbered circles.
 * Drag along the arc or tap anywhere on it; screen readers adjust it with swipe up / down.
 */
export function UrgeGauge({ value, onChange, label, color, compareTo }: Props) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const reduce = useReducedMotion();
  const g = useMemo(() => gaugeGeometry(GAUGE.width), []);
  const main = color ?? t.tokens.primary;
  const amber = t.tokens.highlight;
  const empty = t.dark ? t.veil.mid : t.tokens.muted;
  const light = mixHex(main, t.dark ? t.focus.black : t.focus.text, 0.45);
  const needleLen = g.r - 34;

  const angle = useSharedValue(needleDegrees(value, g));
  const [wiggle] = useState(() => value === null && !reduce);
  useEffect(() => {
    const target = needleDegrees(value, g);
    if (value === null && wiggle) {
      // "I'm here": one small wiggle when the gauge opens empty.
      angle.value = withSequence(withTiming(168, { duration: 260 }), withTiming(178, { duration: 220 }), withTiming(180, { duration: 200 }));
    } else angle.value = reduce ? target : withSpring(target, { damping: 14, stiffness: 160 });
  }, [value, g, reduce, angle, wiggle]);
  const needle = useAnimatedStyle(() => ({ transform: [{ rotate: `${-angle.value}deg` }] }));

  const pick = (v: number) => {
    if (v === value) return;
    uiHaptic(v === 10 ? 'light' : 'selection');
    onChange(v);
  };
  // Re-created on every render so the handlers always see the current value (cheap; no gesture state is kept).
  const pan = PanResponder.create({
    onStartShouldSetPanResponder: (e) => onArc(e.nativeEvent.locationX, e.nativeEvent.locationY, g),
    onMoveShouldSetPanResponder: (e) => onArc(e.nativeEvent.locationX, e.nativeEvent.locationY, g),
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (e) => pick(valueFromPoint(e.nativeEvent.locationX, e.nativeEvent.locationY, g)),
    onPanResponderMove: (e) => pick(valueFromPoint(e.nativeEvent.locationX, e.nativeEvent.locationY, g)),
  });

  const segColor = (v: number) => {
    const band = segmentBand(v);
    return band === 'light' ? light : band === 'main' ? main : band === 'mix' ? mixHex(main, amber, 0.5) : amber;
  };
  const word = value === null ? null : tr(`ui.urge.${urgeWord(value)}`);
  const a11yValue = value === null ? tr('ui.urge.none') : tr('ui.urge.a11y', { v: value, word });
  const diff = compareTo != null && value !== null ? value - compareTo : null;

  const needleView = (deg?: number, faint?: boolean) => (
    <Animated.View
      key={faint ? 'ghost' : 'needle'}
      pointerEvents="none"
      style={[
        { position: 'absolute', left: g.cx - needleLen, top: g.cy - NEEDLE_W / 2, width: needleLen * 2, height: NEEDLE_W, flexDirection: 'row' },
        deg === undefined ? needle : { transform: [{ rotate: `${-deg}deg` }] },
        { opacity: faint ? 0.22 : value === null ? 0.3 : 1 },
      ]}
    >
      <View style={{ flex: 1 }} />
      <View style={{ flex: 1, borderRadius: NEEDLE_W / 2, backgroundColor: t.tokens.foreground }} />
    </Animated.View>
  );

  return (
    <View
      style={{ alignItems: 'center', gap: t.space.md }}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: a11yValue }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => pick(stepUrge(value, e.nativeEvent.actionName === 'increment' ? 1 : -1))}
    >
      <View style={{ width: GAUGE.width, height: g.height }}>
        <Svg width={GAUGE.width} height={g.height}>
          {Array.from({ length: GAUGE.segments }, (_, i) => (
            <Path key={i} d={segmentPath(i, g)} stroke={value !== null && i < value ? segColor(i + 1) : empty} strokeWidth={GAUGE.stroke} strokeLinecap="round" fill="none" />
          ))}
        </Svg>
        {compareTo != null ? needleView(needleDegrees(compareTo, g), true) : null}
        {needleView()}
        <View pointerEvents="none" style={{ position: 'absolute', left: g.cx - PIN / 2, top: g.cy - PIN / 2, width: PIN, height: PIN, borderRadius: PIN / 2, backgroundColor: t.tokens.foreground, opacity: value === null ? 0.3 : 1 }} />
        {/* Touch layer: no children, so locationX / locationY are in the gauge's own coordinates. */}
        <View style={{ position: 'absolute', left: 0, top: 0, width: GAUGE.width, height: g.height + 16 }} {...pan.panHandlers} />
      </View>

      <View style={{ width: GAUGE.width, flexDirection: 'row', justifyContent: 'space-between', marginTop: -t.space.sm }} pointerEvents="none">
        <AppText variant="footnote" muted>
          {tr('ui.urge.low')}
        </AppText>
        <AppText variant="footnote" muted>
          {tr('ui.urge.veryStrong')}
        </AppText>
      </View>

      <View style={{ alignItems: 'center', minHeight: 84, justifyContent: 'center' }} pointerEvents="none" accessibilityLiveRegion="polite">
        {value === null ? (
          <AppText variant="title3" muted>
            {tr('ui.urge.hint')}
          </AppText>
        ) : (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
              <AppText tabular weight="700" style={{ fontSize: 48, lineHeight: 56 }}>
                {value}
              </AppText>
              <AppText variant="title3" muted tabular>
                /10
              </AppText>
            </View>
            <AppText variant="bodyStrong">{word}</AppText>
          </>
        )}
        {diff !== null ? (
          <AppText variant="callout" weight="600" color={diff < 0 ? t.tokens.success : t.tokens.mutedForeground} tabular style={{ marginTop: 4 }}>
            {tr(diff < 0 ? 'ui.urge.down' : diff > 0 ? 'ui.urge.up' : 'ui.urge.same', { a: compareTo, b: value, d: Math.abs(diff) })}
          </AppText>
        ) : null}
      </View>

      <View style={{ alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'space-between' }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => {
          const on = value === v;
          return (
            <Pressable
              key={v}
              onPress={() => pick(v)}
              hitSlop={6}
              style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? segColor(v) : 'transparent', borderWidth: 1, borderColor: on ? segColor(v) : t.tokens.border }}
            >
              <AppText variant="footnote" weight={on ? '700' : '500'} tabular color={on ? (segmentBand(v) === 'light' ? t.tokens.foreground : t.focus.black) : t.tokens.foreground}>
                {v}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
