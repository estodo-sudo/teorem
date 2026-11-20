import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Header, Screen, useTheme } from '@/components';
import { IconTile } from '@/components/ui';
import { CAMP_SKILLS, campSources } from '@/features/camps/smoking/content';
import { lessonIsFree } from '@/features/camps/smoking/engine/premium';
import { quizScore } from '@/features/camps/smoking/engine/skills';
import { PremiumLock } from '@/features/camps/smoking/ui';
import { useAccess } from '@/features/purchases/useGate';
import { tint } from '@/features/campus/shared/ui';
import { StoryPlayer } from '@/features/content/storyPlayer/StoryPlayer';
import { goBack } from '@/lib/nav';
import { useCampStore } from '@/stores/campStore';

type Stage = 'story' | 'practice' | 'quiz' | 'done';

/** One ACT lesson: story slides (shared story player) → one practice → a short check → done. */
export default function CampLesson() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const lesson = CAMP_SKILLS.lessons.find((l) => l.id === lessonId);
  const [stage, setStage] = useState<Stage>('story');
  const [answers, setAnswers] = useState<(number | null)[]>(() => (lesson ? lesson.quiz.map(() => null) : []));
  const back = () => goBack('/camp/skills');
  const premium = useAccess()('camp');

  if (!lesson) {
    return (
      <Screen>
        <Header title={tr('camp.skills.title')} onBack={back} />
        <AppText muted>{tr('camp.skills.notFound')}</AppText>
      </Screen>
    );
  }
  if (!premium && !lessonIsFree(lesson.order, lesson.bonus)) {
    return (
      <Screen>
        <Header title={lesson.title} onBack={back} />
        <PremiumLock title={tr('camp.premium.lesson', { title: lesson.title })} />
      </Screen>
    );
  }
  if (stage === 'story') return <StoryPlayer title={lesson.title} slides={lesson.slides} onClose={back} onFinish={() => setStage('practice')} endLabel={tr('camp.skills.toPractice')} />;

  const answered = answers.every((a) => a !== null);
  const score = quizScore(
    answers.map((a) => a ?? -1),
    lesson.quiz.map((q) => q.answer),
  );

  const footer =
    stage === 'practice' ? (
      <Button label={tr('camp.skills.toQuiz')} size="lg" variant="primary" onPress={() => setStage('quiz')} />
    ) : stage === 'quiz' ? (
      <Button
        label={tr('camp.skills.finish')}
        size="lg"
        variant="accent"
        disabled={!answered}
        onPress={() => {
          useCampStore.getState().completeSkill(lesson.id, score);
          setStage('done');
        }}
      />
    ) : (
      <Button label={tr('camp.skills.backToList')} size="lg" variant="primary" onPress={() => router.replace('/camp/skills')} />
    );

  return (
    <Screen footer={footer}>
      <Header title={lesson.title} onBack={back} />
      {stage === 'practice' ? (
        <>
          <IconTile icon="pen" tone="smokefree" size="lg" round />
          <AppText variant="h2" center accessibilityRole="header">
            {lesson.practice.title}
          </AppText>
          <Card style={{ backgroundColor: t.tokens.muted, borderColor: t.tokens.muted}}>
            <AppText>{lesson.practice.text}</AppText>
          </Card>
        </>
      ) : null}

      {stage === 'quiz' || stage === 'done' ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {stage === 'done' ? tr('camp.skills.doneTitle') : tr('camp.skills.quizTitle')}
          </AppText>
          {lesson.quiz.map((q, qi) => {
            const chosen = answers[qi] ?? null;
            return (
              <Card key={q.q} style={{ gap: 10 }}>
                <AppText weight="800">{q.q}</AppText>
                {q.options.map((o, oi) => {
                  const picked = chosen === oi;
                  const right = chosen !== null && oi === q.answer;
                  const wrong = picked && oi !== q.answer;
                  return (
                    <Pressable
                      key={o}
                      disabled={chosen !== null}
                      onPress={() => setAnswers((a) => a.map((x, i) => (i === qi ? oi : x)))}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: picked }}
                      style={{
                        minHeight: 48,
                        padding: t.space.md,
                        borderRadius: t.radius.md,
                        borderWidth: 2,
                        borderColor: right ? t.colors.success : wrong ? t.colors.warning : t.colors.border,
                        backgroundColor: right ? tint(t.colors.success, '14') : t.colors.surface,
                        justifyContent: 'center',
                      }}
                    >
                      <AppText weight="700">{right ? `✓ ${o}` : o}</AppText>
                    </Pressable>
                  );
                })}
                {chosen !== null ? (
                  <AppText variant="small" muted accessibilityLiveRegion="polite">
                    {q.explain}
                  </AppText>
                ) : null}
              </Card>
            );
          })}
          {stage === 'done' ? (
            <Card style={{ gap: 6 }}>
              <AppText variant="small" weight="700" muted>
                {tr('camp.skills.sources')}
              </AppText>
              {campSources(lesson.sourceIds).map((s) => (
                <Pressable key={s.id} onPress={() => void Linking.openURL(s.url)} accessibilityRole="link">
                  <AppText variant="small" color={t.colors.primary}>
                    {`${s.org} – ${s.title}`}
                  </AppText>
                </Pressable>
              ))}
            </Card>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}
