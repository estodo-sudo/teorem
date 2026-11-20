import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Header, Icon, ProgressBar, Screen, useTheme } from '@/components';
import { CAMP_REWARDS } from '@/features/camps/smoking/content';
import { parsePriceTRY } from '@/features/camps/smoking/onboarding';
import { moneySaved } from '@/features/camps/smoking/engine/savings';
import { goalProgress } from '@/features/camps/smoking/engine/stats';
import { campAttempt } from '@/features/camps/smoking/state';
import { fmtTL, PremiumLock } from '@/features/camps/smoking/ui';
import { useAccess } from '@/features/purchases/useGate';
import { SectionTitle, tint } from '@/features/campus/shared/ui';
import { CelebrationCard } from '@/features/gamification/Celebration';
import { goBack } from '@/lib/nav';
import { useCampEventsStore, useCampStore } from '@/stores/campStore';
import { Medallion } from '@/features/gamification/Medallion';

/** Badges (earned / still to earn) and the reward jar filled by the money not spent on cigarettes. */
export default function CampRewards() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const camp = useCampStore();
  const premium = useAccess()('camp');
  const cigs = useCampEventsStore((s) => s.cigarettes);
  const [now] = useState(() => new Date());
  const [title, setTitle] = useState('');
  const [amountText, setAmountText] = useState('');
  const attempt = campAttempt(camp);
  const saved = attempt && camp.profile ? moneySaved(camp.prices, camp.profile.perDay, attempt, cigs, now) : 0;
  const amount = parsePriceTRY(amountText);
  const unlocked = (id: string) => camp.badges.find((b) => b.id === id && b.unlockedAt);
  // A goal the savings just reached is celebrated once, then marked.
  const reached = !premium ? undefined : camp.rewards.find((r) => !r.reachedAt && goalProgress(saved, r.amountTRY) >= 1);
  const field = { minHeight: 48, borderRadius: t.radius.md, borderWidth: 1, borderColor: t.colors.border, backgroundColor: t.colors.surfaceAlt, paddingHorizontal: t.space.md, color: t.colors.text, fontSize: t.type.body.fontSize } as const;

  return (
    <Screen>
      <Header title={tr('camp.rewards.title')} onBack={() => goBack('/camp')} />

      <SectionTitle tone="smokefree" icon="piggy" title={tr('camp.rewards.jarTitle')} hint={CAMP_REWARDS.jar.intro} />
      {premium ? (
        <>
          <Card style={{ alignItems: 'center', gap: 2, backgroundColor: tint(t.colors.success, '14') }}>
            <AppText variant="tiny" weight="800" muted>
              {tr('camp.rewards.saved')}
            </AppText>
            <AppText variant="display" color={t.colors.success} style={{ fontSize: 40, lineHeight: 48 }}>
              {tr('camp.plan.tl', { amount: fmtTL(saved) })}
            </AppText>
          </Card>
          {camp.rewards.map((r) => {
            const p = goalProgress(saved, r.amountTRY);
            return (
              <Card key={r.id} style={{ gap: t.space.sm, borderWidth: r.reachedAt ? 2 : 1, borderColor: r.reachedAt ? t.colors.success : t.colors.border }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.sm }}>
                  <AppText weight="800" style={{ flex: 1 }}>
                    {r.reachedAt ? '' : ''}
                    {r.title}
                  </AppText>
                  <AppText variant="small" weight="700" muted>
                    {tr('camp.plan.tl', { amount: fmtTL(r.amountTRY) })}
                  </AppText>
                  <Pressable
                    onPress={() => useCampStore.getState().removeReward(r.id)}
                    accessibilityRole="button"
                    accessibilityLabel={tr('camp.rewards.remove')}
                    hitSlop={8}
                    style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Icon name="trash" color={t.colors.textMuted} size={16} />
                  </Pressable>
                </View>
                <ProgressBar value={p} height={8} color={t.colors.success} />
                <AppText variant="tiny" muted>
                  {p >= 1 ? tr('camp.rewards.reached') : tr('camp.rewards.left', { amount: fmtTL(r.amountTRY - saved) })}
                </AppText>
              </Card>
            );
          })}
          <Card style={{ gap: t.space.sm }}>
            <AppText weight="800">{tr('camp.rewards.add')}</AppText>
            <TextInput
              value={title}
              onChangeText={setTitle}
              maxLength={40}
              placeholder={tr('camp.rewards.titlePlaceholder', { example: CAMP_REWARDS.jar.examples[camp.rewards.length % CAMP_REWARDS.jar.examples.length] })}
              placeholderTextColor={t.colors.textMuted}
              accessibilityLabel={tr('camp.rewards.titleLabel')}
              style={field}
            />
            <TextInput
              value={amountText}
              onChangeText={(v) => setAmountText(v.replace(/[^0-9.,]/g, ''))}
              keyboardType="decimal-pad"
              maxLength={9}
              placeholder={tr('camp.rewards.amountPlaceholder')}
              placeholderTextColor={t.colors.textMuted}
              accessibilityLabel={tr('camp.rewards.amountLabel')}
              style={field}
            />
            <Button
              label={tr('camp.rewards.addButton')}
              icon="plus"
              variant="primary"
              disabled={!title.trim() || amount === null}
              onPress={() => {
                if (amount === null) return;
                useCampStore.getState().addReward(title.trim(), amount);
                setTitle('');
                setAmountText('');
              }}
            />
          </Card>
        </>
      ) : (
        <PremiumLock title={tr('camp.premium.jar')} />
      )}

      <SectionTitle tone="smokefree" icon="medal" title={tr('camp.rewards.badgesTitle')} hint={tr('camp.stats.badgesHint', { earned: camp.badges.filter((b) => b.unlockedAt).length, total: CAMP_REWARDS.badges.length })} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space.sm }}>
        {CAMP_REWARDS.badges.map((b) => {
          const on = Boolean(unlocked(b.id));
          return (
            <View
              key={b.id}
              style={{
                width: '31%',
                flexGrow: 1,
                alignItems: 'center',
                gap: t.space.xs,
                padding: 10,
                borderRadius: t.radius.lg,
                borderWidth: 1.5,
                borderColor: on ? t.tokens.primary : t.colors.border,
                backgroundColor: on ? tint(t.colors.accent, '14') : t.colors.surface,
              }}
              accessible
              accessibilityLabel={`${b.title}. ${b.desc}. ${on ? tr('camp.rewards.earned') : tr('camp.rewards.notEarned')}`}
            >
              <Medallion icon={b.icon} earned={on} progress={0} tone="smokefree" size={72} />
              <AppText variant="tiny" weight="800" center>
                {b.title}
              </AppText>
            </View>
          );
        })}
      </View>

      {reached ? (
        <CelebrationCard
          celebrationKey={reached.id}
          kicker={tr('camp.rewards.reachedKicker')}
          icon="gift"
          title={reached.title}
          desc={tr('camp.rewards.reachedBody', { amount: fmtTL(reached.amountTRY) })}
          cta={tr('camp.panel.gainCta')}
          onClose={() => useCampStore.getState().markReward(reached.id)}
        />
      ) : null}
    </Screen>
  );
}
