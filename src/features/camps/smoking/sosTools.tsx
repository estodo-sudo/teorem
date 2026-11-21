import type { IconName } from '@/components/Icon';
import { useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Icon, ProgressBar, useTheme } from '@/components';
import { tint } from '@/features/campus/shared/ui';
import { mmss, type useCountdown } from '@/features/camps/core/sosTools';

import { CAMP_ONBOARDING as ONB, CAMP_SOS as SOS } from './content';
import { DELAY_MINUTES } from './engine/sos';
import type { CampProfile } from './types';
import { IconTile } from '@/components/ui';


export { DELAY_MINUTES };
/**
 * "Just wait 10 minutes" countdown with small things to do meanwhile. The countdown lives in the SOS
 * screen, so it keeps running (as a small chip) while another tool is used (SPEC_V4 §C.3).
 */
export function DelayTimer({ cd, onUsed }: { cd: ReturnType<typeof useCountdown>; onUsed: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [done, setDone] = useState<string[]>([]);
  return (
    <View style={{ gap: t.space.md }}>
      <AppText muted>{SOS.delay.desc}</AppText>
      <View style={{ alignItems: 'center', gap: 6 }}>
        <AppText variant="display" style={{ fontSize: 56, lineHeight: 64 }} accessibilityLabel={tr('camp.sos.timeLeft', { time: mmss(cd.left) })}>
          {mmss(cd.left)}
        </AppText>
        <View style={{ alignSelf: 'stretch' }}>
          <ProgressBar value={cd.elapsed / (DELAY_MINUTES * 60)} height={8} />
        </View>
      </View>
      {cd.finished ? (
        <Card style={{ backgroundColor: t.tokens.muted, borderColor: t.tokens.muted}}>
          <AppText weight="700">{SOS.delay.done}</AppText>
        </Card>
      ) : (
        <Button
          label={cd.running ? tr('camp.sos.pause') : cd.elapsed > 0 ? tr('camp.sos.resume') : tr('camp.sos.delayStart')}
          icon={cd.running ? 'pause' : 'play'}
          variant={cd.running ? 'secondary' : 'primary'}
          onPress={() => {
            if (cd.running) cd.pause();
            else {
              onUsed();
              cd.start();
            }
          }}
        />
      )}
      <AppText weight="800">{tr('camp.sos.meanwhile')}</AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space.sm }}>
        {SOS.delay.ideas.map((idea) => {
          const on = done.includes(idea);
          return (
            <Pressable
              key={idea}
              onPress={() => setDone((d) => (on ? d.filter((x) => x !== idea) : [...d, idea]))}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                minHeight: 48,
                paddingHorizontal: t.space.md,
                borderRadius: t.radius.pill,
                borderWidth: 1.5,
                borderColor: on ? t.colors.success : t.colors.border,
                backgroundColor: on ? tint(t.colors.success, '1A') : t.colors.surface,
              }}
            >
              {on ? <Icon name="check" color={t.colors.success} size={14} strokeWidth={3} /> : null}
              <AppText variant="small" weight="700">
                {idea}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** The user's own reasons and photo. */
export function ReasonsView({ profile }: { profile: CampProfile }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const items = profile.reasons.map((r) =>
    r.id === 'custom' ? { key: 'custom', icon: 'chat' as IconName, text: `“${r.text ?? ''}”` } : { key: r.id, icon: ONB.reasons.find((x) => x.id === r.id)?.icon ?? ('heart' as IconName), text: ONB.reasons.find((x) => x.id === r.id)?.label ?? '' },
  );
  return (
    <View style={{ gap: 10 }}>
      <AppText muted>{SOS.reasons.desc}</AppText>
      {profile.reasonPhotoUri ? <Image source={{ uri: profile.reasonPhotoUri }} style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: t.radius.lg }} accessibilityLabel={tr('camp.onb.reasons.photoAlt')} /> : null}
      {items.length ? (
        items.map((it) => (
          <Card key={it.key} style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md, backgroundColor: tint(t.colors.accent, '10') }}>
            <IconTile icon={it.icon} tone="smokefree" />
            <AppText variant="h3" style={{ flex: 1 }}>
              {it.text}
            </AppText>
          </Card>
        ))
      ) : (
        <AppText muted>{SOS.reasons.empty}</AppText>
      )}
    </View>
  );
}

