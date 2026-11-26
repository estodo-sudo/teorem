import { useVideoPlayer, VideoView, type VideoPlayer } from 'expo-video';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Icon, useTheme } from '@/components';

import { useLive } from '@/lib/useLive';

import { FitnessDemo } from './FitnessFigure';
import { cycleMs, MOVES, type MoveSpec } from './motion';

/**
 * Kasık Fitness in 3D, every move (redo 2026-11-25, "baştan sona"): a light, human-looking Blender figure
 * on a mat (reels project, blender/fit3d.py), driven by the app's own poses and tempo. Each clip is one
 * steady loop at the move's tempo — two reps for the alternating moves (dead bug, bird dog: the second
 * with the other arm and leg). In the workout the loop is kept on the move's own clock, so the big word
 * ("KALDIR", "BIRAK") and the vibration stay in step; side 2 of a one-side-then-the-other move is
 * mirrored. Elsewhere (list, "Sıradaki") it just loops.
 */
const CLIPS: Record<string, number> = {
  pelvic_tilt: require('../../../assets/video/fit-pelvic-tilt.mp4'),
  glute_bridge: require('../../../assets/video/fit-glute-bridge.mp4'),
  pillow_squeeze: require('../../../assets/video/fit-pillow-squeeze.mp4'),
  clamshell: require('../../../assets/video/fit-clamshell.mp4'),
  knee_to_chest: require('../../../assets/video/fit-knee-to-chest.mp4'),
  dead_bug: require('../../../assets/video/fit-dead-bug.mp4'),
  squat: require('../../../assets/video/fit-squat.mp4'),
  sumo_squat: require('../../../assets/video/fit-sumo-squat.mp4'),
  plank: require('../../../assets/video/fit-plank.mp4'),
  bird_dog: require('../../../assets/video/fit-bird-dog.mp4'),
  hip_opener: require('../../../assets/video/fit-hip-opener.mp4'),
  butterfly: require('../../../assets/video/fit-butterfly.mp4'),
};

export const FITNESS_VIDEO = new Map<MoveSpec, number>(
  Object.entries(CLIPS).flatMap(([id, src]) => (MOVES[id] ? [[MOVES[id]!, src] as [MoveSpec, number]] : [])),
);

/** Length of a move's clip (s): one rep, two for alternating moves. */
export const clipSeconds = (move: MoveSpec) => (cycleMs(move) * (move.alternate ? 2 : 1)) / 1000;

/** Where the clip should be `elapsedMs` into an exercise of `workMs` (s), and whether it is side 2 (mirrored). */
export function clipAt(move: MoveSpec, elapsedMs: number, workMs: number): { at: number; mirrored: boolean } {
  const half = move.sides && !move.alternate && Number.isFinite(workMs) ? workMs / 2 : Number.POSITIVE_INFINITY;
  const side2 = elapsedMs >= half;
  const local = side2 ? elapsedMs - half : elapsedMs;
  return { at: (local / 1000) % clipSeconds(move), mirrored: side2 };
}

/** Background of the rendered clip; the panel around it uses the same colour. */
const PANEL = '#161C26';
/** How far the clip may drift from the move's clock before it is moved (s). */
const DRIFT_S = 0.2;

const seek = (p: VideoPlayer, s: number) => {
  p.currentTime = s;
};

/**
 * The 3D clip of a move. With `elapsedMs` (and `workMs`) it follows the workout's clock; without, it loops
 * freely while the screen is seen.
 */
export function FitnessVideo({ move, elapsedMs, workMs = Number.POSITIVE_INFINITY, paused = false, width = 300 }: { move: MoveSpec; elapsedMs?: number; workMs?: number; paused?: boolean; width?: number }) {
  const live = useLive();
  const player = useVideoPlayer(FITNESS_VIDEO.get(move)!, (p) => {
    p.muted = true;
    p.loop = true;
  });
  const synced = elapsedMs !== undefined;
  const clip = synced ? clipAt(move, elapsedMs, workMs) : { at: 0, mirrored: false };
  const loopS = clipSeconds(move);

  // Battery (round 8): plays only while the screen is seen and the workout runs.
  useEffect(() => {
    if (paused || !live) player.pause();
    else player.play();
  }, [paused, live, player]);

  // Keep the clip at the rep's phase (the move's tempo clock), e.g. after a pause or a slow frame.
  useEffect(() => {
    if (!synced) return;
    let d = Math.abs(player.currentTime - clip.at);
    d = Math.min(d, loopS - d);
    if (d > DRIFT_S) seek(player, clip.at);
  }, [synced, clip.at, loopS, player]);

  return (
    <View style={{ width, gap: 6 }}>
      <View style={[styles.panel, { width, height: (width * 2) / 3 }]} accessible accessibilityRole="image">
        <VideoView
          player={player}
          style={[styles.video, clip.mirrored ? styles.mirror : null]}
          contentFit="cover"
          nativeControls={false}
          allowsPictureInPicture={false}
        />
      </View>
      <DevNote />
    </View>
  );
}

/** Under the clip, never on it (user request 2026-11-26): the 3D animations are still being worked on. */
function DevNote() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
      <Icon name="info" size={13} color={t.tokens.mutedForeground} />
      <AppText variant="caption" muted>
        {tr('fitness.animDev')}
      </AppText>
    </View>
  );
}

/** A move's preview: its 3D clip when it has one, else the drawn figure. */
export function FitnessPreview({ move, width = 260, paused }: { move: MoveSpec; width?: number; paused?: boolean }) {
  return FITNESS_VIDEO.has(move) ? <FitnessVideo move={move} width={width} paused={paused} /> : <FitnessDemo move={move} width={width} paused={paused} />;
}

const styles = StyleSheet.create({
  panel: { borderRadius: 20, overflow: 'hidden', backgroundColor: PANEL },
  // explicit size: on the web an absolute-fill VideoView keeps the video's own pixel size
  video: { width: '100%', height: '100%' },
  mirror: { transform: [{ scaleX: -1 }] },
});
