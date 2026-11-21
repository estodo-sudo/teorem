import { Redirect, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { AnatomyScene, SCENE_COLORS } from '@/features/intro-anatomy/AnatomyScene';
import { IntroAnatomyScreen } from '@/features/intro-anatomy/IntroAnatomyScreen';

/**
 * Developer mode only: the anatomy animation frozen at one moment (SPEC_ANIMASYON_PELVIK A0/A1 frames).
 * `?t=<ms>` picks the time (`&screen=1`: the whole screen with caption and buttons); `&reduce=1` uses the reduce-motion timeline; `&cam=<ms>` takes the camera
 * from another moment (so two frames can be compared with the bones in the same place).
 */
export default function AnatomyFrame() {
  const { play, screen, t, reader } = useLocalSearchParams<{ play?: string; screen?: string; t?: string; reader?: string }>();
  if (!__DEV__) return <Redirect href="/" />;
  // `?play=1`: the real screen (plays on its own), without the first-run gate; `&reader=1` step mode.
  if (play === '1') return <IntroAnatomyScreen forceReader={reader === '1'} />;
  // `?screen=1&t=<ms>`: the real screen (caption, buttons) frozen at one moment.
  if (screen === '1') return <IntroAnatomyScreen stillAt={Number(t ?? 0)} onExit={() => undefined} />;
  return <Frozen />;
}

function Frozen() {
  const { t, reduce, cam } = useLocalSearchParams<{ t?: string; reduce?: string; cam?: string }>();
  const time = useSharedValue(Number(t ?? 23999));
  return (
    <View style={{ flex: 1, backgroundColor: SCENE_COLORS.bgBottom }}>
      <AnatomyScene time={time} reduce={reduce === '1'} cameraAt={cam !== undefined ? Number(cam) : undefined} />
    </View>
  );
}
