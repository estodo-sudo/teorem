import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, View, type ScrollViewInstance } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Card, Header, Screen, useTheme } from '@/components';
import { CAMP_COACH, CAMP_ONBOARDING as ONB } from '@/features/camps/smoking/content';
import { nodeText, parseAction, type CoachReply, type CoachScenario, type CoachVars } from '@/features/camps/smoking/engine/coach';
import { totalSmokeFreeDays } from '@/features/camps/smoking/engine/counters';
import { isMinor, MEDICATION_SCENARIOS, scenarioIsFree } from '@/features/camps/smoking/engine/premium';
import { useAccess } from '@/features/purchases/useGate';
import { currentPhase } from '@/features/camps/smoking/engine/phase';
import { moneySaved } from '@/features/camps/smoking/engine/savings';
import { campAttempt } from '@/features/camps/smoking/state';
import { fmtTL } from '@/features/camps/smoking/ui';
import { tint } from '@/features/campus/shared/ui';
import { goBack } from '@/lib/nav';
import { useCampEventsStore, useCampStore } from '@/stores/campStore';

type Msg = { from: 'coach' | 'me'; text: string };
const TYPING_MS = 650;

/**
 * Koç: pre-written, rule-based support conversations (no AI, no server). Pick a topic, answer with
 * buttons; some answers open a camp tool (SOS, slip flow, a lesson, ALO 171…).
 */
export default function CampCoach() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const params = useLocalSearchParams<{ scenario?: string }>();
  const camp = useCampStore();
  const cigs = useCampEventsStore((s) => s.cigarettes);
  const [now] = useState(() => new Date());
  const premium = useAccess()('camp');
  const minor = isMinor(camp.profile?.ageRange);
  const found = CAMP_COACH.scenarios.find((s) => s.id === params.scenario) ?? null;
  const initial = found && (premium || scenarioIsFree(found.id)) ? found : null;
  const [scenario, setScenario] = useState<CoachScenario | null>(initial);
  const [nodeId, setNodeId] = useState<string | null>(initial?.start ?? null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(Boolean(initial));
  const scroll = useRef<ScrollViewInstance>(null);

  const attempt = campAttempt(camp);
  const phase = attempt ? currentPhase(attempt, now) : null;
  const reason = camp.profile?.reasons[0];
  const vars: CoachVars = {
    days: attempt ? totalSmokeFreeDays(attempt, cigs, now) : 0,
    reason: reason ? (reason.id === 'custom' ? (reason.text ?? '') : (ONB.reasons.find((r) => r.id === reason.id)?.label ?? '')) : tr('camp.coach.noReason'),
    phase: ONB.phases.find((p) => p.id === phase)?.title ?? '',
    saved: fmtTL(attempt && camp.profile ? moneySaved(camp.prices, camp.profile.perDay, attempt, cigs, now) : 0),
    supporter: camp.profile?.supporterName ?? tr('camp.coach.yourSupporter'),
  };
  const node = scenario && nodeId ? scenario.nodes[nodeId] : undefined;

  // Show the coach's message after a short "typing" pause (set in the timer, not the effect body).
  useEffect(() => {
    if (!typing || !node) return;
    const id = setTimeout(() => {
      setMsgs((m) => [...m, { from: 'coach', text: nodeText(node, phase, vars) }]);
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
    const a = r.action ? parseAction(r.action) : null;
    setScenario(null);
    setNodeId(null);
    if (!a || a.kind === 'end') {
      setMsgs((m) => [...m, { from: 'coach', text: tr('camp.coach.bye') }]);
      return;
    }
    if (a.kind === 'call171') void Linking.openURL('tel:171');
    else if (a.kind === 'skill') router.push({ pathname: '/camp/skills/[lessonId]', params: { lessonId: a.id } });
    else if (a.kind === 'library') router.push({ pathname: '/camp/library/[storyId]', params: { storyId: a.id } });
    else router.push(a.kind === 'sos' ? '/camp/sos' : a.kind === 'slip' ? '/camp/slip' : a.kind === 'triggers' ? '/camp/triggers' : a.kind === 'checkin' ? '/camp/checkin' : '/camp/reasons');
    setMsgs((m) => [...m, { from: 'coach', text: tr('camp.coach.opened') }]);
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
      <Header title={tr('camp.coach.title')} onBack={() => goBack('/camp')} />
      <Card style={{ paddingVertical: 8, backgroundColor: tint(t.colors.warning, '14') }}>
        <AppText variant="tiny">ℹ️ {CAMP_COACH.disclaimer}</AppText>
      </Card>
      <ScrollView ref={scroll} contentContainerStyle={{ gap: 10, paddingVertical: 8 }} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })} accessibilityLiveRegion="polite">
        {msgs.length === 0 && !scenario ? bubble({ from: 'coach', text: tr('camp.coach.hello') }, -1) : null}
        {msgs.map(bubble)}
        {typing ? (
          <AppText variant="small" muted>
            🧑‍🏫 {tr('camp.coach.typing')}
          </AppText>
        ) : null}
        {!typing && node ? node.replies.map((r, i) => choice(r.label, () => choose(r), `${nodeId}-${i}`)) : null}
        {!typing && !scenario ? (
          <View style={{ gap: 8, marginTop: 4 }}>
            <AppText variant="small" weight="800" muted>
              {msgs.length ? tr('camp.coach.another') : tr('camp.coach.pick')}
            </AppText>
            {CAMP_COACH.scenarios
              .filter((s) => !(minor && MEDICATION_SCENARIOS.includes(s.id)))
              .map((s) => (premium || scenarioIsFree(s.id) ? choice(`${s.emoji} ${s.title}`, () => start(s), s.id) : choice(`🔒 ${s.title}`, () => router.push({ pathname: '/paywall', params: { source: 'camp' } }), s.id)))}
            {choice(`📞 ${tr('camp.ui.call171')}`, () => void Linking.openURL('tel:171'), 'alo')}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
