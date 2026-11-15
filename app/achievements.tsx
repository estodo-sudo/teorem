import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Card, Header, ProgressBar, Screen, useTheme } from '@/components';
import { ACHIEVEMENTS } from '@/features/gamification/achievements';
import { buildAchievementContext } from '@/features/gamification/service';
import { useProgressStore } from '@/stores/progressStore';

export default function Achievements() {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const unlocked = useProgressStore((s) => s.achievements);
  const ctx = buildAchievementContext();
  const count = ACHIEVEMENTS.filter((a) => unlocked[a.id]).length;

  return (
    <Screen>
      <Header title={tr('achievements.title')} />
      <AppText muted center>
        {tr('achievements.summary', { count, total: ACHIEVEMENTS.length })}
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {ACHIEVEMENTS.map((a) => {
          const at = unlocked[a.id];
          const p = a.progress(ctx);
          return (
            <Card
              key={a.id}
              accessibilityLabel={`${tr(`achievements.items.${a.id}.title`)}. ${at ? tr('achievements.earned') : tr('achievements.locked')}`}
              style={{ width: '48%', flexGrow: 1, alignItems: 'center', gap: 6, opacity: at ? 1 : 0.6 }}
            >
              <View style={{ width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: at ? (t.dark ? t.colors.surfaceAlt : '#FFF3EB') : t.colors.locked }}>
                <AppText style={{ fontSize: 30, lineHeight: 38, opacity: at ? 1 : 0.35 }}>{a.emoji}</AppText>
              </View>
              <AppText weight="700" center variant="small">
                {tr(`achievements.items.${a.id}.title`)}
              </AppText>
              <AppText variant="tiny" muted center>
                {tr(`achievements.items.${a.id}.desc`)}
              </AppText>
              {at ? (
                <AppText variant="tiny" color={t.colors.accent} weight="700">
                  {new Date(at).toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : 'en-US')}
                </AppText>
              ) : (
                <View style={{ alignSelf: 'stretch' }}>
                  <ProgressBar value={p} height={6} />
                </View>
              )}
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}
