import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Card, Header, Icon, ProgressBar, Screen, useTheme } from '@/components';
import { CAMP_SKILLS } from '@/features/camps/smoking/content';
import { lessonIsFree } from '@/features/camps/smoking/engine/premium';
import { lessonStatuses, recommendedLessons } from '@/features/camps/smoking/engine/skills';
import { useAccess } from '@/features/purchases/useGate';
import { tint } from '@/features/campus/shared/ui';
import { goBack } from '@/lib/nav';
import { useCampStore } from '@/stores/campStore';

/** ACT skill lessons: open one after another; ones tied to earlier relapse causes come forward. */
export default function CampSkills() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const camp = useCampStore();
  const premium = useAccess()('camp');
  const done = camp.skills.map((s) => s.lessonId);
  const causes = camp.profile?.relapseCauses ?? [];
  const st = lessonStatuses(CAMP_SKILLS.lessons, done, causes);
  const rec = recommendedLessons(CAMP_SKILLS.lessons, done, causes);
  const total = CAMP_SKILLS.lessons.length;
  const count = CAMP_SKILLS.lessons.filter((l) => st[l.id] === 'done').length;

  return (
    <Screen>
      <Header title={tr('camp.skills.title')} onBack={() => goBack('/camp')} />
      <AppText muted>{tr('camp.skills.intro')}</AppText>
      <View style={{ gap: 6 }}>
        <AppText variant="small" weight="800">
          {tr('camp.skills.progress', { done: count, total })}
        </AppText>
        <ProgressBar value={count / total} height={6} />
      </View>
      {CAMP_SKILLS.lessons.map((l) => {
        const s = st[l.id] ?? 'locked';
        const locked = s === 'locked';
        const paid = !premium && !lessonIsFree(l.order, l.bonus);
        const isRec = rec.includes(l.id);
        const kicker = (l.bonus ? tr('camp.skills.bonus') : tr('camp.skills.lessonN', { n: l.order })) + (isRec ? ` · ${tr('camp.skills.recommended')}` : '') + (paid ? ` · ${tr('camp.premium.badge')}` : '');
        return (
          <Pressable
            key={l.id}
            disabled={locked}
            onPress={() => (paid ? router.push({ pathname: '/paywall', params: { source: 'camp' } }) : router.push({ pathname: '/camp/skills/[lessonId]', params: { lessonId: l.id } }))}
            accessibilityRole="button"
            accessibilityState={{ disabled: locked }}
            accessibilityLabel={`${l.title}. ${tr(`camp.skills.status.${s}`)}`}
          >
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, opacity: locked ? 0.55 : 1, borderWidth: isRec ? 2 : 1, borderColor: isRec ? t.colors.accent : t.colors.border }}>
              <View style={{ width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: s === 'done' ? t.colors.success : tint(t.colors.primary, '1F') }}>
                {s === 'done' ? <Icon name="check" color="#FFFFFF" size={22} strokeWidth={3} /> : <AppText variant="h3">{l.emoji}</AppText>}
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="tiny" weight="800" color={isRec ? t.colors.accent : t.colors.textMuted}>
                  {kicker}
                </AppText>
                <AppText weight="800">{l.title}</AppText>
                <AppText variant="small" muted>
                  {l.summary}
                </AppText>
              </View>
              <Icon name={locked || paid ? 'lock' : 'chevron'} color={t.colors.textMuted} size={18} />
            </Card>
          </Pressable>
        );
      })}
    </Screen>
  );
}
