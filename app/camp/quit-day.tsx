import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Header, Icon, ProgressBar, Screen, useTheme } from '@/components';
import { IconTile } from '@/components/ui';
import { CAMP_MISSIONS } from '@/features/camps/smoking/content';
import { currentAttempt } from '@/features/camps/smoking/state';
import { Alo171Card, useCampDate } from '@/features/camps/smoking/ui';
import { CampusHero, tint } from '@/features/campus/shared/ui';
import { goBack } from '@/lib/nav';
import { useCampStore } from '@/stores/campStore';

const QD = CAMP_MISSIONS.quitDay;

/** Quit day: the "not a single puff" rule, a checklist (kept per attempt) and quick help. */
export default function CampQuitDay() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const fmtDate = useCampDate();
  const camp = useCampStore();
  const attempt = currentAttempt(camp);
  const done = attempt && camp.quitDayChecks?.attemptId === attempt.id ? camp.quitDayChecks.ids : [];
  const count = QD.checklist.filter((c) => done.includes(c.id)).length;
  const all = count === QD.checklist.length;

  return (
    <Screen>
      <Header title={tr('camp.quitDay.title')} onBack={() => goBack('/camp')} />
      <CampusHero color={t.colors.accent}>
        <IconTile icon="flag" tone="smokefree" size="lg" round />
        <AppText variant="h1" center color={t.tokens.primaryForeground} accessibilityRole="header">
          {QD.title}
        </AppText>
        <AppText center color={t.tokens.primaryForeground} style={{ opacity: 0.92 }}>
          {attempt?.status === 'preparing' ? tr('camp.quitDay.upcoming', { date: fmtDate(attempt.plannedQuitDate) }) : QD.intro}
        </AppText>
      </CampusHero>

      <Card style={{ gap: 6, borderWidth: 2, borderColor: t.colors.border, backgroundColor: tint(t.colors.accent, '12') }}>
        <AppText variant="h2" color={t.colors.accent} center>
          {QD.rule}
        </AppText>
        <AppText center>{QD.ruleText}</AppText>
      </Card>

      <Button label={tr('camp.sos.panelButton')} icon="wind" variant="accent" size="lg" onPress={() => router.push('/camp/sos')} />

      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <AppText variant="h3">{tr('camp.quitDay.checklist')}</AppText>
          <AppText variant="small" weight="800" color={all ? t.colors.success : t.colors.textMuted}>
            {count}/{QD.checklist.length}
          </AppText>
        </View>
        <ProgressBar value={count / QD.checklist.length} height={6} />
      </View>
      <View style={{ gap: t.space.sm }}>
        {QD.checklist.map((c) => {
          const on = done.includes(c.id);
          return (
            <Pressable
              key={c.id}
              disabled={!attempt}
              onPress={() => attempt && useCampStore.getState().toggleQuitDayCheck(attempt.id, c.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              style={{
                flexDirection: 'row',
                gap: t.space.md,
                alignItems: 'center',
                padding: 14,
                borderRadius: t.radius.lg,
                borderWidth: 1.5,
                borderColor: on ? t.colors.success : t.colors.border,
                backgroundColor: on ? tint(t.colors.success, '14') : t.colors.surface,
              }}
            >
              <View style={{ width: 28, height: 28, borderRadius: t.radius.sm, borderWidth: 2, borderColor: on ? t.colors.success : t.colors.border, backgroundColor: on ? t.colors.success : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                {on ? <Icon name="check" color={t.tokens.primaryForeground} size={16} strokeWidth={3} /> : null}
              </View>
              <AppText weight="700" style={{ flex: 1 }}>
                {c.text}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      {all ? (
        <Card style={{ backgroundColor: t.tokens.muted, borderColor: t.tokens.muted}}>
          <AppText weight="800" color={t.colors.success}>
            {tr('camp.quitDay.ready')}
          </AppText>
        </Card>
      ) : null}

      <AppText muted>{QD.after}</AppText>
      <Button label={tr('camp.panel.triggersOpen')} icon="compass" variant="secondary" onPress={() => router.push('/camp/triggers')} />
      <Alo171Card compact />
    </Screen>
  );
}
