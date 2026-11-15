import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, ChoiceCard, Header, ProgressBar, Screen, useTheme } from '@/components';
import { COURSES } from '@/features/content/data';
import { quizScore } from '@/features/content/daily';
import { StoryPlayer } from '@/features/content/storyPlayer/StoryPlayer';
import { checkAchievements } from '@/features/gamification/service';
import { useProgressStore } from '@/stores/progressStore';

export default function LessonScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { courseId, lessonId } = useLocalSearchParams<{ courseId: string; lessonId: string }>();
  const course = COURSES.find((c) => c.id === courseId);
  const lesson = course?.lessons.find((l) => l.id === lessonId);
  const [stage, setStage] = useState<'slides' | 'quiz' | 'result'>('slides');
  const [qi, setQi] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [revealed, setRevealed] = useState(false);
  const close = () => router.back();

  if (!course || !lesson) {
    return (
      <Screen>
        <Header />
        <AppText>{tr('courses.notFound')}</AppText>
      </Screen>
    );
  }

  if (stage === 'slides') {
    return <StoryPlayer title={lesson.title} slides={lesson.slides} onClose={close} endLabel={tr('courses.toQuiz')} onFinish={() => setStage('quiz')} />;
  }

  const correct = lesson.quiz.map((q) => q.answer);

  if (stage === 'result') {
    const score = quizScore(answers, correct);
    return (
      <Screen footer={<Button label={tr('common.continue')} size="lg" variant="accent" onPress={close} />}>
        <View style={{ alignItems: 'center', gap: 10, marginTop: 40 }}>
          <AppText variant="display">{score === 1 ? '🏆' : score >= 0.5 ? '👏' : '📖'}</AppText>
          <AppText variant="h1" center>
            {tr('courses.resultTitle', { correct: Math.round(score * correct.length), total: correct.length })}
          </AppText>
          <AppText muted center>
            {tr('courses.resultBody')}
          </AppText>
        </View>
        <Card style={{ gap: 6 }}>
          <AppText weight="700">{tr('stories.sources')}</AppText>
          {lesson.sources.map((s) => (
            <AppText key={s.url} variant="small" muted>
              {s.title}
            </AppText>
          ))}
        </Card>
      </Screen>
    );
  }

  const q = lesson.quiz[qi]!;
  const picked = answers[qi] ?? null;
  const next = () => {
    setRevealed(false);
    if (qi + 1 < lesson.quiz.length) setQi(qi + 1);
    else {
      useProgressStore.getState().completeLesson(course.id, lesson.id, quizScore(answers, correct));
      checkAchievements();
      setStage('result');
    }
  };

  return (
    <Screen
      footer={
        revealed ? (
          <Button label={qi + 1 < lesson.quiz.length ? tr('common.next') : tr('courses.finish')} size="lg" variant="accent" onPress={next} />
        ) : (
          <Button label={tr('courses.check')} size="lg" variant="accent" disabled={picked === null} onPress={() => setRevealed(true)} />
        )
      }
    >
      <Header title={tr('courses.quizTitle')} close />
      <ProgressBar value={(qi + 1) / lesson.quiz.length} accessibilityLabel={tr('courses.question', { n: qi + 1, total: lesson.quiz.length })} />
      <AppText variant="small" muted>
        {tr('courses.question', { n: qi + 1, total: lesson.quiz.length })}
      </AppText>
      <AppText variant="h2">{q.q}</AppText>
      <View style={{ gap: 10 }}>
        {q.options.map((o, i) => (
          <ChoiceCard
            key={o}
            label={o}
            emoji={revealed ? (i === q.answer ? '✅' : i === picked ? '❌' : undefined) : undefined}
            selected={picked === i}
            onPress={() => {
              if (revealed) return;
              const a = [...answers];
              a[qi] = i;
              setAnswers(a);
            }}
          />
        ))}
      </View>
      {revealed ? (
        <Card style={{ borderColor: picked === q.answer ? t.colors.success : t.colors.warning }}>
          <AppText weight="700">{picked === q.answer ? tr('courses.correct') : tr('courses.wrong')}</AppText>
          {q.explain ? <AppText muted>{q.explain}</AppText> : null}
        </Card>
      ) : null}
    </Screen>
  );
}
