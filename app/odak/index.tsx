import type { IconName } from '@/components/Icon';
import { Redirect, router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Header, Icon, Screen, useTheme } from '@/components';
import { IconTile } from '@/components/ui';
import { dayKey } from '@/features/camps/core/time';
import { fill, ODAK_BADGES as BD, ODAK_CHECKIN as C, ODAK_MISSIONS, ODAK_SKILLS, ODAK_ONBOARDING as ONB, ODAK_PANEL as P, ODAK_REFERRAL as REF, ODAK_RELAPSE as RL } from '@/features/camps/odak/content';
import { checkedInToday, odakCheckinDue, programStart, referralReason, relapseActive } from '@/features/camps/odak/engine/checkin';
import { goalCounters, weekStart, type GoalCounter } from '@/features/camps/odak/engine/goals';
import { missionIsFree } from '@/features/camps/odak/engine/premium';
import { lessonOfDay, todayMission } from '@/features/camps/odak/engine/program';
import { managedCount } from '@/features/camps/odak/engine/sos';
import { earnedOdakBadges } from '@/features/camps/odak/engine/stats';
import { daysToNextOdakPhase, ODAK_PHASE_ORDER, ODAK_PROGRAM_DAYS, odakPhase, programDay } from '@/features/camps/odak/engine/phase';
import { useOdakLockStore } from '@/features/camps/odak/privacy/lockStore';
import { QuickExitButton } from '@/features/camps/odak/privacy/quickExit';
import { useOdakStore } from '@/features/camps/odak/store';
import { ExpertCard, OdakLock, OdakPhaseTrack } from '@/features/camps/odak/ui';
import { CelebrationCard } from '@/features/gamification/Celebration';
import { tint } from '@/features/campus/shared/ui';
import { useNow } from '@/lib/useNow';
import { useAccess } from '@/features/purchases/useGate';

/** Odak Paneli (SPEC_ODAK_KAMPI 5.1): phase line, SOS, a counter card per goal, a value reminder, plans. */
export default function OdakPanel() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  // Re-render every minute; always compute with the current time (a log just made must count).
  useNow(60_000);
  const now = new Date();
  const enrolled = useOdakLockStore((s) => s.enrolled);
  const premium = useAccess()('odak');
  const { ready, goal, plans, events, profile, urges, checkins, screenings, relapseHandledAt, missionsDone, skillsDone, boundaries, badges } = useOdakStore();

  if (!enrolled) return <Redirect href="/odak/onboarding" />;
  if (!ready) {
    return (
      <Screen>
        <Header title={tr('odak.title')} right={<QuickExitButton />} />
      </Screen>
    );
  }
  if (!goal) {
    // Enrolled, but the vault cannot be read (e.g. restored onto another phone: the key never leaves the device).
    return (
      <Screen>
        <Header title={tr('odak.title')} right={<QuickExitButton />} />
        <Card style={{ gap: t.space.sm }}>
          <AppText variant="h3">{tr('odak.panel.missingTitle')}</AppText>
          <AppText variant="small">{tr('odak.panel.missingBody')}</AppText>
        </Card>
        <Button
          label={tr('odak.panel.missingRestart')}
          onPress={() => {
            void useOdakStore
              .getState()
              .wipe()
              .finally(() => router.replace('/odak/onboarding'));
          }}
        />
      </Screen>
    );
  }

  const start = programStart(goal);
  const day = programDay(start, now);
  const phase = odakPhase(start, now);
  const pIdx = ODAK_PHASE_ORDER.indexOf(phase);
  const pInfo = ONB.summary.phases[pIdx]!;
  const toNext = daysToNextOdakPhase(start, now);
  const due = odakCheckinDue(checkins, goal, now);
  const doneToday = checkedInToday(checkins, now);
  const relapse = relapseActive(events, checkins, now, relapseHandledAt);
  const referral = referralReason({ events, checkins, screenings, now });
  const mission = todayMission(
    ODAK_MISSIONS,
    goal,
    missionsDone.map((m) => m.id),
    now,
  );
  const missionDone = mission ? missionsDone.some((m) => m.id === mission.id) : false;
  const lesson = lessonOfDay(
    ODAK_SKILLS,
    profile,
    skillsDone.map((s) => s.id),
    phase,
  );
  const mainLessonsDone = ODAK_SKILLS.filter((l) => !l.bonus && skillsDone.some((s) => s.id === l.id)).length;
  const earned = earnedOdakBadges({ goal, events, urges, checkins, plans, boundaries, mainLessonsDone, now });
  const fresh = earned.filter((id) => !badges.some((b) => b.id === id));
  const freshBadge = fresh.length ? BD.items.find((b) => b.id === fresh[0]) : undefined;
  const counters = goalCounters(goal, events, now);
  const weekEvents = events.filter((e) => Date.parse(e.at) >= weekStart(now).getTime()).length;

  // A value to remember today (rotates daily through the chosen cards and the user's own sentence).
  const cards = ONB.values.cards.filter((c) => profile?.values.includes(c.id));
  const pool: string[] = [...cards.map((c) => `${c.label}`), ...(profile?.valuesText ? [`“${profile.valuesText}”`] : [])];
  const seed = [...dayKey(now)].reduce((s, ch) => s + ch.charCodeAt(0), 0);
  const valueToday = pool.length ? pool[seed % pool.length]! : null;

  return (
    <Screen>
      <Header
        title={tr('odak.title')}
        right={
          <View style={{ flexDirection: 'row' }}>
            <Pressable onPress={() => router.push('/odak/privacy')} accessibilityRole="button" accessibilityLabel={tr('odak.privacy.title')} hitSlop={8} style={{ width: t.touch, height: t.touch, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="shield" color={t.colors.text} size={22} />
            </Pressable>
            <QuickExitButton />
          </View>
        }
      />

      <Card style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <AppText variant="h3">
            {pInfo.name}
          </AppText>
          <AppText variant="small" weight="800" color={t.colors.accent}>
            {tr('odak.panel.day', { day: Math.min(day, ODAK_PROGRAM_DAYS), total: ODAK_PROGRAM_DAYS })}
          </AppText>
        </View>
        <OdakPhaseTrack index={pIdx} />
        <AppText variant="small" muted>
          {pInfo.focus}
        </AppText>
        {toNext !== null ? (
          <AppText variant="tiny" muted>
            {tr('odak.panel.nextPhase', { count: toNext })}
          </AppText>
        ) : null}
      </Card>

      <Pressable
        onPress={() => router.push('/odak/sos')}
        accessibilityRole="button"
        accessibilityLabel={`${tr('odak.panel.sos')}. ${tr('odak.panel.sosHint')}`}
        style={({ pressed }) => ({ minHeight: 88, borderRadius: t.radius.lg, backgroundColor: t.colors.accent, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, opacity: pressed ? 0.85 : 1 })}
      >
        <IconTile icon="waves" tone="focus" size="lg" round />
        <View style={{ flex: 1 }}>
          <AppText variant="h2" color={t.tokens.primaryForeground}>
            {tr('odak.panel.sos')}
          </AppText>
          <AppText variant="small" color={t.tokens.primaryForeground} style={{ opacity: 0.9 }}>
            {tr('odak.panel.sosHint')}
          </AppText>
        </View>
      </Pressable>

      {managedCount(urges) > 0 ? (
        <AppText variant="small" weight="800" color={t.colors.success} center>
          {tr('odak.panel.managed', { count: managedCount(urges) })}
        </AppText>
      ) : null}

      {relapse ? (
        <Card style={{ gap: t.space.sm, backgroundColor: t.tokens.muted, borderColor: t.tokens.muted}}>
          <AppText variant="h3">{RL.panelTitle}</AppText>
          <AppText variant="small">{RL.panelBody}</AppText>
          <Button label={RL.panelButton} variant="secondary" onPress={() => router.push('/odak/relapse')} />
        </Card>
      ) : null}

      {due ? (
        <Button label={C.panelDue} icon="check" size="lg" onPress={() => router.push('/odak/checkin')} />
      ) : doneToday ? (
        <AppText variant="small" weight="700" muted center>
          {C.panelDone}
        </AppText>
      ) : null}

      {counters.length ? (
        counters.map((c) => <GoalCard key={c.target} c={c} />)
      ) : (
        <Card style={{ gap: 6 }}>
          <AppText variant="h3">{P.undecided.title}</AppText>
          <AppText variant="small">{fill(P.undecided.body, { n: weekEvents })}</AppText>
        </Card>
      )}

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button label={tr('odak.panel.diary')} icon="book" variant="secondary" onPress={() => router.push('/odak/diary')} style={{ flex: 1 }} />
        <Button label={P.log.title} icon="plus" variant="secondary" onPress={() => router.push('/odak/log-behavior')} style={{ flex: 1 }} />
      </View>
      <Pressable
        onPress={() => router.push('/odak/skills')}
        accessibilityRole="button"
        accessibilityLabel={`${tr('odak.skills.title')}. ${tr('odak.panel.skillsProgress', { done: mainLessonsDone, total: ODAK_SKILLS.filter((l) => !l.bonus).length })}`}
        style={({ pressed }) => ({
          minHeight: 72,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          padding: t.space.lg,
          borderRadius: t.radius.lg,
          borderWidth: 2,
          borderColor: t.colors.primary,
          backgroundColor: tint(t.colors.primary, '22'),
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <View style={{ width: 48, height: 48, borderRadius: t.radius.xl, backgroundColor: t.colors.primary, alignItems: 'center', justifyContent: 'center' }}>
          <IconTile icon="graduation" tone="focus" />
        </View>
        <View style={{ flex: 1, gap: t.space.xs }}>
          <AppText variant="h3">{tr('odak.skills.title')}</AppText>
          <AppText variant="small" muted>
            {tr('odak.panel.skillsProgress', { done: mainLessonsDone, total: ODAK_SKILLS.filter((l) => !l.bonus).length })}
          </AppText>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: t.colors.surfaceAlt, overflow: 'hidden' }}>
            <View style={{ width: `${(mainLessonsDone / Math.max(1, ODAK_SKILLS.filter((l) => !l.bonus).length)) * 100}%`, height: 6, backgroundColor: t.colors.primary }} />
          </View>
        </View>
        <Icon name="chevron" color={t.colors.primary} size={20} />
      </Pressable>
      <Button label={tr('odak.panel.boundaries')} icon="shield" variant="secondary" onPress={() => router.push('/odak/boundaries')} />
      <Button label={tr('odak.panel.rebuild')} icon="leaf" variant="secondary" onPress={() => router.push('/odak/rebuild')} />
      <Button label={tr('odak.coach.title')} icon="sparkle" variant="secondary" onPress={() => router.push('/odak/coach')} />
      <Button label={tr('odak.panel.stats')} icon="chart" variant="secondary" onPress={() => router.push('/odak/stats')} />
      <Button label={tr('odak.panel.rewards')} icon="trophy" variant="secondary" onPress={() => router.push('/odak/rewards')} />
      <Button label={tr('odak.panel.support')} icon="help" variant="secondary" onPress={() => router.push('/odak/support')} />
      <Button label={tr('odak.library.title')} icon="book" variant="secondary" onPress={() => router.push('/odak/library')} />

      {mission && !premium && !missionIsFree(mission) ? <OdakLock title={tr('odak.premium.mission')} /> : null}
      {mission && (premium || missionIsFree(mission)) ? (
        <Card style={{ gap: t.space.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText variant="small" weight="800" muted>
              {tr('odak.panel.mission')}
            </AppText>
            <AppText variant="tiny" weight="800" color={t.colors.accent}>
              {tr('odak.skills.minutes', { count: mission.durationMin })}
            </AppText>
          </View>
          <AppText variant="h3">{mission.title}</AppText>
          <AppText variant="small">{mission.body}</AppText>
          {missionDone ? (
            <AppText variant="small" weight="800" color={t.colors.success}>
              ✓ {tr('odak.panel.missionDone')}
            </AppText>
          ) : (
            <Button label={tr('odak.panel.missionComplete')} icon="check" variant="secondary" onPress={() => void useOdakStore.getState().completeMission(mission.id)} />
          )}
        </Card>
      ) : null}

      {lesson ? (
        <Card onPress={() => router.push({ pathname: '/odak/skills/[lessonId]', params: { lessonId: lesson.id } })} accessibilityLabel={`${tr('odak.panel.lesson')}: ${lesson.title}`} style={{ flexDirection: 'row', gap: t.space.md, alignItems: 'center' }}>
          <IconTile icon={lesson.icon} tone="focus" size="lg" round />
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="small" weight="800" muted>
              {tr('odak.panel.lesson')}
            </AppText>
            <AppText weight="800">{lesson.title}</AppText>
            <AppText variant="tiny" muted>
              {tr('odak.skills.minutes', { count: lesson.minutes })}
            </AppText>
          </View>
          <Icon name="chevron" color={t.colors.textMuted} size={18} />
        </Card>
      ) : null}

      {valueToday ? (
        <Card style={{ gap: 6, backgroundColor: t.tokens.muted, borderColor: t.tokens.muted}}>
          <AppText variant="small" weight="800" muted>
            {P.value.title}
          </AppText>
          <AppText weight="700">{valueToday}</AppText>
        </Card>
      ) : null}

      {referral ? <ExpertCard lead={`${REF.title}. ${REF[referral]}`} /> : null}

      {plans.length ? (
        <Card style={{ gap: 6 }}>
          <AppText variant="h3">{ONB.summary.plansTitle}</AppText>
          {plans.map((p) => (
            <AppText key={p.id} variant="small">
              • {ONB.plans.if} {p.ifText}: {p.thenText}
            </AppText>
          ))}
        </Card>
      ) : null}
      {freshBadge ? <CelebrationCard celebrationKey={freshBadge.id} kicker={BD.kicker} icon={freshBadge.icon as IconName} title={freshBadge.title} desc={freshBadge.desc} cta={BD.cta} onClose={() => void useOdakStore.getState().unlockBadges(fresh)} /> : null}
    </Screen>
  );
}

function GoalCard({ c }: { c: GoalCounter }) {
  const t = useTheme();
  const main =
    c.mode !== 'reduce' && c.current === 0
      ? P.counter.zero
      : c.mode === 'quit'
        ? fill(P.counter.quit, { n: c.current })
        : c.mode === 'pause'
          ? c.done
            ? fill(P.counter.pauseDone, { limit: c.limit })
            : fill(P.counter.pause, { n: Math.min(c.current, c.limit ?? c.current), limit: c.limit })
          : fill(c.weekUsed > (c.limit ?? 0) ? P.counter.reduceOver : P.counter.reduce, { used: c.weekUsed, limit: c.limit });
  const progress = c.mode === 'reduce' ? Math.min(1, c.weekUsed / Math.max(1, c.limit ?? 1)) : c.mode === 'pause' ? Math.min(1, c.current / Math.max(1, c.limit ?? 1)) : null;
  return (
    <Card style={{ gap: t.space.sm }}>
      <AppText variant="small" weight="800" muted>
        {P.targets[c.target]}
      </AppText>
      <AppText variant="h2">{main}</AppText>
      {progress !== null ? (
        <View style={{ height: 8, borderRadius: 4, backgroundColor: t.colors.surfaceAlt, overflow: 'hidden' }}>
          <View style={{ width: `${progress * 100}%`, height: 8, backgroundColor: c.mode === 'reduce' && c.weekUsed > (c.limit ?? 0) ? t.colors.textMuted : t.colors.success }} />
        </View>
      ) : null}
      <AppText variant="tiny" muted>
        {fill(P.counter.detail, { total: c.total, longest: c.longest })}
      </AppText>
    </Card>
  );
}
