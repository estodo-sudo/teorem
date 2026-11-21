import type { IconName } from '@/components/Icon';
import { router, type Href } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Image, Linking, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Header, Icon, ProgressBar, Screen, useTheme } from '@/components';
import { IconTile, Sheet } from '@/components/ui';
import { CAMP_HEALTH, CAMP_MISSIONS, CAMP_ONBOARDING as ONB, CAMP_REWARDS, CAMP_SKILLS } from '@/features/camps/smoking/content';
import { checkinDue, moodAlert } from '@/features/camps/smoking/engine/checkin';
import { cigarettesNotSmoked, slipsOf, smokeFreeDuration } from '@/features/camps/smoking/engine/counters';
import { logsOfAttempt, todayCount } from '@/features/camps/smoking/engine/diary';
import { reasonOfDay, remainingUnit, splitDuration } from '@/features/camps/smoking/engine/format';
import { HEALTH_MILESTONES, milestoneToCelebrate, nextHealthMilestone, reachedMilestones } from '@/features/camps/smoking/engine/milestones';
import { panelContext, recentSlip, sameDay, triggerCoverage } from '@/features/camps/smoking/engine/panel';
import { currentPhase, daysSinceQuit, programDay, quitStart } from '@/features/camps/smoking/engine/phase';
import { missionForDay } from '@/features/camps/smoking/engine/plans';
import { missionIsFree } from '@/features/camps/smoking/engine/premium';
import { moneySaved } from '@/features/camps/smoking/engine/savings';
import { nextLesson } from '@/features/camps/smoking/engine/skills';
import { canGraduate, earnedBadges, newBadges } from '@/features/camps/smoking/engine/stats';
import { campAttempt } from '@/features/camps/smoking/state';
import { HeroButton, HeroChip, HeroTitle, MiniStats, PanelHero, PastelCard, SupportRow, TodayCard, ToolGrid, type TaskRow, type ToolTile } from '@/features/camps/core/panelUi';
import { fmtTL, MissionCard, SafetyCard } from '@/features/camps/smoking/ui';
import { CelebrationCard } from '@/features/gamification/Celebration';
import { useAccess } from '@/features/purchases/useGate';
import { goBack } from '@/lib/nav';
import { useClock } from '@/lib/useNow';
import { useCampEventsStore, useCampStore } from '@/stores/campStore';

/**
 * Sigarasız Kamp panel (SPEC_V4 §C.6): five layers, one job each, and a single filled button.
 * 1 title with settings · 2 hero (phase chip, counter, three mini stats, "Canım çekiyor") ·
 * 3 Bugün (check-in, mission, skill — and the cigarette log while reducing) · 4 at most one
 * situational card · 5 an 8-tile tool grid · then the support line.
 */
export default function CampPanel() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const s = useCampStore();
  const premium = useAccess()('camp');
  const cigs = useCampEventsStore((x) => x.cigarettes);
  const cravings = useCampEventsStore((x) => x.cravings);
  const checkins = useCampEventsStore((x) => x.checkins);
  const { now } = useClock(30_000);
  const [missionOpen, setMissionOpen] = useState(false);
  // A graduated attempt stays on the panel (freedom phase).
  const attempt = campAttempt(s);
  const ready = Boolean(s.profile && attempt);

  useEffect(() => {
    if (!ready) router.replace('/camp/onboarding');
    else useCampStore.getState().refreshAttempt(now);
  }, [ready, now]);

  if (!s.profile || !attempt) {
    return (
      <Screen>
        <Header title={tr('camp.title')} />
      </Screen>
    );
  }

  const profile = s.profile;
  const phase = currentPhase(attempt, now);
  const phaseNo = ONB.phases.findIndex((p) => p.id === phase) + 1;
  const phaseInfo = ONB.phases[phaseNo - 1]!;
  const preparing = phase === 'preparation';
  const pd = programDay(attempt, now);
  const start = quitStart(attempt);
  const dur = splitDuration(smokeFreeDuration(attempt, cigs, now));
  const slips = slipsOf(attempt, cigs);
  const saved = moneySaved(s.prices, profile.perDay, attempt, cigs, now);
  const notSmoked = cigarettesNotSmoked(profile.perDay, attempt, cigs, now);
  const next = preparing ? null : nextHealthMilestone(start, now);
  const nextItem = CAMP_HEALTH.items.find((x) => x.id === (next?.id ?? HEALTH_MILESTONES[0].id))!;
  const left = remainingUnit(next ? next.remainingMs : HEALTH_MILESTONES[0].afterMs);
  const daysToQuit = preparing ? -daysSinceQuit(attempt, now) : null;

  // Layer 3: today's tasks.
  const checkin = checkinDue(checkins, phase, now);
  const mission = missionForDay(CAMP_MISSIONS.missions, pd.phase, pd.day, s.missions.map((m) => m.missionId));
  const missionDone = mission ? s.missions.some((m) => m.missionId === mission.id) : false;
  const missionLocked = mission ? !(premium || missionIsFree(pd.phase)) : false;
  const learnedToday = [...s.skills].reverse().find((k) => sameDay(k.completedAt, now));
  const lessonId = learnedToday?.lessonId ?? nextLesson(CAMP_SKILLS.lessons, s.skills.map((k) => k.lessonId), profile.relapseCauses ?? []);
  const lesson = CAMP_SKILLS.lessons.find((l) => l.id === lessonId);
  const logs = logsOfAttempt(cigs, attempt.id);
  const tasks: TaskRow[] = [
    { key: 'checkin', icon: 'clipboard', title: tr('camp.home2.checkin'), sub: checkin.due && checkin.slot ? tr(`camp.panel.checkin.${checkin.slot}`) : tr('camp.home2.checkinDone'), done: !checkin.due, onPress: () => router.push('/camp/checkin') },
    ...(mission ? [{ key: 'mission', icon: 'target' as IconName, title: tr('camp.home2.mission'), sub: mission.title, done: missionDone, locked: missionLocked, onPress: () => (missionLocked ? router.push({ pathname: '/paywall', params: { source: 'camp' } }) : setMissionOpen(true)) }] : []),
    ...(lesson ? [{ key: 'skill', icon: 'book' as IconName, title: tr('camp.home2.skill'), sub: lesson.title, done: Boolean(learnedToday), onPress: () => router.push({ pathname: '/camp/skills/[lessonId]', params: { lessonId: lesson.id } }) }] : []),
    ...(preparing ? [{ key: 'log', icon: 'pen' as IconName, title: tr('camp.home2.logToday', { count: todayCount(logs, now) }), sub: tr('camp.home2.logHint'), done: false, extra: true, action: tr('camp.home2.logAction'), onPress: () => router.push('/camp/log-cigarette') }] : []),
  ];

  // Layer 4: one situational card.
  const graduateNow = canGraduate(attempt, now);
  const reason = reasonOfDay(profile.reasons, now);
  const reasonText = reason ? (reason.id === 'custom' ? reason.text : ONB.reasons.find((r) => r.id === reason.id)?.label) : null;
  const reasonIcon: IconName = (reason && reason.id !== 'custom' ? ONB.reasons.find((r) => r.id === reason.id)?.icon : undefined) ?? 'chat';
  const context = panelContext({
    safety: moodAlert(checkins, now),
    quitDayToday: phase === 'quit_day',
    daysToQuit,
    slipWithinDay: !preparing && recentSlip(slips, now),
    graduation: graduateNow || attempt.status === 'graduated',
    nextHealth: Boolean(next),
    reason: Boolean(reasonText),
  });

  // Layer 5: tool counters.
  const coverage = triggerCoverage(profile.triggers, cravings, cigs, s.plans);
  const lessons = CAMP_SKILLS.lessons.filter((l) => !l.bonus);
  const learned = lessons.filter((l) => s.skills.some((k) => k.lessonId === l.id)).length;
  const badgeCount = s.badges.filter((b) => b.unlockedAt).length;
  const tools: ToolTile[] = [
    { icon: 'compass', title: tr('camp.home2.tools.triggers'), sub: coverage.total ? tr('camp.home2.coverage', { done: coverage.done, total: coverage.total }) : undefined, route: '/camp/triggers' },
    { icon: 'calendar', title: tr('camp.home2.tools.diary'), route: '/camp/diary' },
    { icon: 'star', title: tr('camp.home2.tools.reasons'), route: '/camp/reasons' },
    { icon: 'graduation', title: tr('camp.home2.tools.skills'), sub: tr('camp.home2.lessons', { done: learned, total: lessons.length }), route: '/camp/skills' },
    { icon: 'book', title: tr('camp.home2.tools.library'), route: '/camp/library' },
    { icon: 'chart', title: tr('camp.home2.tools.stats'), route: '/camp/stats' },
    { icon: 'trophy', title: tr('camp.home2.tools.rewards'), sub: badgeCount ? tr('camp.home2.badges', { count: badgeCount }) : undefined, route: '/camp/rewards' },
    { icon: 'heartPulse', title: tr('camp.home2.tools.health'), route: '/camp/health' },
  ];

  // Celebrations (unchanged): a health gain first, then newly earned badges one at a time.
  const reached = preparing ? [] : reachedMilestones(start, now);
  const celebrate = milestoneToCelebrate(reached, s.seenMilestoneIds);
  const celebrateItem = CAMP_HEALTH.items.find((x) => x.id === celebrate);
  const freshBadges = celebrate ? [] : newBadges(earnedBadges(s, { cigarettes: cigs, cravings, checkins }, lessons.map((l) => l.id), now), s.badges);
  const badge = CAMP_REWARDS.badges.find((b) => b.id === freshBadges[0]);

  const counter = preparing
    ? tr('camp.home2.toQuit', { count: daysToQuit ?? 0 })
    : tr(slips.length ? 'camp.home2.sinceSlip' : 'camp.home2.smokeFree', { days: dur.days, hours: dur.hours });

  return (
    <Screen>
      <Header
        title={tr('camp.title')}
        onBack={() => goBack('/discover')}
        right={
          <Pressable onPress={() => router.push('/camp/settings')} accessibilityRole="button" accessibilityLabel={tr('camp.settings.title')} hitSlop={10} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="gear" color={t.tokens.foreground} size={22} />
          </Pressable>
        }
      />

      <View style={{ gap: t.space.xl }}>
        {/* 2. Hero */}
        <PanelHero tone="smokefree">
          <HeroChip label={tr('camp.home2.phaseChip', { n: phaseNo, phase: phaseInfo.title, attempt: attempt.attemptNo })} />
          <HeroTitle>{counter}</HeroTitle>
          <MiniStats
            items={[
              { value: tr('camp.plan.tl', { amount: fmtTL(saved) }), label: tr('camp.home2.saved') },
              { value: String(notSmoked), label: tr('camp.home2.notSmoked') },
              { value: tr(`camp.dur.${left.unit}`, { count: left.value }), label: tr(next ? 'camp.home2.nextGain' : 'camp.home2.firstGain'), onPress: () => router.push('/camp/health') },
            ]}
          />
          <HeroButton tone="smokefree" icon="wind" label={tr('camp.sos.panelButton')} hint={tr('camp.sos.panelHint')} onPress={() => router.push('/camp/sos')} />
        </PanelHero>

        {/* 3. Bugün */}
        <TodayCard title={tr('camp.home2.today')} rows={tasks} />

        {/* 4. One situational card */}
        {context ? (
          <ContextCard
            kind={context}
            daysToQuit={daysToQuit ?? 0}
            health={next ? { title: tr('camp.home2.nextAt', { label: nextItem.label }), text: nextItem.text, icon: nextItem.icon, progress: next.progress } : undefined}
            graduateNow={graduateNow}
            reason={reasonText ? { text: reason?.id === 'custom' ? `“${reasonText}”` : reasonText, icon: reasonIcon, photo: profile.reasonPhotoUri } : undefined}
          />
        ) : null}

        {/* 5. Tools */}
        <ToolGrid tone="smokefree" title={tr('camp.home2.toolsTitle')} tools={tools} />

        {/* 6. Support */}
        <SupportRow
          items={[
            { icon: 'phone', title: tr('camp.home2.alo'), sub: tr('camp.home2.aloSub'), onPress: () => void Linking.openURL('tel:171') },
            { icon: 'users', title: tr('camp.home2.network'), sub: tr('camp.home2.networkSub'), onPress: () => router.push('/camp/support') },
          ]}
        />
      </View>

      {mission ? (
        <Sheet visible={missionOpen} onClose={() => setMissionOpen(false)} title={tr('camp.home2.mission')}>
          <MissionCard
            mission={mission}
            done={missionDone}
            onDone={() => {
              useCampStore.getState().completeMission(mission.id);
              setMissionOpen(false);
            }}
          />
        </Sheet>
      ) : null}

      {!celebrate && badge ? (
        <CelebrationCard celebrationKey={badge.id} kicker={tr('camp.rewards.badgeKicker')} icon={badge.icon} title={badge.title} desc={badge.desc} cta={tr('camp.panel.gainCta')} onClose={() => freshBadges.forEach((id) => useCampStore.getState().unlockBadge(id))} />
      ) : null}
      {celebrate && celebrateItem ? (
        <CelebrationCard
          celebrationKey={celebrate}
          kicker={tr('camp.panel.gainKicker')}
          icon={celebrateItem.icon}
          title={tr('camp.panel.gainTitle', { label: celebrateItem.label })}
          desc={`${celebrateItem.text} ${CAMP_HEALTH.note}`}
          cta={tr('camp.panel.gainCta')}
          onClose={() => useCampStore.getState().markMilestonesSeen(reached)}
        />
      ) : null}
    </Screen>
  );
}

function ContextCard({ kind, daysToQuit, health, graduateNow, reason }: { kind: NonNullable<ReturnType<typeof panelContext>>; daysToQuit: number; health?: { title: string; text: string; icon: IconName; progress: number }; graduateNow: boolean; reason?: { text: string; icon: IconName; photo?: string } }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  if (kind === 'safety') return <SafetyCard />;

  const pastel = (icon: IconName, title: string, text: string | null, route: Href, extra?: ReactNode) => <PastelCard tone="smokefree" icon={icon} title={title} text={text} onPress={() => router.push(route)} extra={extra} />;

  switch (kind) {
    case 'quitDay':
      return pastel('flag', CAMP_MISSIONS.quitDay.title, tr('camp.quitDay.panelHint'), '/camp/quit-day');
    case 'quitSoon':
      return pastel('flag', daysToQuit === 0 ? tr('camp.home2.quitToday') : tr('camp.home2.quitSoon', { count: daysToQuit }), tr('camp.home2.quitSoonHint'), '/camp/plan');
    case 'slip':
      return pastel('rotate', tr('camp.home2.slipTitle'), tr('camp.home2.slipText'), '/camp/slip');
    case 'graduation':
      return pastel('graduation', tr(graduateNow ? 'camp.graduation.panelReady' : 'camp.graduation.panelDone'), null, '/camp/graduation');
    case 'health':
      return health ? pastel(health.icon, health.title, health.text, '/camp/health', <ProgressBar value={health.progress} height={6} />) : null;
    case 'reason':
      return reason ? (
        <View style={{ borderRadius: t.radius.lg, overflow: 'hidden', backgroundColor: t.tone.smokefree.soft }}>
          {reason.photo ? <Image source={{ uri: reason.photo }} style={{ width: '100%', aspectRatio: 16 / 9 }} accessibilityLabel={tr('camp.onb.reasons.photoAlt')} /> : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md, padding: t.space.lg }}>
            <IconTile icon={reason.icon} tone="smokefree" size="lg" round />
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="footnote" muted>
                {tr('camp.home2.reasonKicker')}
              </AppText>
              <AppText variant="title3">{reason.text}</AppText>
            </View>
          </View>
        </View>
      ) : null;
    default:
      return null;
  }
}
