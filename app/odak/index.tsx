import type { IconName } from '@/components/Icon';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Header, Icon, Screen, useTheme } from '@/components';
import { Sheet } from '@/components/ui';
import { HeroButton, HeroChip, HeroTitle, MiniStats, PanelHero, PastelCard, SupportRow, TodayCard, ToolGrid, type TaskRow, type ToolTile } from '@/features/camps/core/panelUi';
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
import { ExpertCard } from '@/features/camps/odak/ui';
import { CelebrationCard } from '@/features/gamification/Celebration';
import { useAccess } from '@/features/purchases/useGate';
import { goBack } from '@/lib/nav';
import { useNow } from '@/lib/useNow';

/**
 * Odak Paneli (SPEC_ODAK_KAMPI 5.1, SPEC_V4 §D.1), the same five layers as Sigarasız Kamp in the focus
 * tone: hero (phase chip, goal counter, "Dürtü anı" — the one filled button) · Bugün (check-in, mission,
 * skill, "Bir davranış kaydet") · at most one situational card (after a slip, an expert note, rebuilding,
 * a value) · 8 tools · support. The lock icon top right shows whether the camp lock is on.
 */
export default function OdakPanel() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  // Re-render every minute; always compute with the current time (a log just made must count).
  useNow(60_000);
  const now = new Date();
  const enrolled = useOdakLockStore((s) => s.enrolled);
  const lockOn = useOdakLockStore((s) => s.enabled);
  const premium = useAccess()('odak');
  const [missionOpen, setMissionOpen] = useState(false);
  const { ready, goal, events, profile, urges, checkins, screenings, relapseHandledAt, missionsDone, skillsDone, boundaries, badges, plans } = useOdakStore();

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
  const mission = todayMission(ODAK_MISSIONS, goal, missionsDone.map((m) => m.id), now);
  const missionDone = mission ? missionsDone.some((m) => m.id === mission.id) : false;
  const missionLocked = mission ? !premium && !missionIsFree(mission) : false;
  const lesson = lessonOfDay(ODAK_SKILLS, profile, skillsDone.map((s) => s.id), phase);
  const lessonDoneToday = skillsDone.some((s) => dayKey(new Date(s.at)) === dayKey(now));
  const mainLessons = ODAK_SKILLS.filter((l) => !l.bonus);
  const mainLessonsDone = mainLessons.filter((l) => skillsDone.some((s) => s.id === l.id)).length;
  const earned = earnedOdakBadges({ goal, events, urges, checkins, plans, boundaries, mainLessonsDone, now });
  const fresh = earned.filter((id) => !badges.some((b) => b.id === id));
  const freshBadge = fresh.length ? BD.items.find((b) => b.id === fresh[0]) : undefined;
  const counters = goalCounters(goal, events, now);
  const weekEvents = events.filter((e) => Date.parse(e.at) >= weekStart(now).getTime()).length;
  const first = counters[0];

  // A value to remember today (rotates daily through the chosen cards and the user's own sentence).
  const cards = ONB.values.cards.filter((c) => profile?.values.includes(c.id));
  const pool: string[] = [...cards.map((c) => `${c.label}`), ...(profile?.valuesText ? [`“${profile.valuesText}”`] : [])];
  const seed = [...dayKey(now)].reduce((s, ch) => s + ch.charCodeAt(0), 0);
  const valueToday = pool.length ? pool[seed % pool.length]! : null;

  const rows: TaskRow[] = [
    { key: 'checkin', icon: 'clipboard', title: tr('odak.home2.checkin'), sub: due ? C.panelDue : doneToday ? C.panelDone : tr('odak.home2.checkinLater'), done: !due && doneToday, onPress: () => router.push('/odak/checkin') },
    ...(mission ? [{ key: 'mission', icon: 'target' as IconName, title: tr('odak.panel.mission'), sub: mission.title, done: missionDone, locked: missionLocked, onPress: () => (missionLocked ? router.push({ pathname: '/paywall', params: { source: 'odak' } }) : setMissionOpen(true)) }] : []),
    ...(lesson ? [{ key: 'lesson', icon: 'book' as IconName, title: tr('odak.panel.lesson'), sub: lesson.title, done: lessonDoneToday, onPress: () => router.push({ pathname: '/odak/skills/[lessonId]', params: { lessonId: lesson.id } }) }] : []),
    { key: 'log', icon: 'plus', title: P.log.title, sub: tr('odak.home2.logHint'), done: false, extra: true, action: tr('odak.home2.logAction'), onPress: () => router.push('/odak/log-behavior') },
  ];

  const tools: ToolTile[] = [
    { icon: 'shield', title: tr('odak.home2.tools.boundaries'), route: '/odak/boundaries' },
    { icon: 'calendar', title: tr('odak.home2.tools.diary'), route: '/odak/diary' },
    { icon: 'graduation', title: tr('odak.home2.tools.skills'), sub: tr('camp.home2.lessons', { done: mainLessonsDone, total: mainLessons.length }), route: '/odak/skills' },
    { icon: 'book', title: tr('odak.home2.tools.library'), route: '/odak/library' },
    { icon: 'chart', title: tr('odak.home2.tools.stats'), route: '/odak/stats' },
    { icon: 'trophy', title: tr('odak.home2.tools.rewards'), sub: badges.length ? tr('camp.home2.badges', { count: badges.length }) : undefined, route: '/odak/rewards' },
    { icon: 'leaf', title: tr('odak.home2.tools.rebuild'), route: '/odak/rebuild' },
    { icon: lockOn ? 'lock' : 'lockOpen', title: tr('odak.home2.tools.privacy'), sub: lockOn ? tr('odak.home2.lockOn') : tr('odak.home2.lockOff'), route: '/odak/privacy' },
  ];

  const managed = managedCount(urges);
  // Layer 4, priority order: after a slip → an expert note → rebuilding phase → a value of the day.
  const context = relapse ? (
    <PastelCard tone="focus" icon="rotate" title={RL.panelTitle} text={RL.panelBody} onPress={() => router.push('/odak/relapse')} />
  ) : referral ? (
    <ExpertCard lead={`${REF.title}. ${REF[referral]}`} />
  ) : phase === 'rebuild' ? (
    <PastelCard tone="focus" icon="leaf" title={tr('odak.home2.rebuildTitle')} text={tr('odak.home2.rebuildText')} onPress={() => router.push('/odak/rebuild')} />
  ) : valueToday ? (
    <PastelCard tone="focus" icon="compass" title={valueToday} text={P.value.title} />
  ) : null;

  return (
    <Screen>
      <Header
        title={tr('odak.title')}
        onBack={() => goBack('/discover')}
        right={
          <View style={{ flexDirection: 'row' }}>
            <Pressable onPress={() => router.push('/odak/privacy')} accessibilityRole="button" accessibilityLabel={`${tr('odak.privacy.title')}, ${lockOn ? tr('odak.home2.lockOn') : tr('odak.home2.lockOff')}`} hitSlop={8} style={{ width: t.touch, height: t.touch, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={lockOn ? 'lock' : 'lockOpen'} color={t.tokens.foreground} size={22} />
            </Pressable>
            <QuickExitButton />
          </View>
        }
      />

      <View style={{ gap: t.space.xl }}>
        <PanelHero tone="focus">
          <HeroChip label={tr('odak.home2.phaseChip', { n: pIdx + 1, phase: pInfo.name, day: Math.min(day, ODAK_PROGRAM_DAYS), total: ODAK_PROGRAM_DAYS })} />
          <HeroTitle>{first ? counterText(first) : P.undecided.title}</HeroTitle>
          {!first ? (
            <AppText variant="callout" color={t.focus.icon}>
              {fill(P.undecided.body, { n: weekEvents })}
            </AppText>
          ) : counters.length > 1 ? (
            counters.slice(1).map((c) => (
              <AppText key={c.target} variant="callout" color={t.focus.icon}>
                {counterText(c)}
              </AppText>
            ))
          ) : null}
          <MiniStats
            items={[
              { value: String(managed), label: tr('odak.home2.managed') },
              { value: first ? tr('camp.panel.days', { count: first.longest }) : '–', label: tr('odak.home2.longest') },
              { value: toNext !== null ? tr('camp.panel.days', { count: toNext }) : '–', label: tr('odak.home2.nextPhase') },
            ]}
          />
          <HeroButton tone="focus" icon="waves" label={tr('odak.panel.sos')} hint={tr('odak.panel.sosHint')} onPress={() => router.push('/odak/sos')} />
        </PanelHero>

        <TodayCard title={tr('camp.home2.today')} rows={rows} />

        {context}

        <ToolGrid tone="focus" title={tr('camp.home2.toolsTitle')} tools={tools} />

        <SupportRow
          items={[
            { icon: 'users', title: tr('odak.home2.support'), sub: tr('odak.home2.supportSub'), onPress: () => router.push('/odak/support') },
            { icon: 'book', title: tr('odak.home2.sources'), sub: tr('odak.home2.sourcesSub'), onPress: () => router.push('/odak/sources') },
          ]}
        />
      </View>

      {mission && !missionLocked ? (
        <Sheet visible={missionOpen} onClose={() => setMissionOpen(false)} title={tr('odak.panel.mission')}>
          <View style={{ gap: t.space.md }}>
            <AppText variant="footnote" muted>
              {tr('odak.skills.minutes', { count: mission.durationMin })}
            </AppText>
            <AppText variant="title3">{mission.title}</AppText>
            <AppText variant="callout">{mission.body}</AppText>
            {missionDone ? (
              <AppText variant="callout" weight="700" color={t.tokens.success}>
                {tr('odak.panel.missionDone')}
              </AppText>
            ) : (
              <Button
                label={tr('odak.panel.missionComplete')}
                icon="check"
                variant="primary"
                onPress={() => {
                  void useOdakStore.getState().completeMission(mission.id);
                  setMissionOpen(false);
                }}
              />
            )}
          </View>
        </Sheet>
      ) : null}
      {freshBadge ? <CelebrationCard celebrationKey={freshBadge.id} kicker={BD.kicker} icon={freshBadge.icon as IconName} title={freshBadge.title} desc={freshBadge.desc} cta={BD.cta} onClose={() => void useOdakStore.getState().unlockBadges(fresh)} /> : null}
    </Screen>
  );
}

/** The goal counter in words (panel.tr.json → counter). */
function counterText(c: GoalCounter): string {
  return c.mode !== 'reduce' && c.current === 0
    ? P.counter.zero
    : c.mode === 'quit'
      ? fill(P.counter.quit, { n: c.current })
      : c.mode === 'pause'
        ? c.done
          ? fill(P.counter.pauseDone, { limit: c.limit })
          : fill(P.counter.pause, { n: Math.min(c.current, c.limit ?? c.current), limit: c.limit })
        : fill(c.weekUsed > (c.limit ?? 0) ? P.counter.reduceOver : P.counter.reduce, { used: c.weekUsed, limit: c.limit });
}
