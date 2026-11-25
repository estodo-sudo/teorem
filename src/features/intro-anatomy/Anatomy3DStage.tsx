import { useVideoPlayer, VideoView, type VideoPlayer } from 'expo-video';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import { CONTENT_LANGUAGE } from '@/i18n/content';

import { TOTAL_MS } from './timeline';

/** Background of the rendered video; the panel around it uses the same colour. */
export const STAGE_3D_BG = '#0C1417';

/**
 * The 3D pictures of "Pelvik taban kasın nerede?" (2026-11-25): a Blender-rendered video (3:4, labels in
 * the content language, no sound or captions) that follows the screen's clock. The screen keeps the
 * captions, progress bar, pause on tap, vibration and sound; the scenes and their times are the same as
 * `timeline.ts`, so the video is simply kept at `time`.
 */
const VIDEO = { tr: require('../../../assets/video/anatomy-tr.mp4'), en: require('../../../assets/video/anatomy-en.mp4') } as const;
const SOURCE = CONTENT_LANGUAGE === 'en' ? VIDEO.en : VIDEO.tr;

/** How far the video may drift from the clock before it is moved (s). */
const DRIFT_S = 0.25;
/** Width / height of the video. */
const ASPECT = 3 / 4;
/** Scene 8 squeezes gently in a 4 s loop: after the end it goes on from 4 s earlier, without a jump. */
const LOOP_FROM_S = TOTAL_MS / 1000 - 4.2;
const LOOP_AT_S = TOTAL_MS / 1000 - 0.2;

/** Seeking is setting `currentTime` (expo-video); kept outside the component for the hooks lint. */
const seek = (p: VideoPlayer, s: number) => {
  p.currentTime = s;
};

export function Anatomy3DStage({ time, playing }: { time: SharedValue<number>; playing: boolean }) {
  const player = useVideoPlayer(SOURCE, (p) => {
    p.muted = true;
    p.loop = false;
  });

  useEffect(() => {
    const sync = () => {
      const t = Math.min(TOTAL_MS, time.value) / 1000;
      if (playing && t >= LOOP_AT_S) {
        // the clock has reached the end; only scene 8's loop goes on
        if (player.currentTime >= LOOP_AT_S) seek(player, LOOP_FROM_S);
        return;
      }
      if (Math.abs(player.currentTime - t) > DRIFT_S) seek(player, t);
    };
    sync();
    if (playing) player.play();
    else player.pause();
    // a seek while paused (screen reader steps, "watch again") also moves the clock: keep following it
    const id = setInterval(sync, 200);
    return () => clearInterval(id);
  }, [playing, player, time]);

  // The panel takes the video's 3:4 shape, as large as the stage allows (no bars of another shade).
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const size = box ? (box.w / box.h > ASPECT ? { width: box.h * ASPECT, height: box.h } : { width: box.w, height: box.w / ASPECT }) : null;

  return (
    <View style={styles.stage} pointerEvents="none" onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {size ? (
        <View style={[styles.panel, size]}>
          <VideoView player={player} style={styles.video} contentFit="cover" nativeControls={false} allowsPictureInPicture={false} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, marginHorizontal: 16, marginVertical: 8, alignItems: 'center', justifyContent: 'center' },
  panel: { borderRadius: 24, overflow: 'hidden', backgroundColor: STAGE_3D_BG },
  // explicit size: on the web an absolute-fill VideoView keeps the video's own pixel size
  video: { width: '100%', height: '100%' },
});
