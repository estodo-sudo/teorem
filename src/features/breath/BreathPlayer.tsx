import * as Haptics from "expo-haptics";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import { useTranslation } from "react-i18next";

import { AppText, Icon, useTheme } from "@/components";
import { mixHex } from "@/components/ui/urgeGaugeLogic";
import { Button } from "@/components/ui";
import { ThemeOverride } from "@/components/useTheme";
import { useSafeKeepAwake } from "@/lib/useSafeKeepAwake";
import { useSettingsStore } from "@/stores/settingsStore";

import {
  breathState,
  fmtClock,
  hapticOffsets,
  orbTarget,
  sessionMs,
  type BreathMode,
} from "./patterns";
import { useBreathStore } from "./store";
import { localeOf } from '@/i18n/languages';

export type BreathFeeling = "calmer" | "same" | "tenser";

const ORB = 220;
const RING = 268;
const STROKE = 3;

/**
 * Breath session (SPEC_V4 §C.4), always on a calm dark surface. A soft orb grows breathing in (a little
 * more on the second breath of "Hızlı sakinleş") and shrinks breathing out; a thin ring shows how long
 * the current step lasts. Haptic taps guide with closed eyes; "Ekranı karart" leaves only a dim orb.
 * With "reduce motion" the orb changes brightness instead of size.
 *
 * `askFeeling` shows "Nasıl hissediyorsun?" at the end; the SOS flow turns it off and goes straight
 * back to its own gauge.
 */
export function BreathPlayer(props: {
  mode: BreathMode;
  minutes: number;
  color?: string;
  askFeeling?: boolean;
  onDone: (feeling: BreathFeeling | null) => void;
  onClose: () => void;
}) {
  return (
    <ThemeOverride dark>
      <StatusBar style="light" />
      <PlayerBody {...props} />
    </ThemeOverride>
  );
}

function PlayerBody({
  mode,
  minutes,
  color,
  askFeeling = true,
  onDone,
  onClose,
}: {
  mode: BreathMode;
  minutes: number;
  color?: string;
  askFeeling?: boolean;
  onDone: (feeling: BreathFeeling | null) => void;
  onClose: () => void;
}) {
  useSafeKeepAwake();
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const reduce = useReducedMotion();
  const fg = color ?? t.tone.mind.fg;
  const total = sessionMs(mode, minutes);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dim, setDim] = useState(false);
  const base = useRef(0);
  const st = breathState(mode, minutes, elapsed);
  const stepKey = `${st.cycle}-${st.step}`;
  const scale = useSharedValue(0.7);
  const lastTarget = useRef(0.7);
  const haptics = useBreathStore((s) => s.haptics);
  const strength = useSettingsStore((s) => s.settings.hapticStrength);
  const safetySeen = useBreathStore((s) => s.safetySeen);

  // Clock: elapsed time, paused while held.
  useEffect(() => {
    if (paused || st.done) return;
    const started = Date.now() - base.current;
    const id = setInterval(() => {
      const e = Math.min(total, Date.now() - started);
      base.current = e;
      setElapsed(e);
    }, 50);
    return () => clearInterval(id);
  }, [paused, st.done, total]);

  // Orb and haptics follow each step.
  useEffect(() => {
    if (st.done || paused) return;
    const target = orbTarget(st.kind, lastTarget.current);
    lastTarget.current = target;
    const left = Math.max(0, st.stepMs - st.stepElapsed);
    scale.value = withTiming(target, {
      duration: left,
      easing: Easing.inOut(Easing.sin),
    });
    if (!haptics || strength === 0) return;
    const timers = hapticOffsets(st.kind, st.stepMs)
      .filter((o) => o >= st.stepElapsed)
      .map((o) =>
        setTimeout(
          () =>
            // Medium (was Light): vibration is felt 30 % stronger app-wide (HAPTIC_GAIN).
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
              () => undefined,
            ),
          o - st.stepElapsed,
        ),
      );
    return () => timers.forEach(clearTimeout);
    // Re-run on every new step (and on resume), not on every clock tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepKey, paused, st.done]);

  const orbStyle = useAnimatedStyle(() =>
    reduce
      ? {
          opacity: 0.45 + (scale.value - 0.7) * 1.4,
          transform: [{ scale: 0.9 }],
        }
      : { opacity: 1, transform: [{ scale: scale.value }] },
  );

  if (st.done) {
    if (!askFeeling) return <Finish onPress={() => onDone(null)} />;
    return (
      <SafeAreaView
        style={[
          styles.flex,
          {
            backgroundColor: t.tokens.background,
            padding: t.space.gutter,
            justifyContent: "center",
            gap: t.space.xl,
          },
        ]}
      >
        <AppText variant="title1" center accessibilityRole="header">
          {tr("breath.feelingQ")}
        </AppText>
        <View style={{ gap: t.space.sm }}>
          {(["calmer", "same", "tenser"] as const).map((f) => (
            <Button
              key={f}
              label={tr(`breath.feeling.${f}`)}
              variant={f === "calmer" ? "primary" : "secondary"}
              size="lg"
              fullWidth
              onPress={() => onDone(f)}
            />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  const label = tr(`breath.step.${st.kind}`).toLocaleUpperCase(localeOf(i18n.language));
  const stepLeft = Math.max(1, Math.ceil((st.stepMs - st.stepElapsed) / 1000));
  const r = (RING - STROKE) / 2;
  const circ = 2 * Math.PI * r;
  const ringShare = st.stepElapsed / st.stepMs;

  const orb = (
    <View
      style={{
        width: RING,
        height: RING,
        alignItems: "center",
        justifyContent: "center",
      }}
      accessible
      accessibilityLiveRegion="polite"
      accessibilityLabel={`${tr(`breath.step.${st.kind}`)}, ${stepLeft}`}
    >
      <Svg width={RING} height={RING} style={StyleSheet.absoluteFill}>
        <Circle
          cx={RING / 2}
          cy={RING / 2}
          r={r}
          stroke={t.veil.mid}
          strokeWidth={STROKE}
          fill="none"
        />
        <Circle
          cx={RING / 2}
          cy={RING / 2}
          r={r}
          stroke={fg}
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={circ * (1 - ringShare)}
          strokeLinecap="round"
          transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
          opacity={dim ? 0.3 : 1}
        />
      </Svg>
      {/* Dimming sits on a wrapper: the animated style owns the orb's own opacity. */}
      <View style={{ opacity: dim ? 0.3 : 1 }}>
        <Animated.View style={[{ width: ORB, height: ORB }, orbStyle]}>
          <Svg width={ORB} height={ORB}>
            <Defs>
              <RadialGradient id="breathOrb" cx="50%" cy="45%" r="55%">
                <Stop offset="0" stopColor={mixHex(fg, t.focus.text, 0.55)} />
                <Stop offset="0.7" stopColor={fg} />
                <Stop offset="1" stopColor={mixHex(fg, t.focus.black, 0.35)} />
              </RadialGradient>
            </Defs>
            <Circle
              cx={ORB / 2}
              cy={ORB / 2}
              r={ORB / 2}
              fill="url(#breathOrb)"
            />
          </Svg>
        </Animated.View>
      </View>
      {dim ? null : (
        <View
          style={[
            StyleSheet.absoluteFill,
            { alignItems: "center", justifyContent: "center" },
          ]}
          pointerEvents="none"
        >
          <AppText
            variant="title1"
            weight="700"
            color={t.focus.black}
            style={{ letterSpacing: 1 }}
          >
            {label}
          </AppText>
          <AppText
            variant="title3"
            tabular
            color={t.focus.black}
            style={{ opacity: 0.7 }}
          >
            {stepLeft}
          </AppText>
        </View>
      )}
    </View>
  );

  if (dim) {
    // Only the orb, very dark; a tap anywhere brings the controls back.
    return (
      <Pressable
        style={[
          styles.flex,
          {
            backgroundColor: t.focus.black,
            alignItems: "center",
            justifyContent: "center",
          },
        ]}
        onPress={() => setDim(false)}
        accessibilityRole="button"
        accessibilityLabel={tr("breath.undim")}
      >
        {orb}
      </Pressable>
    );
  }

  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: t.tokens.background }]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: t.space.md,
          minHeight: 56,
        }}
      >
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={tr("common.close")}
          hitSlop={8}
          style={{
            width: 48,
            height: 48,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="close" size={24} color={t.tokens.foreground} />
        </Pressable>
        <AppText variant="bodyStrong" center style={{ flex: 1 }}>
          {tr(`breath.mode.${mode}.name`)}
        </AppText>
        <View style={{ width: 48 }} />
      </View>
      {!safetySeen ? (
        <View
          style={{
            marginHorizontal: t.space.gutter,
            padding: t.space.md,
            borderRadius: t.radius.md,
            backgroundColor: t.veil.soft,
            flexDirection: "row",
            gap: t.space.sm,
            alignItems: "center",
          }}
        >
          <Icon name="info" size="sm" color={t.tokens.foreground} />
          <AppText variant="footnote" style={{ flex: 1 }}>
            {tr("breath.safety")}
          </AppText>
          <Pressable
            onPress={() => useBreathStore.getState().markSafetySeen()}
            accessibilityRole="button"
            hitSlop={8}
            style={{ minHeight: 44, justifyContent: "center" }}
          >
            <AppText variant="footnote" weight="700" color={fg}>
              {tr("breath.ok")}
            </AppText>
          </Pressable>
        </View>
      ) : null}
      <View
        style={[
          styles.flex,
          { alignItems: "center", justifyContent: "center", gap: t.space.xl },
        ]}
      >
        {orb}
        <AppText variant="callout" muted tabular>
          {tr("breath.cycleLeft", {
            n: st.cycle,
            left: fmtClock(st.remainingMs),
          })}
        </AppText>
      </View>
      <View
        style={{
          flexDirection: "row",
          gap: t.space.sm,
          padding: t.space.gutter,
        }}
      >
        <View style={{ flex: 1 }}>
          <Button
            label={paused ? tr("player.resume") : tr("player.pause")}
            icon={paused ? "play" : "pause"}
            variant="secondary"
            size="lg"
            fullWidth
            onPress={() => setPaused((p) => !p)}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label={tr("breath.dim")}
            icon="moon"
            variant="secondary"
            size="lg"
            fullWidth
            onPress={() => setDim(true)}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

/** End of a session started from SOS: a short "done" moment, then back to the gauge. */
function Finish({ onPress }: { onPress: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <SafeAreaView
      style={[
        styles.flex,
        {
          backgroundColor: t.tokens.background,
          padding: t.space.gutter,
          justifyContent: "center",
          gap: t.space.xl,
        },
      ]}
    >
      <AppText variant="title1" center accessibilityRole="header">
        {tr("breath.doneTitle")}
      </AppText>
      <Button
        label={tr("breath.backToGauge")}
        variant="primary"
        size="lg"
        fullWidth
        onPress={onPress}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
