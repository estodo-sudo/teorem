import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Card, Header, Icon, ProgressBar, Screen, useTheme } from '@/components';
import { IconTile } from '@/components/ui';
import { COURSES } from '@/features/content/data';
import { useProgressStore } from '@/stores/progressStore';

export default function CourseScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const course = COURSES.find((c) => c.id === courseId);
  const progress = useProgressStore((s) => (courseId ? s.content.courseProgress[courseId] : undefined));
  if (!course) {
    return (
      <Screen>
        <Header />
        <AppText>{tr('courses.notFound')}</AppText>
      </Screen>
    );
  }
  const done = progress?.completedLessonIds ?? [];
  const complete = course.lessons.every((l) => done.includes(l.id));
  const nextIdx = course.lessons.findIndex((l) => !done.includes(l.id));

  return (
    <Screen>
      <Header title={course.title} />
      <View style={{ alignItems: 'center', gap: 6 }}>
        <IconTile icon={course.icon} tone="knowledge" size="lg" round />
        <AppText muted center>
          {course.description}
        </AppText>
      </View>
      <ProgressBar value={done.length / course.lessons.length} accessibilityLabel={tr('courses.progress', { done: done.length, total: course.lessons.length })} />
      <AppText variant="small" muted center>
        {tr('courses.progress', { done: done.length, total: course.lessons.length })}
      </AppText>
      {complete ? (
        <Card style={{ alignItems: 'center', gap: t.space.xs, borderColor: t.colors.accent }}>
          <IconTile icon="medal" tone="knowledge" size="lg" round />
          <AppText weight="800">{tr('courses.badge')}</AppText>
          <AppText variant="small" muted center>
            {tr('courses.badgeBody')}
          </AppText>
        </Card>
      ) : null}
      {course.lessons.map((l, i) => {
        const isDone = done.includes(l.id);
        const score = progress?.quizScores[l.id];
        return (
          <Card
            key={l.id}
            onPress={() => router.push({ pathname: '/course/[courseId]/[lessonId]', params: { courseId: course.id, lessonId: l.id } })}
            accessibilityLabel={`${i + 1}. ${l.title}${isDone ? `, ${tr('courses.completed')}` : ''}`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md, borderColor: i === nextIdx ? t.colors.accent : t.colors.border }}
          >
            <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: isDone ? t.colors.success : t.colors.surfaceAlt }}>
              {isDone ? <Icon name="check" color={t.tokens.primaryForeground} size={20} strokeWidth={3} /> : <AppText weight="800">{i + 1}</AppText>}
            </View>
            <View style={{ flex: 1 }}>
              <AppText weight="700">{l.title}</AppText>
              <AppText variant="small" muted>
                {isDone && score !== undefined ? tr('courses.score', { pct: Math.round(score * 100) }) : tr('courses.lessonMeta', { slides: l.slides.length, q: l.quiz.length })}
              </AppText>
            </View>
            <Icon name="chevron" color={t.colors.textMuted} size={18} />
          </Card>
        );
      })}
    </Screen>
  );
}
