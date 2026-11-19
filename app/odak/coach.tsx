import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, View, type ScrollViewInstance } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Card, Header, Screen, useTheme } from '@/components';
import type { CoachReply, CoachScenario } from '@/features/camps/core/coachEngine';
import { ODAK_COACH, ODAK_ONBOARDING as ONB } from '@/features/camps/odak/content';
import { ACTION_ROUTES, odakNodeText, parseOdakAction, type OdakCoachVars } from '@/features/camps/odak/engine/coach';
import { goalCounters } from '@/features/camps/odak/engine/goals';
import { managedCount } from '@/features/camps/odak/engine/sos';
import { QuickExitButton } from '@/features/camps/odak/privacy/quickExit';
import { useOdakStore } from '@/features/camps/odak/store';
import { tint } from '@/features/campus/shared/ui';
import { scenarioIsFree } from '@/features/camps/odak/engine/premium';
import { useAccess } from '@/features/purchases/useGate';
import { goBack } from '@/lib/nav';

type Msg = { from: 'coach' | 'me'; text: string };
const TYPING_MS = 650;

/**
 * Koç (SPEC_ODAK_KAMPI 5.10): pre-written, rule-based conversations (no AI, no server). Pick a topic,
 * answer with buttons; some answers open a camp tool (SOS, slip flow, a lesson, a story, 115…).
 */
export default function OdakCoach() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const params = useLocalSearchParams<{ scenario?: string }>();
  const premium = useAccess()('odak');
  const { goal, events, urges, profile } = useOdakStore();
  const initial = ODAK_COACH.scenarios.find((s) => s.id === params.scenario) ?? null;
  const [scenario, setScenario] = useState<CoachScenario | null>(initial);
  const [nodeId, setNodeId] = useState<string | null>(initial?.start ?? null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(Boolean(initial));
  const scroll = useRef<ScrollViewInstance>(null);

  const now = new Date();
  const counters = goal ? goalCounters(goal, events, now) : [];
  const card = ONB.values.cards.find((c) => profile?.values.includes(c.id));
  const vars: OdakCoachVars = {
    days: counters.length ? Math.max(...counters.map((c) => c.current)) : 0,
    value: profile?.valuesText?.trim() || card?.label || tr('odak.coach.noValue'),
    managed: managedCount(urges),
  };
  const node = scenario && nodeId ? scenario.nodes[nodeId] : undefined;

  // Show the coach's message after a short "typing" pause (set in the timer, not the effect body).
  useEffect(() => {
    if (!typing || !node) return;
    const id = setTimeout(() => {
      setMsgs((m) => [...m, { from: 'coach', text: odakNodeText(node, vars) }]);
      setTyping(false);
    }, TYPING_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typing, nodeId]);

  const start = (s: CoachScenario) => {
    setScenario(s);
    setNodeId(s.start);
    setMsgs((m) => [...m, { from: 'me', text: s.title }]);
    setTyping(true);
  };

  const choose = (r: CoachReply) => {
    setMsgs((m) => [...m, { from: 'me', text: r.label }]);
    if (r.next) {
      setNodeId(r.next);
      setTyping(true);
      return;
    }
    const a = r.action ? parseOdakAction(r.action) : null;
    setScenario(null);
    setNodeId(null);
    if (!a || a.kind === 'end') {
      setMsgs((m) => [...m, { from: 'coach', text: tr('odak.coach.bye') }]);
      return;
    }
    if (a.kind === 'call115' || a.kind === 'call112') void Linking.openURL(a.kind === 'call115' ? 'tel:115' : 'tel:112');
    else if (a.kind === 'skill') router.push({ pathname: '/odak/skills/[lessonId]', params: { lessonId: a.id } });
    else if (a.kind === 'library') router.push({ pathname: '/odak/library/[storyId]', params: { storyId: a.id } });
    else router.push(ACTION_ROUTES[a.kind]);
    setMsgs((m) => [...m, { from: 'coach', text: tr('odak.coach.opened') }]);
  };

  const bubble = (m: Msg, i: number) => {
    const mine = m.from === 'me';
    return (
      <View key={i} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '86%', flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
        {!mine ? <AppText>🧑‍🏫</AppText> : null}
        <View
          style={{
            flexShrink: 1,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 18,
            borderBottomLeftRadius: mine ? 18 : 4,
            borderBottomRightRadius: mine ? 4 : 18,
            backgroundColor: mine ? t.colors.primary : t.colors.surface,
            borderWidth: mine ? 0 : 1,
            borderColor: t.colors.border,
          }}
        >
          <AppText color={mine ? t.colors.primaryText : t.colors.text}>{m.text}</AppText>
        </View>
      </View>
    );
  };

  const choice = (label: string, onPress: () => void, key: string) => (
    <Pressable
      key={key}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        minHeight: 48,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: t.radius.pill,
        borderWidth: 1.5,
        borderColor: t.colors.primary,
        backgroundColor: tint(t.colors.primary, '12'),
        justifyContent: 'center',
        alignSelf: 'flex-end',
        maxWidth: '92%',
      }}
    >
      <AppText weight="700" color={t.colors.primary}>
        {label}
      </AppText>
    </Pressable>
  );

  return (
    <Screen scroll={false}>
      <Header title={tr('odak.coach.title')} onBack={() => goBack('/odak')} right={<QuickExitButton />} />
      <Card style={{ paddingVertical: 8, backgroundColor: tint(t.colors.warning, '14') }}>
        <AppText variant="tiny">ℹ️ {ODAK_COACH.disclaimer}</AppText>
      </Card>
      <ScrollView ref={scroll} contentContainerStyle={{ gap: 10, paddingVertical: 8 }} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })} accessibilityLiveRegion="polite">
        {msgs.length === 0 && !scenario ? bubble({ from: 'coach', text: tr('odak.coach.hello') }, -1) : null}
        {msgs.map(bubble)}
        {typing ? (
          <AppText variant="small" muted>
            🧑‍🏫 {tr('odak.coach.typing')}
          </AppText>
        ) : null}
        {!typing && node ? node.replies.map((r, i) => choice(r.label, () => choose(r), `${nodeId}-${i}`)) : null}
        {!typing && !scenario ? (
          <View style={{ gap: 8, marginTop: 4 }}>
            <AppText variant="small" weight="800" muted>
              {msgs.length ? tr('odak.coach.another') : tr('odak.coach.pick')}
            </AppText>
            {ODAK_COACH.scenarios.map((s) => (premium || scenarioIsFree(s.id) ? choice(`${s.emoji} ${s.title}`, () => start(s), s.id) : choice(`🔒 ${s.title}`, () => router.push({ pathname: '/paywall', params: { source: 'odak' } }), s.id)))}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
