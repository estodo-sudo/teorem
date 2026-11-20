import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Header, Screen, useTheme } from '@/components';
import { IconTile } from '@/components/ui';
import { ODAK_SKILLS, ODAK_SOURCES } from '@/features/camps/odak/content';
import { quizScore } from '@/features/camps/odak/engine/program';
import { QuickExitButton } from '@/features/camps/odak/privacy/quickExit';
import { useOdakStore } from '@/features/camps/odak/store';
import { tint } from '@/features/campus/shared/ui';
import { StoryPlayer } from '@/features/content/storyPlayer/StoryPlayer';
import { lessonIsFree } from '@/features/camps/odak/engine/premium';
import { OdakLock } from '@/features/camps/odak/ui';
import { useAccess } from '@/features/purchases/useGate';
import { goBack } from '@/lib/nav';

/** One skill lesson (3–5 min): story slides (shared story player) → practice → a short check → sources. */
export default function OdakLesson() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const lesson = ODAK_SKILLS.find((l) => l.id === lessonId);
  const [stage, setStage] = useState<'story' | 'practice' | 'quiz' | 'done'>('story');
  const [answers, setAnswers] = useState<(number | null)[]>(() => (lesson ? lesson.quiz.map(() => null) : []));
  const back = () => goBack('/odak/skills');
  const premium = useAccess()('odak');

  if (!lesson) {
    return (
      <Screen>
        <Header title={tr('odak.skills.title')} onBack={back} right={<QuickExitButton />} />
      </Screen>
    );
  }
  if (!premium && !lessonIsFree(lesson)) {
    return (
      <Screen>
        <Header title={lesson.title} onBack={back} right={<QuickExitButton />} />
        <OdakLock title={tr('odak.premium.lesson')} />
      </Screen>
    );
  }
  if (stage === 'story') return <StoryPlayer title={lesson.title} slides={lesson.slides} onClose={back} onFinish={() => setStage('practice')} endLabel={tr('odak.skills.toPractice')} />;

  const answered = answers.every((a) => a !== null);
  const footer =
    stage === 'practice' ? (
      <Button label={tr('odak.skills.toQuiz')} size="lg" onPress={() => setStage('quiz')} />
    ) : stage === 'quiz' ? (
      <Button
        label={tr('odak.skills.finish')}
        size="lg"
        variant="accent"
        disabled={!answered}
        onPress={() => {
          const score = quizScore(
            answers,
            lesson.quiz.map((q) => q.answer),
          );
          void useOdakStore.getState().completeLesson(lesson.id, score);
          setStage('done');
        }}
      />
    ) : (
      <Button label={tr('odak.skills.backToList')} size="lg" onPress={() => router.replace('/odak/skills')} />
    );

  return (
    <Screen footer={footer}>
      <Header title={lesson.title} onBack={back} right={<QuickExitButton />} />
      {stage === 'practice' ? (
        <>
          <IconTile icon="pen" tone="focus" size="lg" round />
          <AppText variant="h2" center accessibilityRole="header">
            {lesson.practice.title}
          </AppText>
          <Card style={{ backgroundColor: t.tokens.muted, borderColor: t.tokens.muted}}>
            <AppText>{lesson.practice.text}</AppText>
          </Card>
        </>
      ) : (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {stage === 'done' ? tr('odak.skills.doneTitle') : tr('odak.skills.quizTitle')}
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
                      accessibilityLabel={o}
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
                {tr('odak.skills.sources')}
              </AppText>
              {ODAK_SOURCES.filter((s) => lesson.sourceIds.includes(s.id)).map((s) => (
                <Pressable key={s.id} onPress={() => void Linking.openURL(s.url)} accessibilityRole="link" style={{ minHeight: 48, justifyContent: 'center' }}>
                  <AppText variant="small" color={t.colors.primary}>
                    {`${s.org} – ${s.title}`}
                  </AppText>
                </Pressable>
              ))}
            </Card>
          ) : null}
        </>
      )}
    </Screen>
  );
}
