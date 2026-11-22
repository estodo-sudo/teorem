import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedProps, useAnimatedStyle, useDerivedValue, useSharedValue, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { darkTheme, familyFor } from '@/config/theme';

import {
  ARM,
  ARM_WIDTH,
  BLADDER,
  floorDeepest,
  floorPath,
  HEAD,
  ILIUM,
  LABELS,
  LANDMARKS,
  organCentres,
  pathLength,
  POSE_REST,
  PUBIS,
  RECTUM,
  SACRUM,
  SILHOUETTE_BODY,
  STOOL,
  VIEWBOX,
  WRONG,
  WRONG_MARKS,
  type Organ,
  type Pt,
} from './paths';
import { FOCUS, poseAt, poseAtReduced, type TimelinePose } from './timeline';

/** Animation colours: theme `anatomy` group (always dark, the same in both themes). */
export const SCENE_COLORS = darkTheme.anatomy;

// ------------------------------------------------------------------ precomputed for the UI thread

/** Organ fit and deepest muscle point, sampled over the contraction (the UI thread interpolates). */
const STEPS = 20;
const FIT = Array.from({ length: STEPS + 1 }, (_, i) => {
  const c = i / STEPS;
  const at = organCentres({ contract: c, scale: POSE_REST.scale });
  const d = floorDeepest(c);
  return [at.bladder[0], at.bladder[1], at.rectum[0], at.rectum[1], d.x, d.y] as const;
});
const FIT_FLAT = FIT.flat();

/** How much of a sag pushes the organs down (the curve's middle moves ¾ of its control points). */
const SAG_SHARE = 0.75;

const LEN = { ilium: pathLength(ILIUM) * 1.02, sacrum: pathLength(SACRUM) * 1.02, pubis: pathLength(PUBIS) * 1.02, floor: pathLength(floorPath(0)) * 1.04 };

function fitAt(contract: number, k: number): number {
  'worklet';
  const x = Math.min(1, Math.max(0, contract)) * STEPS;
  const i = Math.min(STEPS - 1, Math.floor(x));
  const f = x - i;
  return FIT_FLAT[i * 6 + k]! * (1 - f) + FIT_FLAT[(i + 1) * 6 + k]! * f;
}

/** Glow behind the muscle: three wider, fainter round lines instead of a shadow (width px, opacity). */
export const GLOW_LAYERS: readonly (readonly [number, number])[] = [
  [40, 0.04],
  [26, 0.09],
  [16, 0.16],
];

const IS_WEB = Platform.OS === 'web';


/**
 * An SVG group transform as animated props. Phones get react-native-svg's numeric `matrix` prop: a
 * `transform` string set from the UI thread is read by Reanimated as a style transform there and
 * rejected ("invalidTransform"). The web preview keeps the `transform` attribute.
 */
export function svgMatrix(a: number, b: number, c: number, d: number, e: number, f: number): { matrix?: number[]; transform?: string } {
  'worklet';
  if (IS_WEB) return { transform: `matrix(${a} ${b} ${c} ${d} ${e.toFixed(2)} ${f.toFixed(2)})` };
  return { matrix: [a, b, c, d, e, f] };
}

/** Camera: puts canvas point (cx, cy) in the middle of the view at the given zoom. */
export function cameraMatrix(scale: number, cx: number, cy: number) {
  'worklet';
  return svgMatrix(scale, 0, 0, scale, VIEWBOX.w / 2 - cx * scale, VIEWBOX.h / 2 - cy * scale);
}

const AG = Animated.createAnimatedComponent(G);
const APath = Animated.createAnimatedComponent(Path);
const ACircle = Animated.createAnimatedComponent(Circle);
const ALine = Animated.createAnimatedComponent(Line);

/**
 * Line widths are given in screen px: each group's `strokeWidth` is divided by the zoom on the UI thread
 * (children inherit it). `vectorEffect="non-scaling-stroke"` is not used because it also rescales stroke
 * dashes on the web, which breaks the draw-on effect.
 */

// ------------------------------------------------------------------ the scene

/**
 * The whole drawing, driven by one shared time value (ms) on the UI thread: background, silhouette, the
 * scene-1 light, pelvis, organs, pelvic floor and labels. Every value comes from `timeline.ts`.
 */
export function AnatomyScene({
  time,
  pulse,
  reduce = false,
  label,
  cameraAt,
  background = true,
}: {
  time: SharedValue<number>;
  /** Scene 8's endless glow loop (0–1); left out on still frames. */
  pulse?: SharedValue<number>;
  reduce?: boolean;
  label?: string;
  /** Dev frames: take the camera from this time instead (side-by-side checks). */
  cameraAt?: number;
  /** false when the screen draws `AnatomyBackground` behind everything (no seam around the stage). */
  background?: boolean;
}) {
  const { t } = useTranslation();
  const c = SCENE_COLORS;
  const noPulse = useSharedValue(0);
  const loop = pulse ?? noPulse;
  // The pose is worked out once per frame and shared by every layer. Each updater below reads the
  // derived value directly, so Reanimated sees the dependency and reruns it on every frame.
  const posed = useDerivedValue(() => {
    const p = reduce ? poseAtReduced(time.value, loop.value) : poseAt(time.value, loop.value);
    if (cameraAt !== undefined) {
      const cam = poseAt(cameraAt);
      p.scale = cam.scale;
      p.cx = cam.cx;
      p.cy = cam.cy;
    }
    return p;
  });

  const camera = useAnimatedProps(() => {
    const p = posed.value;
    return { ...cameraMatrix(p.scale, p.cx, p.cy), opacity: p.fade };
  });
  const silhouette = useAnimatedProps(() => {
    const p = posed.value;
    return { opacity: p.silhouette, ...svgMatrix(1, 0, 0, 1, 0, p.silhouetteRise), strokeWidth: 1.5 / p.scale };
  });
  const light = useAnimatedProps(() => ({ opacity: posed.value.pelvisLight }));
  const bones = useAnimatedProps(() => {
    const p = posed.value;
    return { opacity: p.bones, strokeWidth: 2.25 / p.scale };
  });
  const dash = (len: number) => () => {
    'worklet';
    return { strokeDashoffset: len * (1 - posed.value.bonesDraw) };
  };
  const ilium = useAnimatedProps(dash(LEN.ilium));
  const sacrum = useAnimatedProps(dash(LEN.sacrum));
  const pubis = useAnimatedProps(dash(LEN.pubis));

  const organs = useAnimatedProps(() => {
    const p = posed.value;
    return { opacity: p.organs, strokeWidth: 1.5 / p.scale };
  });
  const organAt = (k: 0 | 2, rot: number) => () => {
    'worklet';
    const p = posed.value;
    const dy = p.organsDrop + p.sag * SAG_SHARE;
    const a = (rot * Math.PI) / 180;
    return svgMatrix(Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), fitAt(p.contract, k), fitAt(p.contract, k + 1) + dy);
  };
  const bladder = useAnimatedProps(organAt(0, BLADDER.rot));
  const rectum = useAnimatedProps(organAt(2, RECTUM.rot));

  const muscleGroup = useAnimatedProps(() => ({ opacity: posed.value.muscle }));
  const muscle = useAnimatedProps(() => {
    const p = posed.value;
    return {
      d: floorPath(p.contract, p.sag),
      strokeWidth: (8 + 2 * Math.min(1, Math.max(0, p.contract))) / p.scale,
      strokeDashoffset: LEN.floor * (1 - p.muscleDraw),
    };
  });
  // While contracting the muscle brightens towards the squeeze colour: the same line in light mint on
  // top, its opacity rising with the contraction up to `muscleContractMix` (= that share of a blend),
  // so the muscle stays recognisably itself and eases back over the 4 s release. Only numbers animate
  // (no colour values), which every platform handles the same way.
  const muscleTint = useAnimatedProps(() => {
    const p = posed.value;
    return {
      d: floorPath(p.contract, p.sag),
      strokeOpacity: SCENE_COLORS.muscleContractMix * Math.min(1, Math.max(0, p.contract)),
      strokeWidth: (8 + 2 * Math.min(1, Math.max(0, p.contract))) / p.scale,
    };
  });
  const glowLayer = ([w, o]: readonly [number, number]) => () => {
    'worklet';
    const p = posed.value;
    return { d: floorPath(p.contract, p.sag), strokeOpacity: o * p.glow, strokeWidth: w / p.scale };
  };
  const glow0 = useAnimatedProps(glowLayer(GLOW_LAYERS[0]!));
  const glow1 = useAnimatedProps(glowLayer(GLOW_LAYERS[1]!));
  const glow2 = useAnimatedProps(glowLayer(GLOW_LAYERS[2]!));
  const glows = [glow0, glow1, glow2];

  const labelFloor = useAnimatedProps(() => {
    const p = posed.value;
    return { opacity: p.labelFloor, strokeWidth: 1 / p.scale };
  });
  const labelOrgans = useAnimatedProps(() => {
    const p = posed.value;
    return { opacity: p.labelOrgans, strokeWidth: 1 / p.scale };
  });
  const lineTo = (k: 'bladder' | 'bowel' | 'floor') => () => {
    'worklet';
    const p = posed.value;
    const dy = p.organsDrop + p.sag * SAG_SHARE;
    if (k === 'bladder') {
      // Upper-front point of the bladder (−40° on its outline).
      const a = (-40 * Math.PI) / 180;
      return { x2: fitAt(p.contract, 0) + BLADDER.rx * Math.cos(a), y2: fitAt(p.contract, 1) + dy + BLADDER.ry * Math.sin(a) };
    }
    if (k === 'bowel') {
      const r = (RECTUM.rot * Math.PI) / 180;
      return { x2: fitAt(p.contract, 2) + RECTUM.ry * Math.sin(r), y2: fitAt(p.contract, 3) + dy - RECTUM.ry * Math.cos(r) };
    }
    return { x2: fitAt(p.contract, 4), y2: fitAt(p.contract, 5) + p.sag * SAG_SHARE + 2.2 };
  };
  const lineBladder = useAnimatedProps(lineTo('bladder'));
  const lineBowel = useAnimatedProps(lineTo('bowel'));
  const lineFloor = useAnimatedProps(lineTo('floor'));

  const wrongBelly = useAnimatedProps(() => ({ opacity: posed.value.wrongBelly }));
  const wrongButtock = useAnimatedProps(() => ({ opacity: posed.value.wrongButtock }));
  const wrongThigh = useAnimatedProps(() => ({ opacity: posed.value.wrongThigh }));
  const markBelly = useAnimatedProps(() => ({ opacity: posed.value.markBelly }));
  const markButtock = useAnimatedProps(() => ({ opacity: posed.value.markButtock }));
  const markThigh = useAnimatedProps(() => ({ opacity: posed.value.markThigh }));
  const wrong = { belly: [wrongBelly, markBelly], buttock: [wrongButtock, markButtock], thigh: [wrongThigh, markThigh] } as const;

  const [pcx, pcy] = LANDMARKS.pelvisCentre;
  /** Label text height in canvas units at the pelvis zoom (for where the label lines start). */
  const textSize = LABEL_FONT / POSE_REST.scale;
  // Stage size, for placing the real-text labels over the drawing.
  const box = useSharedValue({ w: 0, h: 0 });
  // Where each label line starts: beside a start-anchored text, above or below a centred one.
  const from = {
    bladder: [LABELS.bladder.at[0] - 1.5, LABELS.bladder.at[1] - textSize * 0.35] as Pt,
    bowel: [LABELS.bowel.at[0], LABELS.bowel.at[1] + 1.5] as Pt,
    floor: [LABELS.floor.at[0], LABELS.floor.at[1] - textSize - 0.8] as Pt,
  };

  return (
    <View
      style={{ flex: 1 }}
      accessible={!!label}
      accessibilityRole="image"
      accessibilityLabel={label}
      onLayout={(e) => box.set({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      <Svg viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`} preserveAspectRatio="xMidYMid meet" width="100%" height="100%">
        <Defs>
          <LinearGradient id="anatomyBg" x1="0" y1="0" x2="0" y2={VIEWBOX.h} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={c.bgTop} />
            <Stop offset="1" stopColor={c.bgBottom} />
          </LinearGradient>
          <RadialGradient id="anatomyBgGlow" cx={VIEWBOX.w / 2} cy={VIEWBOX.h / 2} r={300} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={c.bgGlow} stopOpacity={c.bgGlowOpacity} />
            <Stop offset="1" stopColor={c.bgGlow} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="anatomyPelvisLight" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={c.muscle} stopOpacity={0.55} />
            <Stop offset="1" stopColor={c.muscle} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        {/* bg: drawn well past the viewBox, so taller or wider screens than 9:16 show no band */}
        {background ? (
          <>
            <Rect x={-VIEWBOX.w} y={-VIEWBOX.h} width={VIEWBOX.w * 3} height={VIEWBOX.h * 3} fill="url(#anatomyBg)" />
            <Circle cx={VIEWBOX.w / 2} cy={VIEWBOX.h / 2} r={300} fill="url(#anatomyBgGlow)" />
          </>
        ) : null}

        <AG animatedProps={camera}>
          {/* silhouette: body and arm share one fill, a 1 px darker line separates them */}
          <AG animatedProps={silhouette}>
            {STOOL.map((d) => (
              <Path key={d} d={d} stroke={c.stool} strokeLinecap="round" fill="none" />
            ))}
            <Path d={SILHOUETTE_BODY} fill={c.silhouette} stroke={c.silhouetteEdge} strokeLinejoin="round" />
            {/* scene 7: the areas not to squeeze, on the body but under the arm */}
            {(Object.keys(WRONG) as (keyof typeof WRONG)[]).map((k) => (
              <AG key={k} animatedProps={wrong[k][0]} opacity={0}>
                <Path d={WRONG[k]} fill={c.wrong} fillOpacity={c.wrongOpacity} strokeWidth={0} />
              </AG>
            ))}
            <Path d={ARM} stroke={c.armDivider} strokeWidth={ARM_WIDTH + 2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <Path d={ARM} stroke={c.silhouette} strokeWidth={ARM_WIDTH} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <Circle cx={HEAD.cx} cy={HEAD.cy} r={HEAD.r} fill={c.silhouette} stroke={c.silhouetteEdge} />
          </AG>

          {/* scene 1: soft light where the pelvis is */}
          <ACircle animatedProps={light} cx={pcx} cy={pcy + 8} r={24} fill="url(#anatomyPelvisLight)" />

          {/* scene 7: the crosses beside belly, buttock and inner thigh (20 px at the scene-7 zoom) */}
          {(Object.keys(WRONG) as (keyof typeof WRONG)[]).map((k) => (
            <AG key={k} animatedProps={wrong[k][1]} opacity={0}>
              <CrossMark at={WRONG_MARKS[k]} size={20 / FOCUS.hips.scale} color={c.wrongMark} />
            </AG>
          ))}

          {/* pelvis, drawn on in scene 2 */}
          <AG animatedProps={bones}>
            <APath animatedProps={ilium} d={ILIUM} stroke={c.bone} strokeOpacity={c.boneWingOpacity} strokeDasharray={[LEN.ilium, LEN.ilium]} strokeLinecap="round" fill="none" />
            <APath animatedProps={sacrum} d={SACRUM} stroke={c.bone} strokeDasharray={[LEN.sacrum, LEN.sacrum]} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <APath animatedProps={pubis} d={PUBIS} stroke={c.bone} strokeDasharray={[LEN.pubis, LEN.pubis]} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </AG>

          {/* organs: fitted on the muscle, they land on it in scene 4 and rise with it */}
          <AG animatedProps={organs}>
            <OrganShape o={RECTUM} color={c.bowel} props={rectum} />
            <OrganShape o={BLADDER} color={c.bladder} props={bladder} />
          </AG>

          {/* pelvic floor: soft glow lines, then the muscle, drawn from the pubis to the coccyx */}
          <AG animatedProps={muscleGroup}>
            {GLOW_LAYERS.map(([w], i) => (
              <APath key={w} animatedProps={glows[i]} stroke={c.muscle} strokeLinecap="round" fill="none" />
            ))}
            <APath animatedProps={muscle} stroke={c.muscle} strokeDasharray={[LEN.floor, LEN.floor]} strokeLinecap="round" fill="none" />
            <APath animatedProps={muscleTint} stroke={c.muscleContract} strokeOpacity={0} strokeLinecap="round" fill="none" />
          </AG>

          {/* labels */}
          <AG animatedProps={labelFloor} opacity={0}>
            <G opacity={c.labelOpacity}>
              <ALine animatedProps={lineFloor} x1={from.floor[0]} y1={from.floor[1]} stroke={c.muscle} />
            </G>
          </AG>
          <AG animatedProps={labelOrgans} opacity={0}>
            <G opacity={c.labelOpacity}>
              <ALine animatedProps={lineBladder} x1={from.bladder[0]} y1={from.bladder[1]} stroke={c.label} />
              <ALine animatedProps={lineBowel} x1={from.bowel[0]} y1={from.bowel[1]} stroke={c.label} />
            </G>
          </AG>
        </AG>
      </Svg>

      {/* The labels are real text on top of the drawing (crisp at any zoom), placed through the camera. */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <SceneLabel text={t('introAnatomy.labels.floor')} spot={LABELS.floor} color={c.muscle} posed={posed} box={box} show="labelFloor" />
        <SceneLabel text={t('introAnatomy.labels.bladder')} spot={LABELS.bladder} color={c.label} posed={posed} box={box} show="labelOrgans" />
        <SceneLabel text={t('introAnatomy.labels.bowel')} spot={LABELS.bowel} color={c.label} posed={posed} box={box} show="labelOrgans" />
      </View>
    </View>
  );
}

/** Label size in screen points (Inter SemiBold). */
const LABEL_FONT = 14;
const LABEL_LINE = 18;
/** Width of a label's box (the text is centred in it, or starts at its left edge). */
const LABEL_BOX = 200;
const LABEL_FAMILY = Platform.OS === 'web' ? `${familyFor('600')}, system-ui, sans-serif` : familyFor('600');

/**
 * One label as native text. Its canvas point (the SVG baseline position of `LABELS`) goes through the
 * camera and then the `meet` fit of the 360 × 640 canvas into the stage, every frame on the UI thread.
 */
function SceneLabel({
  text,
  spot,
  color,
  posed,
  box,
  show,
}: {
  text: string;
  spot: { at: Pt; anchor: 'start' | 'middle' };
  color: string;
  posed: SharedValue<TimelinePose>;
  box: SharedValue<{ w: number; h: number }>;
  show: 'labelFloor' | 'labelOrgans';
}) {
  const [x, y] = spot.at;
  const middle = spot.anchor === 'middle';
  const style = useAnimatedStyle(() => {
    const p = posed.value;
    const { w, h } = box.value;
    const fit = Math.min(w / VIEWBOX.w, h / VIEWBOX.h);
    const sx = (w - VIEWBOX.w * fit) / 2 + fit * (VIEWBOX.w / 2 + (x - p.cx) * p.scale);
    const sy = (h - VIEWBOX.h * fit) / 2 + fit * (VIEWBOX.h / 2 + (y - p.cy) * p.scale);
    return {
      opacity: w > 0 ? p[show] : 0,
      // the canvas y is the text baseline: the box top sits one font size above it
      transform: [{ translateX: middle ? sx - LABEL_BOX / 2 : sx }, { translateY: sy - LABEL_FONT }],
    };
  });
  return (
    <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: LABEL_BOX }, style]}>
      <Text
        maxFontSizeMultiplier={1.2}
        style={{
          color,
          fontFamily: LABEL_FAMILY,
          fontSize: LABEL_FONT,
          lineHeight: LABEL_LINE,
          textAlign: middle ? 'center' : 'left',
          textShadowColor: 'rgba(0,0,0,0.55)',
          textShadowRadius: 3,
        }}
      >
        {text}
      </Text>
    </Animated.View>
  );
}

/**
 * The scene's background (vertical gradient + soft radial glow, §1 of the A0 fix) stretched over a whole
 * screen, so the area around the stage (progress bar, caption, buttons) has no seam.
 */
export function AnatomyBackground() {
  const c = SCENE_COLORS;
  return (
    <Svg style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} width="100%" height="100%" viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`} preserveAspectRatio="none" pointerEvents="none">
      <Defs>
        <LinearGradient id="anatomyScreenBg" x1="0" y1="0" x2="0" y2={VIEWBOX.h} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={c.bgTop} />
          <Stop offset="1" stopColor={c.bgBottom} />
        </LinearGradient>
        <RadialGradient id="anatomyScreenGlow" cx={VIEWBOX.w / 2} cy={VIEWBOX.h / 2} r={300} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={c.bgGlow} stopOpacity={c.bgGlowOpacity} />
          <Stop offset="1" stopColor={c.bgGlow} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={VIEWBOX.w} height={VIEWBOX.h} fill="url(#anatomyScreenBg)" />
      <Rect x={0} y={0} width={VIEWBOX.w} height={VIEWBOX.h} fill="url(#anatomyScreenGlow)" />
    </Svg>
  );
}

/** A cross icon centred on a canvas point (two round strokes). */
function CrossMark({ at, size, color }: { at: Pt; size: number; color: string }) {
  const h = size * 0.32;
  const [x, y] = at;
  return (
    <G stroke={color} strokeWidth={size * 0.12} strokeLinecap="round">
      <Line x1={x - h} y1={y - h} x2={x + h} y2={y + h} />
      <Line x1={x - h} y1={y + h} x2={x + h} y2={y - h} />
    </G>
  );
}

function OrganShape({ o, color, props }: { o: Organ; color: string; props: ReturnType<typeof useAnimatedProps> }) {
  const c = SCENE_COLORS;
  return (
    <AG animatedProps={props}>
      <Ellipse cx={0} cy={0} rx={o.rx} ry={o.ry} fill={color} fillOpacity={c.organFillOpacity} stroke={color} strokeOpacity={c.organEdgeOpacity} />
    </AG>
  );
}
