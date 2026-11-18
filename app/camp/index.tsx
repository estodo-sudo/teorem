import { router } from 'expo-router';
import { useEffect } from 'react';
import { Image, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Header, Icon, ProgressBar, Screen, useTheme } from '@/components';
import { CAMP_HEALTH, CAMP_MISSIONS, CAMP_ONBOARDING as ONB, CAMP_REWARDS, CAMP_SKILLS } from '@/features/camp/content';
import { nextLesson } from '@/features/camp/engine/skills';
import { cigarettesNotSmoked, slipsOf, smokeFreeDuration, totalSmokeFreeDays } from '@/features/camp/engine/counters';
import { reasonOfDay, remainingUnit, splitDuration } from '@/features/camp/engine/format';
import { HEALTH_MILESTONES, milestoneToCelebrate, nextHealthMilestone, reachedMilestones } from '@/features/camp/engine/milestones';
import { currentPhase, daysSinceQuit, daysToNextPhase, programDay, quitStart } from '@/features/camp/engine/phase';
import { missionForDay } from '@/features/camp/engine/plans';
import { checkinDue, moodAlert } from '@/features/camp/engine/checkin';
import { logsOfAttempt, REPORT_MIN_LOGS, todayCount } from '@/features/camp/engine/diary';
import { moneySaved } from '@/features/camp/engine/savings';
import { resistedCount } from '@/features/camp/engine/sos';
import { campAttempt } from '@/features/camp/state';
import { missionIsFree } from '@/features/camp/engine/premium';
import { useAccess } from '@/features/purchases/useGate';
import { canGraduate, earnedBadges, newBadges } from '@/features/camp/engine/stats';
import { Alo171Card, fmtTL, MissionCard, PhaseTrack, PremiumLock, SafetyCard, StatTile, useCampDate } from '@/features/camp/ui';
import { CampusHero, SectionTitle, tint } from '@/features/campus/shared/ui';
import { CelebrationCard } from '@/features/gamification/Celebration';
import { goBack } from '@/lib/nav';
import { useClock } from '@/lib/useNow';
import { useCampEventsStore, useCampStore } from '@/stores/campStore';

/**
 * Sigarasız Kamp panel (phase-aware home): counter, savings, cigarettes not smoked, next health
 * gain, phase progress and a reason card. SOS, today's mission, check-in and the skill lesson join
 * this page in their own steps (K4, K6, K7, K8).
 */
export default function CampPanel() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const fmtDate = useCampDate();
  const s = useCampStore();
  const premium = useAccess()('camp');
  const cigs = useCampEventsStore((x) => x.cigarettes);
  const cravings = useCampEventsStore((x) => x.cravings);
  const resisted = resistedCount(cravings);
  const { now } = useClock(30_000);
  // A graduated attempt stays on the panel (freedom phase).
  const attempt = campAttempt(s);
  const attemptLogs = attempt ? logsOfAttempt(cigs, attempt.id) : [];
  const checkins = useCampEventsStore((x) => x.checkins);
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
  const phaseInfo = ONB.phases.find((p) => p.id === phase)!;
  const checkin = checkinDue(checkins, phase, now);
  const pd = programDay(attempt, now);
  const lessonId = nextLesson(
    CAMP_SKILLS.lessons,
    s.skills.map((k) => k.lessonId),
    s.profile?.relapseCauses ?? [],
  );
  const lesson = CAMP_SKILLS.lessons.find((l) => l.id === lessonId);
  const mission = missionForDay(
    CAMP_MISSIONS.missions,
    pd.phase,
    pd.day,
    s.missions.map((m) => m.missionId),
  );
  const alert = moodAlert(checkins, now);
  const preparing = phase === 'preparation';
  const onHero = t.colors.primaryText;
  const start = quitStart(attempt);
  const dur = splitDuration(smokeFreeDuration(attempt, cigs, now));
  const total = totalSmokeFreeDays(attempt, cigs, now);
  const hadSlips = slipsOf(attempt, cigs).length > 0;
  const saved = moneySaved(s.prices, profile.perDay, attempt, cigs, now);
  const notSmoked = cigarettesNotSmoked(profile.perDay, attempt, cigs, now);
  const next = preparing ? null : nextHealthMilestone(start, now);
  const nextItem = CAMP_HEALTH.items.find((x) => x.id === (next?.id ?? HEALTH_MILESTONES[0].id))!;
  // Before the quit the tile shows how soon the first gain comes after it (20 minutes).
  const left = remainingUnit(next ? next.remainingMs : HEALTH_MILESTONES[0].afterMs);
  const toNext = daysToNextPhase(attempt, now);
  const reached = preparing ? [] : reachedMilestones(start, now);
  const celebrate = milestoneToCelebrate(reached, s.seenMilestoneIds);
  const celebrateItem = CAMP_HEALTH.items.find((x) => x.id === celebrate);
  // Badges: celebrated one at a time after health gains; closing stores all newly earned ones.
  const freshBadges = celebrate
    ? []
    : newBadges(
        earnedBadges(
          s,
          { cigarettes: cigs, cravings, checkins },
          CAMP_SKILLS.lessons.filter((l) => !l.bonus).map((l) => l.id),
          now,
        ),
        s.badges,
      );
  const badge = CAMP_REWARDS.badges.find((b) => b.id === freshBadges[0]);
  const graduateNow = canGraduate(attempt, now);
  const reason = reasonOfDay(profile.reasons, now);
  const reasonText = reason ? (reason.id === 'custom' ? reason.text : ONB.reasons.find((r) => r.id === reason.id)?.label) : null;
  const reasonEmoji = reason && reason.id !== 'custom' ? ONB.reasons.find((r) => r.id === reason.id)?.emoji : '💬';

  return (
    <Screen>
      <Header
        title={tr('camp.title')}
        onBack={() => goBack('/discover')}
        right={
          <Pressable onPress={() => router.push('/camp/settings')} accessibilityRole="button" accessibilityLabel={tr('camp.settings.title')} hitSlop={10} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="gear" color={t.colors.text} size={22} />
          </Pressable>
        }
      />

      {alert ? <SafetyCard /> : null}

      <CampusHero color={t.colors.primary}>
        <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: t.radius.pill, backgroundColor: 'rgba(255,255,255,0.16)' }}>
          <AppText variant="tiny" weight="800" color={onHero} style={{ letterSpacing: 1 }}>
            {phaseInfo.emoji} {phaseInfo.title.toLocaleUpperCase('tr')} · {tr('camp.panel.attempt', { n: attempt.attemptNo })}
          </AppText>
        </View>
        {preparing ? (
          <View style={{ gap: 2 }} accessible accessibilityLabel={tr('camp.panel.toQuitA11y', { count: -daysSinceQuit(attempt, now), date: fmtDate(attempt.plannedQuitDate) })}>
            <AppText variant="small" weight="700" color={onHero} style={{ opacity: 0.9 }}>
              {tr('camp.panel.toQuit')}
            </AppText>
            <AppText variant="display" color={onHero} style={{ fontSize: 52, lineHeight: 60 }}>
              {tr('camp.panel.days', { count: -daysSinceQuit(attempt, now) })}
            </AppText>
            <AppText weight="700" color={onHero} style={{ opacity: 0.9 }}>
              {fmtDate(attempt.plannedQuitDate)}
            </AppText>
          </View>
        ) : (
          <View style={{ gap: 2 }} accessible accessibilityLabel={tr('camp.panel.freeA11y', { days: dur.days, hours: dur.hours, minutes: dur.minutes })}>
            <AppText variant="small" weight="700" color={onHero} style={{ opacity: 0.9 }}>
              {hadSlips ? tr('camp.panel.sinceLast') : tr('camp.panel.smokeFree')}
            </AppText>
            <AppText variant="display" color={onHero} style={{ fontSize: 52, lineHeight: 60 }}>
              {tr('camp.panel.days', { count: dur.days })}
            </AppText>
            <AppText weight="700" color={onHero} style={{ opacity: 0.9 }}>
              {tr('camp.panel.hoursMinutes', { hours: dur.hours, minutes: dur.minutes })}
            </AppText>
            {hadSlips ? (
              <AppText variant="small" color={onHero} style={{ opacity: 0.85 }}>
                {tr('camp.panel.totalDays', { count: total })}
              </AppText>
            ) : null}
          </View>
        )}
      </CampusHero>

      <View style={{ gap: 6 }}>
        <Button label={tr('camp.sos.panelButton')} icon="wind" variant="accent" size="lg" accessibilityHint={tr('camp.sos.panelHint')} onPress={() => router.push('/camp/sos')} />
        {resisted > 0 ? (
          <AppText variant="small" weight="700" center color={t.colors.success}>
            {tr('camp.sos.resistedCount', { count: resisted })}
          </AppText>
        ) : null}
      </View>

      {phase === 'quit_day' ? (
        <Pressable onPress={() => router.push('/camp/quit-day')} accessibilityRole="button" accessibilityLabel={CAMP_MISSIONS.quitDay.title}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: t.colors.accent }}>
            <AppText variant="h1">🚩</AppText>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="h3" color="#FFFFFF">
                {CAMP_MISSIONS.quitDay.title}
              </AppText>
              <AppText variant="small" color="#FFFFFF" style={{ opacity: 0.92 }}>
                {tr('camp.quitDay.panelHint')}
              </AppText>
            </View>
            <Icon name="chevron" color="#FFFFFF" size={18} />
          </Card>
        </Pressable>
      ) : null}

      {graduateNow || attempt.status === 'graduated' ? (
        <Pressable onPress={() => router.push('/camp/graduation')} accessibilityRole="button" accessibilityLabel={tr(graduateNow ? 'camp.graduation.panelReady' : 'camp.graduation.panelDone')}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: t.colors.accent }}>
            <AppText variant="h1">🎓</AppText>
            <AppText variant="h3" color="#FFFFFF" style={{ flex: 1 }}>
              {tr(graduateNow ? 'camp.graduation.panelReady' : 'camp.graduation.panelDone')}
            </AppText>
            <Icon name="chevron" color="#FFFFFF" size={18} />
          </Card>
        </Pressable>
      ) : null}

      {mission ? (
        <>
          <SectionTitle emoji="🎯" title={tr('camp.mission.title')} />
          {premium || missionIsFree(pd.phase) ? (
            <MissionCard mission={mission} done={s.missions.some((m) => m.missionId === mission.id)} onDone={() => useCampStore.getState().completeMission(mission.id)} />
          ) : (
            <PremiumLock title={tr('camp.premium.mission', { title: mission.title })} />
          )}
        </>
      ) : null}

      {checkin.due ? (
        <Pressable onPress={() => router.push('/camp/checkin')} accessibilityRole="button" accessibilityLabel={tr(`camp.panel.checkin.${checkin.slot}`)}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 2, borderColor: t.colors.primary }}>
            <AppText variant="h2">📋</AppText>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText weight="800">{tr(`camp.panel.checkin.${checkin.slot}`)}</AppText>
              <AppText variant="small" muted>
                {tr('camp.panel.checkinHint')}
              </AppText>
            </View>
            <Icon name="chevron" color={t.colors.textMuted} size={18} />
          </Card>
        </Pressable>
      ) : null}

      {lesson ? (
        <Pressable onPress={() => router.push({ pathname: '/camp/skills/[lessonId]', params: { lessonId: lesson.id } })} accessibilityRole="button" accessibilityLabel={`${tr('camp.skills.today')}: ${lesson.title}`}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: tint(t.colors.primary, '1F') }}>
              <AppText variant="h3">{lesson.emoji}</AppText>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="tiny" weight="800" color={t.colors.primary}>
                {tr('camp.skills.todayKicker', { min: lesson.minutes })}
              </AppText>
              <AppText weight="800">{lesson.title}</AppText>
            </View>
            <Icon name="chevron" color={t.colors.textMuted} size={18} />
          </Card>
        </Pressable>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <StatTile emoji="💰" value={tr('camp.plan.tl', { amount: fmtTL(saved) })} label={tr('camp.panel.saved')} color={t.colors.success} />
        <StatTile emoji="🚭" value={String(notSmoked)} label={tr('camp.panel.notSmoked')} />
        <StatTile emoji={nextItem.emoji} value={tr(`camp.dur.${left.unit}`, { count: left.value })} label={next ? tr('camp.panel.nextGain') : tr('camp.panel.firstGain')} onPress={() => router.push('/camp/health')} />
      </View>
      {preparing ? (
        <AppText variant="small" muted>
          {tr('camp.panel.prepNote')}
        </AppText>
      ) : null}

      {next ? (
        <Pressable onPress={() => router.push('/camp/health')} accessibilityRole="button" accessibilityLabel={`${tr('camp.panel.nextGain')}: ${nextItem.text}`}>
          <Card style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <AppText variant="h2">{nextItem.emoji}</AppText>
              <View style={{ flex: 1 }}>
                <AppText variant="tiny" weight="800" color={t.colors.primary}>
                  {tr('camp.panel.nextAt', { label: nextItem.label })}
                </AppText>
                <AppText weight="700">{nextItem.text}</AppText>
              </View>
              <Icon name="chevron" color={t.colors.textMuted} size={18} />
            </View>
            <ProgressBar value={next.progress} height={6} />
          </Card>
        </Pressable>
      ) : null}

      {preparing ? (
        <>
          <SectionTitle emoji="📝" title={tr('camp.diary.title')} hint={tr('camp.panel.diaryHint')} />
          <Card style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <AppText variant="h1">{todayCount(attemptLogs, now)}</AppText>
              <AppText variant="small" muted style={{ flex: 1 }}>
                {attemptLogs.length >= REPORT_MIN_LOGS ? tr('camp.panel.reportReady') : tr('camp.panel.todayLogged')}
              </AppText>
            </View>
            <Button label={tr('camp.diary.log')} icon="plus" variant="primary" onPress={() => router.push('/camp/log-cigarette')} />
            <Button label={tr('camp.panel.diaryOpen')} variant="ghost" onPress={() => router.push('/camp/diary')} />
          </Card>
        </>
      ) : null}

      <SectionTitle emoji="🗺️" title={tr('camp.panel.phaseTitle')} hint={phaseInfo.text} />
      <Card style={{ gap: 12 }}>
        <PhaseTrack phase={phase} />
        <AppText variant="small" weight="700" center>
          {toNext === null ? tr('camp.panel.lastPhase') : tr('camp.panel.toNextPhase', { count: toNext, phase: ONB.phases[ONB.phases.findIndex((p) => p.id === phase) + 1]?.title ?? '' })}
        </AppText>
      </Card>

      {reasonText ? (
        <>
          <SectionTitle emoji="🎯" title={tr('camp.panel.reasonTitle')} />
          <Card padded={false} style={{ overflow: 'hidden' }}>
            {profile.reasonPhotoUri ? <Image source={{ uri: profile.reasonPhotoUri }} style={{ width: '100%', aspectRatio: 16 / 9 }} accessibilityLabel={tr('camp.onb.reasons.photoAlt')} /> : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: tint(t.colors.accent, '12') }}>
              <AppText variant="h1">{reasonEmoji}</AppText>
              <AppText variant="h3" style={{ flex: 1 }}>
                {reason?.id === 'custom' ? `“${reasonText}”` : reasonText}
              </AppText>
            </View>
          </Card>
        </>
      ) : null}

      <View style={{ gap: 8 }}>
        {!preparing ? <Button label={tr('camp.panel.slip')} icon="flame" variant="ghost" onPress={() => router.push('/camp/slip')} /> : null}
        <Button label={tr('camp.panel.triggersOpen')} icon="compass" variant="secondary" onPress={() => router.push('/camp/triggers')} />
        {!preparing ? <Button label={tr('camp.panel.diaryOpen')} icon="calendar" variant="secondary" onPress={() => router.push('/camp/diary')} /> : null}
        <Button label={tr('camp.support.title')} icon="shield" variant="secondary" onPress={() => router.push('/camp/support')} />
        <Button label={tr('camp.coach.panelButton')} icon="help" variant="secondary" onPress={() => router.push('/camp/coach')} />
        <Button label={tr('camp.skills.title')} icon="book" variant="secondary" onPress={() => router.push('/camp/skills')} />
        <Button label={tr('camp.reasons.title')} icon="star" variant="secondary" onPress={() => router.push('/camp/reasons')} />
        <Button label={tr('camp.library.title')} icon="book" variant="secondary" onPress={() => router.push('/camp/library')} />
        <Button label={tr('camp.stats.title')} icon="chart" variant="secondary" onPress={() => router.push('/camp/stats')} />
        <Button label={tr('camp.rewards.title')} icon="trophy" variant="secondary" onPress={() => router.push('/camp/rewards')} />
        <Button label={tr('camp.panel.healthOpen')} icon="pulse" variant="secondary" onPress={() => router.push('/camp/health')} />
        <Button label={tr('camp.panel.planOpen')} icon="book" variant="secondary" onPress={() => router.push('/camp/plan')} />
      </View>

      <Alo171Card compact />

      {!celebrate && badge ? (
        <CelebrationCard
          celebrationKey={badge.id}
          kicker={tr('camp.rewards.badgeKicker')}
          emoji={badge.emoji}
          title={badge.title}
          desc={badge.desc}
          cta={tr('camp.panel.gainCta')}
          onClose={() => freshBadges.forEach((id) => useCampStore.getState().unlockBadge(id))}
        />
      ) : null}

      {celebrate && celebrateItem ? (
        <CelebrationCard
          celebrationKey={celebrate}
          kicker={tr('camp.panel.gainKicker')}
          emoji={celebrateItem.emoji}
          title={tr('camp.panel.gainTitle', { label: celebrateItem.label })}
          desc={`${celebrateItem.text} ${CAMP_HEALTH.note}`}
          cta={tr('camp.panel.gainCta')}
          onClose={() => useCampStore.getState().markMilestonesSeen(reached)}
        />
      ) : null}
    </Screen>
  );
}
