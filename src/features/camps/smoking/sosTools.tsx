import type { IconName } from '@/components/Icon';
import { useState } from 'react';
import { Image, Pressable, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Icon, ProgressBar, useTheme } from '@/components';
import { tint } from '@/features/campus/shared/ui';
import { IntensityScale as CoreIntensityScale, mmss, SosBreath as CoreSosBreath, UrgeSurf as CoreUrgeSurf, useCountdown } from '@/features/camps/core/sosTools';

import { CAMP_ONBOARDING as ONB, CAMP_SOS as SOS } from './content';
import { DELAY_MINUTES, flipCard, gameWon, matchedPairs, newMatchGame } from './engine/sos';
import type { CampProfile } from './types';
import { IconTile } from '@/components/ui';

/** 1–10 intensity scale with this camp's labels. */
export const IntensityScale = (p: { value: number | null; onChange: (v: number) => void; label: string }) => <CoreIntensityScale {...p} labels={SOS.intensityLabels} />;

/** Urge surfing with this camp's prompts. */
export const UrgeSurf = ({ onUsed }: { onUsed: () => void }) => <CoreUrgeSurf onUsed={onUsed} text={SOS.surf} />;

/** Breathing, 2 minutes. */
export const SosBreath = ({ onUsed }: { onUsed: () => void }) => <CoreSosBreath onUsed={onUsed} desc={SOS.breath.desc} />;

/** "Just wait 10 minutes" countdown with small things to do meanwhile. */
export function DelayTimer({ onUsed }: { onUsed: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const cd = useCountdown(DELAY_MINUTES * 60);
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

/** The 4E card (Ertele · Elini meşgul et · En sevdiğin içeceği iç · Eğlenceli bir şey yap). */
export function FourECard() {
  const t = useTheme();
  return (
    <View style={{ gap: 10 }}>
      <AppText muted>{SOS.fourE.desc}</AppText>
      {SOS.fourE.items.map((it, i) => (
        <Card key={it.title} style={{ flexDirection: 'row', gap: t.space.md, alignItems: 'center' }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.colors.accent, alignItems: 'center', justifyContent: 'center' }}>
            <AppText variant="h3" weight="800" color={t.tokens.primaryForeground}>
              {it.letter}
              <AppText variant="tiny" weight="800" color={t.tokens.primaryForeground}>
                {i + 1}
              </AppText>
            </AppText>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText weight="800">{it.title}</AppText>
            <AppText variant="small" muted>
              {it.text}
            </AppText>
          </View>
        </Card>
      ))}
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

const SYMBOLS: IconName[] = ['leaf', 'waves', 'sun', 'apple', 'headphones', 'bike'];

/** 60-second matching game (offline distraction). Each round remounts, so its timer starts fresh. */
export function MatchGameView({ onUsed }: { onUsed: () => void }) {
  const [round, setRound] = useState(0);
  return <MatchRound key={round} onUsed={onUsed} onRestart={() => setRound((n) => n + 1)} />;
}

function MatchRound({ onUsed, onRestart }: { onUsed: () => void; onRestart: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [game, setGame] = useState(() => newMatchGame(SYMBOLS));
  const [started, setStarted] = useState(false);
  const cd = useCountdown(SOS.game.seconds);
  const won = gameWon(game);
  const over = won || cd.finished;
  const { width } = useWindowDimensions();
  const size = Math.min(84, (Math.min(width, 520) - 32 - 3 * 8) / 4);
  return (
    <View style={{ gap: t.space.md }}>
      <AppText muted>{SOS.game.desc}</AppText>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <AppText weight="800">{tr('camp.sos.gameTime', { sec: started ? cd.left : SOS.game.seconds })}</AppText>
        <AppText weight="800">{tr('camp.sos.gamePairs', { n: matchedPairs(game), total: SYMBOLS.length })}</AppText>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space.sm, justifyContent: 'center' }}>
        {game.cards.map((c, i) => {
          const up = c.matched || game.open.includes(i);
          return (
            <Pressable
              key={i}
              disabled={over || c.matched}
              onPress={() => {
                if (!started) {
                  setStarted(true);
                  onUsed();
                  cd.start();
                }
                setGame((g) => flipCard(g, i));
              }}
              accessibilityRole="button"
              accessibilityLabel={up ? tr(`camp.sos.symbol.${c.symbol}`) : tr('camp.sos.gameCard', { n: i + 1 })}
              style={{
                width: size,
                height: size,
                borderRadius: t.radius.md,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: c.matched ? tint(t.colors.success, '33') : up ? t.colors.surface : t.colors.primary,
                borderWidth: 2,
                borderColor: c.matched ? t.colors.success : t.colors.border,
              }}
            >
              {up ? <Icon name={c.symbol as IconName} size={Math.round(size * 0.45)} color={t.tokens.primary} /> : null}
            </Pressable>
          );
        })}
      </View>
      {over ? (
        <Card style={{ gap: t.space.sm }}>
          <AppText weight="800" center>
            {won ? tr('camp.sos.gameWon', { moves: game.moves }) : tr('camp.sos.gameOver', { n: matchedPairs(game) })}
          </AppText>
          <Button label={tr('camp.sos.gameAgain')} variant="secondary" onPress={onRestart} />
        </Card>
      ) : null}
    </View>
  );
}
