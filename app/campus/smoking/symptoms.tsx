import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Header, Icon, Screen, useTheme } from '@/components';
import { SMOKING, type WithdrawalSymptom } from '@/features/campus/smoking/content';
import { symptomCounts } from '@/features/campus/smoking/logic';
import { useCampusStore } from '@/stores/campusStore';

/** "Bu süreçte neler yaşanabilir?" — withdrawal timeline and loggable symptoms. */
export default function SmokingSymptomsScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const logs = useCampusStore((s) => s.smoking.symptomLogs);
  const counts = symptomCounts(logs);
  const [openId, setOpenId] = useState<string | null>(null);
  const w = SMOKING.withdrawal;

  return (
    <Screen>
      <Header title={tr('smoking.symptoms.title')} />
      <Card style={{ flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: t.colors.surfaceAlt, borderColor: t.colors.surfaceAlt }}>
        <AppText variant="h1">🌱</AppText>
        <AppText variant="small" style={{ flex: 1 }}>
          {w.intro}
        </AppText>
      </Card>

      <Card style={{ gap: 4 }}>
        <AppText variant="h3" style={{ marginBottom: 8 }}>
          {tr('smoking.symptoms.timelineTitle')}
        </AppText>
        {w.timeline.map((x, i) => {
          const last = i === w.timeline.length - 1;
          const tint = x.level >= 3 ? t.colors.accent : x.level === 2 ? t.colors.warning : t.colors.success;
          return (
            <View key={x.id} style={{ flexDirection: 'row', gap: 12 }} accessible accessibilityLabel={`${x.label}, ${tr(`smoking.symptoms.level.${x.level}`)}: ${x.text}`}>
              <View style={{ alignItems: 'center', width: 22 }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: tint, alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.colors.surface }} />
                </View>
                {!last ? <View style={{ flex: 1, width: 2, marginVertical: 4, backgroundColor: t.colors.border }} /> : null}
              </View>
              <View style={{ flex: 1, gap: 4, paddingBottom: last ? 0 : 18 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <AppText weight="800">{x.label}</AppText>
                  <View style={{ flexDirection: 'row', gap: 3, alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: t.radius.pill, backgroundColor: t.colors.surfaceAlt }}>
                    {[1, 2, 3].map((n) => (
                      <View key={n} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: n <= x.level ? tint : t.colors.border }} />
                    ))}
                    <AppText variant="tiny" weight="700" style={{ marginLeft: 3 }}>
                      {tr(`smoking.symptoms.level.${x.level}`)}
                    </AppText>
                  </View>
                </View>
                <AppText variant="small" muted>
                  {x.text}
                </AppText>
              </View>
            </View>
          );
        })}
        <View style={{ marginTop: 10, padding: 10, borderRadius: t.radius.md, backgroundColor: t.colors.surfaceAlt }}>
          <AppText variant="tiny" muted>
            {w.note}
          </AppText>
        </View>
      </Card>

      <View style={{ gap: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText variant="h3">{tr('smoking.symptoms.listTitle')}</AppText>
          {logs.length ? <AppText muted>{tr('smoking.symptoms.total', { count: logs.length })}</AppText> : null}
        </View>
        <AppText variant="small" muted>
          {tr('smoking.symptoms.listHint')}
        </AppText>
      </View>

      {w.symptoms.map((x) => (
        <SymptomCard key={x.id} symptom={x} count={counts[x.id] ?? 0} open={openId === x.id} onToggle={() => setOpenId((cur) => (cur === x.id ? null : x.id))} />
      ))}

      <Button label={tr('smoking.symptoms.cravingLink')} icon="wind" variant="secondary" onPress={() => router.push('/campus/smoking/craving')} />
      <AppText variant="tiny" muted>
        {tr('smoking.home.disclaimer')}
      </AppText>
    </Screen>
  );
}

function SymptomCard({ symptom: x, count, open, onToggle }: { symptom: WithdrawalSymptom; count: number; open: boolean; onToggle: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const logged = count > 0;
  return (
    <Card padded={false} style={{ overflow: 'hidden', borderColor: open ? t.colors.primary : t.colors.border, borderWidth: open ? 2 : 1 }}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${x.title}, ${logged ? tr('smoking.symptoms.count', { count }) : tr('smoking.symptoms.countNone')}`}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, minHeight: t.touch }}
      >
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
          <AppText variant="h3">{x.emoji}</AppText>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText weight="800">{x.title}</AppText>
          <AppText variant="small" muted numberOfLines={open ? undefined : 1}>
            {x.summary}
          </AppText>
        </View>
        <View
          style={{
            minWidth: 44,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: t.radius.pill,
            alignItems: 'center',
            backgroundColor: logged ? t.colors.accent : t.colors.surfaceAlt,
          }}
        >
          <AppText variant="tiny" weight="800" color={logged ? t.colors.accentText : t.colors.textMuted}>
            {logged ? tr('smoking.symptoms.count', { count }) : '0'}
          </AppText>
        </View>
        <View style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}>
          <Icon name="chevron" color={t.colors.textMuted} size={18} />
        </View>
      </Pressable>

      {open ? (
        <View style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: t.radius.pill, backgroundColor: t.colors.surfaceAlt }}>
            <Icon name="calendar" color={t.colors.primary} size={14} />
            <AppText variant="tiny" weight="800" color={t.colors.primary}>
              {x.duration}
            </AppText>
          </View>
          <AppText>{x.text}</AppText>
          <View style={{ gap: 6 }}>
            <AppText weight="800">{tr('smoking.symptoms.tipsTitle')}</AppText>
            {x.tips.map((tip) => (
              <View key={tip} style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, marginTop: 8, backgroundColor: t.colors.success }} />
                <AppText style={{ flex: 1 }}>{tip}</AppText>
              </View>
            ))}
          </View>
          {x.warning ? (
            <View style={{ flexDirection: 'row', gap: 8, padding: 12, borderRadius: t.radius.md, borderWidth: 1, borderColor: t.colors.warning }}>
              <Icon name="help" color={t.colors.warning} size={18} />
              <AppText variant="small" style={{ flex: 1 }}>
                {x.warning}
              </AppText>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Button label={tr('smoking.symptoms.experienced')} icon="plus" variant="accent" onPress={() => useCampusStore.getState().logSymptom(x.id)} style={{ flex: 1 }} />
            {logged ? <Button label={tr('smoking.symptoms.undo')} variant="ghost" onPress={() => useCampusStore.getState().undoSymptom(x.id)} /> : null}
          </View>
          <AppText variant="small" muted center accessibilityLiveRegion="polite">
            {logged ? tr('smoking.symptoms.loggedTimes', { count }) : tr('smoking.symptoms.countNone')}
          </AppText>
        </View>
      ) : null}
    </Card>
  );
}
