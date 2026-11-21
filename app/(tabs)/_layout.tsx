import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName, useTheme } from '@/components';
import { requiredFirstRunRoute } from '@/features/app/gate';
import { useCampShortcut } from '@/features/camps/smoking/shortcut';
import { useProfileStore } from '@/stores/profileStore';

/** SPEC_V4 §A.1: four equal tabs. The old Antrenman tab is gone (`/training` redirects to Günüm). */
const TABS: { name: string; key: string; icon: IconName }[] = [
  { name: 'index', key: 'home', icon: 'sun' },
  { name: 'progress', key: 'progress', icon: 'chart' },
  { name: 'discover', key: 'discover', icon: 'compass' },
  { name: 'profile', key: 'profile', icon: 'user' },
];

/**
 * Bottom tabs — ui-v3 (SPEC_UI_V3 §7.16): 56 px + safe area on the surface with a 1 px top border; the
 * active tab is a primary icon on a 32×24 soft pill with a primary label, inactive tabs are subtle.
 */
export default function TabsLayout() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { t: tr } = useTranslation();
  const gate = useProfileStore((s) => requiredFirstRunRoute(s.profile));
  // "Canım çekiyor" home-screen shortcut → Sigarasız Kamp SOS (must live in a sub-layout).
  useCampShortcut();
  // Never render the main app before first-run setup is complete.
  if (gate) return <Redirect href={gate} />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.tokens.primary,
        tabBarInactiveTintColor: t.tokens.subtle,
        tabBarStyle: {
          backgroundColor: t.tokens.card,
          borderTopColor: t.tokens.border,
          borderTopWidth: t.border.thin,
          height: 56 + Math.max(insets.bottom, t.space.sm),
          paddingTop: t.space.xs,
          paddingBottom: Math.max(insets.bottom, t.space.sm),
        },
        tabBarItemStyle: { paddingVertical: 0, gap: 2 },
        tabBarIconStyle: { height: 24 },
        tabBarLabelStyle: { fontSize: t.type.caption.fontSize, lineHeight: t.type.caption.lineHeight, fontFamily: t.family.medium, marginTop: 0, marginBottom: 0, minHeight: t.type.caption.lineHeight },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tr(`tabs.${tab.key}`),
            tabBarAccessibilityLabel: tr(`tabs.${tab.key}`),
            tabBarIcon: ({ color, focused }) => (
              <View style={{ width: 32, height: 24, borderRadius: t.radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? t.tokens.primarySoft : 'transparent' }}>
                <Icon name={tab.icon} color={String(color)} size="md" />
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
